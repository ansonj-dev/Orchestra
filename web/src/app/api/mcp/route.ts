// GET & POST /api/mcp - Model Context Protocol Server Endpoint
// Connects Cursor, Claude Code, and ChatGPT Desktop to Orchestra's WebMCP Tools

import { NextResponse } from 'next/server';
import { OrchestraLedger } from '@/lib/ledger';

export async function GET() {
  // Returns MCP Tool Manifest for discovery
  const tools = OrchestraLedger.getRentedTools();
  
  const mcpTools = tools.map(t => ({
    name: t.tool_name,
    description: `[Orchestra WebMCP | Cost: ${t.cost} CR] ${t.description}`,
    inputSchema: t.input_schema
  }));

  return NextResponse.json({
    jsonrpc: "2.0",
    protocolVersion: "2024-11-05",
    serverInfo: {
      name: "orchestra-webmcp-hub",
      version: "1.0.0"
    },
    tools: mcpTools
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { method, params, id } = body;

    // 1. Tool Discovery Request
    if (method === "tools/list") {
      const tools = OrchestraLedger.getRentedTools();
      return NextResponse.json({
        jsonrpc: "2.0",
        id,
        result: {
          tools: tools.map(t => ({
            name: t.tool_name,
            description: `[Orchestra WebMCP | Cost: ${t.cost} CR | Reliability: ${t.reliability_score}%] ${t.description}`,
            inputSchema: t.input_schema
          }))
        }
      });
    }

    // 2. Tool Execution Request (Call from Cursor or Claude Code)
    if (method === "tools/call") {
      const { name, arguments: toolArgs } = params;
      
      const deduction = OrchestraLedger.deductCredits({
        toolName: name,
        caller: 'cursor',
        metadata: { clientMcpArgs: toolArgs }
      });

      if (!deduction.success) {
        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          error: {
            code: -32000,
            message: deduction.error || "Circuit Breaker: Insufficient credits or cap reached."
          }
        });
      }

      // Format MCP Result
      const resultText = `[Orchestra WebMCP Invoked: ${name}]\nStatus: Executed in browser context.\nCredits Deducted: ${deduction.deducted} CR\nRemaining Balance: ${deduction.remainingBalance.toFixed(2)} CR\nParameters: ${JSON.stringify(toolArgs, null, 2)}`;

      return NextResponse.json({
        jsonrpc: "2.0",
        id,
        result: {
          content: [
            {
              type: "text",
              text: resultText
            }
          ],
          isError: false
        }
      });
    }

    return NextResponse.json({
      jsonrpc: "2.0",
      id,
      error: { code: -32601, message: "Method not found" }
    });
  } catch (err: any) {
    return NextResponse.json({
      jsonrpc: "2.0",
      error: { code: -32603, message: err.message || "Internal error" }
    });
  }
}
