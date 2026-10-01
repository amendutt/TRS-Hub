import { createHash, randomBytes } from 'node:crypto';
import type { RowDataPacket } from 'mysql2';
import { getDatabase } from './database.js';

export const localDemoMode = process.env.NODE_ENV !== 'production'
  && (!process.env.MYSQL_URL || process.env.MYSQL_URL.includes('change-me'));

const localSessions = new Set<string>();
const localAdminId = 'local-super-admin';

export interface AccountIdentity {
  id: string;
  email: string;
  displayName: string;
  phoneNumber: string | null;
  role: string;
  permissions: string[];
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function createSession(accountId: string): Promise<string> {
  const token = randomBytes(32).toString('base64url');
  if (localDemoMode) {
    localSessions.add(token);
    return token;
  }
  await getDatabase().execute(
    'INSERT INTO account_sessions (token_hash, account_id, expires_at) VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 7 DAY))',
    [hashToken(token), accountId]
  );
  return token;
}

export async function requireSession(authorization?: string): Promise<AccountIdentity> {
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  if (!match) throw new Error('A database session is required.');
  if (localDemoMode) {
    if (!localSessions.has(match[1])) throw new Error('Your session is invalid or expired. Sign in again.');
    return {
      id: localAdminId,
      email: process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase() || 'admin@example.com',
      displayName: process.env.SUPER_ADMIN_NAME?.trim() || 'Super Admin',
      phoneNumber: null,
      role: 'super_admin',
      permissions: []
    };
  }
  const [rows] = await getDatabase().execute<Array<RowDataPacket & {
    id: string;
    email: string;
    display_name: string;
    phone_number: string | null;
    role: string;
    permissions: unknown;
  }>>(
    `SELECT a.id, a.email, a.display_name, a.phone_number, a.role, a.permissions
     FROM account_sessions s
     JOIN account_users a ON a.id = s.account_id
     WHERE s.token_hash = ? AND s.expires_at > UTC_TIMESTAMP() AND a.active = 1`,
    [hashToken(match[1])]
  );
  const account = rows[0];
  if (!account) throw new Error('Your session is invalid or expired. Sign in again.');
  const permissions = typeof account.permissions === 'string'
    ? JSON.parse(account.permissions)
    : account.permissions;
  return {
    id: account.id,
    email: account.email,
    displayName: account.display_name,
    phoneNumber: account.phone_number,
    role: account.role,
    permissions: Array.isArray(permissions) ? permissions : []
  };
}

export async function revokeSession(authorization?: string): Promise<void> {
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  if (!match) return;
  if (localDemoMode) {
    localSessions.delete(match[1]);
    return;
  }
  await getDatabase().execute('DELETE FROM account_sessions WHERE token_hash = ?', [hashToken(match[1])]);
}