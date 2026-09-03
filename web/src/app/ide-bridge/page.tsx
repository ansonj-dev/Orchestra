'use client';

import React, { useState } from 'react';
import IdeConfigSnippet from '@/components/IdeConfigSnippet';

export default function IdeBridgePage() {
  const [testTool, setTestTool] = useState('shopify_checkout_fast');
  const [testArgs, setTestArgs] = useState('{"fullName": "Alex Mercer", "email": "alex@mercer.io"}');
  const [ideSimulating, setIdeSimulating] = useState(false);
  const [rpcResponse, setRpcResponse] = useState<any>(null);

  const simulateIdeRpcCall = async () => {
    setIdeSimulating(true);
    setRpcResponse(null);
    try {
      let parsed = {};
      try { parsed = JSON.parse(testArgs); } catch (e) {
        setRpcResponse({ error: "Invalid JSON args" });
        setIdeSimulating(false);
        return;
      }

      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "cursor-req-" + Date.now(),
          method: "tools/call",
          params: {
            name: testTool,
            arguments: parsed
          }
        })
      });

      const data = await res.json();
      setRpcResponse(data);
      window.dispatchEvent(new CustomEvent('orchestra:tool-executed', { detail: { remainingBalance: 99.85 } }));
    } catch (e: any) {
      setRpcResponse({ error: e.message });
    } finally {
      setIdeSimulating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-6 font-sans">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-mono text-blue-400 mb-2">
              <span>🔌 Model Context Protocol (MCP) Server Endpoint</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              IDE & Local Agent Bridge
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Connect Cursor, Claude Code, Windsurf, and ChatGPT Desktop directly into Orchestra's metered browser runtime.
            </p>
          </div>

          <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-xl font-mono text-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-400">Endpoint:</span>
            <span className="text-cyan-400 font-bold">/api/mcp</span>
          </div>
        </div>

        {/* Interactive Configuration Snippets */}
        <IdeConfigSnippet />

        {/* Live IDE RPC Call Simulator */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Simulate IDE JSON-RPC Tool Invocation
              </h3>
              <p className="text-xs text-slate-400">
                Watch how Cursor or Claude Code calls an Orchestra tool, triggers atomic micro-deduction, and gets live context back.
              </p>
            </div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950 px-2.5 py-1 rounded border border-cyan-800/40">
              Protocol: JSON-RPC 2.0
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            <div className="space-y-2">
              <label className="text-slate-400 block font-semibold">Select Injected WebMCP Tool</label>
              <select
                value={testTool}
                onChange={(e) => setTestTool(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="shopify_checkout_fast">shopify_checkout_fast (0.15 CR)</option>
                <option value="extract_analytics_table">extract_analytics_table (0.08 CR)</option>
                <option value="margin_context_editor">margin_context_editor (0.10 CR)</option>
              </select>

              <label className="text-slate-400 block font-semibold mt-3">RPC Arguments Payload</label>
              <textarea
                rows={4}
                value={testArgs}
                onChange={(e) => setTestArgs(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-cyan-300 focus:outline-none focus:border-cyan-500 font-mono"
              />

              <button
                onClick={simulateIdeRpcCall}
                disabled={ideSimulating}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition shadow-md shadow-cyan-500/20"
              >
                {ideSimulating ? 'Sending RPC Call...' : '▶ Send IDE Tool Call Request'}
              </button>
            </div>

            {/* Response Output Box */}
            <div className="space-y-2">
              <label className="text-slate-400 block font-semibold">MCP JSON-RPC Response Output</label>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-300 h-[190px] overflow-y-auto leading-relaxed">
                {rpcResponse ? JSON.stringify(rpcResponse, null, 2) : '// Response will appear here after clicking Send IDE Tool Call Request...'}
              </pre>
            </div>
          </div>
        </div>

        {/* Architecture Comparison Table */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-bold text-white tracking-tight">
            Comparison: Traditional Cloud Directories vs Orchestra
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <th className="pb-3 pr-4">Dimension</th>
                  <th className="pb-3 pr-4 text-rose-400">Remote Cloud Agents (OKX.AI / Old Stores)</th>
                  <th className="pb-3 text-cyan-400">Orchestra Local Bridge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                <tr>
                  <td className="py-3 pr-4 font-bold text-white">Credential Handling</td>
                  <td className="py-3 pr-4 text-rose-300">Requires uploading master API keys / OAuth tokens to cloud servers</td>
                  <td className="py-3 text-emerald-300">Runs locally in active DOM session; zero keys shared with anyone</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-bold text-white">Infinite Loop Cost</td>
                  <td className="py-3 pr-4 text-rose-300">Uncapped remote API bills upon failure or deadlocks</td>
                  <td className="py-3 text-emerald-300">Pre-paid micro-ledger with hard circuit breaker auto-cutoff</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-bold text-white">IDE Integration</td>
                  <td className="py-3 pr-4 text-rose-300">Fragmented REST webhooks requiring proprietary client SDKs</td>
                  <td className="py-3 text-emerald-300">Universal Model Context Protocol (Cursor, Claude Code, ChatGPT)</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-bold text-white">Reliability Testing</td>
                  <td className="py-3 pr-4 text-rose-300">Subjective human reviews; untested scripts deployed to buyers</td>
                  <td className="py-3 text-emerald-300">Automated 5-point headless synthetic chaos evals benchmark</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
