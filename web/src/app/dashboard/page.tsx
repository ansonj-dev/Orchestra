'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ExecutionTransaction, WebMCPTool } from '@/types';
import WalletModal from '@/components/WalletModal';

export default function DashboardPage() {
  const [balance, setBalance] = useState(100.0);
  const [transactions, setTransactions] = useState<ExecutionTransaction[]>([]);
  const [rentedTools, setRentedTools] = useState<WebMCPTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [capFeedback, setCapFeedback] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      const [walletRes, toolsRes] = await Promise.all([
        fetch('/api/wallet'),
        fetch('/api/user-tools')
      ]);

      if (walletRes.ok) {
        const wData = await walletRes.json();
        setBalance(wData.balance ?? 100.0);
        setTransactions(wData.transactions || []);
      }

      if (toolsRes.ok) {
        const tData = await toolsRes.json();
        setRentedTools(tData.tools || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateCap = async (toolName: string, hardCap: number) => {
    try {
      const res = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set-hard-cap', toolName, hardCap })
      });
      const data = await res.json();
      if (data.success) {
        setCapFeedback(`Circuit cap for ${toolName} updated to ${hardCap} CR.`);
        setTimeout(() => setCapFeedback(null), 3000);
      }
    } catch (e: any) {
      setCapFeedback('Error updating cap: ' + e.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <span>Credit Ledger & Session Console</span>
              <span className="text-xs font-mono font-normal bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                Circuit Guard Active
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Real-time audit log of local agent tool execution micropayments and runaway protection
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsWalletOpen(true)}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 text-white text-xs font-mono font-bold px-4 py-2.5 rounded-xl transition shadow-lg shadow-cyan-500/20"
            >
              + Top-Up Credits
            </button>
            <Link
              href="/"
              className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-mono px-4 py-2.5 rounded-xl transition"
            >
              Browse Tools
            </Link>
          </div>
        </div>

        {/* Feedback Alert */}
        {capFeedback && (
          <div className="p-3 rounded-xl bg-cyan-950/60 border border-cyan-800/50 text-cyan-300 text-xs font-mono">
            {capFeedback}
          </div>
        )}

        {/* Ledger Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 relative overflow-hidden">
            <span className="text-xs uppercase text-slate-400">Available Wallet Balance</span>
            <div className="text-3xl font-black text-cyan-400 mt-1">
              {balance.toFixed(2)} <span className="text-sm font-normal text-slate-400">CR</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Atomic Supabase / Memory Ledger</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-xs uppercase text-slate-400">Active Rented Tools</span>
            <div className="text-3xl font-black text-white mt-1">
              {rentedTools.length}
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Injected into document.modelContext</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-xs uppercase text-slate-400">Execution Events</span>
            <div className="text-3xl font-black text-emerald-400 mt-1">
              {transactions.filter(t => t.status === 'SUCCESS').length}
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Verified local DOM tasks</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-xs uppercase text-slate-400">Circuit Breakers Cutoffs</span>
            <div className="text-3xl font-black text-amber-400 mt-1">
              {transactions.filter(t => t.status !== 'SUCCESS').length}
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Runaway attempts halted</p>
          </div>
        </div>

        {/* Section: Per-Tool Spend Caps (Circuit Breaker Controls) */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Runaway Circuit Breakers (Per-Tool Caps)</h2>
              <p className="text-xs text-slate-400">Set maximum credit ceiling per session to prevent infinite loops from draining funds.</p>
            </div>
            <span className="text-[11px] font-mono bg-cyan-950 text-cyan-400 px-2.5 py-1 rounded-md border border-cyan-800/40">
              Auto-Terminate at Cap
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
            {rentedTools.map((t) => (
              <div key={t.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white truncate">{t.title}</span>
                  <span className="text-cyan-400 font-semibold">{t.cost} CR</span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono">mcp_id: {t.tool_name}</div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Hard Spend Cap:</span>
                    <span className="text-amber-400 font-bold">10.00 CR</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateCap(t.tool_name, 5.0)}
                      className="flex-1 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[10px]"
                    >
                      Cap: 5 CR
                    </button>
                    <button
                      onClick={() => handleUpdateCap(t.tool_name, 10.0)}
                      className="flex-1 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[10px]"
                    >
                      Cap: 10 CR
                    </button>
                    <button
                      onClick={() => handleUpdateCap(t.tool_name, 25.0)}
                      className="flex-1 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[10px]"
                    >
                      Cap: 25 CR
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section: Audit Ledger Transactions Table */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Tamper-Proof Execution Ledger</h2>
              <p className="text-xs text-slate-400">Auditable record of all micro-deductions and circuit breaker checks</p>
            </div>
            <button
              onClick={fetchDashboardData}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-mono"
            >
              ↻ Refresh Ledger
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider text-[10px]">
                  <th className="pb-3 pr-4">Timestamp</th>
                  <th className="pb-3 pr-4">Agent Tool</th>
                  <th className="pb-3 pr-4">Cost</th>
                  <th className="pb-3 pr-4">Client Caller</th>
                  <th className="pb-3 pr-4">Remaining Balance</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 pr-4 text-slate-400 whitespace-nowrap">
                      {new Date(tx.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3 pr-4 font-semibold text-white">
                      {tx.toolTitle || tx.toolName}
                    </td>
                    <td className="py-3 pr-4 font-bold text-cyan-400">
                      {tx.cost > 0 ? `-${tx.cost.toFixed(2)}` : `+${Math.abs(tx.cost).toFixed(2)}`} CR
                    </td>
                    <td className="py-3 pr-4 text-slate-400">
                      <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px]">
                        {tx.caller}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-300">
                      {tx.remainingBalance.toFixed(2)} CR
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                          tx.status === 'SUCCESS'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <WalletModal
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
        currentBalance={balance}
        onRefilled={(b) => setBalance(b)}
      />
    </div>
  );
}
