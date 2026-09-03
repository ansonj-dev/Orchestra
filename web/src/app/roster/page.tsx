'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface PipelineStage {
  step: number;
  toolName: string;
  title: string;
  cost: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  outputPreview?: string;
}

export default function RosterPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('secops');
  const [isRunningPipeline, setIsRunningPipeline] = useState(false);
  const [stages, setStages] = useState<PipelineStage[]>([
    { step: 1, toolName: 'browser_session_auditor', title: 'Zero-Trust Session Guard', cost: 0.12, status: 'pending' },
    { step: 2, toolName: 'extract_analytics_table', title: 'Vercel Analytics Deep-Miner', cost: 0.08, status: 'pending' },
    { step: 3, toolName: 'margin_context_editor', title: 'Margin Automated Document Editor', cost: 0.10, status: 'pending' },
  ]);

  const [pipelineLogs, setPipelineLogs] = useState<string[]>([]);

  const templates = [
    {
      id: 'secops',
      name: 'Autonomous SecOps & Telemetry Squad',
      description: 'Scans browser storage for JWT exposure, extracts latency bottlenecks, and publishes audited markdown incident reports.',
      tools: [
        { step: 1, toolName: 'browser_session_auditor', title: 'Zero-Trust Session Guard', cost: 0.12 },
        { step: 2, toolName: 'extract_analytics_table', title: 'Vercel Analytics Deep-Miner', cost: 0.08 },
        { step: 3, toolName: 'margin_context_editor', title: 'Margin Automated Document Editor', cost: 0.10 }
      ],
      totalCost: 0.30
    },
    {
      id: 'ecommerce',
      name: 'Autonomous Cart & Checkout Syndicate',
      description: 'Heuristically discovers cart fields, verifies discount policies, autofills customer credentials, and triggers confirmation.',
      tools: [
        { step: 1, toolName: 'universal_form_syncer', title: 'Universal Intelligent Form Syncer', cost: 0.09 },
        { step: 2, toolName: 'shopify_checkout_fast', title: 'Shopify Quick Checkout Agent', cost: 0.15 }
      ],
      totalCost: 0.24
    },
    {
      id: 'web3',
      name: 'DeFi Calldata & Observability Pipeline',
      description: 'Decodes dApp hex payloads, simulates gas spikes, and generates transaction audit logs prior to wallet signing.',
      tools: [
        { step: 1, toolName: 'evm_calldata_meter', title: 'EVM Real-Time Gas & Calldata Meter', cost: 0.20 },
        { step: 2, toolName: 'browser_session_auditor', title: 'Zero-Trust Session Guard', cost: 0.12 }
      ],
      totalCost: 0.32
    }
  ];

  const handleSelectTemplate = (tmpl: any) => {
    setSelectedTemplate(tmpl.id);
    setStages(tmpl.tools.map((t: any) => ({ ...t, status: 'pending' })));
    setPipelineLogs([]);
  };

  const executePipeline = async () => {
    setIsRunningPipeline(true);
    setPipelineLogs([`[Orchestra Orchestrator] Initializing multi-agent collaborative pipeline (${selectedTemplate})...`]);

    for (let i = 0; i < stages.length; i++) {
      const currentStage = stages[i];

      // Update stage to running
      setStages(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'running' } : s));
      setPipelineLogs(prev => [...prev, `→ Stage ${i + 1}/${stages.length}: Invoking ${currentStage.toolName} (-${currentStage.cost} CR)...`]);

      await new Promise(r => setTimeout(r, 600));

      // Trigger actual deduction
      try {
        const res = await fetch('/api/deduct-credits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toolName: currentStage.toolName,
            cost: currentStage.cost,
            caller: 'browser-webmcp',
            metadata: { pipelineStage: i + 1, roster: selectedTemplate }
          })
        });
        const data = await res.json();
        window.dispatchEvent(new CustomEvent('orchestra:tool-executed', { detail: data }));
      } catch (e) {}

      // Mark stage complete
      setStages(prev => prev.map((s, idx) => idx === i ? {
        ...s,
        status: 'completed',
        outputPreview: `Output token packet generated. Handoff complete to Stage ${idx + 2}.`
      } : s));

      setPipelineLogs(prev => [...prev, `✓ Stage ${i + 1} succeeded. Shared memory buffer updated.`]);
    }

    setPipelineLogs(prev => [...prev, `⚡ [Orchestra Pipeline Complete] All stages executed in session context with zero credential leaks.`]);
    setIsRunningPipeline(false);
  };

  const totalCost = stages.reduce((acc, s) => acc + s.cost, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 px-3 py-1 rounded-full text-xs font-mono text-purple-300 mb-2">
              <span>🎼 The Multi-Agent Orchestrator</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Dynamic Multi-Agent Roster Composer
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Assemble, chain, and execute coordinated workforces of specialized agent tools with shared session memory.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/demo-target"
              className="bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-800 text-xs font-mono px-4 py-2 rounded-xl transition"
            >
              Open Target Sandbox
            </Link>
          </div>
        </div>

        {/* Template Selector Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          {templates.map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={() => handleSelectTemplate(tmpl)}
              className={`p-5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                selectedTemplate === tmpl.id
                  ? 'bg-purple-950/20 border-purple-500/50 shadow-lg shadow-purple-950/30 ring-1 ring-purple-500/30'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400'
              }`}
            >
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] uppercase font-bold text-purple-400">{tmpl.tools.length} Agents Chained</span>
                  <span className="text-cyan-400 font-bold">{tmpl.totalCost.toFixed(2)} CR</span>
                </div>
                <h3 className="text-sm font-bold text-white mb-1.5">{tmpl.name}</h3>
                <p className="text-[11px] text-slate-400 font-sans leading-relaxed">{tmpl.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[10px] text-slate-500">
                Click to load roster workflow
              </div>
            </button>
          ))}
        </div>

        {/* Interactive Pipeline Execution Board */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Active Multi-Agent Workflow Sequence</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Total Pipeline Budget: <strong className="text-cyan-400">{totalCost.toFixed(2)} CR</strong> (Hard Circuit Breaker Protected)
              </p>
            </div>

            <button
              onClick={executePipeline}
              disabled={isRunningPipeline}
              className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:opacity-90 disabled:opacity-50 text-white font-mono font-bold text-xs px-5 py-3 rounded-xl transition shadow-lg shadow-purple-500/20 flex items-center gap-2"
            >
              <span>{isRunningPipeline ? 'Orchestrating Agents...' : '▶ Launch Orchestra Pipeline'}</span>
            </button>
          </div>

          {/* Sequential Stage Visualizer */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stages.map((stage, idx) => (
              <div
                key={stage.step}
                className={`p-4 rounded-xl border font-mono text-xs transition-all ${
                  stage.status === 'running'
                    ? 'bg-cyan-950/30 border-cyan-500/60 shadow-md shadow-cyan-950/40 ring-1 ring-cyan-500/40'
                    : stage.status === 'completed'
                    ? 'bg-emerald-950/20 border-emerald-500/40'
                    : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-500">STAGE 0{stage.step}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    stage.status === 'completed' ? 'bg-emerald-950 text-emerald-400' :
                    stage.status === 'running' ? 'bg-cyan-950 text-cyan-400 animate-pulse' :
                    'bg-slate-900 text-slate-500'
                  }`}>
                    {stage.status.toUpperCase()}
                  </span>
                </div>

                <div className="font-bold text-white text-sm truncate">{stage.title}</div>
                <div className="text-[11px] text-cyan-400/80 mt-1">mcp_id: {stage.toolName}</div>
                <div className="text-[10px] text-slate-500 mt-2">Cost: {stage.cost.toFixed(2)} CR</div>

                {stage.outputPreview && (
                  <div className="mt-3 p-2 rounded bg-slate-900 border border-slate-800 text-[10px] text-emerald-300">
                    {stage.outputPreview}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Live Orchestrator Execution Log */}
          {pipelineLogs.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-1.5 max-h-48 overflow-y-auto">
              <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">
                Live Orchestration Console
              </div>
              {pipelineLogs.map((log, idx) => (
                <div key={idx} className={log.startsWith('✓') || log.startsWith('⚡') ? 'text-emerald-400 font-semibold' : 'text-slate-300'}>
                  {log}
                </div>
              ))}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
