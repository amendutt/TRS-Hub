import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { RowDataPacket } from 'mysql2';
import { z } from 'zod';
import { ensureDatabaseSchema, getDatabase } from './database.js';
import { isAdminEmail, verifyBearerToken } from './firebase.js';
import { getPersistentOrders, paymentRouter, stripeWebhook, syncPersistentOrderStatuses } from './payments.js';

const app = express();
const port = Number(process.env.PORT ?? 3002);
const rootPath = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const authLimiter = rateLimit({ windowMs: 60_000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false });
const stateSchema = z.record(z.string(), z.unknown());

app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      connectSrc: ["'self'", 'https://identitytoolkit.googleapis.com', 'https://securetoken.googleapis.com', 'https://www.googleapis.com', 'https://*.googleapis.com'],
      fontSrc: ["'self'", 'https:', 'data:'],
      frameAncestors: ["'self'"],
      frameSrc: ["'self'", 'https://www.google.com', 'https://www.recaptcha.net', 'https://*.firebaseapp.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'", 'https://www.gstatic.com', 'https://www.google.com', 'https://www.recaptcha.net'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https:']
    }
  }
}));
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), stripeWebhook);
app.use(express.json({ limit: '2mb' }));

async function requireAdmin(authorization?: string) {
  const identity = await verifyBearerToken(authorization);
  if (!identity.email_verified || !isAdminEmail(identity.email)) {
    throw new Error('Admin access is not authorized.');
  }
  return identity;
}

app.get('/api/health', async (_request, response) => {
  try {
    await getDatabase().query('SELECT 1');
    response.json({ status: 'ok' });
  } catch {
    response.status(503).json({ status: 'unavailable' });
  }
});

app.get('/api/auth/me', authLimiter, async (request, response) => {
  try {
    const identity = await verifyBearerToken(request.header('authorization'));
    const database = getDatabase();
    await database.execute(
      `INSERT INTO customer_profiles (firebase_uid, email, display_name, phone_number)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE email = VALUES(email), display_name = VALUES(display_name), phone_number = VALUES(phone_number)`,
      [identity.uid, identity.email ?? null, identity.name ?? null, identity.phone_number ?? null]
    );
    response.json({
      uid: identity.uid,
      email: identity.email ?? null,
      displayName: identity.name ?? null,
      phoneNumber: identity.phone_number ?? null,
      isAdmin: Boolean(identity.email_verified && isAdminEmail(identity.email))
    });
  } catch (error) {
    response.status(401).json({ error: error instanceof Error ? error.message : 'Authentication failed.' });
  }
});

app.get('/api/store/state', async (_request, response) => {
  try {
    const [rows] = await getDatabase().execute<Array<{ payload: unknown } & import('mysql2').RowDataPacket>>(
      'SELECT payload FROM app_state WHERE state_key = ?', ['store']
    );
    if (!rows[0]) {
      response.json({ state: null });
      return;
    }

    const state = typeof rows[0].payload === 'string' ? JSON.parse(rows[0].payload) : rows[0].payload;
    const publicState = state && typeof state === 'object' ? state as Record<string, any> : {};
    const settings = publicState.settings;
    const versions = Array.isArray(publicState.versions) ? publicState.versions : [];
    const activeVersion = versions.find((version: { id: string }) => version.id === settings?.activeVersionId);
    response.json({
      state: {
        versions: activeVersion ? [{ ...activeVersion, authorEmail: '' }] : [],
        settings: settings ?? null,
        products: (publicState.products ?? [])
          .filter((product: { status: string }) => product.status === 'Published')
          .map(({ warehouseStock: _warehouseStock, lowStockThreshold: _lowStockThreshold, ...product }: Record<string, unknown>) => product),
        categories: (publicState.categories ?? []).filter((category: { isActive: boolean }) => category.isActive),
        siteConfig: publicState.siteConfig ?? null,
        banners: (publicState.banners ?? []).filter((banner: { active: boolean }) => banner.active),
        staticPages: publicState.staticPages ?? [],
        reviews: (publicState.reviews ?? [])
          .filter((review: { status: string }) => review.status === 'Approved')
          .map((review: Record<string, unknown>) => ({ ...review, customerEmail: '' }))
      }
    });
  } catch {
    response.status(503).json({ error: 'Store data is temporarily unavailable.' });
  }
});

app.get('/api/admin/state', async (request, response) => {
  try {
    await requireAdmin(request.header('authorization'));
    const [rows] = await getDatabase().execute<Array<{ payload: unknown } & import('mysql2').RowDataPacket>>(
      'SELECT payload FROM app_state WHERE state_key = ?', ['store']
    );
    const payload = rows[0]?.payload;
    const state = typeof payload === 'string' ? JSON.parse(payload) : payload;
    if (!state) {
      response.json({ state: null });
      return;
    }
    const persistentOrders = await getPersistentOrders();
    const [profiles] = await getDatabase().execute<Array<RowDataPacket & {
      firebase_uid: string;
      email: string | null;
      display_name: string | null;
      phone_number: string | null;
      created_at: Date;
    }>>('SELECT firebase_uid, email, display_name, phone_number, created_at FROM customer_profiles ORDER BY created_at DESC');
    const [orderStats] = await getDatabase().execute<Array<RowDataPacket & {
      firebase_uid: string;
      orders_count: number;
      total_spent: number | string | null;
    }>>(`SELECT firebase_uid, COUNT(*) AS orders_count,
        SUM(CASE WHEN payment_status = 'paid' THEN total ELSE 0 END) AS total_spent
        FROM store_orders WHERE firebase_uid IS NOT NULL GROUP BY firebase_uid`);
    const statsByUid = new Map(orderStats.map(stats => [stats.firebase_uid, stats]));
    const customers = profiles.map(profile => {
      const stats = statsByUid.get(profile.firebase_uid);
      return {
        id: `firebase_${profile.firebase_uid}`,
        name: profile.display_name || profile.email || profile.phone_number || 'Customer',
        email: profile.email || '',
        phone: profile.phone_number || undefined,
        ordersCount: Number(stats?.orders_count ?? 0),
        totalSpent: Number(stats?.total_spent ?? 0),
        joinedDate: new Date(profile.created_at).toISOString().slice(0, 10),
        status: 'Active' as const
      };
    });
    const savedCustomers = Array.isArray(state.customers) ? state.customers : [];
    const persistentCustomerIds = new Set(customers.map(customer => customer.id));
    const savedOrders = Array.isArray(state.orders) ? state.orders : [];
    const persistentIds = new Set(persistentOrders.map(order => order.id));
    response.json({
      state: {
        ...state,
        customers: [...customers, ...savedCustomers.filter((customer: { id?: string }) => !persistentCustomerIds.has(customer.id ?? ''))],
        orders: [...persistentOrders, ...savedOrders.filter((order: { id?: string }) => !persistentIds.has(order.id ?? ''))]
      }
    });
  } catch (error) {
    const status = error instanceof Error && error.message.includes('Admin access') ? 403 : 401;
    response.status(status).json({ error: error instanceof Error ? error.message : 'Admin authorization failed.' });
  }
});

app.put('/api/admin/state', async (request, response) => {
  try {
    await requireAdmin(request.header('authorization'));
    const state = stateSchema.parse(request.body);
    await getDatabase().execute(
      `INSERT INTO app_state (state_key, payload) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE payload = VALUES(payload)`,
      ['store', JSON.stringify(state)]
    );
    await syncPersistentOrderStatuses(state.orders);
    response.json({ saved: true });
  } catch (error) {
    const status = error instanceof z.ZodError ? 400 : error instanceof Error && error.message.includes('Admin access') ? 403 : 401;
    response.status(status).json({ error: error instanceof Error ? error.message : 'Unable to persist store data.' });
  }
});

app.use('/api/payments', paymentRouter);
app.use('/api', (_request, response) => response.status(404).json({ error: 'API route not found.' }));
app.use(express.static(resolve(rootPath, 'dist'), { index: false, maxAge: '1h' }));
app.get('*', (_request, response) => response.sendFile(resolve(rootPath, 'dist', 'index.html')));

try {
  await ensureDatabaseSchema();
  app.listen(port, () => console.info(`TRS-Hub API listening on port ${port}`));
} catch (error) {
  console.error('Backend startup failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
