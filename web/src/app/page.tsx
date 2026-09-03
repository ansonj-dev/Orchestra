'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ToolCard from '@/components/ToolCard';
import { WebMCPTool } from '@/types';

export default function MarketplaceLandingPage() {
  const [tools, setTools] = useState<WebMCPTool[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [recentExecution, setRecentExecution] = useState<any>(null);

  const categories = [
    'All',
    'E-Commerce',
    'DevOps & Cloud',
    'Productivity',
    'Security & Auth',
    'Data Extraction',
    'Web3 & Onchain',
  ];

  const fetchTools = async () => {
    try {
      const url = new URL('/api/tools', window.location.origin);
      if (selectedCategory !== 'All') url.searchParams.set('category', selectedCategory);
      if (searchQuery) url.searchParams.set('search', searchQuery);

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setTools(data.tools || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTools();

    const handleRentalChanged = () => {
      fetchTools();
    };
    const handleExecuted = (e: any) => {
      setRecentExecution(e.detail);
      setTimeout(() => setRecentExecution(null), 4000);
    };

    window.addEventListener('orchestra:rental-changed', handleRentalChanged);
    window.addEventListener('orchestra:tool-executed', handleExecuted);

    return () => {
      window.removeEventListener('orchestra:rental-changed', handleRentalChanged);
      window.removeEventListener('orchestra:tool-executed', handleExecuted);
    };
  }, [selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-cyan-500/30">
      
      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-6 max-w-7xl mx-auto overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-cyan-600/15 to-blue-600/15 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="text-center max-w-3xl mx-auto space-y-6 relative z-10">
          
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 px-3.5 py-1.5 rounded-full text-xs font-mono font-medium text-cyan-400 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>Google Chrome & OpenAI Standard • The 2026 Agent Economy</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.15] bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            The Local-First Marketplace for AI Agent Utilities
          </h1>

          <p className="text-slate-400 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            Rent deterministic agent capabilities injected directly into your active browser tab sessions via <code className="text-cyan-300 font-mono text-xs bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">document.modelContext</code>. Atomic credit metering with zero credential leaks.
          </p>

          <div className="flex flex-wrap justify-center gap-3 pt-4 font-mono text-xs">
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('orchestra:open-webmcp-inspector'));
                }
              }}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-95 text-white font-bold px-6 py-3 rounded-xl transition shadow-lg shadow-cyan-500/20 flex items-center gap-2"
            >
              <span>⚡ Inspect WebMCP Tools</span>
              <span>→</span>
            </button>
            <Link
              href="/demo-target"
              className="bg-slate-900 hover:bg-slate-800 text-cyan-400 font-semibold px-6 py-3 rounded-xl transition border border-slate-800 hover:border-cyan-800/60"
            >
              Live Target Sandbox
            </Link>
            <Link
              href="/ide-bridge"
              className="bg-slate-900/60 hover:bg-slate-800 text-slate-300 font-semibold px-5 py-3 rounded-xl transition border border-slate-800"
            >
              IDE Bridge (Cursor / Claude)
            </Link>
          </div>
        </div>

        {/* Live Architecture Tunnel Diagram */}
        <div className="mt-14 max-w-4xl mx-auto p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md shadow-2xl">
          <div className="text-[11px] uppercase font-mono tracking-wider text-slate-400 text-center mb-3 font-semibold">
            ⚡ Orchestra Data Flow & Execution Boundary
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-center text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-cyan-400 font-bold block mb-1">1. IDE / CLIENT</span>
              <span className="text-slate-300">Cursor / Claude / ChatGPT</span>
              <span className="text-[10px] text-slate-500 block mt-1">Sends tool call intent</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-cyan-500/40 shadow-inner">
              <span className="text-[10px] text-emerald-400 font-bold block mb-1">2. LEDGER PROXY</span>
              <span className="text-slate-200">Orchestra Micro-Billing</span>
              <span className="text-[10px] text-slate-500 block mt-1">Atomic check & circuit cap</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-blue-400 font-bold block mb-1">3. ORCHESTRA RUNTIME</span>
              <span className="text-slate-300">document.modelContext</span>
              <span className="text-[10px] text-slate-500 block mt-1">MAIN World injection</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-purple-400 font-bold block mb-1">4. DOM SESSION</span>
              <span className="text-slate-300">Active Site / Target Page</span>
              <span className="text-[10px] text-slate-500 block mt-1">Zero backend API leak</span>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Banner */}
      <section className="border-y border-slate-800/80 bg-slate-900/30 py-6 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center font-mono">
          <div>
            <div className="text-2xl font-black text-cyan-400">100%</div>
            <div className="text-xs text-slate-400 mt-0.5">Session-Bound (Zero Key Leaks)</div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-400">&lt; 35ms</div>
            <div className="text-xs text-slate-400 mt-0.5">Local Injection Latency</div>
          </div>
          <div>
            <div className="text-2xl font-black text-white">0.00 CR</div>
            <div className="text-xs text-slate-400 mt-0.5">Hard Circuit Breaker Cap</div>
          </div>
          <div>
            <div className="text-2xl font-black text-blue-400">98.5%</div>
            <div className="text-xs text-slate-400 mt-0.5">Avg Headless Evals Accuracy</div>
          </div>
        </div>
      </section>

      {/* Marketplace Catalog Section */}
      <section className="max-w-7xl mx-auto px-6 py-14">
        
        {/* Search & Category Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Verified Agent Capability Modules</span>
              <span className="text-xs font-mono font-normal text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/50">
                {tools.length} Tools Live
              </span>
            </h2>
            <p className="text-slate-400 text-xs mt-1">
              Pre-vetted through simulated synthetic chaos test-beds
            </p>
          </div>

          {/* Search Input */}
          <div className="w-full md:w-72">
            <input
              type="text"
              placeholder="Search tools or mcp_id..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-4 mb-8 text-xs font-mono">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl font-semibold transition whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Tools Grid */}
        {loading ? (
          <div className="py-20 text-center font-mono text-sm text-slate-500">
            Loading verified agent registry...
          </div>
        ) : tools.length === 0 ? (
          <div className="py-20 text-center font-mono text-sm text-slate-500 border border-dashed border-slate-800 rounded-2xl">
            No agent tools found matching criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                onRentalToggled={() => fetchTools()}
                onExecutionCompleted={(name, res) => setRecentExecution({ name, res, time: new Date().toLocaleTimeString() })}
              />
            ))}
          </div>
        )}

        {/* Recent Execution Toast */}
        {recentExecution && (
          <div className="fixed bottom-6 right-6 z-40 bg-slate-900 border border-cyan-500/40 p-4 rounded-2xl shadow-2xl max-w-sm animate-fadeIn">
            <div className="flex items-center justify-between text-xs font-mono mb-1">
              <span className="text-emerald-400 font-bold">● Agent Execution Event</span>
              <span className="text-slate-500">{recentExecution.time}</span>
            </div>
            <div className="text-xs text-white font-semibold">{recentExecution.name}</div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              Credits Deducted: -{recentExecution.res.deductedCredits ?? 0.10} CR
            </div>
          </div>
        )}
      </section>

      {/* The 4 Core Market Crises & Orchestra Fixes */}
      <section className="border-t border-slate-800/80 bg-slate-900/20 py-16 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Solving the 4 Fatal Bottlenecks in AI Agent Marketplaces
            </h2>
            <p className="text-slate-400 text-sm">
              Moving beyond remote cloud directories to deterministic client-side execution boundaries.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1 */}
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
              <div className="flex items-center space-x-2.5">
                <span className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-mono font-bold">Crisis 1</span>
                <h3 className="text-base font-bold text-white">The "Lemon Problem" (Unreliable Scripts)</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                <strong className="text-slate-300">The Flaw:</strong> Traditional agent directories allow anyone to upload untested scripts that fail probabilistically in production.
              </p>
              <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/20 text-xs font-mono text-emerald-300">
                <strong>Orchestra Fix:</strong> Automated 5-point Proof of Competence synthetic chaos testing sandbox that assigns verifiable determinism scores before listing.
              </div>
            </div>

            {/* Card 2 */}
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
              <div className="flex items-center space-x-2.5">
                <span className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-mono font-bold">Crisis 2</span>
                <h3 className="text-base font-bold text-white">The Infinite Loop & Runaway Token Bill</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                <strong className="text-slate-300">The Flaw:</strong> An agent encountering unexpected errors can spin in infinite retry loops, causing hundreds of dollars in unplanned API charges.
              </p>
              <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/20 text-xs font-mono text-emerald-300">
                <strong>Orchestra Fix:</strong> Pre-paid atomic micro-credit ledger. If the wallet depletes or a per-tool hard cap is reached, execution is halted instantly.
              </div>
            </div>

            {/* Card 3 */}
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
              <div className="flex items-center space-x-2.5">
                <span className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-mono font-bold">Crisis 3</span>
                <h3 className="text-base font-bold text-white">The "Confused Deputy" Credential Leak</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                <strong className="text-slate-300">The Flaw:</strong> Giving cloud agents master backend tokens or API keys exposes entire company databases if the agent is tricked via prompt injection.
              </p>
              <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/20 text-xs font-mono text-emerald-300">
                <strong>Orchestra Fix:</strong> Session-bound local execution in Chrome's MAIN world. The agent only interacts with authorized DOM forms and active schemas.
              </div>
            </div>

            {/* Card 4 */}
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
              <div className="flex items-center space-x-2.5">
                <span className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-mono font-bold">Crisis 4</span>
                <h3 className="text-base font-bold text-white">Cross-IDE Fragmentation</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                <strong className="text-slate-300">The Flaw:</strong> Agents built in different frameworks cannot share capabilities across Cursor, Claude Code, and ChatGPT Desktop.
              </p>
              <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/20 text-xs font-mono text-emerald-300">
                <strong>Orchestra Fix:</strong> Unified Model Context Protocol (MCP) server bridging any editor directly to client-side browser WebMCP instances.
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
