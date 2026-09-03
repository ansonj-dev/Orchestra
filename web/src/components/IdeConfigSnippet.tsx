'use client';

import React, { useState } from 'react';

export default function IdeConfigSnippet() {
  const [activeTab, setActiveTab] = useState<'cursor' | 'claude' | 'desktop'>('cursor');
  const [copied, setCopied] = useState(false);

  const configs = {
    cursor: `{
  "mcpServers": {
    "orchestra": {
      "url": "http://localhost:3000/api/mcp",
      "transport": "http"
    }
  }
}`,
    claude: `{
  "mcpServers": {
    "orchestra": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch", "http://localhost:3000/api/mcp"]
    }
  }
}`,
    desktop: `// ChatGPT Desktop Configuration
// Orchestra tools are automatically exposed to ChatGPT in-app browser sessions
// via document.modelContext when Orchestra Extension or Polyfill is active.

document.modelContext.getTools().then(tools => {
  console.log("Orchestra Tools Discovered by ChatGPT:", tools);
});`
  };

  const currentSnippet = configs[activeTab];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h4 className="text-sm font-bold text-white tracking-tight">IDE Protocol Bridge Configuration</h4>
          <p className="text-xs text-slate-400">Zero-latency MCP tunnel between your local editor and browser runtime</p>
        </div>

        <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setActiveTab('cursor')}
            className={`px-3 py-1 rounded-lg font-semibold transition ${
              activeTab === 'cursor' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            Cursor (.cursor/mcp.json)
          </button>
          <button
            onClick={() => setActiveTab('claude')}
            className={`px-3 py-1 rounded-lg font-semibold transition ${
              activeTab === 'claude' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            Claude Code
          </button>
          <button
            onClick={() => setActiveTab('desktop')}
            className={`px-3 py-1 rounded-lg font-semibold transition ${
              activeTab === 'desktop' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            ChatGPT Desktop
          </button>
        </div>
      </div>

      <div className="relative">
        <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 text-xs font-mono text-cyan-300 overflow-x-auto leading-relaxed">
          {currentSnippet}
        </pre>
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 bg-slate-800 hover:bg-cyan-600 hover:text-white text-slate-300 text-[11px] font-mono font-bold px-3 py-1 rounded-lg border border-slate-700 transition"
        >
          {copied ? '✓ Copied' : 'Copy Config'}
        </button>
      </div>

      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
        <span>Tunnel: <strong>http://localhost:3000/api/mcp</strong></span>
        <span className="text-emerald-400">● Live SSE / HTTP Transport</span>
      </div>
    </div>
  );
}
