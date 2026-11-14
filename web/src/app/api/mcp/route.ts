// Remote MCP endpoint.
// Browser-local WebMCP tools require the user's active tab and cannot be executed
// by this server route. Never debit credits or report success for work not performed.

import { NextResponse } from 'next/server';
import { OrchestraLedger } from '@/lib/ledger';

const SERVER_INFO = { name: 'orchestra-webmcp-hub', version: '1.1.0' };
const PROTOCOL_VERSION = '2024-11-05';

function listTools() {
  return OrchestraLedger.getRentedTools().map((tool) => ({
    name: tool.tool_name,
    description: `[Orchestra WebMCP | Cost: ${tool.cost} CR] ${tool.description}`,
    inputSchema: tool.input_schema
  }));
}

export async function GET() {
  return NextResponse.json({
    protocolVersion: PROTOCOL_VERSION,
    serverInfo: SERVER_INFO,
    tools: listTools(),
    executionMode: 'browser-local',
    note: 'Remote execution is disabled. Invoke tools from the Orchestra browser runtime.'
  });
}

export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({
      jsonrpc: '2.0',
      id: null,
      error: { code: -32700, message: 'Parse error: request body must be valid JSON.' }
    }, { status: 400 });
  }

  const { method, params, id } = body ?? {};

  if (body?.jsonrpc !== '2.0' || typeof method !== 'string') {
    return NextResponse.json({
      jsonrpc: '2.0',
      id: id ?? null,
      error: { code: -32600, message: 'Invalid JSON-RPC request.' }
    }, { status: 400 });
  }

  if (method === 'tools/list') {
    return NextResponse.json({
      jsonrpc: '2.0',
      id,
      result: { tools: listTools() }
    });
  }

  if (method === 'tools/call') {
    const name = params?.name;
    const available = listTools().some((tool) => tool.name === name);

    return NextResponse.json({
      jsonrpc: '2.0',
      id,
      error: {
        code: -32002,
        message: available
          ? 'This tool executes only in the user\'s active browser tab. Remote server execution is disabled; no credits were charged.'
          : `Unknown or unrented tool: ${String(name ?? '(missing name)')}.`
      }
    });
  }

  return NextResponse.json({
    jsonrpc: '2.0',
    id,
    error: { code: -32601, message: 'Method not found.' }
  });
}
