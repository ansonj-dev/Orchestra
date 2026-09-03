'use client';

import React, { useState } from 'react';
import { EvalRunResult } from '../types';

interface EvalsRunnerProps {
  toolName: string;
  schema: string;
  code: string;
  onEvalPassed?: (result: EvalRunResult) => void;
}

export default function EvalsRunner({
  toolName,
  schema,
  code,
  onEvalPassed
}: EvalsRunnerProps) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<EvalRunResult | null>(null);
  const [progress, setProgress] = useState(0);

  const startChaosBenchmark = async () => {
    setRunning(true);
    setResult(null);
    setProgress(15);

    try {
      const step1 = setTimeout(() => setProgress(45), 250);
      const step2 = setTimeout(() => setProgress(80), 550);

      const res = await fetch('/api/evals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool_name: toolName,
          input_schema: schema,
          javascript_code: code
        })
      });

      clearTimeout(step1);
      clearTimeout(step2);
      setProgress(100);

      const data = await res.json();
      if (data.success && data.eval) {
        setResult(data.eval);
        if (onEvalPassed) onEvalPassed(data.eval);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping"></div>
          <div>
            <h4 className="text-sm font-bold text-white tracking-tight">Proof of Competence Sandbox Engine</h4>
            <p className="text-[11px] text-slate-400 font-mono">Automated 5-point headless chaos benchmarking suite</p>
          </div>
        </div>
        
        <button
          onClick={startChaosBenchmark}
          disabled={running}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-md shadow-cyan-500/20 font-mono flex items-center gap-1.5"
        >
          <span>{running ? 'Benchmarking...' : '▶ Run Synthetic Evals'}</span>
        </button>
      </div>

      {running && (
        <div className="space-y-2 py-3">
          <div className="flex justify-between text-xs font-mono text-slate-400">
            <span>Executing Synthetic Chaos Matrix...</span>
            <span className="text-cyan-400 font-bold">{progress}%</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-4 animate-fadeIn">
          {/* Metrics summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] uppercase font-mono text-slate-400">Reliability Score</span>
              <div className="text-xl font-black font-mono text-emerald-400 mt-0.5">
                {result.overallScore}%
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] uppercase font-mono text-slate-400">Execution Latency</span>
              <div className="text-xl font-black font-mono text-cyan-400 mt-0.5">
                {result.latencyMs}ms
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] uppercase font-mono text-slate-400">Token Efficiency</span>
              <div className="text-xl font-black font-mono text-blue-400 mt-0.5">
                {result.tokenEfficiencyScore}%
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] uppercase font-mono text-slate-400">Certification</span>
              <div className="text-xs font-bold font-mono text-emerald-400 mt-1 truncate">
                {result.verdict}
              </div>
            </div>
          </div>

          {/* Test log details */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-300">Detailed Chaos Run Log:</span>
            <div className="space-y-1.5 font-mono text-xs max-h-48 overflow-y-auto">
              {result.testLogs.map((log) => (
                <div
                  key={log.caseId}
                  className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800/80 flex items-start justify-between gap-3"
                >
                  <div className="flex items-start space-x-2">
                    <span className={`text-xs mt-0.5 ${log.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {log.passed ? '✓' : '✗'}
                    </span>
                    <div>
                      <div className="font-semibold text-white">
                        [{log.caseId}] {log.caseName}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{log.details}</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono shrink-0">
                    {log.durationMs}ms
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
