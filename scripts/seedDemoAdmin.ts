import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2';
import { z } from 'zod';
import { ensureDatabaseSchema, getDatabase } from '../server/src/database.js';
import { hashPassword } from '../server/src/password.js';

const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.SUPER_ADMIN_PASSWORD;
const name = process.env.SUPER_ADMIN_NAME?.trim() || 'Super Admin';

const employeeSeeds = [
  {
    emailKey: 'EMPLOYEE_CATALOG_MANAGER_EMAIL',
    passwordKey: 'EMPLOYEE_CATALOG_MANAGER_PASSWORD',
    nameKey: 'EMPLOYEE_CATALOG_MANAGER_NAME',
    role: 'Catalog Manager',
    defaultName: 'Catalog Manager',
    permissions: ['dashboard', 'catalog', 'inventory']
  },
  {
    emailKey: 'EMPLOYEE_ORDER_FULFILLMENT_EMAIL',
    passwordKey: 'EMPLOYEE_ORDER_FULFILLMENT_PASSWORD',
    nameKey: 'EMPLOYEE_ORDER_FULFILLMENT_NAME',
    role: 'Order Fulfillment',
    defaultName: 'Order Fulfillment',
    permissions: ['dashboard', 'orders', 'inventory']
  },
  {
    emailKey: 'EMPLOYEE_CUSTOMER_SUPPORT_EMAIL',
    passwordKey: 'EMPLOYEE_CUSTOMER_SUPPORT_PASSWORD',
    nameKey: 'EMPLOYEE_CUSTOMER_SUPPORT_NAME',
    role: 'Customer Support',
    defaultName: 'Customer Support',
    permissions: ['dashboard', 'orders', 'customers', 'reviews']
  }
] as const;

const emailSchema = z.string().trim().email().max(254);

try {
  if (!email || !password) throw new Error('Set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD in .env first.');
  if (password.length < 12 || password.length > 128) throw new Error('SUPER_ADMIN_PASSWORD must be 12 to 128 characters long.');

  await ensureDatabaseSchema();
  const database = getDatabase();
  const [existingAdmin] = await database.execute<Array<RowDataPacket & { id: string; role: string }>>(
    'SELECT id, role FROM account_users WHERE email = ?', [email]
  );
  if (existingAdmin[0]) {
    if (existingAdmin[0].role !== 'super_admin') {
      throw new Error('The configured Super Admin email belongs to a non-admin account.');
    }
    console.info('Super Admin already exists; leaving its password unchanged.');
  } else {
    await database.execute(
      `INSERT INTO account_users (id, email, password_hash, display_name, role, permissions)
       VALUES (?, ?, ?, ?, 'super_admin', JSON_ARRAY())`,
      [randomUUID(), email, hashPassword(password), name]
    );
    console.info(`Super Admin account created for ${email}.`);
  }

  for (const seed of employeeSeeds) {
    const employeeEmailValue = process.env[seed.emailKey]?.trim();
    const employeePassword = process.env[seed.passwordKey];
    if (!employeeEmailValue && !employeePassword) continue;
    if (!employeeEmailValue || !employeePassword) {
      throw new Error(`Set both ${seed.emailKey} and ${seed.passwordKey}, or leave both empty.`);
    }
    const parsedEmail = emailSchema.safeParse(employeeEmailValue);
    if (!parsedEmail.success) throw new Error(`${seed.emailKey} must be a valid email address.`);
    if (employeePassword.length < 12 || employeePassword.length > 128) {
      throw new Error(`${seed.passwordKey} must be 12 to 128 characters long.`);
    }

    const employeeEmail = parsedEmail.data.toLowerCase();
    const employeeName = process.env[seed.nameKey]?.trim() || seed.defaultName;
    const [existingEmployee] = await database.execute<Array<RowDataPacket & { id: string; role: string }>>(
      'SELECT id, role FROM account_users WHERE email = ?', [employeeEmail]
    );
    if (existingEmployee[0]) {
      if (existingEmployee[0].role !== seed.role) {
        throw new Error(`${seed.emailKey} is already assigned to a different account role.`);
      }
      console.info(`${seed.role} account already exists; leaving its password and access unchanged.`);
      continue;
    }

    await database.execute(
      `INSERT INTO account_users (id, email, password_hash, display_name, role, permissions)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [randomUUID(), employeeEmail, hashPassword(employeePassword), employeeName, seed.role, JSON.stringify(seed.permissions)]
    );
    console.info(`${seed.role} account created for ${employeeEmail}.`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Unable to seed Super Admin.');
  process.exitCode = 1;
} finally {
  try {
    await getDatabase().end();
  } catch {
  }
}