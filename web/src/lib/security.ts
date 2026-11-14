// Server-side tool integrity verification.
// A tool is trusted only when its expected digest is supplied by trusted deployment
// configuration. The in-memory "first mint" registry from the demo was not durable
// and allowed arbitrary tools to trust themselves.

import crypto from 'crypto';
import { WebMCPTool } from '../types';

export interface IntegrityVerificationResult {
  toolName: string;
  isVerified: boolean;
  computedHash: string;
  expectedHash?: string;
  tamperDetected: boolean;
  quarantineTriggered: boolean;
  securityVerdict: 'SECURE_CERTIFIED' | 'TAMPER_ALERT_QUARANTINED' | 'UNREGISTERED_UNTRUSTED';
  details: string;
}

function readTrustedHashes(): Record<string, string> {
  const raw = process.env.ORCHESTRA_CERTIFIED_TOOL_HASHES;
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>)
        .filter((entry): entry is [string, string] =>
          typeof entry[0] === 'string' &&
          typeof entry[1] === 'string' &&
          /^sha256_[a-f0-9]{64}$/.test(entry[1])
        )
    );
  } catch {
    return {};
  }
}

export class OrchestraSecurityEngine {
  static generateToolHash(tool: Partial<WebMCPTool>): string {
    const canonicalString = JSON.stringify({
      tool_name: tool.tool_name,
      schema: tool.input_schema,
      code: (tool.javascript_code || '').trim()
    });
    const hash = crypto.createHash('sha256').update(canonicalString).digest('hex');
    return `sha256_${hash}`;
  }

  static verifyIntegrity(tool: WebMCPTool): IntegrityVerificationResult {
    const computedHash = this.generateToolHash(tool);
    const expectedHash = readTrustedHashes()[tool.tool_name];

    if (!expectedHash) {
      return {
        toolName: tool.tool_name,
        isVerified: false,
        computedHash,
        tamperDetected: false,
        quarantineTriggered: true,
        securityVerdict: 'UNREGISTERED_UNTRUSTED',
        details: 'No trusted deployment fingerprint is configured. Tool execution must remain blocked until an operator certifies this exact tool definition.'
      };
    }

    const isMatch = crypto.timingSafeEqual(
      Buffer.from(computedHash, 'utf8'),
      Buffer.from(expectedHash, 'utf8')
    );

    return {
      toolName: tool.tool_name,
      isVerified: isMatch,
      computedHash,
      expectedHash,
      tamperDetected: !isMatch,
      quarantineTriggered: !isMatch,
      securityVerdict: isMatch ? 'SECURE_CERTIFIED' : 'TAMPER_ALERT_QUARANTINED',
      details: isMatch
        ? 'Tool definition matches the trusted deployment fingerprint.'
        : 'Tool definition does not match its trusted fingerprint and has been quarantined.'
    };
  }

  static simulateTamperAttack(toolName: string): IntegrityVerificationResult {
    const expectedHash = readTrustedHashes()[toolName];
    return {
      toolName,
      isVerified: false,
      computedHash: 'sha256_' + '0'.repeat(64),
      expectedHash,
      tamperDetected: true,
      quarantineTriggered: true,
      securityVerdict: 'TAMPER_ALERT_QUARANTINED',
      details: 'Simulated tamper event: tool execution is blocked.'
    };
  }
}
