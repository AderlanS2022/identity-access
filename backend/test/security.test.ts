import test from 'node:test';
import assert from 'node:assert/strict';
import { hashSecret, safeEqualHex, sha256, verifySecret } from '../src/core/crypto.js';
import { evaluateAccess } from '../src/core/policy.js';
import { LocalMockProvider } from '../src/plugins/mock-provider.js';
import { HttpError } from '../src/core/errors.js';

test('application secrets are salted and verified without storing plaintext', async () => {
  const hash = await hashSecret('test-secret-only');
  assert.notEqual(hash, 'test-secret-only');
  assert.equal(await verifySecret('test-secret-only', hash), true);
  assert.equal(await verifySecret('wrong-secret', hash), false);
});

test('grant digest comparison is constant-time and rejects malformed values', () => {
  const digest = sha256('grant-test');
  assert.equal(safeEqualHex(digest, digest), true);
  assert.equal(safeEqualHex(digest, sha256('other')), false);
  assert.equal(safeEqualHex('short', digest), false);
});

test('access requires valid evidence and all requested scopes', () => {
  const now = new Date();
  const session = { status: 'VERIFIED', expiresAt: new Date(now.getTime() + 60_000), result: { outcome: 'verified', assuranceLevel: 'provider-verified', validUntil: new Date(now.getTime() + 60_000), revokedAt: null } };
  assert.equal(evaluateAccess({ session, scopes: ['media:read'], requiredScopes: ['media:read'], now }).outcome, 'ALLOW');
  assert.equal(evaluateAccess({ session, scopes: ['media:read'], requiredScopes: ['media:write'], now }).reasonCode, 'scope_mismatch');
  assert.equal(evaluateAccess({ session: null, scopes: [], requiredScopes: ['media:read'], now }).outcome, 'VERIFICATION_REQUIRED');
  assert.equal(evaluateAccess({ session: { ...session, expiresAt: now }, scopes: ['media:read'], requiredScopes: ['media:read'], now }).outcome, 'DENY');
  assert.equal(evaluateAccess({ session: { ...session, result: { ...session.result, revokedAt: now } }, scopes: ['media:read'], requiredScopes: ['media:read'], now }).reasonCode, 'evidence_not_valid');
  assert.equal(evaluateAccess({ session: { ...session, result: { ...session.result, assuranceLevel: 'mock-only' } }, scopes: ['media:read'], requiredScopes: ['media:read'], now }).reasonCode, 'evidence_not_valid');
});

test('mock provider is denied in production even if the flag is enabled', () => {
  assert.throws(() => new LocalMockProvider(true, 'production').result('verified'), (error: unknown) => error instanceof HttpError && error.status === 404);
  assert.throws(() => new LocalMockProvider(false, 'development').result('verified'), (error: unknown) => error instanceof HttpError && error.status === 404);
  assert.equal(new LocalMockProvider(true, 'test').result('inconclusive').status, 'INCONCLUSIVE');
});
