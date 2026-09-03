# Orchestra — Devpost Project Story

## Inspiration

As artificial intelligence advances from conversational chat assistants into autonomous agents capable of performing transactions, compiling research, and interacting with live web applications, the industry faces an urgent trust and execution dilemma.

Today's agent architectures suffer from three critical structural flaws:
1. **The Credential Leak Dilemma:** Traditional cloud-hosted agents require users to surrender long-lived master API keys, passwords, or OAuth tokens to remote servers, exposing private credentials to third-party data breaches.
2. **The Runaway Loop & Billing Crisis:** Probabilistic agents that hit unexpected deadlocks can enter unbounded retry loops, silently burning through hundreds of dollars in unplanned compute and API bills in minutes.
3. **The Unverified Script Problem:** Users have no objective proof of determinism, accuracy, or safety before letting an autonomous agent execute code on their behalf.

We built Orchestra to bring agent utility discovery and execution out of remote cloud black boxes and directly into the user's browser, powered by Google Chrome's WebMCP standard and governed by an atomic, runaway-proof credit ledger.

---

## What It Does

Orchestra is a local-first marketplace and execution runtime for credit-metered AI agent utilities.

When an AI agent visits Orchestra in the browser, Orchestra's frontend registers a suite of deterministic, schema-validated tools directly into the browser via Chrome's native WebMCP standard (`document.modelContext.registerTool`).

Through this browser-native interface, autonomous agents can:
* **Discover Utilities:** Query `document.modelContext.getTools()` to inspect available capabilities, categories, and execution costs.
* **Inspect Schemas:** Fetch strict parameter requirements and type definitions before invoking any action.
* **Rent & Activate:** Dynamically rent utilities for their active browsing session.
* **Execute In-Session Actions:** Perform real local DOM tasks (such as autofilling checkout flows, scraping telemetry tables, or applying markdown patches) directly inside the active browser session with zero credential leaks.
* **Audit Spending:** Query live wallet balances and transaction histories.

Every execution is backed by an **Authoritative Runaway Circuit Breaker**: micropayments are verified and deducted on the server using atomic PostgreSQL transactions. If an agent loops or depletes its balance, execution halts immediately at $0.00, permanently neutralizing runaway token bills.

---

## Why Your Use Case is a Strong Fit for WebMCP

The Web Model Context Protocol (WebMCP) is designed to give browser-based agents a clean, structured, and native mechanism to take action on the web. A tool marketplace and execution runtime is the quintessential use case for WebMCP for four fundamental reasons:

1. **Dynamic Runtime Discovery Over Hardcoded Integrations:** Instead of forcing agent developers to write bespoke integrations for every web application, WebMCP enables agents to navigate to Orchestra and dynamically discover available utilities at runtime through `document.modelContext.getTools()`.
2. **Session-Bound Execution Without Credential Exposure:** WebMCP tools execute directly inside the user's active, authenticated browser tab session. The agent interacts with the DOM through structured tool callbacks rather than scraping raw HTML or handling sensitive master passwords.
3. **Ephemeral & Contextual Tool Lifecycles:** WebMCP allows pages to register, update, and unregister tools dynamically based on the user's state, workflow, and budget. Orchestra leverages this to expose tools only when rented and verified.
4. **Declarative Contracts for Probabilistic Models:** Large language models struggle with ambiguous web forms. WebMCP provides strict JSON Schemas, parameter typing, and semantic descriptions, giving agents the deterministic boundaries they need to succeed reliably.

---

## How It Creates a Better User Experience

Orchestra delivers a transformative user experience for humans, autonomous agents, and tool developers alike:

* **For Human Users (Visibility & Financial Safety):**
  * **Zero Surprise Bills:** The built-in Circuit Breaker allows users to set hard spend caps per tool. If an agent gets confused, execution auto-terminates before wasting funds.
  * **Real-Time Visual Transparency:** Every time an agent invokes a WebMCP tool, Orchestra displays live in-session notification toasts, animates real DOM updates, and updates the wallet balance instantly.
  * **Privacy by Default:** Sensitive personal data and session cookies never leave the local browser environment.
* **For AI Agents (Determinism & Speed):**
  * **Structured JSON Input/Output:** Agents interact via clean, type-checked parameters rather than brittle, error-prone visual screen parsing.
  * **Predictable Error Handling:** When credits are exhausted or inputs fail validation, the agent receives clear, structured status codes (such as HTTP 402 with circuit breaker metadata) rather than silent timeouts or broken DOM states.
* **For Developers (Frictionless Distribution):**
  * **Build Once, Expose Everywhere:** Tool authors write standard web utilities that any WebMCP-compatible browser agent can immediately discover and invoke without custom SDKs or plugin stores.

---

## What People and Agents Can Do Together That Was Difficult or Impossible Before

Before Orchestra and WebMCP, human-agent collaboration on the web was severely bottlenecked:

1. **Safe Delegation of Autonomous Actions:** Previously, users hesitated to let agents touch financial or administrative web workflows because granting access meant either handing over raw credentials or risking unbounded financial exposure. With Orchestra, users can safely hand off complex multi-step workflows (like e-commerce checkouts or dashboard extractions) knowing that hard circuit-breaker limits physically cap spending and actions occur right before their eyes in the tab.
2. **On-the-Fly Capability Expansion:** Previously, if an agent encountered a task it lacked the tool for, the user had to stop, find an API, obtain an API key, configure environment variables, and restart the agent. With Orchestra's WebMCP marketplace, an agent visiting a site can autonomously discover a specialized utility, check its pricing, rent it through the user's pre-funded wallet, and execute the task in seconds.
3. **Cross-Ecosystem Interoperability:** Previously, tools built for one agent framework (like Cursor or Claude) could not be used by browser-based web agents. By standardizing on Chrome's `document.modelContext`, Orchestra allows the same verified utility to be invoked by browser agents, desktop assistants, and IDE extensions interchangeably.

---

## How We Implemented WebMCP

We built a comprehensive, browser-native WebMCP implementation that complies strictly with Google Chrome's Imperative API specification:

* **Core WebMCP Engine:** Implemented in the client application with automated feature detection. It inspects `document.modelContext` and `navigator.modelContext`. If native browser flags are not active, it seamlessly initializes a fully compliant, spec-accurate polyfill engine so developers and judges can evaluate tool calls in any browser environment.
* **The 5 Exposed WebMCP Tools:**
  1. `list_available_tools`: Explores the catalog of verified tools, categories, execution costs (in CR), reliability scores, and rental statuses. (`readOnlyHint: true`)
  2. `inspect_tool`: Returns comprehensive parameter schemas and functional descriptions for a target tool before execution. (`readOnlyHint: true`)
  3. `rent_tool`: Validates wallet balance, updates the database rental ledger, and emits live UI state changes. (`readOnlyHint: false`)
  4. `execute_tool`: Executes active tools within the browser session, performs authoritative server-side microbilling, logs audit transactions, and applies DOM actions. (`readOnlyHint: false`)
  5. `get_wallet`: Retrieves current credit balance, active spend caps, and recent microbilling transaction history. (`readOnlyHint: true`)
* **Real DOM Session Execution:** When `execute_tool` runs, it triggers functional DOM operations:
  * For checkout utilities (`shopify_checkout_fast`), it locates target input fields, injects customer data, and dispatches native input and change events.
  * For telemetry utilities (`extract_analytics_table`), it scrapes and parses live DOM table rows into structured JSON.
  * For document utilities (`margin_context_editor`), it injects verified markdown patches into active editor canvases.
* **Authoritative Server Ledger & Anti-Tampering:** Server endpoints lookup registered tool costs directly from the verified catalog. Clients and agents cannot spoof execution prices. Micro-billing deductions execute via atomic PostgreSQL queries with row-level locks.
* **Reactive Frontend Event Bus:** Next.js 16 client components listen to `orchestra:agent-action` and `orchestra:tool-executed` custom DOM events, instantly updating the navbar wallet pill, transaction log, and tool rental badges without full-page reloads.
* **In-Browser WebMCP Diagnostics Inspector:** An interactive diagnostics modal accessible directly from the navbar allowing users and judges to inspect registered tools, review schemas, and invoke `document.modelContext.executeTool(...)` with real-time JSON response previews.

---

## Challenges We Ran Into

* **True Browser-Side WebMCP vs. Server MCP:** Many projects settle for building standard HTTP JSON-RPC servers. We committed to building true browser-side WebMCP where tools bind directly to `document.modelContext`, ensuring tools run inside the client DOM rather than remote servers.
* **Balancing Authoritative Pricing with Local Execution:** Ensuring that client-side DOM execution remained fast while guaranteeing that the server authoritative ledger prevented malicious price tampering or credit overdrafts.
* **Database Cold Starts in Production:** Handling PostgreSQL connection pools and schema creation gracefully during cold boots on cloud container environments without interrupting active agent sessions.

---

## Accomplishments We're Proud Of

* **Genuine WebMCP Integration:** Full compliance with Chrome's Imperative WebMCP specification, complete with built-in runtime diagnostics.
* **Zero Faked Demos:** Every tool execution performs real DOM modifications and authoritative credit deductions—no simulated dummy strings.
* **Resilient Architecture:** Automatic schema initialization, graceful fallback mechanisms, and zero TypeScript or build errors in production.
* **Seamless Co-Pilot & Extension Support:** A complete ecosystem connecting the web marketplace, in-session co-pilot, and Chrome extension.

---

## What We Learned

We learned that Chrome's WebMCP standard fundamentally transforms the web browser from a passive visual document viewer into a programmable, sandboxed execution runtime for autonomous agents. Combining browser-native tool registration with server-authoritative credit metering creates a safe, viable economic foundation for the agentic web.

---

## What's Next for Orchestra

* **Developer Publishing & Monetization:** Enabling third-party tool authors to publish custom WebMCP tools with automated revenue sharing.
* **Multi-Agent Collaborative Pipelines:** Allowing teams of specialized agents to coordinate and hand off tasks sequentially under a single shared credit budget.
* **Declarative Markup Standard:** Expanding support for Chrome's declarative WebMCP standard so websites can expose agent actions directly via HTML form attributes.
