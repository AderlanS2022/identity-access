import type { SessionStatus } from '@prisma/client';
import { HttpError } from '../core/errors.js';

export class LocalMockProvider {
  constructor(private readonly enabled: boolean, private readonly nodeEnv: string) {}

  assertEnabled() {
    if (this.nodeEnv === 'production' || !['development', 'test'].includes(this.nodeEnv) || !this.enabled) {
      throw new HttpError(404, 'not_found');
    }
  }

  result(outcome: 'verified' | 'not_verified' | 'inconclusive'): { status: SessionStatus; outcome: string; assuranceLevel: string; reasonCodes: string[]; validUntil: Date } {
    this.assertEnabled();
    const status = outcome === 'verified' ? 'VERIFIED' : outcome === 'not_verified' ? 'NOT_VERIFIED' : 'INCONCLUSIVE';
    return { status, outcome, assuranceLevel: 'mock-only', reasonCodes: ['local_mock'], validUntil: new Date(Date.now() + 5 * 60_000) };
  }
}
