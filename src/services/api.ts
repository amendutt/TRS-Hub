import type { MySQLDatabaseSnapshot } from './mysqlMockDb';
import type { AuthSession } from './authSession';
import type { CustomerAddress, Order } from '../types/logo';

export interface AccountProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  phoneNumber: string | null;
  isAdmin: boolean;
  isRootAdmin: boolean;
  adminRole: string | null;
  adminPermissions: string[];
  savedAddresses: CustomerAddress[];
  wishlist: string[];
}

export type EmployeeRole = 'Catalog Manager' | 'Order Fulfillment' | 'Customer Support';
export type AdminPermission = 'dashboard' | 'catalog' | 'orders' | 'customers' | 'reviews' | 'marketing' | 'reports' | 'settings' | 'audit_logs' | 'inventory';

export interface AdminEmployee {
  id: string;
  email: string;
  name: string;
  role: EmployeeRole;
  permissions: AdminPermission[];
  active: boolean;
  createdAt?: string;
}

export interface CheckoutRequest {
  items: Array<{ productId: string; quantity: number; variantTitle?: string }>;
  shippingMethod: Order['shippingMethod'];
  paymentMethod: 'Card' | 'Cash on Delivery';
  couponCode?: string;
  shippingAddress: Order['shippingAddress'];
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers
    }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 502 || response.status === 503) {
      throw new Error('The TRS Hub API is unavailable. Start the API and verify MYSQL_URL before signing in.');
    }
    throw new Error(typeof body.error === 'string' ? body.error : `Request failed (${response.status}).`);
  }
  return body as T;
}

async function authorizedRequest<T>(user: Pick<AuthSession, 'token'>, path: string, init?: RequestInit): Promise<T> {
  return request<T>(path, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${user.token}`
    }
  });
}

export async function loginAccount(email: string, password: string): Promise<{ token: string }> {
  return request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export async function registerAccount(name: string, email: string, password: string): Promise<{ token: string }> {
  return request('/api/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });
}

export async function logoutAccount(user: Pick<AuthSession, 'token'>): Promise<void> {
  await authorizedRequest(user, '/api/auth/logout', { method: 'POST' });
}

export async function loadPublicState(): Promise<Partial<MySQLDatabaseSnapshot> | null> {
  const result = await request<{ state: Partial<MySQLDatabaseSnapshot> | null }>('/api/store/state');
  return result.state;
}

export async function loadAdminState(user: AuthSession): Promise<MySQLDatabaseSnapshot | null> {
  const result = await authorizedRequest<{ state: MySQLDatabaseSnapshot | null }>(user, '/api/admin/state');
  return result.state;
}

export async function saveAdminState(user: AuthSession, state: MySQLDatabaseSnapshot): Promise<void> {
  await authorizedRequest(user, '/api/admin/state', {
    method: 'PUT',
    body: JSON.stringify(state)
  });
}

export async function loadAccountProfile(user: Pick<AuthSession, 'token'>): Promise<AccountProfile> {
  return authorizedRequest<AccountProfile>(user, '/api/auth/me');
}

export async function saveAccountProfile(
  user: AuthSession,
  profile: Pick<AccountProfile, 'savedAddresses' | 'wishlist'>
): Promise<Pick<AccountProfile, 'savedAddresses' | 'wishlist'>> {
  return authorizedRequest(user, '/api/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(profile)
  });
}

export async function createCheckout(user: AuthSession, checkout: CheckoutRequest): Promise<{ order?: Order; checkoutUrl?: string; orderId?: string }> {
  return authorizedRequest(user, '/api/payments/checkout', {
    method: 'POST',
    body: JSON.stringify(checkout)
  });
}

export async function confirmStripePayment(user: AuthSession, orderId: string, sessionId: string): Promise<Order> {
  const result = await authorizedRequest<{ order: Order }>(user, '/api/payments/confirm', {
    method: 'POST',
    body: JSON.stringify({ orderId, sessionId })
  });
  return result.order;
}

export async function loadCustomerOrders(user: AuthSession): Promise<Order[]> {
  const result = await authorizedRequest<{ orders: Order[] }>(user, '/api/payments/orders');
  return result.orders;
}

export async function requestAdminRefund(
  user: AuthSession,
  orderId: string,
  amount: number,
  reason: string
): Promise<{ refundId: string; refundAmount: number; fullyRefunded: boolean }> {
  return authorizedRequest(user, '/api/payments/admin/refund', {
    method: 'POST',
    body: JSON.stringify({ orderId, amount, reason })
  });
}

export async function loadAdminEmployees(user: AuthSession): Promise<AdminEmployee[]> {
  const result = await authorizedRequest<{ employees: AdminEmployee[] }>(user, '/api/admin/employees');
  return result.employees;
}

export async function createAdminEmployee(
  user: AuthSession,
  employee: Pick<AdminEmployee, 'name' | 'email' | 'role' | 'permissions'> & { password: string }
): Promise<AdminEmployee> {
  return authorizedRequest<AdminEmployee>(user, '/api/admin/employees', {
    method: 'POST',
    body: JSON.stringify(employee)
  });
}

export async function updateAdminEmployee(
  user: AuthSession,
  employee: Pick<AdminEmployee, 'id' | 'name' | 'role' | 'permissions'>
): Promise<void> {
  await authorizedRequest(user, `/api/admin/employees/${encodeURIComponent(employee.id)}`, {
    method: 'PUT',
    body: JSON.stringify({ name: employee.name, role: employee.role, permissions: employee.permissions })
  });
}

export async function deactivateAdminEmployee(user: AuthSession, employeeId: string): Promise<void> {
  await authorizedRequest(user, `/api/admin/employees/${encodeURIComponent(employeeId)}`, { method: 'DELETE' });
}
