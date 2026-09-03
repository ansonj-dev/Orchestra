'use client';

import React, { useEffect, useState } from 'react';
import { initializeOrchestraWebMCP, WebMCPStatusInfo, getWebMCPStatus } from '@/lib/webmcp';

interface AgentActionNotice {
  id: string;
  timestamp: string;
  toolName: string;
  actionDesc: string;
  meta?: Record<string, any>;
}

export default function WebMCPRuntimeProvider() {
  const [status, setStatus] = useState<WebMCPStatusInfo>({
    isSupported: false,
    isNative: false,
    source: 'Unavailable',
    registeredToolsCount: 0,
    toolNames: []
  });
  const [activeNotice, setActiveNotice] = useState<AgentActionNotice | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [testConsoleTool, setTestConsoleTool] = useState<string>('list_available_tools');
  const [testConsoleArgs, setTestConsoleArgs] = useState<string>('{}');
  const [testConsoleResult, setTestConsoleResult] = useState<any>(null);
  const [isExecutingTest, setIsExecutingTest] = useState(false);

  useEffect(() => {
    // 1. Initialize WebMCP on browser mount
    initializeOrchestraWebMCP().then(res => {
      setStatus(res);
    });

    // 2. Listen for agent actions triggered via WebMCP
    const handleAgentAction = (e: any) => {
      const detail = e.detail;
      const notice: AgentActionNotice = {
        id: 'notice_' + Date.now(),
        timestamp: detail.timestamp || new Date().toLocaleTimeString(),
        toolName: detail.toolName,
        actionDesc: detail.actionDesc,
        meta: detail
      };
      setActiveNotice(notice);
      setTimeout(() => {
        setActiveNotice(prev => (prev?.id === notice.id ? null : prev));
      }, 5000);
    };

    const handleOpenInspector = () => {
      setStatus(getWebMCPStatus());
      setIsInspectorOpen(true);
    };

    window.addEventListener('orchestra:agent-action', handleAgentAction);
    window.addEventListener('orchestra:open-webmcp-inspector', handleOpenInspector);

    return () => {
      window.removeEventListener('orchestra:agent-action', handleAgentAction);
      window.removeEventListener('orchestra:open-webmcp-inspector', handleOpenInspector);
    };
  }, []);

  const runTestInConsole = async () => {
    setIsExecutingTest(true);
    setTestConsoleResult(null);
    try {
      let parsed = {};
      try {
        parsed = JSON.parse(testConsoleArgs);
      } catch (e: any) {
        setTestConsoleResult({ error: 'Invalid JSON parameters: ' + e.message });
        setIsExecutingTest(false);
        return;
      }

      // Execute via the official window.__ORCHESTRA_WEBMCP__ or document.modelContext
      if (document.modelContext && typeof document.modelContext.executeTool === 'function') {
        const res = await document.modelContext.executeTool(testConsoleTool, parsed);
        setTestConsoleResult(res);
      } else if (window.__ORCHESTRA_WEBMCP__) {
        const res = await window.__ORCHESTRA_WEBMCP__.execute(testConsoleTool, parsed);
        setTestConsoleResult(res);
      } else {
        setTestConsoleResult({ error: 'WebMCP modelContext is not initialized yet.' });
      }
    } catch (err: any) {
      setTestConsoleResult({ error: err.message });
    } finally {
      setIsExecutingTest(false);
    }
  };

  return (
    <>
      {/* Live Agent Action Toast Banner */}
      {activeNotice && (
        <div className="fixed top-20 right-6 z-50 animate-slideDown max-w-md w-full bg-slate-900/95 border border-cyan-500/50 rounded-2xl p-4 shadow-2xl shadow-cyan-950/60 backdrop-blur-xl text-slate-100 flex items-start gap-3.5">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white shrink-0 shadow-md shadow-cyan-500/30">
            ⚡
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
                WebMCP Invocations
              </span>
              <span className="text-[10px] text-slate-500 font-mono">{activeNotice.timestamp}</span>
            </div>
            <p className="text-xs font-semibold text-white mt-1 truncate">{activeNotice.actionDesc}</p>
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
              Tool: <span className="text-cyan-300 font-bold">{activeNotice.toolName}</span>
            </p>
          </div>
          <button
            onClick={() => setActiveNotice(null)}
            className="text-slate-500 hover:text-white text-xs p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* WebMCP Inspector & Diagnostics Modal */}
      {isInspectorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl p-6 text-slate-100 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-500/30">
                  W
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    <span>WebMCP Browser Runtime Diagnostics</span>
                    <span className={`text-[10px] font-mono font-normal px-2 py-0.5 rounded-full border ${
                      status.isNative
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                    }`}>
                      {status.isNative ? 'Native Chrome WebMCP' : 'Orchestra WebMCP Engine'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Governed by Google Chrome Imperative API standard (<code className="text-cyan-300">document.modelContext</code>)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsInspectorOpen(false)}
                className="text-slate-400 hover:text-white p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono"
              >
                ✕ Close
              </button>
            </div>

            {/* Runtime Status Card */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Active Execution Source:</span>
                <span className="text-cyan-300 font-bold">{status.source}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Total Registered Tools:</span>
                <span className="text-emerald-400 font-bold">{status.registeredToolsCount} Tools Active</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Authoritative Ledger Protection:</span>
                <span className="text-cyan-400 font-bold">Enabled (PostgreSQL / Atomic RPC)</span>
              </div>
            </div>

            {/* Registered Tools List */}
            <div className="space-y-2">
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
                Registered WebMCP Tools Exposed to Agents:
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {[
                  {
                    name: 'list_available_tools',
                    desc: 'Browse catalog of verified WebMCP tools with costs & reliability.',
                    hint: 'readOnlyHint: true',
                    sample: '{}'
                  },
                  {
                    name: 'inspect_tool',
                    desc: 'Inspect parameters, input schema & execution cost for a specific tool.',
                    hint: 'readOnlyHint: true',
                    sample: '{"toolName": "shopify_checkout_fast"}'
                  },
                  {
                    name: 'rent_tool',
                    desc: 'Rent/activate tool in database ledger and user session.',
                    hint: 'readOnlyHint: false',
                    sample: '{"toolName": "shopify_checkout_fast"}'
                  },
                  {
                    name: 'execute_tool',
                    desc: 'Execute tool with authoritative microbilling & real DOM actions.',
                    hint: 'readOnlyHint: false',
                    sample: '{"toolName": "shopify_checkout_fast", "parameters": {"fullName": "Jane Doe", "email": "jane@tech.io"}}'
                  },
                  {
                    name: 'get_wallet',
                    desc: 'Retrieve current wallet balance & microbilling transaction history.',
                    hint: 'readOnlyHint: true',
                    sample: '{}'
                  }
                ].map(tool => (
                  <div key={tool.name} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <code className="text-cyan-300 font-bold">{tool.name}</code>
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">{tool.hint}</span>
                      </div>
                      <p className="text-slate-400 text-[11px] mt-0.5">{tool.desc}</p>
                    </div>
                    <button
                      onClick={() => {
                        setTestConsoleTool(tool.name);
                        setTestConsoleArgs(tool.sample);
                      }}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-cyan-950 hover:text-cyan-300 text-slate-300 text-[11px] font-mono border border-slate-700/60 whitespace-nowrap self-start sm:self-center"
                    >
                      Load in Tester
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Tool Invocation Tester */}
            <div className="p-4 rounded-xl bg-slate-950 border border-cyan-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold">
                  Interactive WebMCP Invoker (DevTools / Agent Simulator)
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Calls document.modelContext.executeTool</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">Target Tool</label>
                  <select
                    value={testConsoleTool}
                    onChange={e => setTestConsoleTool(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg p-2 text-xs font-mono"
                  >
                    {status.toolNames.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">Parameters (JSON)</label>
                  <input
                    type="text"
                    value={testConsoleArgs}
                    onChange={e => setTestConsoleArgs(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-cyan-300 rounded-lg p-2 text-xs font-mono"
                  />
                </div>
              </div>

              <button
                onClick={runTestInConsole}
                disabled={isExecutingTest}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 disabled:opacity-50 text-white text-xs font-mono font-bold py-2 rounded-lg transition"
              >
                {isExecutingTest ? 'Invoking WebMCP...' : `Invoke document.modelContext.executeTool("${testConsoleTool}", ...)`}
              </button>

              {testConsoleResult && (
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono overflow-x-auto max-h-44">
                  <span className="text-slate-500 block mb-1">WebMCP Execution Response:</span>
                  <pre className="text-emerald-400 text-[11px] whitespace-pre-wrap">
                    {JSON.stringify(testConsoleResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Chrome Flags Note */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 font-mono space-y-1">
              <span className="text-slate-300 font-bold block">💡 How to test in Chrome with native WebMCP:</span>
              <p>
                Open <code className="text-cyan-400 bg-slate-900 px-1 py-0.5 rounded">chrome://flags/#enable-experimental-web-platform-features</code>, enable it, and restart Chrome. Tools will bind directly to native <code className="text-cyan-400">document.modelContext</code>.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
