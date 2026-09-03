// GET & POST /api/wallet - Balance, Refill & Hard Cap Management

import { NextResponse } from 'next/server';
import { OrchestraLedger } from '@/lib/ledger';

export async function GET() {
  try {
    const balance = await OrchestraLedger.getBalanceAsync();
    const transactions = await OrchestraLedger.getTransactionsAsync(30);
    const rentedTools = OrchestraLedger.getRentedTools();

    return NextResponse.json({
      success: true,
      balance,
      transactions,
      activeToolsCount: rentedTools.length,
      isCircuitBreakerActive: true
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, amount, toolName, hardCap } = body;

    if (action === 'refill') {
      const refillAmount = parseFloat(amount) || 50.00;
      const res = await OrchestraLedger.refillBalanceAsync(refillAmount);
      return NextResponse.json({
        success: true,
        message: `Added +${refillAmount.toFixed(2)} CR to ledger.`,
        newBalance: res.newBalance
      });
    }

    if (action === 'set-hard-cap' && toolName) {
      const cap = parseFloat(hardCap) || 10.00;
      OrchestraLedger.setHardCap(toolName, cap);
      return NextResponse.json({
        success: true,
        message: `Hard cap for ${toolName} set to ${cap.toFixed(2)} CR.`,
        toolName,
        hardCap: cap
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
