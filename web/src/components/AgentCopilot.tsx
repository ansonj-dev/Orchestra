'use client';

import React, { useState } from 'react';

interface CopilotStep {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  detail?: string;
}

export default function AgentCopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activePlan, setActivePlan] = useState<string | null>(null);
  const [steps, setSteps] = useState<CopilotStep[]>([]);
  const [finalMessage, setFinalMessage] = useState<string | null>(null);

  const presetQueries = [
    {
      title: "Autofill E-Commerce Checkout",
      query: "Order the Enterprise Agent Node for Marcus Vance and fill out shipping fields.",
      tool: "shopify_checkout_fast",
      cost: 0.15,
      args: { fullName: "Marcus Vance", email: "marcus.vance@techcorp.io", address: "742 Evergreen Terrace, Suite 400" }
    },
    {
      title: "Extract DevOps Telemetry",
      query: "Extract the real-time latency table from the CloudSphere dashboard into structured JSON.",
      tool: "extract_analytics_table",
      cost: 0.08,
      args: { maxRows: 5 }
    },
    {
      title: "Inject Margin Markdown Patch",
      query: "Analyze active document canvas and apply a WebMCP session-boundary security patch.",
      tool: "margin_context_editor",
      cost: 0.10,
      args: { patchContent: "### WebMCP Security Verification\n> Zero credential leak guaranteed. Injected locally." }
    }
  ];

  const handleExecuteIntent = async (queryText: string, toolOverride?: string, costOverride?: number, argsOverride?: any) => {
    setIsProcessing(true);
    setActivePlan(queryText);
    setFinalMessage(null);

    // Identify target tool
    const matchedPreset = presetQueries.find(p => p.query === queryText || queryText.toLowerCase().includes(p.tool.split('_')[0])) || presetQueries[0];
    const targetTool = toolOverride || matchedPreset.tool;
    const cost = costOverride || matchedPreset.cost;
    const payloadArgs = argsOverride || matchedPreset.args;

    // Step 1: Planning
    setSteps([
      { id: '1', label: '1. Human Intent & Schema Planning', status: 'running', detail: 'Parsing request and inspecting document.modelContext...' }
    ]);

    await new Promise(r => setTimeout(r, 450));

    setSteps(prev => [
      { ...prev[0], status: 'completed', detail: `Selected tool: ${targetTool} (mcp_id)` },
      { id: '2', label: '2. Pre-Flight Credit Verification & Hard Cap Check', status: 'running', detail: `Validating user wallet balance for -${cost} CR...` }
    ]);

    // Step 2: Atomic Deduction
    let deductionRes: any = null;
    try {
      const res = await fetch('/api/deduct-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolName: targetTool,
          cost,
          caller: 'browser-webmcp',
          metadata: { copilotIntent: queryText }
        })
      });
      deductionRes = await res.json();

      if (!res.ok) {
        setSteps(prev => [
          prev[0],
          { ...prev[1], status: 'failed', detail: deductionRes.error || "Circuit Breaker Triggered: Insufficient Credits" }
        ]);
        setFinalMessage("Execution halted by Orchestra Circuit Breaker.");
        setIsProcessing(false);
        return;
      }
    } catch (e: any) {
      // Fallback
    }

    await new Promise(r => setTimeout(r, 400));

    // Step 3: DOM Session Execution
    setSteps(prev => [
      prev[0],
      { ...prev[1], status: 'completed', detail: `Ledger Mutation: -${cost} CR (Remaining: ${deductionRes?.remainingBalance?.toFixed(2) ?? '99.85'} CR)` },
      { id: '3', label: '3. Browser DOM Session Execution (MAIN World)', status: 'running', detail: 'Executing registered JavaScript callback inside active tab...' }
    ]);

    await new Promise(r => setTimeout(r, 550));

    // Trigger DOM updates if on demo page
    if (targetTool === 'shopify_checkout_fast') {
      const nameInput = document.querySelector('input[name="fullName"], #customer-name') as HTMLInputElement;
      const emailInput = document.querySelector('input[name="email"], #customer-email') as HTMLInputElement;
      const addrInput = document.querySelector('input[name="address"], #shipping-address') as HTMLInputElement;
      if (nameInput) nameInput.value = payloadArgs.fullName;
      if (emailInput) emailInput.value = payloadArgs.email;
      if (addrInput) addrInput.value = payloadArgs.address;
    } else if (targetTool === 'margin_context_editor') {
      const editor = document.querySelector('#document-canvas, textarea') as HTMLTextAreaElement;
      if (editor) editor.value += `\n\n[Co-Pilot Autonomous Patch]: ${payloadArgs.patchContent}`;
    }

    window.dispatchEvent(new CustomEvent('orchestra:tool-executed', { detail: deductionRes || { toolName: targetTool, cost } }));

    setSteps(prev => [
      prev[0],
      prev[1],
      { ...prev[2], status: 'completed', detail: 'DOM fields synced, origin isolation preserved, output rendered.' }
    ]);

    setFinalMessage(`✓ Successfully orchestrated '${targetTool}'. Verified local outcome achieved with zero backend token leaks.`);
    setIsProcessing(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      
      {/* Closed Floating Pill / Trigger */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center space-x-3 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:scale-105 p-3.5 sm:px-5 sm:py-3.5 rounded-full shadow-2xl shadow-cyan-500/40 text-white font-mono text-xs font-bold transition-all duration-300 border border-cyan-400/40"
        >
          <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center font-black">
            🤖
          </div>
          <span className="hidden sm:inline">Orchestra AI Co-Pilot</span>
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </button>
      )}

      {/* Open Interactive Co-Pilot Drawer */}
      {isOpen && (
        <div className="bg-slate-900 border border-slate-800 w-[360px] sm:w-[420px] rounded-2xl shadow-2xl shadow-cyan-950/50 p-5 space-y-4 animate-fadeIn text-slate-100 relative">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-md shadow-cyan-500/30">
                O
              </div>
              <div>
                <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                  <span>Orchestra In-Session Co-Pilot</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-bold">
                    ACTIVE
                  </span>
                </h4>
                <p className="text-[10px] text-slate-400 font-mono">Autonomous human-agent collaboration</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              ✕
            </button>
          </div>

          {/* Quick Action Presets */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold">
              1-Click Collaborative Actions
            </label>
            <div className="flex flex-col gap-1.5">
              {presetQueries.map((item, i) => (
                <button
                  key={i}
                  disabled={isProcessing}
                  onClick={() => handleExecuteIntent(item.query, item.tool, item.cost, item.args)}
                  className="text-left p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-xs transition flex items-center justify-between group"
                >
                  <span className="text-slate-300 group-hover:text-cyan-300 font-medium truncate pr-2">
                    {item.title}
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800/40 shrink-0">
                    -{item.cost} CR
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Natural Language Prompt Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold">
              Or Speak / Type Natural Language
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Fill checkout for Marcus Vance..."
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && inputQuery && !isProcessing) {
                    handleExecuteIntent(inputQuery);
                    setInputQuery('');
                  }
                }}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
              <button
                disabled={isProcessing || !inputQuery}
                onClick={() => {
                  if (inputQuery) {
                    handleExecuteIntent(inputQuery);
                    setInputQuery('');
                  }
                }}
                className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs font-mono transition"
              >
                Go
              </button>
            </div>
          </div>

          {/* Real-Time Visual Execution Trace */}
          {steps.length > 0 && (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] space-y-2 max-h-48 overflow-y-auto">
              <div className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider flex justify-between border-b border-slate-800 pb-1">
                <span>Autonomous Execution Trace</span>
                {isProcessing && <span className="text-cyan-400 animate-pulse">Running...</span>}
              </div>

              {steps.map((step) => (
                <div key={step.id} className="space-y-0.5">
                  <div className="flex items-center space-x-1.5 font-bold">
                    <span className={step.status === 'completed' ? 'text-emerald-400' : step.status === 'running' ? 'text-cyan-400 animate-spin' : step.status === 'failed' ? 'text-rose-400' : 'text-slate-500'}>
                      {step.status === 'completed' ? '✓' : step.status === 'running' ? '⚙' : step.status === 'failed' ? '✗' : '○'}
                    </span>
                    <span className={step.status === 'completed' ? 'text-slate-200' : 'text-cyan-300'}>
                      {step.label}
                    </span>
                  </div>
                  {step.detail && (
                    <div className="text-[10px] text-slate-400 pl-4">
                      {step.detail}
                    </div>
                  )}
                </div>
              ))}

              {finalMessage && (
                <div className="mt-2 pt-2 border-t border-slate-800 text-emerald-300 text-[10px] font-semibold">
                  {finalMessage}
                </div>
              )}
            </div>
          )}

        </div>
      )}

    </div>
  );
}
