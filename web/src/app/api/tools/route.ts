// GET & POST /api/tools - Marketplace Catalog & Registration

import { NextResponse } from 'next/server';
import { OrchestraLedger } from '@/lib/ledger';
import { WebMCPTool } from '@/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search')?.toLowerCase();

    let tools = OrchestraLedger.getAllTools();

    if (category && category !== 'All') {
      tools = tools.filter(t => t.category === category);
    }

    if (search) {
      tools = tools.filter(t => 
        t.title.toLowerCase().includes(search) ||
        t.tool_name.toLowerCase().includes(search) ||
        t.description.toLowerCase().includes(search)
      );
    }

    const rentedNames = new Set(OrchestraLedger.getRentedTools().map(t => t.tool_name));
    const toolsWithRentStatus = tools.map(t => ({
      ...t,
      isRented: rentedNames.has(t.tool_name)
    }));

    return NextResponse.json({
      success: true,
      count: toolsWithRentStatus.length,
      tools: toolsWithRentStatus
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, toolName, newTool } = body;

    if (action === 'toggle-rental' && toolName) {
      const result = OrchestraLedger.toggleToolRental(toolName);
      return NextResponse.json({
        success: true,
        toolName,
        isRented: result.rented,
        activeTools: result.activeTools
      });
    }

    if (action === 'register-tool' && newTool) {
      if (!newTool.title || !newTool.tool_name || !newTool.description) {
        return NextResponse.json({ success: false, error: "Missing required fields." }, { status: 400 });
      }

      const registered: WebMCPTool = {
        id: "tool_custom_" + Date.now(),
        title: newTool.title,
        tool_name: newTool.tool_name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'),
        description: newTool.description,
        category: newTool.category || 'Productivity',
        cost: parseFloat(newTool.cost) || 0.10,
        reliability_score: parseFloat(newTool.reliability_score) || 98.0,
        author: newTool.author || 'Independent Developer',
        is_verified: true,
        active_rentals_count: 1,
        input_schema: typeof newTool.input_schema === 'string' ? JSON.parse(newTool.input_schema) : newTool.input_schema || { type: "object", properties: {} },
        javascript_code: newTool.javascript_code || '// Executable WebMCP DOM function'
      };

      OrchestraLedger.addCustomTool(registered);

      return NextResponse.json({
        success: true,
        message: `WebMCP tool '${registered.tool_name}' published and certified successfully.`,
        tool: registered
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
