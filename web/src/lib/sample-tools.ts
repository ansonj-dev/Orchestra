import { WebMCPTool } from '../types';

export const SAMPLE_TOOLS: WebMCPTool[] = [
  {
    id: "tool_shopify_checkout",
    title: "Shopify Quick Checkout Agent",
    tool_name: "shopify_checkout_fast",
    description: "Automates multi-passenger cart compilation, shipping fields validation, and structured checkout processes safely via client DOM sessions.",
    category: "E-Commerce",
    cost: 0.15,
    reliability_score: 99.4,
    author: "Alex_Dev",
    is_verified: true,
    active_rentals_count: 1420,
    input_schema: {
      type: "object",
      properties: {
        fullName: { type: "string", description: "Customer full name for shipping label" },
        email: { type: "string", description: "Receipt email address" },
        address: { type: "string", description: "Full street address" },
        promoCode: { type: "string", description: "Optional discount code" }
      },
      required: ["fullName", "email"]
    },
    javascript_code: `async function execute(args) {
  const nameInput = document.querySelector('input[name="fullName"], input[name="name"], #customer-name');
  const emailInput = document.querySelector('input[name="email"], #customer-email');
  const addrInput = document.querySelector('input[name="address"], #shipping-address');
  if (nameInput && args.fullName) { nameInput.value = args.fullName; nameInput.dispatchEvent(new Event('input', { bubbles: true })); }
  if (emailInput && args.email) { emailInput.value = args.email; emailInput.dispatchEvent(new Event('input', { bubbles: true })); }
  if (addrInput && args.address) { addrInput.value = args.address; addrInput.dispatchEvent(new Event('input', { bubbles: true })); }
  return { success: true, autofilled: true, domain: window.location.hostname };
}`
  },
  {
    id: "tool_analytics_table",
    title: "Vercel Analytics Deep-Miner",
    tool_name: "extract_analytics_table",
    description: "Connects securely with local dashboards to map real-time performance analytics tables into clean JSON matrices without backend API leak exposure.",
    category: "DevOps & Cloud",
    cost: 0.08,
    reliability_score: 98.1,
    author: "Matrix_Labs",
    is_verified: true,
    active_rentals_count: 890,
    input_schema: {
      type: "object",
      properties: {
        maxRows: { type: "number", description: "Maximum rows to extract from the DOM table" },
        filterMetric: { type: "string", description: "Optional metric keyword filter (e.g. latency, 500, p99)" }
      }
    },
    javascript_code: `async function execute(args) {
  const rows = Array.from(document.querySelectorAll('table tr, [data-analytics-row]'));
  const data = rows.slice(0, args.maxRows || 10).map((r, i) => ({
    id: i + 1,
    cells: Array.from(r.querySelectorAll('td, th')).map(c => c.textContent.trim())
  }));
  return { success: true, count: data.length, rows: data };
}`
  },
  {
    id: "tool_margin_editor",
    title: "Margin Automated Document Editor",
    tool_name: "margin_context_editor",
    description: "Injects structured markdown node capabilities directly into active text editor canvases, handling autonomous formatting and context patching.",
    category: "Productivity",
    cost: 0.10,
    reliability_score: 96.7,
    author: "OpenWriter",
    is_verified: true,
    active_rentals_count: 640,
    input_schema: {
      type: "object",
      properties: {
        patchContent: { type: "string", description: "Markdown text or structured patch string" },
        targetSection: { type: "string", description: "Optional section header where patch should be applied" }
      },
      required: ["patchContent"]
    },
    javascript_code: `async function execute(args) {
  const canvas = document.querySelector('[contenteditable="true"], textarea, #document-canvas');
  if (!canvas) throw new Error("Editable canvas not found on active page.");
  if (canvas.isContentEditable) {
    canvas.innerHTML += '<p class="orchestra-patch">' + args.patchContent + '</p>';
  } else {
    canvas.value += '\\n' + args.patchContent;
  }
  return { success: true, patched: true, length: args.patchContent.length };
}`
  },
  {
    id: "tool_auth_sentinel",
    title: "Zero-Trust Session Guard",
    tool_name: "browser_session_auditor",
    description: "Audits active tab storage (cookies, localStorage, token schemas) for unencrypted JWTs or CSRF vulnerabilities without transmitting secrets to external clouds.",
    category: "Security & Auth",
    cost: 0.12,
    reliability_score: 99.8,
    author: "CyberShield",
    is_verified: true,
    active_rentals_count: 512,
    input_schema: {
      type: "object",
      properties: {
        checkLocalStorage: { type: "boolean", description: "Scan localStorage keys" },
        deepScanCookies: { type: "boolean", description: "Inspect cookie secure flags" }
      }
    },
    javascript_code: `async function execute(args) {
  const findings = [];
  if (args.checkLocalStorage) {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('token') || key.includes('secret') || key.includes('auth'))) {
        findings.push({ key, exposedInLocalStorage: true, severity: 'MEDIUM' });
      }
    }
  }
  return { success: true, origin: window.location.origin, findingsCount: findings.length, findings };
}`
  },
  {
    id: "tool_onchain_gas_tracker",
    title: "EVM Real-Time Gas & Calldata Meter",
    tool_name: "evm_calldata_meter",
    description: "Inspects dApp web3 modal connections, decodes raw hex transaction proposals on Uniswap/Aave DOM, and simulates gas spikes before signing.",
    category: "Web3 & Onchain",
    cost: 0.20,
    reliability_score: 97.9,
    author: "NexusA2A",
    is_verified: true,
    active_rentals_count: 1180,
    input_schema: {
      type: "object",
      properties: {
        chainFamily: { type: "string", enum: ["ethereum", "arbitrum", "base", "polygon"], description: "EVM network identifier" },
        maxGweiAlert: { type: "number", description: "Alert ceiling for gas fees" }
      },
      required: ["chainFamily"]
    },
    javascript_code: `async function execute(args) {
  return {
    success: true,
    chain: args.chainFamily,
    estimatedBaseFeeGwei: 18.4,
    priorityFeeGwei: 1.5,
    safeToTransact: true,
    calldataSanitized: true
  };
}`
  },
  {
    id: "tool_dom_form_filler",
    title: "Universal Intelligent Form Syncer",
    tool_name: "universal_form_syncer",
    description: "High-precision heuristic mapper that connects JSON schema payloads to multi-page forms, handling custom dropdowns, radio groups, and date pickers.",
    category: "Data Extraction",
    cost: 0.09,
    reliability_score: 98.6,
    author: "AutomataCore",
    is_verified: true,
    active_rentals_count: 2310,
    input_schema: {
      type: "object",
      properties: {
        fieldMapping: { type: "object", description: "Key-value dictionary of form field names and desired values" }
      },
      required: ["fieldMapping"]
    },
    javascript_code: `async function execute(args) {
  let matched = 0;
  for (const [key, val] of Object.entries(args.fieldMapping || {})) {
    const input = document.querySelector(\`[name="\${key}"], #\${key}, [aria-label*="\${key}" i]\`);
    if (input) {
      input.value = val;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      matched++;
    }
  }
  return { success: true, matchedFields: matched };
}`
  }
];
