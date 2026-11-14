import { createHash } from 'node:crypto';

export type AccessInput = {
  session?: { status: string; expiresAt: Date; result?: { outcome: string; assuranceLevel: string; validUntil: Date; revokedAt: Date | null } | null } | null;
  scopes: string[];
  requiredScopes: string[];
  now: Date;
};

export function evaluateAccess(input: AccessInput): { outcome: 'ALLOW' | 'DENY' | 'VERIFICATION_REQUIRED'; reasonCode: string } {
  if (!input.session) return { outcome: 'VERIFICATION_REQUIRED', reasonCode: 'verification_required' };
  if (input.session.status !== 'VERIFIED' || input.session.expiresAt <= input.now) return { outcome: 'DENY', reasonCode: 'verification_not_valid' };
  if (!input.session.result || input.session.result.outcome !== 'verified' || input.session.result.assuranceLevel === 'mock-only' || input.session.result.validUntil <= input.now || input.session.result.revokedAt) return { outcome: 'DENY', reasonCode: 'evidence_not_valid' };
  if (!input.requiredScopes.every(scope => input.scopes.includes(scope))) return { outcome: 'DENY', reasonCode: 'scope_mismatch' };
  return { outcome: 'ALLOW', reasonCode: 'policy_satisfied' };
}

export const digestResource = (resourceRef: string) => createHash('sha256').update(resourceRef).digest('hex');
