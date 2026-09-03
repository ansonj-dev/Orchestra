// Orchestra Unified Ledger & Transaction Engine
// PostgreSQL-backed (Render) with automatic in-memory fallback for dev/demo mode.

import { WebMCPTool, ExecutionTransaction } from '../types';
import { SAMPLE_TOOLS } from './sample-tools';
import { getPool, ensureDatabaseSchema } from './db';

export interface LedgerState {
  balance: number;
  rentedToolNames: string[];
  transactions: ExecutionTransaction[];
  customTools: WebMCPTool[];
  hardCaps: Record<string, number>;
}

// ─── In-Memory Fallback Store ────────────────────────────────────────────────
// Used when DATABASE_URL is not set (local dev / demo mode).
let memoryLedger: LedgerState = {
  balance: 100.00,
  rentedToolNames: ['shopify_checkout_fast', 'extract_analytics_table', 'margin_context_editor'],
  transactions: [
    {
      id: 'tx_init_welcome',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      toolName: 'system_onboarding',
      toolTitle: 'Orchestra Welcome Grant',
      cost: 0,
      remainingBalance: 100.00,
      caller: 'browser-webmcp',
      status: 'SUCCESS',
      resultSummary: '100.00 CR initial credits funded.',
    },
  ],
  customTools: [],
  hardCaps: {
    shopify_checkout_fast: 10.00,
    extract_analytics_table: 5.00,
    margin_context_editor: 5.00,
  },
};

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

function isDbAvailable(): boolean {
  return getPool() !== null;
}

// ─── DB Helpers ──────────────────────────────────────────────────────────────

async function dbGetBalance(): Promise<number> {
  try {
    const pool = getPool();
    if (!pool) return memoryLedger.balance;
    await ensureDatabaseSchema();
    const { rows } = await pool.query(
      'SELECT credits_balance FROM profiles WHERE id = $1',
      [DEMO_USER_ID]
    );
    if (rows.length === 0) {
      // Seed the demo user
      await pool.query(
        `INSERT INTO profiles (id, email, full_name, credits_balance)
         VALUES ($1, 'demo@orchestra.app', 'Orchestra Demo', 100.00)
         ON CONFLICT (id) DO NOTHING`,
        [DEMO_USER_ID]
      );
      return 100.00;
    }
    return parseFloat(rows[0].credits_balance);
  } catch (err: any) {
    console.error('[Orchestra Ledger] DB getBalance error, falling back to memory:', err.message);
    return memoryLedger.balance;
  }
}

async function dbDeduct(cost: number, toolName: string, toolTitle: string | undefined, caller: string): Promise<{ success: boolean; remainingBalance: number; error?: string }> {
  const pool = getPool()!;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      'SELECT credits_balance FROM profiles WHERE id = $1 FOR UPDATE',
      [DEMO_USER_ID]
    );

    if (rows.length === 0) throw new Error('Profile not found');
    const balance = parseFloat(rows[0].credits_balance);

    if (balance < cost) {
      await client.query('ROLLBACK');
      await client.query(
        `INSERT INTO execution_transactions (user_id, tool_name, cost, caller_client, status, metadata)
         VALUES ($1, $2, $3, $4, 'INSUFFICIENT_FUNDS', '{}')`,
        [DEMO_USER_ID, toolName, cost, caller]
      );
      return { success: false, remainingBalance: balance, error: `Insufficient Credits (${balance.toFixed(2)} CR). Circuit Breaker activated.` };
    }

    const { rows: updated } = await client.query(
      'UPDATE profiles SET credits_balance = credits_balance - $1, updated_at = NOW() WHERE id = $2 RETURNING credits_balance',
      [cost, DEMO_USER_ID]
    );
    const newBalance = parseFloat(updated[0].credits_balance);

    await client.query(
      `INSERT INTO execution_transactions (user_id, tool_name, cost, caller_client, status, metadata)
       VALUES ($1, $2, $3, $4, 'SUCCESS', $5)`,
      [DEMO_USER_ID, toolName, cost, caller, JSON.stringify({ toolTitle })]
    );

    await client.query('COMMIT');
    return { success: true, remainingBalance: newBalance };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function dbGetTransactions(limit = 25): Promise<ExecutionTransaction[]> {
  const pool = getPool()!;
  const { rows } = await pool.query(
    `SELECT id, created_at as timestamp, tool_name, cost, caller_client as caller, status,
            metadata, (SELECT credits_balance FROM profiles WHERE id = $1) as remaining_balance
     FROM execution_transactions
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [DEMO_USER_ID, limit]
  );
  return rows.map((r: any) => ({
    id: r.id,
    timestamp: r.timestamp,
    toolName: r.tool_name,
    toolTitle: r.metadata?.toolTitle,
    cost: parseFloat(r.cost),
    remainingBalance: parseFloat(r.remaining_balance ?? 0),
    caller: r.caller,
    status: r.status,
    resultSummary: r.status === 'SUCCESS' ? `Executed. -${parseFloat(r.cost).toFixed(2)} CR` : 'Blocked by circuit breaker.',
  }));
}

async function dbRefill(amount: number): Promise<number> {
  try {
    const pool = getPool();
    if (!pool) throw new Error('No DB pool');
    await ensureDatabaseSchema();
    const { rows } = await pool.query(
      'UPDATE profiles SET credits_balance = credits_balance + $1, updated_at = NOW() WHERE id = $2 RETURNING credits_balance',
      [amount, DEMO_USER_ID]
    );
    if (rows.length === 0) {
      await pool.query(
        `INSERT INTO profiles (id, email, full_name, credits_balance)
         VALUES ($1, 'demo@orchestra.app', 'Orchestra Demo', $2)
         ON CONFLICT (id) DO NOTHING`,
        [DEMO_USER_ID, 100.00 + amount]
      );
      return 100.00 + amount;
    }
    return parseFloat(rows[0].credits_balance);
  } catch (err: any) {
    console.error('[Orchestra Ledger] DB refill error, falling back to memory:', err.message);
    memoryLedger.balance = parseFloat((memoryLedger.balance + amount).toFixed(4));
    return memoryLedger.balance;
  }
}

// ─── OrchestraLedger (Public API) ────────────────────────────────────────────

export class OrchestraLedger {
  static async getBalanceAsync(): Promise<number> {
    if (isDbAvailable()) return dbGetBalance();
    return memoryLedger.balance;
  }

  static getBalance(): number {
    return memoryLedger.balance;
  }

  static async refillBalanceAsync(amount: number): Promise<{ success: boolean; newBalance: number }> {
    if (isDbAvailable()) {
      const newBalance = await dbRefill(amount);
      return { success: true, newBalance };
    }
    memoryLedger.balance = parseFloat((memoryLedger.balance + amount).toFixed(4));
    return { success: true, newBalance: memoryLedger.balance };
  }

  static refillBalance(amount: number): { success: boolean; newBalance: number } {
    memoryLedger.balance = parseFloat((memoryLedger.balance + amount).toFixed(4));
    const tx: ExecutionTransaction = {
      id: 'tx_refill_' + Date.now(),
      timestamp: new Date().toISOString(),
      toolName: 'wallet_refill',
      toolTitle: 'Wallet Credit Top-Up',
      cost: -amount,
      remainingBalance: memoryLedger.balance,
      caller: 'simulator',
      status: 'SUCCESS',
      resultSummary: `Added +${amount.toFixed(2)} CR to ledger.`,
    };
    memoryLedger.transactions.unshift(tx);
    return { success: true, newBalance: memoryLedger.balance };
  }

  static getRentedTools(): WebMCPTool[] {
    return this.getAllTools().filter(t => memoryLedger.rentedToolNames.includes(t.tool_name));
  }

  static isToolRented(toolName: string): boolean {
    return memoryLedger.rentedToolNames.includes(toolName);
  }

  static toggleToolRental(toolName: string): { rented: boolean; activeTools: string[] } {
    const idx = memoryLedger.rentedToolNames.indexOf(toolName);
    if (idx >= 0) {
      memoryLedger.rentedToolNames.splice(idx, 1);
      return { rented: false, activeTools: memoryLedger.rentedToolNames };
    }
    memoryLedger.rentedToolNames.push(toolName);
    if (!memoryLedger.hardCaps[toolName]) memoryLedger.hardCaps[toolName] = 10.00;
    return { rented: true, activeTools: memoryLedger.rentedToolNames };
  }

  static setHardCap(toolName: string, cap: number): void {
    memoryLedger.hardCaps[toolName] = cap;
  }

  static getHardCap(toolName: string): number {
    return memoryLedger.hardCaps[toolName] ?? 10.00;
  }

  static getAllTools(): WebMCPTool[] {
    return [...SAMPLE_TOOLS, ...memoryLedger.customTools];
  }

  static addCustomTool(tool: WebMCPTool): WebMCPTool {
    memoryLedger.customTools.unshift(tool);
    if (!memoryLedger.rentedToolNames.includes(tool.tool_name)) {
      memoryLedger.rentedToolNames.push(tool.tool_name);
    }
    return tool;
  }

  static async deductCreditsAsync(params: {
    toolName: string;
    cost?: number;
    caller?: ExecutionTransaction['caller'];
  }): Promise<{ success: boolean; remainingBalance: number; deducted: number; circuitBreakerTriggered?: boolean; error?: string }> {
    const tool = this.getAllTools().find(t => t.tool_name === params.toolName);
    const cost = params.cost ?? tool?.cost ?? 0.10;
    const caller = params.caller ?? 'browser-webmcp';

    if (isDbAvailable()) {
      try {
        const result = await dbDeduct(cost, params.toolName, tool?.title, caller);
        return {
          success: result.success,
          remainingBalance: result.remainingBalance,
          deducted: result.success ? cost : 0,
          circuitBreakerTriggered: !result.success,
          error: result.error,
        };
      } catch (err: any) {
        console.error('[Orchestra Ledger] DB deduct error, falling back to memory:', err.message);
      }
    }

    // In-memory fallback
    return this.deductCredits(params);
  }

  static deductCredits(params: {
    toolName: string;
    cost?: number;
    caller?: ExecutionTransaction['caller'];
    metadata?: Record<string, any>;
  }): { success: boolean; remainingBalance: number; deducted: number; circuitBreakerTriggered?: boolean; error?: string } {
    const tool = this.getAllTools().find(t => t.tool_name === params.toolName);
    const cost = params.cost ?? tool?.cost ?? 0.10;

    if (memoryLedger.balance < cost || memoryLedger.balance <= 0) {
      memoryLedger.transactions.unshift({
        id: 'tx_err_' + Date.now(),
        timestamp: new Date().toISOString(),
        toolName: params.toolName,
        toolTitle: tool?.title,
        cost,
        remainingBalance: memoryLedger.balance,
        caller: params.caller || 'browser-webmcp',
        status: 'INSUFFICIENT_FUNDS',
        resultSummary: `Circuit Breaker: ${cost} CR required, ${memoryLedger.balance} CR available.`,
      });
      return { success: false, circuitBreakerTriggered: true, remainingBalance: memoryLedger.balance, deducted: 0, error: `Insufficient Credits. Balance: ${memoryLedger.balance.toFixed(2)} CR.` };
    }

    const cap = this.getHardCap(params.toolName);
    const spentOnTool = memoryLedger.transactions
      .filter(t => t.toolName === params.toolName && t.status === 'SUCCESS')
      .reduce((acc, t) => acc + t.cost, 0);

    if (spentOnTool + cost > cap) {
      memoryLedger.transactions.unshift({
        id: 'tx_cap_' + Date.now(),
        timestamp: new Date().toISOString(),
        toolName: params.toolName,
        toolTitle: tool?.title,
        cost,
        remainingBalance: memoryLedger.balance,
        caller: params.caller || 'browser-webmcp',
        status: 'REJECTED',
        resultSummary: `Hard cap of ${cap} CR reached for ${params.toolName}.`,
      });
      return { success: false, circuitBreakerTriggered: true, remainingBalance: memoryLedger.balance, deducted: 0, error: `Hard Spend Cap Exceeded (${cap} CR).` };
    }

    memoryLedger.balance = parseFloat((memoryLedger.balance - cost).toFixed(4));
    memoryLedger.transactions.unshift({
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      toolName: params.toolName,
      toolTitle: tool?.title,
      cost,
      remainingBalance: memoryLedger.balance,
      caller: params.caller || 'browser-webmcp',
      status: 'SUCCESS',
      metadata: params.metadata,
      resultSummary: `Executed. -${cost.toFixed(2)} CR deducted.`,
    });

    return { success: true, remainingBalance: memoryLedger.balance, deducted: cost };
  }

  static async getTransactionsAsync(limit = 25): Promise<ExecutionTransaction[]> {
    if (isDbAvailable()) {
      try {
        return await dbGetTransactions(limit);
      } catch (err: any) {
        console.error('[Orchestra Ledger] DB tx fetch error, falling back to memory:', err.message);
      }
    }
    return memoryLedger.transactions.slice(0, limit);
  }

  static getTransactions(limit = 25): ExecutionTransaction[] {
    return memoryLedger.transactions.slice(0, limit);
  }
}
