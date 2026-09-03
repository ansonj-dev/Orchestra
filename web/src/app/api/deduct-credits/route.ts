// POST /api/deduct-credits - Atomic Microbilling Ledger Endpoint & Circuit Breaker

import { NextResponse } from 'next/server';
import { OrchestraLedger } from '@/lib/ledger';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { toolName, cost, caller, metadata } = body;

    if (!toolName) {
      return NextResponse.json(
        { success: false, error: "Missing required parameter 'toolName'." },
        { status: 400 }
      );
    }

    const result = await OrchestraLedger.deductCreditsAsync({
      toolName,
      cost,
      caller: caller || 'browser-webmcp',
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          circuitBreakerTriggered: true,
          error: result.error,
          remainingBalance: result.remainingBalance
        },
        { status: 402 } // 402 Payment Required
      );
    }

    return NextResponse.json({
      success: true,
      deducted: result.deducted,
      remainingBalance: result.remainingBalance,
      toolName,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process credit deduction." },
      { status: 500 }
    );
  }
}
