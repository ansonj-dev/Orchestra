// Orchestra — PostgreSQL Connection Pool
// Uses DATABASE_URL automatically injected by Render when linked to a PostgreSQL database.
// Falls back gracefully if DATABASE_URL is not set (dev/demo mode with in-memory ledger).

import { Pool, PoolClient } from 'pg';

let pool: Pool | null = null;
let initialized = false;
let initPromise: Promise<void> | null = null;

export function getPool(): Pool | null {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' || process.env.DATABASE_URL.includes('render.com')
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

export async function ensureDatabaseSchema(): Promise<void> {
  const db = getPool();
  if (!db || initialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const checkRes = await db.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'profiles'
        );
      `);

      if (!checkRes.rows[0]?.exists) {
        console.log('[Orchestra DB] Initializing tables and schema on startup...');
        await db.query(`
          CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

          CREATE TABLE IF NOT EXISTS profiles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email TEXT UNIQUE,
            full_name TEXT,
            role TEXT DEFAULT 'buyer' CHECK (role IN ('buyer', 'developer', 'admin')),
            credits_balance NUMERIC(10, 4) DEFAULT 100.0000,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );

          CREATE TABLE IF NOT EXISTS agent_tools (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            developer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
            title TEXT NOT NULL,
            tool_name TEXT UNIQUE NOT NULL,
            description TEXT NOT NULL,
            category TEXT DEFAULT 'Utility',
            cost_per_execution NUMERIC(8, 4) DEFAULT 0.1000,
            reliability_score NUMERIC(5, 2) DEFAULT 98.50,
            author_name TEXT DEFAULT 'Verified Partner',
            input_schema JSONB NOT NULL DEFAULT '{}'::jsonb,
            javascript_code TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );

          CREATE TABLE IF NOT EXISTS tool_rentals (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
            tool_id UUID REFERENCES agent_tools(id) ON DELETE CASCADE,
            tool_name TEXT NOT NULL,
            hard_cap_credits NUMERIC(8, 2) DEFAULT 10.00,
            total_spent NUMERIC(10, 4) DEFAULT 0.0000,
            status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'revoked')),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(user_id, tool_id)
          );

          CREATE TABLE IF NOT EXISTS execution_transactions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
            developer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
            tool_name TEXT NOT NULL,
            cost NUMERIC(8, 4) NOT NULL,
            caller_client TEXT DEFAULT 'browser-webmcp',
            status TEXT DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS', 'INSUFFICIENT_FUNDS', 'BLOCKED', 'ERROR')),
            metadata JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMPTZ DEFAULT NOW()
          );

          INSERT INTO profiles (id, email, full_name, credits_balance)
          VALUES ('00000000-0000-0000-0000-000000000001', 'demo@orchestra.app', 'Orchestra Demo', 100.00)
          ON CONFLICT (id) DO NOTHING;
        `);
        console.log('[Orchestra DB] Database schema auto-initialized successfully.');
      }
      initialized = true;
    } catch (err: any) {
      console.error('[Orchestra DB] Auto-schema initialization warning:', err.message);
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

export async function query<T = any>(
  sql: string,
  params?: any[]
): Promise<T[]> {
  const db = getPool();
  if (!db) throw new Error('DATABASE_URL not configured');
  await ensureDatabaseSchema();
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
  await ensureDatabaseSchema();
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
    await ensureDatabaseSchema();
    await db.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}
