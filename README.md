# Orchestra 🎻

> **Deterministic, Client-Side Runtime Marketplace for Credit-Metered AI Agent Utilities**
> 
> *Built specifically for the [WebMCP Devpost Challenge](https://webmcp.devpost.com/) (Google Chrome & OpenAI)*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Protocol: WebMCP](https://img.shields.io/badge/Protocol-WebMCP%20Imperative%20API-cyan.svg)](https://developer.chrome.com/docs/ai/webmcp)
[![Chrome WebMCP](https://img.shields.io/badge/Chrome-document.modelContext-blue.svg)](https://developer.chrome.com/docs/ai/webmcp/imperative-api)
[![Live Production Demo](https://img.shields.io/badge/Render-Live%20Deployment-emerald.svg)](https://orchestra-web-gmvv.onrender.com/)

---

## ⚡ Live Production Deployment

* **Live URL:** [https://orchestra-web-gmvv.onrender.com/](https://orchestra-web-gmvv.onrender.com/)
* **Healthcheck:** [https://orchestra-web-gmvv.onrender.com/api/health](https://orchestra-web-gmvv.onrender.com/api/health)
* **WebMCP Inspector:** Click **"WebMCP: Connected"** or **"⚡ Inspect WebMCP Tools"** on the live website.

---

## 🌐 What is Orchestra & Why WebMCP?

In the emerging agentic economy, AI agents need to interact with websites and perform concrete tasks (e.g. checkout, table extraction, form submission) on behalf of users. Traditional solutions force users to hand raw cloud API keys or OAuth secrets to third-party services—risking **credential leaks, "confused deputy" attacks, and runaway token billing**.

**Orchestra** solves this by establishing a **Client-Side, Browser-Native Agent Utility Marketplace** governed by Google Chrome's **WebMCP (`document.modelContext`)** standard:
1. **Zero Credential Leaks:** Tools execute directly in the user's active, authenticated browser tab DOM (`MAIN` world). No passwords or private tokens leave the local machine.
2. **Authoritative Microbilling & Runaway Circuit Breaker:** Every tool execution is metered by an atomic credit ledger. If an agent hits a runaway loop or exceeds hard caps, the circuit breaker instantly halts execution.
3. **Genuine Browser-Side WebMCP:** Orchestra's web frontend actively registers deterministic tools via `document.modelContext.registerTool(...)`. An AI agent visiting Orchestra can discover, inspect, rent, and execute tools natively.

---

## 🏛️ System Architecture

```text
       ┌─────────────────────────────────────────────────────────────┐
       │                AI AGENT (Chrome / Browser Agent)            │
       └──────────────────────────────┬──────────────────────────────┘
                                      │
                                      ▼ WebMCP Imperative API
                    document.modelContext.executeTool(...)
                                      │
┌─────────────────────────────────────▼──────────────────────────────────────┐
│                    ORCHESTRA BROWSER FRONTEND (web/src)                    │
│                                                                            │
│  1. WebMCP Client Engine (web/src/lib/webmcp.ts)                           │
│     - document.modelContext.registerTool(...)                              │
│     - Feature Detection & Spec-Compliant Polyfill Runtime                 │
│                                                                            │
│  2. Reactive Event Bus (orchestra:tool-executed, orchestra:rental-changed)  │
│     - Navbar Wallet Counter: Instant balance deduction sync               │
│     - Marketplace ToolCard: Instant rental toggle badge                   │
│     - Dashboard Ledger: Live transaction insertion                         │
│     - Demo Target Canvas: Real-time DOM manipulation                       │
└─────────────────────────────────────┬──────────────────────────────────────┘
                                      │
                                      ▼ Authoritative Verification & Microbilling
                              POST /api/deduct-credits
                                      │
┌─────────────────────────────────────▼──────────────────────────────────────┐
│                   SERVER-SIDE ATOMIC LEDGER (Render / Node.js)             │
│                                                                            │
│  - Authoritative Pricing: Cost dictated by catalog, not client-tampered    │
│  - Runaway Circuit Breaker: Auto-blocks when balance < cost or cap hit     │
│  - PostgreSQL Transaction Pool (with memory fallback during cold starts)   │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ The 5 WebMCP Tools Exposed by Orchestra

Orchestra registers **5 high-value, deterministic tools** directly into `document.modelContext`:

| Tool Identifier | Type | Read-Only? | Input Schema | Functional Purpose & Side Effects |
| :--- | :---: | :---: | :--- | :--- |
| **`list_available_tools`** | Discovery | `true` | `{ category?: string }` | Browses Orchestra's verified tool catalog. Returns tool names, titles, categories, costs in credits (CR), reliability ratings, and rental state. |
| **`inspect_tool`** | Discovery | `true` | `{ toolName: string }` | Returns deep schema metadata, parameter specifications, author, and cost for a specific tool before invocation. |
| **`rent_tool`** | State Mutation | `false` | `{ toolName: string }` | Validates user balance, toggles rental activation in PostgreSQL/ledger, and emits real-time UI events. |
| **`execute_tool`** | Execution | `false` | `{ toolName: string, parameters: object }` | Authoritatively checks credit limits on server, deducts credits, executes functional DOM actions (form filling, table scraping, canvas patching), logs transaction, and updates UI live. |
| **`get_wallet`** | Ledger Audit | `true` | `{}` | Returns current credit balance (CR), circuit breaker active status, active tool counts, and recent transaction history. |

---

## ⚙️ Real Execution: No Simulated Faking

Unlike typical demos that return `"Executed successfully"` strings, Orchestra's `execute_tool` performs **real operations**:

1. **Server-Authoritative Microbilling:** The server queries the tool catalog to determine the exact cost (e.g. `0.15 CR` for `shopify_checkout_fast`). Clients cannot override costs to `0`.
2. **PostgreSQL Atomic Transaction:** Executes with row-level locks on the user profile ledger. If balance is insufficient, returns HTTP 402 with `CIRCUIT_BREAKER_BLOCKED`.
3. **Real DOM Actions inside the Active Tab:**
   - **`shopify_checkout_fast`:** Searches for `input[name="fullName"]`, `input[name="email"]`, `input[name="address"]`, populates them, and dispatches native `input` and `change` events.
   - **`extract_analytics_table`:** Scrapes table rows from active DOM, parses columns, and returns structured telemetry.
   - **`margin_context_editor`:** Safely appends verified markdown security patches into `#document-canvas` or `textarea`.
4. **Real-time UI Synchronization:** Emits `orchestra:tool-executed` and `orchestra:rental-changed` custom events so the **Navbar wallet badge, Dashboard transaction history, and ToolCard badges update instantly**.

---

## 🧪 How to Test WebMCP in Chrome

### Option A: Using the Live WebMCP Inspector in Orchestra (Zero Setup)
1. Open [https://orchestra-web-gmvv.onrender.com/](https://orchestra-web-gmvv.onrender.com/) in any browser.
2. In the top navbar, click **"WebMCP: Connected (5 Tools)"** or click the **"⚡ Inspect WebMCP Tools"** button on the homepage.
3. The interactive **WebMCP Browser Runtime Diagnostics** modal opens.
4. Select any tool (e.g. `list_available_tools`, `get_wallet`, or `execute_tool`), click **Invoke `document.modelContext.executeTool(...)`**, and watch the live execution response and credit deduction!

### Option B: Using the Chrome DevTools Console
Open DevTools (`F12` or `Ctrl+Shift+I`) on any Orchestra page, switch to the **Console** tab, and run:

```javascript
// 1. Discover all tools registered on WebMCP
const tools = await document.modelContext.getTools();
console.table(tools);

// 2. Query your wallet balance
const wallet = await document.modelContext.executeTool("get_wallet", {});
console.log("Current Balance:", wallet.balance, "CR");

// 3. Inspect a specific tool
const info = await document.modelContext.executeTool("inspect_tool", { 
  toolName: "shopify_checkout_fast" 
});
console.log(info);

// 4. Rent a tool (watch the UI badge toggle live!)
await document.modelContext.executeTool("rent_tool", { 
  toolName: "shopify_checkout_fast" 
});

// 5. Execute the tool and watch DOM + ledger update live!
const result = await document.modelContext.executeTool("execute_tool", {
  toolName: "shopify_checkout_fast",
  parameters: {
    fullName: "Marcus Vance",
    email: "marcus.vance@techcorp.io",
    address: "742 Evergreen Terrace, Suite 400"
  }
});
console.log("Result:", result);
```

### Option C: Native Chrome Flag (Chrome v149+)
1. Open Chrome and navigate to:
   ```text
   chrome://flags/#enable-experimental-web-platform-features
   ```
2. Set it to **Enabled** and click **Relaunch**.
3. Visit Orchestra: the badge in the navbar will display **`WebMCP: Native (5 Tools)`** indicating direct binding to native Chromium `document.modelContext`!

---

## 💻 Local Development Setup

```bash
# 1. Clone repository
git clone https://github.com/ansonj-dev/Orchestra.git
cd Orchestra/web

# 2. Install dependencies
npm install

# 3. Build & verify TypeScript compilation
npm run build

# 4. Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view Orchestra.

### Running Automated Test Suite

```bash
# Run WebMCP registration, discovery, and DOM execution verification
npx tsx ../scratch/test-webmcp-flow.mjs
```

---

## 🔒 Security & Circuit Breaker Architecture

1. **Anti-Rugpull SHA-256 AST Certification:** Tools submitted via `/studio` are hashed at certification time. Live code is validated against this immutable fingerprint prior to execution.
2. **Hard Spend Cap:** Users configure circuit-breaker limits per tool (e.g. max `5.00 CR`). When accumulated spend reaches the cap, further calls are blocked.
3. **No Credential Propagation:** WebMCP tools interact strictly through defined schemas and browser DOM elements—never transmitting master API tokens or passwords.

---

## 🏆 WebMCP Challenge Alignment Matrix

| Challenge Criteria | How Orchestra Delivers |
| :--- | :--- |
| **WebMCP Leverage** | Real browser-side `document.modelContext.registerTool(...)` imperative API; 5 structured tools with rich JSON Schemas, descriptions, and read-only hints. |
| **Execution Quality** | Fully responsive Next.js 16 UI with live event synchronization, automatic PostgreSQL schema initialization on Render, and 0-error build. |
| **Potential Impact** | Solves the critical bottleneck of agent commerce: safe, local-first execution with pre-paid microbilling and runaway loop protection. |
| **Creativity & Ambition** | First-of-its-kind tool marketplace where AI agents can autonomously discover, rent, and invoke metered web utilities within browser sessions. |

---

## 📄 License

Distributed under the **MIT Open-Source License**. Built with pride for the WebMCP Devpost Challenge.