/**
 * Orchestra - PostgreSQL Schema Initializer for Render
 * Run via: node scripts/init-db.js
 * Requires DATABASE_URL environment variable.
 */
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log('ℹ️ DATABASE_URL is not set. Skipping database migration (in-memory mode).');
    process.exit(0);
  }

  console.log('🚀 Connecting to PostgreSQL database...');
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === 'production' || databaseUrl.includes('render.com') 
      ? { rejectUnauthorized: false } 
      : false,
  });

  try {
    const client = await pool.connect();
    console.log('✅ Connected to database. Reading schema migration...');

    const schemaPath = path.join(__dirname, '..', 'supabase', 'migrations', '20260903_init.sql');
    let sql;
    if (fs.existsSync(schemaPath)) {
      sql = fs.readFileSync(schemaPath, 'utf-8');
    } else {
      throw new Error(`Schema file not found at: ${schemaPath}`);
    }

    console.log('⚡ Applying schema migration & stored functions...');
    await client.query(sql);

    console.log('🌱 Seeding initial demo profile...');
    await client.query(`
      INSERT INTO profiles (id, email, full_name, credits_balance)
      VALUES ('00000000-0000-0000-0000-000000000001', 'demo@orchestra.app', 'Orchestra Demo', 100.00)
      ON CONFLICT (id) DO NOTHING;
    `);

    console.log('🎉 Database initialized and seeded successfully!');
    client.release();
  } catch (err) {
    console.error('⚠️ Migration notice:', err.message);
    // Exit 0 so next start can still boot with runtime auto-init and in-memory fallback
    process.exit(0);
  } finally {
    await pool.end();
  }
}

main();
