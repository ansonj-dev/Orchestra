// POST /api/evals
// This endpoint performs limited static checks only. It does not execute untrusted
// JavaScript, provide a sandbox, measure memory, or certify runtime determinism.

import { NextResponse } from 'next/server';
import { EvalRunResult } from '@/types';

export async function POST(request: Request) {
  const startedAt = Date.now();

  try {
    const body = await request.json();
    const { tool_name, input_schema, javascript_code } = body ?? {};

    if (typeof tool_name !== 'string' || !tool_name.trim()) {
      return NextResponse.json({ success: false, error: "Missing required field 'tool_name'." }, { status: 400 });
    }

    const testLogs: EvalRunResult['testLogs'] = [];
    let passedCount = 0;

    let schemaPassed = false;
    let schemaDetails = '';
    try {
      const schema = typeof input_schema === 'string' ? JSON.parse(input_schema) : input_schema;
      schemaPassed = !!schema &&
        typeof schema === 'object' &&
        !Array.isArray(schema) &&
        schema.type === 'object' &&
        !!schema.properties &&
        typeof schema.properties === 'object' &&
        !Array.isArray(schema.properties);
      schemaDetails = schemaPassed
        ? 'Basic object-schema structure is valid. Full JSON Schema validation was not performed.'
        : 'Expected an object schema with an object-valued properties field.';
    } catch {
      schemaDetails = 'Input schema is missing or is not valid JSON.';
    }

    testLogs.push({
      caseId: 'STATIC-01',
      caseName: 'Basic input schema structure',
      passed: schemaPassed,
      durationMs: 0,
      details: schemaDetails
    });
    if (schemaPassed) passedCount++;

    const code = typeof javascript_code === 'string' ? javascript_code : '';
    const unsafePatterns = [
      { pattern: /\beval\s*\(/i, label: 'eval()' },
      { pattern: /\bnew\s+Function\b|\bFunction\s*\(/i, label: 'dynamic Function constructor' },
      { pattern: /\bdocument\.write\s*\(/i, label: 'document.write()' },
      { pattern: /\.innerHTML/i, label: 'innerHTML usage' }
    ];
    const detected = unsafePatterns.filter(({ pattern }) => pattern.test(code)).map(({ label }) => label);
    const codePassed = detected.length === 0;
    testLogs.push({
      caseId: 'STATIC-02',
      caseName: 'Known dangerous DOM and dynamic-code patterns',
      passed: codePassed,
      durationMs: 0,
      details: codePassed
        ? 'No listed patterns were found by this basic text scan. This is not proof of safety.'
        : `Potentially unsafe patterns detected: ${detected.join(', ')}.`
    });
    if (codePassed) passedCount++;

    const totalTests = testLogs.length;
    const overallScore = Number(((passedCount / totalTests) * 100).toFixed(1));

    const result: EvalRunResult = {
      toolName: tool_name,
      overallScore,
      testsPassed: passedCount,
      totalTests,
      latencyMs: Date.now() - startedAt,
      tokenEfficiencyScore: 0,
      resilienceScore: 0,
      // Static checks alone must never confer runtime certification.
      verdict: 'REQUIRES_REFINEMENT',
      testLogs
    };

    return NextResponse.json({
      success: true,
      eval: result,
      scope: 'static-analysis-only',
      certificationGranted: false,
      limitations: [
        'Tool code was not executed.',
        'No process or browser sandbox was used.',
        'Timeout, memory, determinism, and side-effect behavior were not tested.',
        'A passing static scan does not establish that a tool is safe.'
      ]
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid evaluation request.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
