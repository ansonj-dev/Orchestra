# Orchestra — Devpost Project Story

## Inspiration

As AI agents transition from conversational chatbots into autonomous workers that shop, extract telemetry, and fill forms, they hit three critical architectural roadblocks:
1. **The Credential Leak Vulnerability:** Cloud-hosted agents require users to surrender raw API keys and passwords to third-party servers.
2. **The Runaway Loop Crisis:** A probabilistic agent stuck in a retry loop can drain hundreds of dollars in unplanned API charges within minutes.
3. **The Unverified Script Problem:** Users have no proof of determinism or safety before letting an agent execute a web utility.

We built Orchestra to bring agent execution out of remote cloud black boxes and directly into the user's browser, powered by Google Chrome's WebMCP standard and protected by an atomic credit ledger.

---

## What It Does

Orchestra is a local-first marketplace and runtime for credit-metered AI agent utilities. 

When an AI agent visits the Orchestra web platform, Orchestra's client frontend registers a suite of deterministic tools directly into the browser via Chrome's native WebMCP standard (`document.modelContext.registerTool`).

Through WebMCP, agents can:
* **Discover:** Query `document.modelContext.getTools()` to browse verified utilities with clear descriptions and strict JSON schemas.
* **Inspect:** Retrieve detailed parameter requirements and execution costs before calling a tool.
* **Rent:** Activate tools dynamically within their session.
* **Execute:** Run local DOM actions (e.g., autofilling checkout fields, extracting live table telemetry, patching documents) inside the active browser session.
* **Audit:** Track wallet balances and microbilling records in real time.

All executions are protected by an **Authoritative Runaway Circuit Breaker**: every micropayment is validated by a PostgreSQL ledger on the server. If an agent loops or depletes its credits, execution halts immediately at $0.00, eliminating surprise bills.

---

## How We Built It

* **WebMCP Client Engine:** Implemented the Chrome WebMCP Imperative API (`document.modelContext.registerTool`) with automatic feature detection and a spec-compliant fallback engine.
* **The 5 Core WebMCP Tools:**
  * `list_available_tools`: Explores verified catalog capabilities.
  * `inspect_tool`: Audits parameter schemas and pricing.
  * `rent_tool`: Manages session-level activation and state mutation.
  * `execute_tool`: Performs authoritative microbilling and real DOM manipulation.
  * `get_wallet`: Audits real-time credit balance and transaction history.
* **Reactive Frontend:** Next.js 16 and Tailwind CSS with an event bus that instantly updates the UI, wallet pill, and transaction log when an agent calls a tool.
* **Authoritative Ledger & Database:** PostgreSQL with atomic row-level locking so clients cannot tamper with prices or bypass credit checks.
* **Chrome Middleware Extension:** A Manifest V3 background service worker and popup manager allowing users to monitor wallet balances and sync tools across active tabs.

---

## Challenges We Ran Into

* **True Browser-Side WebMCP vs. Server MCP:** Many projects stop at building an HTTP JSON-RPC endpoint. We made sure Orchestra implements true browser-side WebMCP where tools bind to the client DOM (`document.modelContext`), ensuring zero passwords or sensitive page data ever leave the user's machine.
* **Authoritative Pricing with Local Execution:** Balancing immediate, local-first DOM actions with server-side tamper resistance. We solved this by enforcing authoritative catalog lookups in the ledger proxy while streaming live DOM mutations inside the active tab.
* **Cold-Start Resilience:** Ensuring the database auto-initializes schemas and handles connections gracefully on serverless/cloud environments without breaking the live agent session.

---

## Accomplishments We're Proud Of

* **Genuine WebMCP Integration:** Full compliance with Google Chrome's Imperative WebMCP specification, complete with runtime diagnostic tooling right in the browser.
* **Real Execution (No Simulated Fakes):** Our demo tools actually populate checkout inputs, scrape live DOM tables, and modify document state with real event dispatching.
* **Bulletproof Circuit Breaker:** Zero risk of runaway token billing for agent operators.
* **Full Stack Cohesion:** A unified experience linking the web marketplace, in-session co-pilot, Chrome extension, and PostgreSQL audit ledger.

---

## What We Learned

We discovered that Chrome's WebMCP standard fundamentally transforms the browser from a passive display canvas into an active, secure execution runtime for autonomous agents. By pairing client-side DOM execution with server-authoritative micro-metering, developers can build a sustainable, safe agent economy without compromising user privacy.

---

## What's Next for Orchestra

* Expanding the developer portal to allow third-party engineers to publish verified WebMCP tools with automated revenue sharing.
* Multi-agent execution pipelines where specialized agents hand off tasks sequentially under a unified credit budget.
* Deeper declarative markup parsing so websites can expose WebMCP actions with simple HTML attributes.
