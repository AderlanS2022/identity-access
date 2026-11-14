import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../src/app.js';
import { hashSecret } from '../src/core/crypto.js';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl || new URL(databaseUrl).pathname.replace(/^\//, '') !== 'identity_access_dev') {
  throw new Error('DATABASE_URL must target the dedicated identity_access_dev database');
}

const prisma = new PrismaClient();
const config = { NODE_ENV: 'test' as const, PORT: 0, DATABASE_URL: databaseUrl, ADMIN_API_KEY: 'integration-test-admin-key-32-characters', MOCK_PROVIDER_ENABLED: true, ACCESS_GRANT_TTL_SECONDS: 60 };
const app = createApp({ prisma, config });

test('PostgreSQL integration: tenant isolation and mock result cannot authorize access', async () => {
  const tenantA = await prisma.tenant.create({ data: { name: 'Integration tenant A' } });
  const tenantB = await prisma.tenant.create({ data: { name: 'Integration tenant B' } });
  const clearA = 'integration-app-secret-a';
  const clearB = 'integration-app-secret-b';
  const appA = await prisma.application.create({ data: { tenantId: tenantA.id, name: 'Integration app A', environment: 'test', allowedOrigins: [], credentials: { create: { keyId: 'integration-key-a', secretHash: await hashSecret(clearA), scopes: ['policies:read', 'policies:write', 'verification:read', 'verification:write', 'access:decide', 'access:validate', 'access:revoke', 'media:restricted'] } } } });
  const appB = await prisma.application.create({ data: { tenantId: tenantB.id, name: 'Integration app B', environment: 'test', allowedOrigins: [], credentials: { create: { keyId: 'integration-key-b', secretHash: await hashSecret(clearB), scopes: ['policies:read', 'policies:write', 'verification:read', 'verification:write', 'access:decide', 'media:restricted'] } } } });

  try {
    const authA = `Bearer integration-key-a.${clearA}`;
    const authB = `Bearer integration-key-b.${clearB}`;
    const policyResponse = await request(app).post('/api/v1/policies').set('Authorization', authA).send({ name: 'Adult media', purpose: 'restricted-content', rules: { requiredScopes: ['media:restricted'], verificationKind: 'AGE', validitySeconds: 900 } });
    assert.equal(policyResponse.status, 201);
    const policyId = policyResponse.body.id as string;

    const sessionResponse = await request(app).post('/api/v1/verification-sessions').set('Authorization', authA).send({ policyId, externalRef: 'synthetic-integration-reference', purpose: 'restricted-content' });
    assert.equal(sessionResponse.status, 201);
    const sessionId = sessionResponse.body.id as string;

    const crossTenantPolicy = await request(app).get(`/api/v1/policies/${policyId}`).set('Authorization', authB);
    const crossTenantSession = await request(app).get(`/api/v1/verification-sessions/${sessionId}`).set('Authorization', authB);
    assert.equal(crossTenantPolicy.status, 404);
    assert.equal(crossTenantSession.status, 404);

    const mockResult = await request(app).post(`/api/v1/verification-sessions/${sessionId}/mock-result`).set('Authorization', authA).send({ outcome: 'verified' });
    assert.equal(mockResult.status, 200);
    assert.equal(mockResult.body.result.assuranceLevel, 'mock-only');
    const decision = await request(app).post('/api/v1/access-decisions').set('Authorization', authA).send({ sessionId, policyId, resourceRef: 'synthetic-resource-1', audience: 'integration-marketplace', purpose: 'restricted-content', requestedScopes: ['media:restricted'] });
    assert.equal(decision.status, 201);
    assert.equal(decision.body.outcome, 'deny');
    assert.equal(decision.body.grant, null);

    const unrelatedPolicyResponse = await request(app).post('/api/v1/policies').set('Authorization', authA).send({ name: 'Other restricted media', purpose: 'restricted-content', rules: { requiredScopes: ['media:restricted'], verificationKind: 'AGE', validitySeconds: 900 } });
    assert.equal(unrelatedPolicyResponse.status, 201);
    const contextMismatch = await request(app).post('/api/v1/access-decisions').set('Authorization', authA).send({ sessionId, policyId: unrelatedPolicyResponse.body.id, resourceRef: 'synthetic-resource-2', audience: 'integration-marketplace', purpose: 'restricted-content', requestedScopes: ['media:restricted'] });
    assert.equal(contextMismatch.status, 201);
    assert.equal(contextMismatch.body.outcome, 'deny');
    assert.equal(contextMismatch.body.reasonCode, 'verification_context_mismatch');

    await prisma.verificationSession.update({ where: { id: sessionId }, data: { status: 'VERIFIED' } });
    await prisma.verificationResult.update({ where: { sessionId }, data: { assuranceLevel: 'synthetic-provider-test', validUntil: new Date(Date.now() + 60_000) } });
    const allowed = await request(app).post('/api/v1/access-decisions').set('Authorization', authA).send({ sessionId, policyId, resourceRef: 'synthetic-resource-3', audience: 'integration-marketplace', purpose: 'restricted-content', requestedScopes: ['media:restricted'] });
    assert.equal(allowed.status, 201);
    assert.equal(allowed.body.outcome, 'allow');
    assert.ok(allowed.body.grant);

    const grantBody = { grant: allowed.body.grant, resourceRef: 'synthetic-resource-3', audience: 'integration-marketplace', requiredScopes: ['media:restricted'] };
    const validGrant = await request(app).post('/api/v1/access-grants/validate').set('Authorization', authA).send(grantBody);
    assert.equal(validGrant.status, 200);
    const wrongResource = await request(app).post('/api/v1/access-grants/validate').set('Authorization', authA).send({ ...grantBody, resourceRef: 'different-resource' });
    assert.equal(wrongResource.status, 403);
    const revokedGrant = await request(app).post(`/api/v1/access-grants/${allowed.body.id}/revoke`).set('Authorization', authA);
    assert.equal(revokedGrant.status, 204);
    const invalidAfterRevocation = await request(app).post('/api/v1/access-grants/validate').set('Authorization', authA).send(grantBody);
    assert.equal(invalidAfterRevocation.status, 403);

    const adminAuth = `Bearer ${config.ADMIN_API_KEY}`;
    const unauthenticatedRotation = await request(app).post(`/api/v1/applications/${appA.id}/credentials`).send({ scopes: ['policies:read'] });
    assert.equal(unauthenticatedRotation.status, 401);
    const overScopedCredential = await request(app).post(`/api/v1/applications/${appA.id}/credentials`).set('Authorization', adminAuth).send({ scopes: ['admin:all'] });
    assert.equal(overScopedCredential.status, 403);
    const rotatedCredential = await request(app).post(`/api/v1/applications/${appA.id}/credentials`).set('Authorization', adminAuth).send({ scopes: ['policies:read'] });
    assert.equal(rotatedCredential.status, 201);
    assert.equal(typeof rotatedCredential.body.secret, 'string');
    assert.equal(rotatedCredential.body.scopes.includes('admin:all'), false);
    const rotatedAuth = `Bearer ${rotatedCredential.body.secret}`;
    const worksBeforeRevoke = await request(app).get(`/api/v1/policies/${policyId}`).set('Authorization', rotatedAuth);
    assert.equal(worksBeforeRevoke.status, 200);
    const credentialRevoked = await request(app).post(`/api/v1/applications/${appA.id}/credentials/${rotatedCredential.body.id}/revoke`).set('Authorization', adminAuth);
    assert.equal(credentialRevoked.status, 204);
    const failsAfterRevoke = await request(app).get(`/api/v1/policies/${policyId}`).set('Authorization', rotatedAuth);
    assert.equal(failsAfterRevoke.status, 401);

    const unauthorized = await request(app).get(`/api/v1/policies/${policyId}`).set('Authorization', 'Bearer invalid.invalid');
    assert.equal(unauthorized.status, 401);
    assert.equal(appA.tenantId, tenantA.id);
    assert.equal(appB.tenantId, tenantB.id);
  } finally {
    await prisma.tenant.deleteMany({ where: { id: { in: [tenantA.id, tenantB.id] } } });
  }
});

test('integration cleanup confirmed through database client', async () => {
  const rows = await prisma.tenant.findMany({ where: { name: { startsWith: 'Integration tenant ' } }, select: { id: true } });
  assert.equal(rows.length, 0);
});

test.after(async () => { await prisma.$disconnect(); });
