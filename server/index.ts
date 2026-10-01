import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2';
import { z } from 'zod';
import { ensureDatabaseSchema, getDatabase } from './database.js';
import { createSession, localDemoMode, requireSession, revokeSession } from './auth.js';
import { hashPassword, verifyPassword } from './password.js';
import { getPersistentOrders, paymentRouter, stripeWebhook, syncPersistentOrderStatuses } from './payments.js';

const app = express();
const port = Number(process.env.PORT ?? 3002);
let localAdminState: Record<string, unknown> | null = null;
const rootPath = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const authLimiter = rateLimit({ windowMs: 60_000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false });
const stateSchema = z.record(z.string(), z.unknown());
const ADMIN_PERMISSIONS = ['dashboard', 'catalog', 'orders', 'customers', 'reviews', 'marketing', 'reports', 'logo_studio', 'settings', 'audit_logs', 'inventory'] as const;
const adminPermissionSchema = z.enum(ADMIN_PERMISSIONS);
const employeeRoleSchema = z.enum(['Catalog Manager', 'Order Fulfillment', 'Customer Support']);
const employeeSchema = z.object({
  name: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(254),
  password: z.string().min(12).max(128),
  role: employeeRoleSchema,
  permissions: z.array(adminPermissionSchema).max(ADMIN_PERMISSIONS.length).min(1)
    .refine(permissions => permissions.includes('dashboard'), 'Dashboard access is required.')
});
const statePermissionByField: Record<string, string> = {
  products: 'catalog', categories: 'catalog',
  orders: 'orders', customers: 'customers', reviews: 'reviews',
  coupons: 'marketing', banners: 'marketing', staticPages: 'marketing',
  siteConfig: 'settings', versions: 'logo_studio', auditLogs: 'logo_studio', settings: 'logo_studio',
  adminAuditLogs: 'audit_logs', notifications: 'orders',
  lowStockThreshold: 'inventory'
};
const customerAddressSchema = z.object({
  id: z.string().uuid(),
  label: z.string().trim().min(1).max(80),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  address: z.string().trim().min(1).max(300),
  city: z.string().trim().min(1).max(120),
  pincode: z.string().trim().min(2).max(20),
  phone: z.string().trim().min(5).max(32),
  isDefault: z.boolean()
});
const customerProfileSchema = z.object({
  savedAddresses: z.array(customerAddressSchema).max(20),
  wishlist: z.array(z.string().min(1)).max(100)
});

app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      connectSrc: ["'self'", 'https://api.stripe.com'],
      fontSrc: ["'self'", 'https:', 'data:'],
      frameAncestors: ["'self'"],
      frameSrc: ["'self'", 'https://js.stripe.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'", 'https://js.stripe.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https:']
    }
  }
}));
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), stripeWebhook);
app.use(express.json({ limit: '4mb' }));

interface AdminAccess {
  isRootAdmin: boolean;
  role: string;
  permissions: string[];
}

async function lookupAdminAccess(identity: Awaited<ReturnType<typeof requireSession>>): Promise<AdminAccess | null> {
  if (identity.role === 'super_admin') {
    return { isRootAdmin: true, role: 'Super Admin', permissions: [...ADMIN_PERMISSIONS, 'employees'] };
  }
  if (!employeeRoleSchema.options.includes(identity.role as typeof employeeRoleSchema.options[number])) return null;
  return { isRootAdmin: false, role: identity.role, permissions: identity.permissions };
}

async function requireAdmin(authorization?: string) {
  const identity = await requireSession(authorization);
  const access = await lookupAdminAccess(identity);
  if (!access) {
    throw new Error('Admin access is not authorized.');
  }
  return { identity, ...access };
}

async function requireRootAdmin(authorization?: string) {
  const admin = await requireAdmin(authorization);
  if (!admin.isRootAdmin) throw new Error('Only a Super Admin can manage employee accounts.');
  return admin;
}

app.get('/api/health', async (_request, response) => {
  if (localDemoMode) {
    response.json({ status: 'demo', database: 'in-memory' });
    return;
  }
  try {
    await getDatabase().query('SELECT 1');
    response.json({ status: 'ok' });
  } catch {
    response.status(503).json({ status: 'unavailable' });
  }
});

const registrationSchema = z.object({
  name: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(254),
  password: z.string().min(12).max(128)
});
const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128)
});

app.post('/api/auth/register', authLimiter, async (request, response) => {
  const input = registrationSchema.safeParse(request.body);
  if (!input.success) {
    response.status(400).json({ error: 'Enter a name, valid email, and password of at least 12 characters.' });
    return;
  }
  try {
    const email = input.data.email.toLowerCase();
    const accountId = randomUUID();
    await getDatabase().execute(
      `INSERT INTO account_users (id, email, password_hash, display_name, role)
       VALUES (?, ?, ?, ?, 'customer')`,
      [accountId, email, hashPassword(input.data.password), input.data.name]
    );
    await getDatabase().execute('INSERT INTO customer_account_profiles (account_id, saved_addresses, wishlist) VALUES (?, ?, ?)', [accountId, JSON.stringify([]), JSON.stringify([])]);
    const token = await createSession(accountId);
    response.status(201).json({
      token,
      user: { uid: accountId, email, displayName: input.data.name, phoneNumber: null, isAdmin: false, isRootAdmin: false, adminRole: null, adminPermissions: [], savedAddresses: [], wishlist: [] }
    });
  } catch (error) {
    const duplicate = error instanceof Error && 'code' in error && error.code === 'ER_DUP_ENTRY';
    response.status(duplicate ? 409 : 503).json({ error: duplicate ? 'An account with this email already exists.' : 'Unable to create your account.' });
  }
});

app.post('/api/auth/login', authLimiter, async (request, response) => {
  const input = loginSchema.safeParse(request.body);
  if (!input.success) {
    response.status(400).json({ error: 'Enter a valid email and password.' });
    return;
  }
  try {
    if (localDemoMode) {
      const configuredEmail = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
      const configuredPassword = process.env.SUPER_ADMIN_PASSWORD;
      if (!configuredEmail || !configuredPassword || input.data.email.toLowerCase() !== configuredEmail || input.data.password !== configuredPassword) {
        response.status(401).json({ error: 'Invalid email or password.' });
        return;
      }
      const token = await createSession('local-super-admin');
      response.json({ token, user: { uid: 'local-super-admin', email: configuredEmail, displayName: process.env.SUPER_ADMIN_NAME || 'Super Admin' } });
      return;
    }
    const [rows] = await getDatabase().execute<Array<RowDataPacket & {
      id: string; email: string; password_hash: string; display_name: string; active: number;
    }>>('SELECT id, email, password_hash, display_name, active FROM account_users WHERE email = ?', [input.data.email.toLowerCase()]);
    const account = rows[0];
    if (!account || !account.active || !verifyPassword(input.data.password, account.password_hash)) {
      response.status(401).json({ error: 'Invalid email or password.' });
      return;
    }
    const token = await createSession(account.id);
    response.json({ token, user: { uid: account.id, email: account.email, displayName: account.display_name } });
  } catch {
    response.status(503).json({ error: 'Sign-in is temporarily unavailable.' });
  }
});

app.post('/api/auth/logout', async (request, response) => {
  await revokeSession(request.header('authorization'));
  response.json({ signedOut: true });
});

app.get('/api/auth/me', authLimiter, async (request, response) => {
  try {
    const identity = await requireSession(request.header('authorization'));
    if (localDemoMode) {
      response.json({
        uid: identity.id,
        email: identity.email,
        displayName: identity.displayName,
        phoneNumber: null,
        isAdmin: true,
        isRootAdmin: true,
        adminRole: 'Super Admin',
        adminPermissions: [...ADMIN_PERMISSIONS, 'employees'],
        savedAddresses: [],
        wishlist: []
      });
      return;
    }
    const [profiles] = await getDatabase().execute<Array<RowDataPacket & { saved_addresses: unknown; wishlist: unknown }>>(
      'SELECT saved_addresses, wishlist FROM customer_account_profiles WHERE account_id = ?', [identity.id]
    );
    const profileData = profiles[0];
    const decodeJson = (value: unknown) => typeof value === 'string' ? JSON.parse(value) : value;
    const adminAccess = await lookupAdminAccess(identity);
    response.json({
      uid: identity.id,
      email: identity.email,
      displayName: identity.displayName,
      phoneNumber: identity.phoneNumber,
      isAdmin: Boolean(adminAccess),
      isRootAdmin: adminAccess?.isRootAdmin ?? false,
      adminRole: adminAccess?.role ?? null,
      adminPermissions: adminAccess?.permissions ?? [],
      savedAddresses: decodeJson(profileData?.saved_addresses) ?? [],
      wishlist: decodeJson(profileData?.wishlist) ?? []
    });
  } catch (error) {
    response.status(401).json({ error: error instanceof Error ? error.message : 'Authentication failed.' });
  }
});

app.put('/api/auth/profile', authLimiter, async (request, response) => {
  try {
    const identity = await requireSession(request.header('authorization'));
    const profile = customerProfileSchema.parse(request.body);
    if (profile.savedAddresses.filter(address => address.isDefault).length > 1) {
      response.status(400).json({ error: 'Only one shipping address can be the default.' });
      return;
    }
    const database = getDatabase();
    const [stateRows] = await database.execute<Array<RowDataPacket & { payload: unknown }>>(
      'SELECT payload FROM app_state WHERE state_key = ?', ['store']
    );
    const state = stateRows[0]
      ? typeof stateRows[0].payload === 'string' ? JSON.parse(stateRows[0].payload) : stateRows[0].payload as Record<string, any>
      : {};
    const publishedIds = new Set((state.products ?? [])
      .filter((product: { status: string }) => product.status === 'Published')
      .map((product: { id: string }) => product.id));
    const validWishlist = profile.wishlist.filter(productId => publishedIds.has(productId));
    await database.execute(
      `INSERT INTO customer_account_profiles (account_id, saved_addresses, wishlist) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE saved_addresses = VALUES(saved_addresses), wishlist = VALUES(wishlist)`,
      [identity.id, JSON.stringify(profile.savedAddresses), JSON.stringify(validWishlist)]
    );
    response.json({ savedAddresses: profile.savedAddresses, wishlist: validWishlist });
  } catch (error) {
    const status = error instanceof z.ZodError ? 400 : 401;
    response.status(status).json({ error: error instanceof Error ? error.message : 'Unable to save customer profile.' });
  }
});

app.get('/api/store/state', async (_request, response) => {
  if (localDemoMode) {
    response.json({ state: null });
    return;
  }
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
    const admin = await requireAdmin(request.header('authorization'));
    if (localDemoMode) {
      response.json({ state: localAdminState, access: { role: admin.role, permissions: admin.permissions, isRootAdmin: admin.isRootAdmin } });
      return;
    }
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
      id: string;
      email: string;
      display_name: string;
      phone_number: string | null;
      created_at: Date;
    }>>(`SELECT id, email, display_name, phone_number, created_at
        FROM account_users WHERE role = 'customer' ORDER BY created_at DESC`);
    const [orderStats] = await getDatabase().execute<Array<RowDataPacket & {
      account_id: string;
      orders_count: number;
      total_spent: number | string | null;
    }>>(`SELECT account_id, COUNT(*) AS orders_count,
        SUM(CASE WHEN payment_status = 'paid' THEN total ELSE 0 END) AS total_spent
        FROM store_orders WHERE account_id IS NOT NULL GROUP BY account_id`);
    const statsByUid = new Map(orderStats.map(stats => [stats.account_id, stats]));
    const customers = profiles.map(profile => {
      const stats = statsByUid.get(profile.id);
      return {
        id: `account_${profile.id}`,
        name: profile.display_name || profile.email || profile.phone_number || 'Customer',
        email: profile.email,
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
    const adminState: Record<string, any> = {
      ...state,
      customers: [...customers, ...savedCustomers.filter((customer: { id?: string }) => !persistentCustomerIds.has(customer.id ?? ''))],
      orders: [...persistentOrders, ...savedOrders.filter((order: { id?: string }) => !persistentIds.has(order.id ?? ''))]
    };
    if (!admin.isRootAdmin) {
      for (const [field, permission] of Object.entries(statePermissionByField)) {
        if (admin.permissions.includes(permission)) continue;
        if (Array.isArray(adminState[field])) adminState[field] = [];
        else if (field in adminState && field !== 'settings') adminState[field] = null;
      }
      adminState.staff = [];
      adminState.currentStaffId = '';
    }
    response.json({ state: adminState, access: { role: admin.role, permissions: admin.permissions, isRootAdmin: admin.isRootAdmin } });
  } catch (error) {
    const status = error instanceof Error && error.message.includes('Admin access') ? 403 : 401;
    response.status(status).json({ error: error instanceof Error ? error.message : 'Admin authorization failed.' });
  }
});

app.put('/api/admin/state', async (request, response) => {
  try {
    const admin = await requireAdmin(request.header('authorization'));
    const requestedState = stateSchema.parse(request.body);
    if (localDemoMode) {
      localAdminState = requestedState;
      response.json({ saved: true });
      return;
    }
    let state = requestedState;
    if (!admin.isRootAdmin) {
      const [rows] = await getDatabase().execute<Array<RowDataPacket & { payload: unknown }>>(
        'SELECT payload FROM app_state WHERE state_key = ?', ['store']
      );
      const payload = rows[0]?.payload;
      if (!payload) {
        response.status(409).json({ error: 'The Super Admin must initialize store state first.' });
        return;
      }
      const currentState = typeof payload === 'string' ? JSON.parse(payload) : payload as Record<string, unknown>;
      const mergedState: Record<string, unknown> = { ...currentState };
      for (const [field, permission] of Object.entries(statePermissionByField)) {
        if (admin.permissions.includes(permission) && field in requestedState) {
          mergedState[field] = requestedState[field];
        }
      }
      state = mergedState;
    }
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

app.get('/api/admin/employees', async (request, response) => {
  try {
    await requireRootAdmin(request.header('authorization'));
    if (localDemoMode) {
      response.json({ employees: [] });
      return;
    }
    const [rows] = await getDatabase().execute<Array<RowDataPacket & {
      id: string;
      email: string;
      display_name: string;
      role: string;
      permissions: unknown;
      active: number;
      created_at: Date;
    }>>(`SELECT id, email, display_name, role, permissions, active, created_at
        FROM account_users WHERE role IN ('Catalog Manager', 'Order Fulfillment', 'Customer Support')
        ORDER BY created_at DESC`);
    response.json({ employees: rows.map(employee => ({
      id: employee.id,
      email: employee.email,
      name: employee.display_name,
      role: employee.role,
      permissions: typeof employee.permissions === 'string' ? JSON.parse(employee.permissions) : employee.permissions,
      active: Boolean(employee.active),
      createdAt: employee.created_at
    })) });
  } catch (error) {
    const status = error instanceof Error && error.message.includes('Super Admin') ? 403 : 401;
    response.status(status).json({ error: error instanceof Error ? error.message : 'Unable to load employees.' });
  }
});

app.post('/api/admin/employees', async (request, response) => {
  try {
    const admin = await requireRootAdmin(request.header('authorization'));
    if (localDemoMode) {
      response.status(503).json({ error: 'Employee management requires a configured MySQL database.' });
      return;
    }
    const employee = employeeSchema.parse(request.body);
    const email = employee.email.toLowerCase();
    const employeeId = randomUUID();
    await getDatabase().execute(
      `INSERT INTO account_users (id, email, password_hash, display_name, role, permissions)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [employeeId, email, hashPassword(employee.password), employee.name, employee.role, JSON.stringify([...new Set(employee.permissions)])]
    );
    response.status(201).json({ id: employeeId, email, name: employee.name, role: employee.role, permissions: employee.permissions, active: true });
  } catch (error) {
    const duplicate = error instanceof Error && 'code' in error && error.code === 'ER_DUP_ENTRY';
    const status = error instanceof z.ZodError ? 400 : error instanceof Error && error.message.includes('Super Admin') ? 403 : duplicate ? 409 : 400;
    response.status(status).json({ error: duplicate ? 'An account with this email already exists.' : error instanceof Error ? error.message : 'Unable to create employee.' });
  }
});

app.put('/api/admin/employees/:id', async (request, response) => {
  try {
    await requireRootAdmin(request.header('authorization'));
    if (localDemoMode) {
      response.status(503).json({ error: 'Employee management requires a configured MySQL database.' });
      return;
    }
    const employee = employeeSchema.pick({ name: true, role: true, permissions: true }).parse(request.body);
    const [result] = await getDatabase().execute<import('mysql2').ResultSetHeader>(
      `UPDATE account_users SET display_name = ?, role = ?, permissions = ?, active = 1
       WHERE id = ?`,
      [employee.name, employee.role, JSON.stringify([...new Set(employee.permissions)]), request.params.id]
    );
    if (!result.affectedRows) {
      response.status(404).json({ error: 'Employee not found.' });
      return;
    }
    response.json({ saved: true });
  } catch (error) {
    const status = error instanceof z.ZodError ? 400 : error instanceof Error && error.message.includes('Super Admin') ? 403 : 401;
    response.status(status).json({ error: error instanceof Error ? error.message : 'Unable to update employee access.' });
  }
});

app.delete('/api/admin/employees/:id', async (request, response) => {
  try {
    const admin = await requireRootAdmin(request.header('authorization'));
    if (localDemoMode) {
      response.status(503).json({ error: 'Employee management requires a configured MySQL database.' });
      return;
    }
    if (request.params.id === admin.identity.id) {
      response.status(400).json({ error: 'You cannot deactivate your own admin membership.' });
      return;
    }
    const [result] = await getDatabase().execute<import('mysql2').ResultSetHeader>(
      'UPDATE account_users SET active = 0 WHERE id = ? AND role <> ?', [request.params.id, 'super_admin']
    );
    if (!result.affectedRows) {
      response.status(404).json({ error: 'Employee not found.' });
      return;
    }
    await getDatabase().execute('DELETE FROM account_sessions WHERE account_id = ?', [request.params.id]);
    response.json({ deactivated: true });
  } catch (error) {
    const status = error instanceof Error && error.message.includes('Super Admin') ? 403 : 401;
    response.status(status).json({ error: error instanceof Error ? error.message : 'Unable to deactivate employee.' });
  }
});

app.use('/api/payments', paymentRouter);
app.use('/api', (_request, response) => response.status(404).json({ error: 'API route not found.' }));
app.use(express.static(resolve(rootPath, 'dist'), { index: false, maxAge: '1h' }));
app.get('*', (_request, response) => response.sendFile(resolve(rootPath, 'dist', 'index.html')));

try {
  if (!localDemoMode) await ensureDatabaseSchema();
  app.listen(port, () => console.info(`TRS-Hub API listening on port ${port}`));
} catch (error) {
  console.error('Backend startup failed. Check MYSQL_URL and confirm that MySQL is running:', error);
  process.exitCode = 1;
}
