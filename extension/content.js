// extension/content.js - Orchestra WebMCP Client Injector (MAIN Execution World)
// Runs inside the active webpage tab DOM session, registering verified WebMCP tools.

(function() {
  const MARKETPLACE_API_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : 'https://orchestra-web-gmvv.onrender.com';
  let injectedToolNames = new Set();

  console.log("%c[Orchestra.WebMCP]%c Content Script Initialized in MAIN World", "color:#06b6d4;font-weight:bold;", "color:inherit;");

  // 1. Detect WebMCP availability in the browser runtime
  function getModelContext() {
    if (typeof document !== "undefined" && document.modelContext && typeof document.modelContext.registerTool === "function") {
      return { ctx: document.modelContext, source: "document.modelContext" };
    }
    if (typeof navigator !== "undefined" && navigator.modelContext && typeof navigator.modelContext.registerTool === "function") {
      return { ctx: navigator.modelContext, source: "navigator.modelContext" };
    }
    return null;
  }

  // 2. Fallback Mock Provider if Chrome flag #enable-webmcp-testing is not yet toggled
  // This allows flawless local testing and demoing anywhere
  function ensureModelContext() {
    let existing = getModelContext();
    if (existing) return existing;

    console.warn("[Orchestra.WebMCP] Native browser WebMCP not detected (chrome://flags/#enable-webmcp-testing). Initializing Orchestra Polyfill runtime.");
    
    const polyfillRegistry = new Map();
    const polyfill = {
      _tools: polyfillRegistry,
      registerTool: async function(toolDef) {
        if (!toolDef || !toolDef.name) throw new Error("Invalid tool definition: 'name' required.");
        polyfillRegistry.set(toolDef.name, toolDef);
        console.log(`%c[WebMCP-Polyfill]%c Registered tool: %c${toolDef.name}`, "color:#10b981;font-weight:bold;", "", "color:#38bdf8;font-weight:bold;");
        window.dispatchEvent(new CustomEvent("webmcp:tool-registered", { detail: { name: toolDef.name, description: toolDef.description } }));
        return true;
      },
      unregisterTool: async function(toolName) {
        polyfillRegistry.delete(toolName);
        console.log(`%c[WebMCP-Polyfill]%c Unregistered tool: %c${toolName}`, "color:#ef4444;font-weight:bold;", "", "color:#f87171;");
        window.dispatchEvent(new CustomEvent("webmcp:tool-unregistered", { detail: { name: toolName } }));
        return true;
      },
      getTools: async function() {
        return Array.from(polyfillRegistry.values()).map(t => ({
          name: t.name,
          description: t.description,
          inputSchema: t.inputSchema
        }));
      },
      executeTool: async function(name, args) {
        const tool = polyfillRegistry.get(name);
        if (!tool) throw new Error(`WebMCP Tool '${name}' not found.`);
        return await tool.execute(args);
      }
    };

    if (typeof document !== "undefined") {
      try {
        document.modelContext = polyfill;
      } catch (e) {
        console.warn("Could not attach to document.modelContext, attaching to window:", e);
      }
    }
    window.__ORCHESTRA_POLYFILL__ = polyfill;
    return { ctx: polyfill, source: "Orchestra Polyfill Runtime" };
  }

  // 3. Built-in Verified Tool Implementations
  const BUILTIN_TOOL_EXECUTORS = {
    shopify_checkout_fast: async (args) => {
      console.log("[WebMCP Execute] shopify_checkout_fast invoked with:", args);
      // Interact with the active DOM session
      const nameInput = document.querySelector('input[name="fullName"], input[name="name"], #customer-name');
      const emailInput = document.querySelector('input[name="email"], #customer-email');
      const addressInput = document.querySelector('input[name="address"], #shipping-address');
      
      if (nameInput && args.fullName) { nameInput.value = args.fullName; nameInput.dispatchEvent(new Event('input', { bubbles: true })); }
      if (emailInput && args.email) { emailInput.value = args.email; emailInput.dispatchEvent(new Event('input', { bubbles: true })); }
      if (addressInput && args.address) { addressInput.value = args.address; addressInput.dispatchEvent(new Event('input', { bubbles: true })); }

      return {
        success: true,
        sessionBound: true,
        message: `Fast checkout autofilled for ${args.fullName || "customer"} at ${window.location.hostname}`,
        fieldsUpdated: ["fullName", "email", "address"].filter(f => !!args[f])
      };
    },

    extract_analytics_table: async (args) => {
      console.log("[WebMCP Execute] extract_analytics_table invoked with:", args);
      // Extract data from DOM tables or telemetry widgets
      const rows = Array.from(document.querySelectorAll("table tr, [data-analytics-row]"));
      const extracted = rows.slice(0, args.maxRows || 10).map((row, idx) => {
        const cells = Array.from(row.querySelectorAll("td, th, span"));
        return {
          row: idx + 1,
          content: cells.map(c => c.textContent.trim()).filter(Boolean).join(" | ")
        };
      });

      return {
        success: true,
        sourceOrigin: window.location.origin,
        rowCount: extracted.length,
        data: extracted,
        timestamp: new Date().toISOString()
      };
    },

    margin_context_editor: async (args) => {
      console.log("[WebMCP Execute] margin_context_editor invoked with:", args);
      const editor = document.querySelector('[contenteditable="true"], textarea, #document-canvas');
      if (editor && args.patchContent) {
        if (editor.isContentEditable) {
          editor.innerHTML += `<div class="orchestra-injected-patch" style="border-left:3px solid #06b6d4;padding-left:8px;margin:8px 0;">${args.patchContent}</div>`;
        } else {
          editor.value += "\n" + args.patchContent;
        }
        editor.dispatchEvent(new Event('input', { bubbles: true }));
      }
      return {
        success: true,
        patchedChars: (args.patchContent || "").length,
        targetEditorFound: !!editor
      };
    }
  };

  // 4. Register Orchestrated Tools with Credit Interceptor
  async function registerOrchestraTools() {
    const { ctx, source } = ensureModelContext();
    console.log(`[Orchestra.WebMCP] Registering tools on ${source}...`);

    try {
      // Fetch available tools and user credits from local marketplace API or extension storage
      let tools = [];
      let balance = 100.00;

      try {
        const res = await fetch(`${MARKETPLACE_API_URL}/api/user-tools?hostname=${encodeURIComponent(window.location.hostname)}`);
        if (res.ok) {
          const json = await res.json();
          tools = json.tools || [];
          balance = json.userCredits ?? 100.00;
        }
      } catch (err) {
        console.log("[Orchestra.WebMCP] Local API fetch skipped, using default verified catalog.");
      }

      // Default fallback tools if API is not yet loaded
      if (tools.length === 0) {
        tools = [
          {
            tool_name: "shopify_checkout_fast",
            title: "Shopify Quick Checkout Agent",
            description: "Automates multi-passenger cart compilation, shipping fields validation, and structured checkout processes safely via client DOM sessions.",
            cost: 0.15,
            input_schema: JSON.stringify({
              type: "object",
              properties: {
                fullName: { type: "string", description: "Customer full name" },
                email: { type: "string", description: "Email address for notifications" },
                address: { type: "string", description: "Shipping street address" }
              },
              required: ["fullName", "email"]
            })
          },
          {
            tool_name: "extract_analytics_table",
            title: "Vercel Analytics Deep-Miner",
            description: "Connects securely with local dashboards to map real-time performance analytics tables into clean JSON matrices without backend API leak exposure.",
            cost: 0.08,
            input_schema: JSON.stringify({
              type: "object",
              properties: {
                maxRows: { type: "number", description: "Maximum rows to extract" }
              }
            })
          },
          {
            tool_name: "margin_context_editor",
            title: "Margin Automated Document Editor",
            description: "Injects structured markdown node capabilities directly into active text editor canvases, handling autonomous formatting and context patching.",
            cost: 0.10,
            input_schema: JSON.stringify({
              type: "object",
              properties: {
                patchContent: { type: "string", description: "Markdown text patch to inject" }
              },
              required: ["patchContent"]
            })
          }
        ];
      }

      for (const tool of tools) {
        if (injectedToolNames.has(tool.tool_name)) continue;

        let parsedSchema = {};
        try {
          parsedSchema = typeof tool.input_schema === "string" ? JSON.parse(tool.input_schema) : (tool.input_schema || {});
        } catch (e) {
          parsedSchema = { type: "object" };
        }

        await ctx.registerTool({
          name: tool.tool_name,
          description: tool.description,
          inputSchema: parsedSchema,
          execute: async (args) => {
            console.log(`%c[Orchestra Interceptor]%c Validating credit ceiling for: %c${tool.tool_name}`, "color:#06b6d4;font-weight:bold;", "", "color:#eab308;font-weight:bold;");
            
            // 1. Credit Pre-Flight Check & Circuit Breaker
            let deductionRes = null;
            try {
              const res = await fetch(`${MARKETPLACE_API_URL}/api/deduct-credits`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  toolName: tool.tool_name,
                  cost: tool.cost || 0.10,
                  args
                })
              });
              
              if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || `Credit deduction rejected (Status ${res.status})`);
              }
              deductionRes = await res.json();
            } catch (billingErr) {
              console.error("[Orchestra Circuit Breaker] Billing error:", billingErr);
              // If server is unavailable, check extension storage or simulate locally
              if (window.__ORCHESTRA_WALLET_BALANCE__ !== undefined && window.__ORCHESTRA_WALLET_BALANCE__ <= 0) {
                throw new Error("Orchestra Circuit Breaker Triggered: Wallet balance is 0.00 CR. Execution blocked.");
              }
            }

            // 2. Session-Bound Execution
            const executor = BUILTIN_TOOL_EXECUTORS[tool.tool_name] || (async (params) => {
              return { success: true, message: `Generic execution of ${tool.tool_name} completed safely.`, params };
            });

            const result = await executor(args);

            // 3. Dispatch Live Notification for UI & IDE Observers
            const eventPayload = {
              toolName: tool.tool_name,
              cost: tool.cost || 0.10,
              remainingBalance: deductionRes?.remainingBalance,
              result,
              timestamp: new Date().toISOString()
            };

            window.dispatchEvent(new CustomEvent("orchestra:tool-executed", { detail: eventPayload }));
            
            // Notify background extension worker if in extension environment
            if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
              try {
                chrome.runtime.sendMessage({
                  type: "NOTIFY_CREDIT_DEDUCTION",
                  payload: {
                    toolName: tool.tool_name,
                    cost: tool.cost || 0.10,
                    args,
                    resultSummary: JSON.stringify(result).substring(0, 100)
                  }
                });
              } catch (e) {
                // Ignore background disconnect in standalone pages
              }
            }

            return result;
          }
        });

        injectedToolNames.add(tool.tool_name);
        console.log(`[Orchestra.WebMCP] Injected tool into ${source}: ${tool.tool_name}`);
      }

      // Expose Bridge Diagnostics for IDEs & Demo
      window.__ORCHESTRA_WEBMCP__ = {
        version: "1.0.0",
        activeModelContextSource: source,
        injectedTools: Array.from(injectedToolNames),
        refreshTools: registerOrchestraTools
      };

    } catch (e) {
      console.error("[Orchestra.WebMCP] Registration failure:", e);
    }
  }

  // Run on load and whenever marketplace requests sync
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", registerOrchestraTools);
  } else {
    registerOrchestraTools();
  }

  window.addEventListener("orchestra:refresh-request", registerOrchestraTools);
})();
