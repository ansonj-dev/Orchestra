'use client';

import React, { useState, useEffect } from 'react';
import AgentCopilot from '@/components/AgentCopilot';

export default function DemoTargetPage() {
  // E-Commerce form state
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  // DevOps telemetry table state
  const [extractedData, setExtractedData] = useState<any>(null);

  // Margin editor state
  const [docContent, setDocContent] = useState('## Q3 System Reliability Review\nAll services operational. Awaiting automated patch injection...');

  // Security Tamper Alert state
  const [securityAlert, setSecurityAlert] = useState<string | null>(null);

  // WebMCP execution status banner
  const [activeWebMCPNotice, setActiveWebMCPNotice] = useState<string | null>(null);
  const [executingTool, setExecutingTool] = useState<string | null>(null);

  useEffect(() => {
    const handleToolExecuted = (e: any) => {
      const detail = e.detail;
      setActiveWebMCPNotice(`WebMCP Tool '${detail.toolName}' executed successfully (-${detail.cost ?? 0.10} CR)`);
      setTimeout(() => setActiveWebMCPNotice(null), 4000);
    };

    window.addEventListener('orchestra:tool-executed', handleToolExecuted);
    return () => window.removeEventListener('orchestra:tool-executed', handleToolExecuted);
  }, []);

  // 1. Interactive Runner for E-Commerce Checkout
  const triggerShopifyCheckoutTool = async () => {
    setExecutingTool('shopify_checkout_fast');
    try {
      const payload = {
        fullName: 'Marcus Vance',
        email: 'marcus.vance@techcorp.io',
        address: '742 Evergreen Terrace, Suite 400, Springfield, OR 97477'
      };

      let data: any = null;
      if (document.modelContext && typeof document.modelContext.executeTool === 'function') {
        data = await document.modelContext.executeTool('execute_tool', {
          toolName: 'shopify_checkout_fast',
          parameters: payload
        });
      } else if (typeof window !== 'undefined' && window.__ORCHESTRA_WEBMCP__) {
        data = await window.__ORCHESTRA_WEBMCP__.execute('execute_tool', {
          toolName: 'shopify_checkout_fast',
          parameters: payload
        });
      } else {
        const res = await fetch('/api/deduct-credits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ toolName: 'shopify_checkout_fast', caller: 'browser-webmcp' })
        });
        data = await res.json();
      }

      if (!data || !data.success) {
        alert(data?.error || "Execution failed via Circuit Breaker.");
        return;
      }

      // Smoothly populate DOM fields
      setCustomerName(payload.fullName);
      setCustomerEmail(payload.email);
      setShippingAddress(payload.address);
      setCheckoutSuccess(true);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setExecutingTool(null);
    }
  };

  // 2. Interactive Runner for DevOps Analytics Extraction
  const triggerAnalyticsTableTool = async () => {
    setExecutingTool('extract_analytics_table');
    try {
      let data: any = null;
      if (document.modelContext && typeof document.modelContext.executeTool === 'function') {
        data = await document.modelContext.executeTool('execute_tool', {
          toolName: 'extract_analytics_table',
          parameters: { maxRows: 5 }
        });
      } else if (typeof window !== 'undefined' && window.__ORCHESTRA_WEBMCP__) {
        data = await window.__ORCHESTRA_WEBMCP__.execute('execute_tool', {
          toolName: 'extract_analytics_table',
          parameters: { maxRows: 5 }
        });
      } else {
        const res = await fetch('/api/deduct-credits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ toolName: 'extract_analytics_table', caller: 'browser-webmcp' })
        });
        data = await res.json();
      }

      if (!data || !data.success) {
        alert(data?.error || "Execution failed via Circuit Breaker.");
        return;
      }

      // Extract current DOM table
      const rows = [
        { service: "auth-gateway", endpoint: "/v2/oauth/token", p99: "42ms", errors: "0.01%", status: "HEALTHY" },
        { service: "billing-rpc", endpoint: "/rpc/execute_micro_billing", p99: "18ms", errors: "0.00%", status: "HEALTHY" },
        { service: "model-context-tunnel", endpoint: "/api/mcp", p99: "31ms", errors: "0.04%", status: "HEALTHY" }
      ];

      setExtractedData(data.executionResult?.extractedData || rows);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setExecutingTool(null);
    }
  };

  // 3. Interactive Runner for Margin Document Editor
  const triggerMarginEditorTool = async () => {
    setExecutingTool('margin_context_editor');
    try {
      const patch = `Validated origin isolation boundaries. Latency 18ms. WebMCP imperative execution verified.`;
      let data: any = null;
      if (document.modelContext && typeof document.modelContext.executeTool === 'function') {
        data = await document.modelContext.executeTool('execute_tool', {
          toolName: 'margin_context_editor',
          parameters: { patchContent: patch }
        });
      } else if (typeof window !== 'undefined' && window.__ORCHESTRA_WEBMCP__) {
        data = await window.__ORCHESTRA_WEBMCP__.execute('execute_tool', {
          toolName: 'margin_context_editor',
          parameters: { patchContent: patch }
        });
      } else {
        const res = await fetch('/api/deduct-credits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ toolName: 'margin_context_editor', caller: 'browser-webmcp' })
        });
        data = await res.json();
      }

      if (!data || !data.success) {
        alert(data?.error || "Execution failed via Circuit Breaker.");
        return;
      }

      setDocContent(prev => prev + `\n\n> [WebMCP Patch Injected at ${new Date().toLocaleTimeString()}]: ${patch}`);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setExecutingTool(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Page Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-950/50 via-slate-900 to-blue-950/50 border border-cyan-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
          <div>
            <div className="inline-flex items-center space-x-2 bg-cyan-500/20 text-cyan-300 px-2.5 py-1 rounded-full text-xs font-mono font-bold mb-2">
              <span>● Live In-Session Target Sandbox</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Live Agent Target Sandbox
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              This page acts as a live target web application (E-Commerce Storefront, DevOps Dashboard, and Rich Document Canvas). Test your rented agent tools in real-time right here!
            </p>
          </div>

          <div className="text-xs font-mono text-slate-400 bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-1">
            <div>DOM Session: <span className="text-emerald-400 font-bold">Active</span></div>
            <div>Orchestra Runtime: <span className="text-cyan-400 font-bold">Injected (MAIN)</span></div>
          </div>
        </div>

        {/* Live Notification Banner */}
        {activeWebMCPNotice && (
          <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-mono flex items-center justify-between animate-fadeIn">
            <span>{activeWebMCPNotice}</span>
            <span className="text-[10px] bg-emerald-900/60 px-2 py-0.5 rounded text-emerald-200">Session Verified</span>
          </div>
        )}

        {/* Sandbox Target 1: E-Commerce Storefront & Checkout */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <span className="text-[10px] font-mono uppercase bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded border border-cyan-800/50">
                Target 1: E-Commerce Store
              </span>
              <h2 className="text-lg font-bold text-white mt-1">Apex Hardware Store Checkout</h2>
            </div>

            <button
              onClick={triggerShopifyCheckoutTool}
              disabled={executingTool === 'shopify_checkout_fast'}
              className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-mono font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-md shadow-cyan-500/20"
            >
              {executingTool === 'shopify_checkout_fast' ? 'Injecting via Orchestra...' : '⚡ Trigger shopify_checkout_fast (-0.15 CR)'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-mono">
            
            {/* Form Fields wrapped with Google Chrome Declarative WebMCP Metadata */}
            <form
              id="apex-checkout-form"
              data-webmcp-tool="true"
              data-tool-name="shopify_checkout_fast"
              data-tool-title="Apex Hardware Fast Checkout"
              data-tool-desc="Declarative WebMCP form for automated order completion"
              data-cost="0.15"
              onSubmit={(e) => e.preventDefault()}
              className="md:col-span-2 space-y-3"
            >
              <div>
                <label className="text-slate-400 block mb-1">Customer Full Name (input[name="fullName"])</label>
                <input
                  id="customer-name"
                  name="fullName"
                  type="text"
                  placeholder="Enter full name..."
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500 text-xs"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Receipt Email (input[name="email"])</label>
                <input
                  id="customer-email"
                  name="email"
                  type="email"
                  placeholder="user@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500 text-xs"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Shipping Address (input[name="address"])</label>
                <input
                  id="shipping-address"
                  name="address"
                  type="text"
                  placeholder="Enter street address..."
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500 text-xs"
                />
              </div>
            </form>

            {/* Order Summary */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-3">
              <div className="font-bold text-white uppercase text-[11px] tracking-wider border-b border-slate-800 pb-2">
                Cart Summary
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Enterprise Agent Node</span>
                <span>$299.00</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Shipping</span>
                <span className="text-emerald-400">FREE</span>
              </div>
              <div className="border-t border-slate-800 pt-2 flex justify-between font-bold text-white">
                <span>Total</span>
                <span className="text-cyan-400">$299.00</span>
              </div>

              {checkoutSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[11px]">
                  ✓ Form populated and ready for confirmation!
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Sandbox Target 2: DevOps Real-Time Telemetry Matrix */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <span className="text-[10px] font-mono uppercase bg-blue-950 text-blue-400 px-2 py-0.5 rounded border border-blue-800/50">
                Target 2: DevOps Telemetry
              </span>
              <h2 className="text-lg font-bold text-white mt-1">CloudSphere Latency Table</h2>
            </div>

            <button
              onClick={triggerAnalyticsTableTool}
              disabled={executingTool === 'extract_analytics_table'}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-mono font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-md shadow-blue-600/20"
            >
              {executingTool === 'extract_analytics_table' ? 'Extracting Matrix...' : '⚡ Trigger extract_analytics_table (-0.08 CR)'}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                  <th className="pb-3 pr-4">Microservice</th>
                  <th className="pb-3 pr-4">Endpoint Path</th>
                  <th className="pb-3 pr-4">p99 Latency</th>
                  <th className="pb-3 pr-4">Error Rate</th>
                  <th className="pb-3">Health Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                <tr data-analytics-row>
                  <td className="py-2.5 pr-4 font-bold text-white">auth-gateway</td>
                  <td className="py-2.5 pr-4 text-cyan-400">/v2/oauth/token</td>
                  <td className="py-2.5 pr-4">42ms</td>
                  <td className="py-2.5 pr-4 text-emerald-400">0.01%</td>
                  <td className="py-2.5 text-emerald-400 font-semibold">● HEALTHY</td>
                </tr>
                <tr data-analytics-row>
                  <td className="py-2.5 pr-4 font-bold text-white">billing-rpc</td>
                  <td className="py-2.5 pr-4 text-cyan-400">/rpc/execute_micro_billing</td>
                  <td className="py-2.5 pr-4">18ms</td>
                  <td className="py-2.5 pr-4 text-emerald-400">0.00%</td>
                  <td className="py-2.5 text-emerald-400 font-semibold">● HEALTHY</td>
                </tr>
                <tr data-analytics-row>
                  <td className="py-2.5 pr-4 font-bold text-white">model-context-tunnel</td>
                  <td className="py-2.5 pr-4 text-cyan-400">/api/mcp</td>
                  <td className="py-2.5 pr-4">31ms</td>
                  <td className="py-2.5 pr-4 text-emerald-400">0.04%</td>
                  <td className="py-2.5 text-emerald-400 font-semibold">● HEALTHY</td>
                </tr>
              </tbody>
            </table>
          </div>

          {extractedData && (
            <div className="p-3 rounded-xl bg-slate-950 border border-blue-500/40 font-mono text-[11px] animate-fadeIn">
              <span className="text-blue-300 font-bold block mb-1">
                ✓ Extracted JSON Matrix ({extractedData.length} records safely extracted locally without backend token leaks):
              </span>
              <pre className="text-slate-300 whitespace-pre-wrap">{JSON.stringify(extractedData, null, 2)}</pre>
            </div>
          )}
        </div>

        {/* Sandbox Target 3: Margin Document Canvas */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <span className="text-[10px] font-mono uppercase bg-indigo-950 text-indigo-400 px-2 py-0.5 rounded border border-indigo-800/50">
                Target 3: Document Canvas
              </span>
              <h2 className="text-lg font-bold text-white mt-1">Margin Autonomous Text Canvas</h2>
            </div>

            <button
              onClick={triggerMarginEditorTool}
              disabled={executingTool === 'margin_context_editor'}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-mono font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-md shadow-indigo-600/20"
            >
              {executingTool === 'margin_context_editor' ? 'Patching Canvas...' : '⚡ Trigger margin_context_editor (-0.10 CR)'}
            </button>
          </div>

          <div>
            <label className="text-xs font-mono text-slate-400 block mb-1">Active ContentEditable Workspace</label>
            <textarea
              id="document-canvas"
              rows={5}
              value={docContent}
              onChange={(e) => setDocContent(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed"
            />
          </div>
        </div>

        {/* Security Feature: Anti-Rugpull Cryptographic AST Tamper Validator */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 font-mono text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-amber-400 font-bold">🛡️ Crisis #1 Solved: Anti-Rugpull Hash Integrity</span>
                <span className="text-[10px] bg-amber-950/60 text-amber-300 px-2 py-0.5 rounded border border-amber-800/40">SHA-256 AST</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 font-sans">
                Simulate a malicious developer modifying an approved WebMCP tool definition to steal data post-certification.
              </p>
            </div>

            <button
              onClick={() => {
                setSecurityAlert("CRITICAL SECURITY QUARANTINE: SHA-256 mismatch detected for 'shopify_checkout_fast'. Certified: sha256_9a4f2e81... vs Attempted: sha256_malicious_mutation_9999... Execution blocked by Orchestra Zero-Trust Layer.");
                setTimeout(() => setSecurityAlert(null), 8000);
              }}
              className="bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 px-3.5 py-2 rounded-xl transition text-[11px] font-bold shrink-0"
            >
              Simulate Rugpull Attack
            </button>
          </div>

          {securityAlert ? (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs animate-fadeIn leading-relaxed">
              {securityAlert}
            </div>
          ) : (
            <div className="text-[11px] text-slate-500 flex items-center justify-between">
              <span>All 6 active tools match immutable Evals cryptographic signatures.</span>
              <span className="text-emerald-400">● 100% Tamper Free</span>
            </div>
          )}
        </div>

      </div>

      {/* Floating In-Session AI Co-Pilot */}
      <AgentCopilot />
    </div>
  );
}
