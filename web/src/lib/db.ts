// Orchestra — PostgreSQL Connection Pool
// Uses DATABASE_URL automatically injected by Render when linked to a PostgreSQL database.
// Falls back gracefully if DATABASE_URL is not set (dev/demo mode with in-memory ledger).

import { Pool, PoolClient } from 'pg';

let pool: Pool | null = null;

export function getPool(): Pool | null {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      console.error('[Orchestra DB] Pool error:', err.message);
    });
  }

  return pool;
}

export async function query<T = any>(
  sql: string,
  params?: any[]
): Promise<T[]> {
  const db = getPool();
  if (!db) throw new Error('DATABASE_URL not configured');
  const result = await db.query(sql, params);
  return result.rows as T[];
}

export async function queryOne<T = any>(
  sql: string,
  params?: any[]
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const db = getPool();
  if (!db) throw new Error('DATABASE_URL not configured');
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function isDatabaseConnected(): Promise<boolean> {
  try {
    const db = getPool();
    if (!db) return false;
    await db.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}
