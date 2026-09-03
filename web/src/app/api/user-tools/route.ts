// GET /api/user-tools - Returns rented WebMCP tools for the active session

import { NextResponse } from 'next/server';
import { OrchestraLedger } from '@/lib/ledger';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hostname = searchParams.get('hostname');

    const rentedTools = OrchestraLedger.getRentedTools();
    const balance = OrchestraLedger.getBalance();

    return NextResponse.json({
      success: true,
      hostname: hostname || 'all',
      userCredits: balance,
      toolsCount: rentedTools.length,
      tools: rentedTools
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to retrieve user tools." },
      { status: 500 }
    );
  }
}
