import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { ensureDatabaseSchema, getDatabase } from '../server/database.js';
import { hashPassword } from '../server/password.js';

const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.SUPER_ADMIN_PASSWORD;
const name = process.env.SUPER_ADMIN_NAME?.trim() || 'Super Admin';

try {
  if (!email || !password) throw new Error('Set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD in .env first.');
  if (password.length < 12 || password.length > 128) throw new Error('SUPER_ADMIN_PASSWORD must be 12 to 128 characters long.');

  await ensureDatabaseSchema();
  const database = getDatabase();
  const [existing] = await database.execute<Array<{ id: string } & import('mysql2').RowDataPacket>>(
    'SELECT id FROM account_users WHERE email = ?', [email]
  );
  if (existing.length) throw new Error('That account already exists; the seed command will not replace its password.');

  await database.execute(
    `INSERT INTO account_users (id, email, password_hash, display_name, role, permissions)
     VALUES (?, ?, ?, ?, 'super_admin', JSON_ARRAY())`,
    [randomUUID(), email, hashPassword(password), name]
  );
  console.info(`Super Admin account created for ${email}.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Unable to seed Super Admin.');
  process.exitCode = 1;
} finally {
  try {
    await getDatabase().end();
  } catch {
  }
}