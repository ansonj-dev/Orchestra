# Orchestra 🎻

> **Deterministic, Client-Side Runtime Marketplace for Credit-Metered AI Agent Utilities**
> 
> *Built for the WebMCP Devpost Challenge (Google Chrome & OpenAI)*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Protocol: WebMCP](https://img.shields.io/badge/Protocol-WebMCP%20v1.0-cyan.svg)](https://developer.chrome.com/docs/ai/webmcp)
[![IDE Bridge: Cursor & Claude](https://img.shields.io/badge/IDE%20Bridge-Cursor%20%7C%20Claude%20%7C%20ChatGPT-emerald.svg)](https://modelcontextprotocol.io)

---

## ⚡ Executive Summary

The AI agent economy has rapidly transitioned from text-generation chat systems to action-oriented commerce. However, existing cloud-based agent directories (like OKX.AI or traditional agent stores) suffer from severe architectural crises:
1. **The "Confused Deputy" & Credential Leak Vulnerability:** Requiring users to surrender raw, long-lived workspace API keys or OAuth tokens to remote clouds.
2. **The Infinite Loop & Runaway Token Bill Crisis:** Probabilistic agents hitting deadlocks can loop infinitely, accumulating hundreds of dollars in unplanned API charges in minutes.
3. **The "Lemon Problem" (Unreliable Marketplace Scripts):** Anyone can upload an unvetted script; buyers have zero proof of determinism or reliability before paying.
4. **Cross-IDE Fragmentation:** Agents built for different frameworks cannot natively interact across Cursor, Claude Code, and ChatGPT Desktop.

**Orchestra.WebMCP** solves all four bottlenecks by moving execution out of remote cloud black-boxes and into a **Client-Side, Browser-Native Runtime** governed by Google Chrome's `document.modelContext` (WebMCP) standard, protected by an **Atomic Pre-Paid Credit Metering Ledger & Circuit Breaker**.

---

## 🚀 The Orchestra Architecture

```text
[ Developer Client Node ] (Cursor, Claude Code, ChatGPT Desktop, Windsurf)
         │
         ▼ (Model Context Protocol / MCP JSON-RPC Tunnel)
┌────────────────────────────────────────────────────────────────────────┐
│                        ORCHESTRA MARKETPLACE LAYER                     │
│  - Credit Ledger Engine (Atomic Supabase RPC Microbilling Protocol)   │
│  - Verification Dashboard (Automated 5-Point Headless Chaos Evals)    │
│  - Runaway Circuit Breaker (Hard Cap auto-cutoff at $0.00 / Cap)      │
└────────────────────────────────────────────────────────────────────────┘
         │
         ▼ (Manifest V3 Background Service Sync Pipeline)
[ Local Extension Runtime ] (Chrome Flag: #enable-webmcp-testing Main World)
         │
         ▼ (Imperative WebMCP Injection: document.modelContext.registerTool)
[ Target Website Tab Session ] (Shopify Checkout, DevOps Telemetry, Document Editor)
```

---

## 🛡️ Key Innovations

### 1. Zero-Trust Local Session Isolation
Instead of handing master credentials to a remote server, Orchestra tools execute directly inside the user's active, authenticated browser tab session (`world: MAIN`). Tools only interact with declared DOM schemas. No database passwords or master tokens ever leave the local machine.

### 2. Atomic Credit Metering & Circuit Breaker
Every WebMCP tool execution is mediated by an atomic micro-billing ledger. When a tool is triggered:
- The proxy verifies available credits.
- Deducts micro-payments (e.g. `0.10 CR`) per execution callback.
- **Circuit Breaker:** If the wallet balance hits `0.00 CR` or a user-defined hard cap (e.g., `5.00 CR`) is reached, execution is halted immediately and the tool is dynamically unregistered, completely neutralizing runaway loops.

### 3. "Proof of Competence" Headless Chaos Benchmarking Engine
Eliminates the "Lemon Problem". Before any developer can publish a tool snippet, Orchestra subjects it to an automated 5-point synthetic chaos matrix:
- JSON Schema Draft-07 compliance.
- Missing and boundary parameter handling.
- Execution loop and latency bounding (< 250ms).
- AST security audit against dynamic evaluation (`eval`, `new Function`).
- DOM event listener and memory leak profiling.

A verifiable **Reliability & Determinism Score (0-100%)** is permanently minted onto the marketplace listing.

### 4. Native Model Context Protocol (MCP) IDE Bridge
Orchestra exposes a live MCP-compliant protocol endpoint (`/api/mcp`) that plugs seamlessly into **Cursor** (`.cursor/mcp.json`), **Claude Code** (`claude_desktop_config.json`), and **ChatGPT Desktop**, allowing local agents to control live browser sessions directly.

---

## 🔐 Killer Upgrade Features (Hackathon Differentiators)

### 5. Anti-Rugpull SHA-256 AST Cryptographic Security Engine
**File:** `src/lib/security.ts` — `OrchestraSecurityEngine`

The most dangerous marketplace attack vector: a malicious developer gets a tool certified, then silently patches the live `execute()` function to steal credentials post-approval. Orchestra eliminates this permanently.

- **How it works:** At certification time, Orchestra generates a SHA-256 hash of the tool's full abstract syntax tree (code + JSON schema). This hash is stored as the immutable "certified fingerprint".
- **On every execution:** The engine re-hashes the live code and compares it against the certified fingerprint. A single byte mismatch causes **immediate zero-tolerance quarantine**.
- **Demo:** On `/demo-target`, click *"Simulate Rugpull Attack"* to trigger a SHA-256 mismatch alert in real-time.

### 6. Declarative WebMCP HTML Parser (Google Chrome Dual Standard)
**File:** `src/lib/declarative-parser.ts` — `DeclarativeWebMCPParser`

The Chrome WebMCP spec defines two standards: *Imperative API* (`document.modelContext.registerTool(...)`) and *Declarative Markup* (`<form data-webmcp-tool="true" data-cost="0.15">`). Orchestra implements both.

- **How it works:** A `MutationObserver` continuously scans the live DOM for any form or meta element with `data-webmcp-tool="true"` and `<meta name="model-context">` tags, converting them into metered, schema-validated tool objects automatically.
- **Live demo:** The `/demo-target` checkout form ships with full declarative markup:
  ```html
  <form
    id="apex-checkout-form"
    data-webmcp-tool="true"
    data-tool-name="shopify_checkout_fast"
    data-cost="0.15"
  >
  ```

### 7. In-Browser AI Co-Pilot Widget
**File:** `src/components/AgentCopilot.tsx`

A floating interactive assistant that makes the agent experience conversational — a key judging criterion for human-agent interaction quality.

- **Natural language routing:** Users type `"run checkout"` or `"check my balance"`. The copilot parses intent and dispatches the appropriate tool or API action.
- **Multi-step execution trace:** Live, timestamped step-by-step log shows every action taken, with credit deductions visible in real-time.
- **Live DOM feedback:** Tool completions update the actual page DOM (form fields, data tables) and the trace is surfaced directly in the copilot panel.

### 8. Multi-Agent Roster Composer
**File:** `src/app/roster/page.tsx`

Orchestrate *multiple* specialized agents in sequence with a shared memory context and unified budget caps — taking Orchestra beyond a single-agent marketplace.

- **Drag-and-compose Workflow Builder:** Assemble SecOps Auditor → E-Commerce Fulfillment → Web3 Treasury agents into a pipeline.
- **Shared Memory Bus:** Each agent's output is passed as structured context to the next agent in the chain.
- **Unified Budget Cap:** A single wallet deduction enforces total spend across all agents, with live per-agent credit breakdowns.

---

## 📁 Repository Structure

```text
orchestra-webmcp/
├── LICENSE                        # Open-Source MIT License
├── README.md                      # Complete pitch, architecture & setup guide
├── .github/
│   └── workflows/deploy.yml       # Automated CI/CD validation workflow
│
├── extension/                     # Chrome Extension (Manifest V3) Injector Middleware
│   ├── manifest.json              # Main world injection & permission boundaries
│   ├── background.js              # Service worker handling storage sync & credit alerts
│   ├── content.js                 # Local injector: Intercepts tab DOM & loads WebMCP schemas
│   ├── popup.html                 # Extension popup UI
│   ├── popup.js                   # Extension popup logic (wallet balance, active tools)
│   └── icon.png                   # Extension branded icon
│
└── web/                           # Next.js 16 Full-Stack Web Application
    ├── package.json
    ├── next.config.ts
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx         # Cyber-enterprise dark theme & navigation
    │   │   ├── page.tsx           # High-conversion Marketplace Storefront Landing Page
    │   │   ├── dashboard/
    │   │   │   └── page.tsx       # Live Token/Credit Ledger, Rented Tools & Circuit Breakers
    │   │   ├── studio/
    │   │   │   └── page.tsx       # Developer Studio: Tool Creator & Automated Chaos Evals
    │   │   ├── ide-bridge/
    │   │   │   └── page.tsx       # IDE Bridge Hub: Cursor, Claude Code, ChatGPT setup
    │   │   ├── roster/
    │   │   │   └── page.tsx       # Multi-Agent Roster Composer (NEW)
    │   │   ├── demo-target/
    │   │   │   └── page.tsx       # Live Sandbox: Declarative WebMCP + Anti-Rugpull + Copilot
    │   │   └── api/
    │   │       ├── user-tools/route.ts     # Domain-filtered active tools
    │   │       ├── deduct-credits/route.ts # Atomic micro-billing deduction
    │   │       ├── tools/route.ts          # Marketplace catalog CRUD
    │   │       ├── wallet/route.ts         # Credit refill, balance, transactions
    │   │       ├── evals/route.ts          # Synthetic chaos benchmark evaluator
    │   │       └── mcp/route.ts            # MCP JSON-RPC Server for IDEs
    │   ├── components/
    │   │   ├── Navbar.tsx         # Navigation bar with live wallet balance pill
    │   │   ├── ToolCard.tsx       # Marketplace tool card with accuracy score & test runner
    │   │   ├── WalletModal.tsx    # Credit top-up modal with judge test-bed drainer
    │   │   ├── EvalsRunner.tsx    # Live visualization of synthetic test runs
    │   │   ├── IdeConfigSnippet.tsx# Interactive snippet generator for IDEs
    │   │   └── AgentCopilot.tsx   # Floating In-Browser AI Co-Pilot widget (NEW)
    │   ├── lib/
    │   │   ├── ledger.ts          # Unified Ledger service (Supabase + Local fallback)
    │   │   ├── supabase.ts        # Supabase client initializer
    │   │   ├── sample-tools.ts    # Seed catalog of verified WebMCP tools
    │   │   ├── security.ts        # SHA-256 AST Anti-Rugpull cryptographic engine (NEW)
    │   │   └── declarative-parser.ts # Declarative HTML WebMCP DOM parser (NEW)
    │   └── types/
    │       └── index.ts           # TypeScript interfaces for WebMCP, ledger, and evals
    └── supabase/
        ├── config.toml
        └── migrations/
            └── 20260903_init.sql  # Database schema & atomic execute_micro_billing RPC
```

---

## 🏁 Quickstart Setup & Local Deployment

### 1. Enable Browser WebMCP Target Layer
Orchestra leverages Google Chrome's client-side tool discovery standard.
1. Open Google Chrome (v149+) or ChatGPT Desktop App.
2. Navigate to: `chrome://flags/#enable-webmcp-testing`
3. Set the flag to **Enabled** and click **Relaunch**.
*(Note: Orchestra also includes a built-in Polyfill runtime so all features and demos run seamlessly even on standard browser builds!)*

### 2. Initialize the Web App & Ledger Hub
```bash
# Navigate to web directory
cd web

# Install dependencies
npm install

# (Optional) Add Supabase credentials in .env.local
# If omitted, Orchestra automatically runs in resilient zero-config Local Ledger mode!
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Launch development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the Marketplace Storefront.

### 3. Mount the Unpacked Chrome Middleware Extension
1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Toggle the **Developer mode** switch in the upper right.
3. Click **Load unpacked** and select the `/extension` directory in this repository.

### 4. Connect Your IDE (Cursor / Claude Code)
In Cursor, open `.cursor/mcp.json` and add:
```json
{
  "mcpServers": {
    "orchestra-webmcp": {
      "url": "http://localhost:3000/api/mcp",
      "transport": "http"
    }
  }
}
```

---

## 🎯 Hackathon Demo & Judging Walkthrough

Follow this 5-minute demonstration script for judging evaluation:

1. **Scene 1 — The Problem:** Demonstrate how cloud agents (OKX.ai, remote bot rentals) require dangerous backend keys and risk runaway token loops and marketplace "rug-pulls" from malicious script updates.

2. **Scene 2 — Marketplace & Wallet** (`/`): Show the live 100.00 CR wallet balance, filter by category, inspect verifiable Reliability Scores on each tool card.

3. **Scene 3 — Proof of Competence Evals** (`/studio`): Run automated synthetic chaos evals. Watch all 5 benchmark categories complete and produce a certified hash fingerprint.

4. **Scene 4 — Declarative WebMCP + Anti-Rugpull** (`/demo-target`):
   - Inspect the checkout form source: `data-webmcp-tool="true"` declarative markup is live in the DOM.
   - Click *"Simulate Rugpull Attack"*: Orchestra's SHA-256 engine immediately quarantines the tampered tool.
   - Click *"Trigger shopify_checkout_fast"*: Form auto-fills locally with 0.15 CR deducted from the live ledger.

5. **Scene 5 — AI Co-Pilot** (`/demo-target`): Open the floating copilot widget. Type `"run checkout"` in natural language. Watch the multi-step execution trace route the intent, dispatch the tool, update the DOM, and report the result.

6. **Scene 6 — Multi-Agent Roster** (`/roster`): Compose a 3-agent pipeline (SecOps → E-Commerce → Web3). Execute the roster under a 5.00 CR shared budget. Watch shared memory pass context between agents sequentially.

7. **Scene 7 — IDE Bridge** (`/ide-bridge`): Show the Cursor/Claude Code MCP configuration snippets. Run a JSON-RPC `tools/list` call against `/api/mcp` and receive the live tool registry in standard MCP format.

8. **Scene 8 — Circuit Breaker** (`/dashboard`): In the Wallet Modal, click *"Drain to 0.00 CR"*. Trigger a tool again. Orchestra's circuit breaker immediately rejects execution with `402 Payment Required`.

---

## 🔑 API Keys & Configuration

| Dependency | Required? | Purpose |
|---|---|---|
| Supabase URL + Anon Key | **Optional** | Persistent credit ledger across sessions. Omit for zero-config in-memory mode. |
| Chrome v149+ | Recommended | Native `document.modelContext` WebMCP API. Polyfill runs on all browsers. |
| No LLM API keys | ✅ None | All intelligence is client-side rule-based. No OpenAI/Gemini key required for demo. |

---

## 📄 License

This repository is distributed under the **MIT Open-Source License**. All core schemas, middleware routes, and dashboard layouts are free to inspect, extend, and deploy.