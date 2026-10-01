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
    CREATE TABLE IF NOT EXISTS account_users (
      id CHAR(36) PRIMARY KEY,
      email VARCHAR(254) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      display_name VARCHAR(160) NOT NULL,
      phone_number VARCHAR(32) NULL,
      role VARCHAR(60) NOT NULL DEFAULT 'customer',
      permissions JSON NULL,
      active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_account_users_role (role, active)
    ) ENGINE=InnoDB
  `);
  await database.execute(`
    CREATE TABLE IF NOT EXISTS account_sessions (
      token_hash CHAR(64) PRIMARY KEY,
      account_id CHAR(36) NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_account_sessions_expiry (expires_at),
      CONSTRAINT fk_account_sessions_user FOREIGN KEY (account_id) REFERENCES account_users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);
  await database.execute(`
    CREATE TABLE IF NOT EXISTS customer_account_profiles (
      account_id CHAR(36) PRIMARY KEY,
      saved_addresses JSON NULL,
      wishlist JSON NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_customer_profiles_user FOREIGN KEY (account_id) REFERENCES account_users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);
  await database.execute(`
    CREATE TABLE IF NOT EXISTS app_state (
      state_key VARCHAR(64) PRIMARY KEY,
      payload JSON NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);
  await database.execute(`
    CREATE TABLE IF NOT EXISTS store_orders (
      id CHAR(36) PRIMARY KEY,
      order_number VARCHAR(40) NOT NULL UNIQUE,
      account_id CHAR(36) NULL,
      customer_email VARCHAR(254) NOT NULL,
      currency CHAR(3) NOT NULL,
      subtotal DECIMAL(12,2) NOT NULL,
      shipping DECIMAL(12,2) NOT NULL,
      tax DECIMAL(12,2) NOT NULL,
      discount DECIMAL(12,2) NOT NULL DEFAULT 0,
      total DECIMAL(12,2) NOT NULL,
      refund_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
      refund_reason VARCHAR(500) NULL,
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
      INDEX idx_orders_customer (account_id, created_at),
      INDEX idx_orders_payment_status (payment_status)
    ) ENGINE=InnoDB
  `);
  const [accountIdColumns] = await database.execute<Array<import('mysql2').RowDataPacket>>(
    "SHOW COLUMNS FROM store_orders LIKE 'account_id'"
  );
  if (accountIdColumns.length === 0) {
    await database.execute('ALTER TABLE store_orders ADD COLUMN account_id CHAR(36) NULL, ADD INDEX idx_orders_account_id (account_id, created_at)');
  }
  const [refundColumns] = await database.execute<Array<import('mysql2').RowDataPacket>>(
    "SHOW COLUMNS FROM store_orders LIKE 'refund_amount'"
  );
  if (refundColumns.length === 0) {
    await database.execute('ALTER TABLE store_orders ADD COLUMN refund_amount DECIMAL(12,2) NOT NULL DEFAULT 0');
  }
  const [refundReasonColumns] = await database.execute<Array<import('mysql2').RowDataPacket>>(
    "SHOW COLUMNS FROM store_orders LIKE 'refund_reason'"
  );
  if (refundReasonColumns.length === 0) {
    await database.execute('ALTER TABLE store_orders ADD COLUMN refund_reason VARCHAR(500) NULL');
  }
}
