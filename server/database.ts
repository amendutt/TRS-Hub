import mysql, { type Pool } from 'mysql2/promise';

let pool: Pool | undefined;

export function getDatabase(): Pool {
  if (pool) return pool;

  const databaseUrl = process.env.MYSQL_URL;
  if (!databaseUrl) {
    throw new Error('MYSQL_URL is required.');
  }

  pool = mysql.createPool(databaseUrl);
  return pool;
}

export async function ensureDatabaseSchema(): Promise<void> {
  const database = getDatabase();
  await database.execute(`
    CREATE TABLE IF NOT EXISTS app_state (
      state_key VARCHAR(64) PRIMARY KEY,
      payload JSON NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);
  await database.execute(`
    CREATE TABLE IF NOT EXISTS customer_profiles (
      firebase_uid VARCHAR(128) PRIMARY KEY,
      email VARCHAR(254) NULL,
      display_name VARCHAR(160) NULL,
      phone_number VARCHAR(32) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);
  await database.execute(`
    CREATE TABLE IF NOT EXISTS store_orders (
      id CHAR(36) PRIMARY KEY,
      order_number VARCHAR(40) NOT NULL UNIQUE,
      firebase_uid VARCHAR(128) NULL,
      customer_email VARCHAR(254) NOT NULL,
      currency CHAR(3) NOT NULL,
      subtotal DECIMAL(12,2) NOT NULL,
      shipping DECIMAL(12,2) NOT NULL,
      tax DECIMAL(12,2) NOT NULL,
      discount DECIMAL(12,2) NOT NULL DEFAULT 0,
      total DECIMAL(12,2) NOT NULL,
      coupon_code VARCHAR(64) NULL,
      shipping_method VARCHAR(80) NOT NULL,
      payment_method VARCHAR(32) NOT NULL,
      payment_provider VARCHAR(24) NOT NULL,
      payment_provider_id VARCHAR(128) NULL,
      stock_reserved TINYINT(1) NOT NULL DEFAULT 0,
      payment_status ENUM('pending', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
      order_status ENUM('processing', 'shipped', 'delivered', 'cancelled', 'returned') NOT NULL DEFAULT 'processing',
      items JSON NOT NULL,
      shipping_address JSON NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_orders_customer (firebase_uid, created_at),
      INDEX idx_orders_payment_status (payment_status)
    ) ENGINE=InnoDB
  `);
}
