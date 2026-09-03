// Orchestra.WebMCP Declarative WebMCP Parser
// Implements Google Chrome's Declarative WebMCP standard (HTML Forms & Meta Tags).

import { WebMCPTool } from '../types';

export interface DeclarativeFormToolDefinition {
  toolName: string;
  title: string;
  description: string;
  cost: number;
  formSelector: string;
  generatedSchema: {
    type: string;
    properties: Record<string, { type: string; description: string }>;
    required: string[];
  };
}

export class DeclarativeWebMCPParser {
  /**
   * Scans a DOM root or document for Declarative WebMCP tags:
   * e.g., <form data-webmcp-tool="true" data-tool-name="fast_checkout" data-cost="0.10">
   */
  static parseDocumentForms(doc: Document): DeclarativeFormToolDefinition[] {
    if (!doc || typeof doc.querySelectorAll !== 'function') return [];

    const discoveredTools: DeclarativeFormToolDefinition[] = [];
    const forms = doc.querySelectorAll('form[data-webmcp-tool], form[tool-name], form[action*="checkout"], form[id*="checkout"]');

    forms.forEach((formEl: any, idx) => {
      const toolName = formEl.getAttribute('data-tool-name') || formEl.getAttribute('tool-name') || `declarative_form_${idx + 1}`;
      const title = formEl.getAttribute('data-tool-title') || formEl.getAttribute('aria-label') || `Declarative Form Tool (${toolName})`;
      const description = formEl.getAttribute('data-tool-desc') || "Automatically extracted from HTML Declarative WebMCP form structure.";
      const cost = parseFloat(formEl.getAttribute('data-cost') || '0.10');

      const properties: Record<string, { type: string; description: string }> = {};
      const required: string[] = [];

      const inputs = formEl.querySelectorAll('input, select, textarea');
      inputs.forEach((input: any) => {
        const name = input.name || input.id;
        if (!name || input.type === 'submit' || input.type === 'button') return;

        const type = input.type === 'number' ? 'number' : input.type === 'checkbox' ? 'boolean' : 'string';
        properties[name] = {
          type,
          description: input.placeholder || input.getAttribute('aria-label') || `Field for ${name}`
        };

        if (input.required) {
          required.push(name);
        }
      });

      discoveredTools.push({
        toolName,
        title,
        description,
        cost,
        formSelector: formEl.id ? `#${formEl.id}` : `form[data-tool-name="${toolName}"]`,
        generatedSchema: {
          type: "object",
          properties,
          required
        }
      });
    });

    return discoveredTools;
  }

  /**
   * Converts a declarative form tool definition into a full WebMCPTool specification
   * capable of executing within document.modelContext.
   */
  static toWebMCPTool(def: DeclarativeFormToolDefinition): WebMCPTool {
    return {
      id: "decl_" + def.toolName,
      title: def.title,
      tool_name: def.toolName,
      description: def.description,
      category: "E-Commerce",
      cost: def.cost,
      reliability_score: 99.1,
      author: "Declarative HTML Standard",
      is_verified: true,
      input_schema: def.generatedSchema,
      javascript_code: `async function execute(args) {
  const form = document.querySelector('${def.formSelector}') || document.querySelector('form');
  if (!form) throw new Error("Declarative target form not found on active page.");
  for (const [k, v] of Object.entries(args)) {
    const input = form.querySelector('[name="' + k + '"], #' + k);
    if (input) {
      input.value = v;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
  return { success: true, mode: 'DECLARATIVE_WEBMCP', fieldsFilled: Object.keys(args) };
}`
    };
  }
}
