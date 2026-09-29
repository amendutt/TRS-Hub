import type { User } from 'firebase/auth';
import type { MySQLDatabaseSnapshot } from './mysqlMockDb';
import type { Order } from '../types/logo';

export interface AccountProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  phoneNumber: string | null;
  isAdmin: boolean;
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
    throw new Error(typeof body.error === 'string' ? body.error : `Request failed (${response.status}).`);
  }
  return body as T;
}

async function authorizedRequest<T>(user: User, path: string, init?: RequestInit): Promise<T> {
  const token = await user.getIdToken();
  return request<T>(path, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${token}`
    }
  });
}

export async function loadPublicState(): Promise<Partial<MySQLDatabaseSnapshot> | null> {
  const result = await request<{ state: Partial<MySQLDatabaseSnapshot> | null }>('/api/store/state');
  return result.state;
}

export async function loadAdminState(user: User): Promise<MySQLDatabaseSnapshot | null> {
  const result = await authorizedRequest<{ state: MySQLDatabaseSnapshot | null }>(user, '/api/admin/state');
  return result.state;
}

export async function saveAdminState(user: User, state: MySQLDatabaseSnapshot): Promise<void> {
  await authorizedRequest(user, '/api/admin/state', {
    method: 'PUT',
    body: JSON.stringify(state)
  });
}

export async function loadAccountProfile(user: User): Promise<AccountProfile> {
  return authorizedRequest<AccountProfile>(user, '/api/auth/me');
}

export async function createCheckout(user: User, checkout: CheckoutRequest): Promise<{ order?: Order; checkoutUrl?: string; orderId?: string }> {
  return authorizedRequest(user, '/api/payments/checkout', {
    method: 'POST',
    body: JSON.stringify(checkout)
  });
}

export async function confirmStripePayment(user: User, orderId: string, sessionId: string): Promise<Order> {
  const result = await authorizedRequest<{ order: Order }>(user, '/api/payments/confirm', {
    method: 'POST',
    body: JSON.stringify({ orderId, sessionId })
  });
  return result.order;
}

export async function loadCustomerOrders(user: User): Promise<Order[]> {
  const result = await authorizedRequest<{ orders: Order[] }>(user, '/api/payments/orders');
  return result.orders;
}
