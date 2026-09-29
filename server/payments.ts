import express, { Router } from 'express';
import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2';
import Stripe from 'stripe';
import { z } from 'zod';
import { getDatabase } from './database.js';
import { verifyBearerToken } from './firebase.js';
import type { Order, OrderItem, Product } from '../src/types/logo.js';

const router = Router();
const checkoutSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().int().min(1).max(50),
    variantTitle: z.string().optional()
  })).min(1).max(50),
  shippingMethod: z.enum(['Standard Shipping (Free)', 'Express Courier ($25)', 'Same-Day Metro Dispatch ($40)']),
  paymentMethod: z.enum(['Card', 'Cash on Delivery']),
  couponCode: z.string().optional(),
  shippingAddress: z.object({
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    address: z.string().min(1).max(300),
    city: z.string().min(1).max(120),
    pincode: z.string().min(2).max(20)
  })
});

function getStripe(): Stripe {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY.');
  return new Stripe(secret);
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

async function changeInventory(items: OrderItem[], direction: 'reserve' | 'release', couponCode?: string): Promise<void> {
  const database = getDatabase();
  const connection = await database.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute<Array<RowDataPacket & { payload: unknown }>>(
      'SELECT payload FROM app_state WHERE state_key = ? FOR UPDATE', ['store']
    );
    if (!rows[0]) throw new Error('The store catalog is unavailable.');
    const state = typeof rows[0].payload === 'string' ? JSON.parse(rows[0].payload) : rows[0].payload as Record<string, any>;

    for (const item of items) {
      const product = (state.products as Product[]).find(candidate => candidate.id === item.productId);
      const variant = item.variantTitle ? product?.variants?.find(candidate => candidate.title === item.variantTitle) : undefined;
      if (!product || (item.variantTitle && !variant)) throw new Error('A selected product option is no longer available.');
      const adjustment = direction === 'reserve' ? -item.quantity : item.quantity;
      if (direction === 'reserve' && (product.stock < item.quantity || (variant && variant.stock < item.quantity))) {
        throw new Error(`${product.name} no longer has enough stock.`);
      }
      product.stock = Math.max(0, product.stock + adjustment);
      if (variant) variant.stock = Math.max(0, variant.stock + adjustment);
    }

    if (couponCode) {
      const coupon = (state.coupons ?? []).find((candidate: { code: string }) => candidate.code.toLowerCase() === couponCode.toLowerCase());
      if (!coupon) throw new Error('Coupon is no longer available.');
      if (direction === 'reserve') {
        if (coupon.status !== 'Active' || coupon.usedCount >= coupon.usageLimit || new Date(coupon.validTill) < new Date()) {
          throw new Error('Coupon is no longer available.');
        }
        coupon.usedCount += 1;
      } else {
        coupon.usedCount = Math.max(0, coupon.usedCount - 1);
      }
    }

    await connection.execute('UPDATE app_state SET payload = ? WHERE state_key = ?', [JSON.stringify(state), 'store']);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

function formatOrder(row: Record<string, any>): Order {
  const value = (key: string) => typeof row[key] === 'string' ? JSON.parse(row[key]) : row[key];
  return {
    id: row.id,
    orderNumber: row.order_number,
    customerName: `${value('shipping_address').firstName} ${value('shipping_address').lastName}`,
    customerEmail: row.customer_email,
    date: new Date(row.created_at).toISOString().slice(0, 10),
    items: value('items'),
    subtotal: Number(row.subtotal),
    shipping: Number(row.shipping),
    tax: Number(row.tax),
    discount: Number(row.discount),
    total: Number(row.total),
    shippingMethod: row.shipping_method,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status === 'paid' ? 'Paid' : row.payment_status === 'refunded' ? 'Refunded' : 'Pending',
    orderStatus: row.order_status[0].toUpperCase() + row.order_status.slice(1),
    shippingAddress: value('shipping_address')
  } as Order;
}

async function markPaid(orderId: string, firebaseUid: string, paymentId: string): Promise<void> {
  await getDatabase().execute(
    `UPDATE store_orders SET payment_status = 'paid', payment_provider_id = ?, stock_reserved = 0
     WHERE id = ? AND firebase_uid = ? AND payment_status = 'pending'`,
    [paymentId, orderId, firebaseUid]
  );
}

router.post('/checkout', async (request, response) => {
  try {
    const identity = await verifyBearerToken(request.header('authorization'));
    const input = checkoutSchema.parse(request.body);
    const database = getDatabase();
    const [stateRows] = await database.execute<Array<RowDataPacket & { payload: unknown }>>(
      'SELECT payload FROM app_state WHERE state_key = ?', ['store']
    );
    if (!stateRows[0]) {
      response.status(503).json({ error: 'The store catalog has not been initialized by an administrator.' });
      return;
    }

    const state = typeof stateRows[0].payload === 'string' ? JSON.parse(stateRows[0].payload) : stateRows[0].payload as Record<string, any>;
    const products = Array.isArray(state.products) ? state.products as Product[] : [];
    const orderItems = input.items.map(item => {
      const product = products.find(candidate => candidate.id === item.productId && candidate.status === 'Published');
      if (!product) throw new Error(`Product ${item.productId} is unavailable.`);
      const variant = item.variantTitle ? product.variants?.find(candidate => candidate.title === item.variantTitle) : undefined;
      if (item.variantTitle && !variant) throw new Error(`Selected option for ${product.name} is unavailable.`);
      const unitPrice = variant?.price ?? product.price;
      if ((variant?.stock ?? product.stock) < item.quantity) throw new Error(`${product.name} does not have enough stock.`);
      return {
        productId: product.id,
        productName: product.name,
        price: unitPrice,
        quantity: item.quantity,
        variantTitle: item.variantTitle,
        image: product.images[0] ?? ''
      };
    });

    const subtotal = roundMoney(orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0));
    const shipping = input.shippingMethod === 'Standard Shipping (Free)'
      ? (subtotal > 150 ? 0 : 12)
      : input.shippingMethod === 'Express Courier ($25)' ? 25 : 40;
    const tax = roundMoney(subtotal * 0.18);
    let discount = 0;
    if (input.couponCode) {
      const coupon = (state.coupons ?? []).find((candidate: { code: string; status: string; usageLimit: number; usedCount: number; validTill: string; minOrderValue?: number }) => candidate.code.toLowerCase() === input.couponCode?.trim().toLowerCase());
      if (!coupon || coupon.status !== 'Active' || coupon.usedCount >= coupon.usageLimit || new Date(coupon.validTill) < new Date() || subtotal < (coupon.minOrderValue ?? 0)) {
        response.status(400).json({ error: 'Coupon is invalid or no longer available.' });
        return;
      }
      const couponRecord = coupon as { discountType: 'percentage' | 'flat'; value: number };
      discount = couponRecord.discountType === 'percentage' ? subtotal * couponRecord.value / 100 : couponRecord.value;
      discount = roundMoney(Math.min(discount, subtotal + shipping + tax));
    }
    const total = roundMoney(Math.max(0, subtotal + shipping + tax - discount));
    const id = randomUUID();
    const orderNumber = `HAVN-${Date.now().toString(36).toUpperCase()}`;
    const email = identity.email ?? `${identity.uid}@phone.havn.invalid`;
    const shippingAddress = input.shippingAddress;
    const itemsJson = JSON.stringify(orderItems);
    const addressJson = JSON.stringify(shippingAddress);

    if (input.paymentMethod === 'Cash on Delivery') {
      await changeInventory(orderItems, 'reserve', input.couponCode);
      try {
        await database.execute(
          `INSERT INTO store_orders
            (id, order_number, firebase_uid, customer_email, currency, subtotal, shipping, tax, discount, total, coupon_code, shipping_method, payment_method, payment_provider, payment_status, order_status, items, shipping_address)
           VALUES (?, ?, ?, ?, 'USD', ?, ?, ?, ?, ?, ?, ?, ?, 'cod', 'pending', 'processing', ?, ?)`,
          [id, orderNumber, identity.uid, email, subtotal, shipping, tax, discount, total, input.couponCode ?? null, input.shippingMethod, input.paymentMethod, itemsJson, addressJson]
        );
      } catch (error) {
        await changeInventory(orderItems, 'release', input.couponCode);
        throw error;
      }
      response.json({ order: { id, orderNumber, customerName: `${shippingAddress.firstName} ${shippingAddress.lastName}`, customerEmail: email, date: new Date().toISOString().slice(0, 10), items: orderItems, subtotal, shipping, tax, discount, total, shippingMethod: input.shippingMethod, paymentMethod: input.paymentMethod, paymentStatus: 'Pending', orderStatus: 'Processing', shippingAddress } satisfies Order });
      return;
    }

    const appUrl = process.env.APP_URL;
    if (!appUrl) throw new Error('APP_URL is required to create a secure payment session.');
    const stripe = getStripe();
    await changeInventory(orderItems, 'reserve', input.couponCode);
    try {
      await database.execute(
        `INSERT INTO store_orders
          (id, order_number, firebase_uid, customer_email, currency, subtotal, shipping, tax, discount, total, coupon_code, shipping_method, payment_method, payment_provider, stock_reserved, payment_status, order_status, items, shipping_address)
         VALUES (?, ?, ?, ?, 'USD', ?, ?, ?, ?, ?, ?, ?, ?, 'stripe', 1, 'pending', 'processing', ?, ?)`,
        [id, orderNumber, identity.uid, email, subtotal, shipping, tax, discount, total, input.couponCode ?? null, input.shippingMethod, input.paymentMethod, itemsJson, addressJson]
      );
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        client_reference_id: identity.uid,
        customer_email: identity.email ?? undefined,
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
        line_items: [{
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(total * 100),
            product_data: { name: `Store order ${orderNumber}`, description: `${orderItems.length} item(s)` }
          },
          quantity: 1
        }],
        metadata: { orderId: id },
        success_url: `${appUrl.replace(/\/$/, '')}/?checkout=success&order=${encodeURIComponent(id)}&session={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl.replace(/\/$/, '')}/?checkout=cancelled&order=${encodeURIComponent(id)}`
      }, { idempotencyKey: id });
      await database.execute('UPDATE store_orders SET payment_provider_id = ? WHERE id = ?', [session.id, id]);
      response.json({ checkoutUrl: session.url, orderId: id });
    } catch (error) {
      await database.execute('DELETE FROM store_orders WHERE id = ?', [id]);
      await changeInventory(orderItems, 'release', input.couponCode);
      throw error;
    }
  } catch (error) {
    const status = error instanceof z.ZodError ? 400 : error instanceof Error && error.message.includes('bearer token') ? 401 : 400;
    response.status(status).json({ error: error instanceof Error ? error.message : 'Unable to start checkout.' });
  }
});

router.post('/confirm', async (request, response) => {
  try {
    const identity = await verifyBearerToken(request.header('authorization'));
    const input = z.object({ orderId: z.string().uuid(), sessionId: z.string().min(1) }).parse(request.body);
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(input.sessionId);
    if (session.metadata?.orderId !== input.orderId || session.client_reference_id !== identity.uid || session.payment_status !== 'paid') {
      response.status(400).json({ error: 'Payment has not been verified.' });
      return;
    }
    await markPaid(input.orderId, identity.uid, session.id);
    const [rows] = await getDatabase().execute<Array<RowDataPacket & Record<string, any>>>(
      'SELECT * FROM store_orders WHERE id = ? AND firebase_uid = ?', [input.orderId, identity.uid]
    );
    if (!rows[0]) {
      response.status(404).json({ error: 'Order not found.' });
      return;
    }
    response.json({ order: formatOrder(rows[0]) });
  } catch (error) {
    const status = error instanceof z.ZodError ? 400 : error instanceof Error && error.message.includes('bearer token') ? 401 : 400;
    response.status(status).json({ error: error instanceof Error ? error.message : 'Unable to verify payment.' });
  }
});

router.get('/orders', async (request, response) => {
  try {
    const identity = await verifyBearerToken(request.header('authorization'));
    const [rows] = await getDatabase().execute<Array<RowDataPacket & Record<string, any>>>(
      'SELECT * FROM store_orders WHERE firebase_uid = ? ORDER BY created_at DESC LIMIT 100', [identity.uid]
    );
    response.json({ orders: rows.map(formatOrder) });
  } catch (error) {
    response.status(401).json({ error: error instanceof Error ? error.message : 'Unable to load orders.' });
  }
});

export async function stripeWebhook(request: express.Request, response: express.Response): Promise<void> {
  const signature = request.header('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    response.status(400).send('Missing Stripe webhook configuration.');
    return;
  }
  try {
    const event = getStripe().webhooks.constructEvent(request.body as Buffer, signature, webhookSecret);
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.metadata?.orderId && session.payment_status === 'paid') {
        await getDatabase().execute(
          `UPDATE store_orders SET payment_status = 'paid', stock_reserved = 0
           WHERE id = ? AND payment_provider_id = ? AND payment_status = 'pending'`,
          [session.metadata.orderId, session.id]
        );
      }
    } else if (event.type === 'checkout.session.expired' || event.type === 'checkout.session.async_payment_failed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;
      if (orderId) {
        const [rows] = await getDatabase().execute<Array<RowDataPacket & { items: unknown; stock_reserved: number; coupon_code: string | null }>>(
          'SELECT items, stock_reserved, coupon_code FROM store_orders WHERE id = ? AND payment_provider_id = ?', [orderId, session.id]
        );
        const [result] = await getDatabase().execute<import('mysql2').ResultSetHeader>(
          `UPDATE store_orders SET payment_status = 'failed', stock_reserved = 0
           WHERE id = ? AND payment_provider_id = ? AND payment_status = 'pending' AND stock_reserved = 1`,
          [orderId, session.id]
        );
        if (result.affectedRows && rows[0]?.stock_reserved) {
          const items = typeof rows[0].items === 'string' ? JSON.parse(rows[0].items) : rows[0].items;
          await changeInventory(items as OrderItem[], 'release', rows[0].coupon_code ?? undefined);
        }
      }
    }
    response.json({ received: true });
  } catch {
    response.status(400).send('Invalid Stripe webhook signature.');
  }
}

export async function getPersistentOrders(): Promise<Order[]> {
  const [rows] = await getDatabase().execute<Array<RowDataPacket & Record<string, any>>>(
    'SELECT * FROM store_orders ORDER BY created_at DESC'
  );
  return rows.map(formatOrder);
}

export async function syncPersistentOrderStatuses(orders: unknown): Promise<void> {
  if (!Array.isArray(orders)) return;
  const allowedStatuses = new Set(['Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned']);
  for (const value of orders) {
    if (!value || typeof value !== 'object') continue;
    const order = value as Partial<Order>;
    if (!order.id || !/^[0-9a-f-]{36}$/i.test(order.id) || !order.orderStatus || !allowedStatuses.has(order.orderStatus)) continue;
    await getDatabase().execute('UPDATE store_orders SET order_status = ? WHERE id = ?', [order.orderStatus.toLowerCase(), order.id]);
  }
}

export const paymentRouter = router;
