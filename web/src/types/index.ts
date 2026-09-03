// Orchestra.WebMCP TypeScript Definitions

export type ToolCategory = 'E-Commerce' | 'DevOps & Cloud' | 'Productivity' | 'Security & Auth' | 'Data Extraction' | 'Web3 & Onchain';

export interface WebMCPTool {
  id: string;
  title: string;
  tool_name: string; // e.g. "shopify_checkout_fast"
  description: string;
  category: ToolCategory;
  cost: number; // Cost in credits (CR)
  reliability_score: number; // 0 to 100% computed from Evals
  author: string;
  author_id?: string;
  input_schema: {
    type: string;
    properties: Record<string, {
      type: string;
      description?: string;
      enum?: string[];
      default?: any;
    }>;
    required?: string[];
  };
  javascript_code?: string;
  is_verified?: boolean;
  active_rentals_count?: number;
  created_at?: string;
}

export interface UserWallet {
  balance: number; // Credits (CR)
  userId: string;
  email: string;
  hardSpendCap: number; // Circuit breaker cap per tool/session
  isCircuitBreakerActive: boolean;
}

export interface ExecutionTransaction {
  id: string;
  timestamp: string;
  toolName: string;
  toolTitle?: string;
  cost: number;
  remainingBalance: number;
  caller: 'browser-webmcp' | 'cursor' | 'claude-code' | 'chatgpt-desktop' | 'simulator';
  status: 'SUCCESS' | 'CIRCUIT_BREAKER_DEPLETED' | 'INSUFFICIENT_FUNDS' | 'REJECTED';
  metadata?: Record<string, any>;
  resultSummary?: string;
}

export interface SyntheticEvalCase {
  id: string;
  name: string;
  description: string;
  input: Record<string, any>;
  expectedStatus: 'SUCCESS' | 'ERROR' | 'TIMEOUT';
  passCriteria: string;
}

export interface EvalRunResult {
  toolName: string;
  overallScore: number; // 0 - 100%
  testsPassed: number;
  totalTests: number;
  latencyMs: number;
  tokenEfficiencyScore: number;
  resilienceScore: number;
  verdict: 'CERTIFIED_DETERMINISTIC' | 'REQUIRES_REFINEMENT' | 'FAILED';
  testLogs: {
    caseId: string;
    caseName: string;
    passed: boolean;
    durationMs: number;
    details: string;
  }[];
}
