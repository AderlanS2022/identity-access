import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import type { Config } from '../src/config/env.js';
import { hashSecret } from '../src/core/crypto.js';

const config: Config = { NODE_ENV: 'test', PORT: 0, DATABASE_URL: 'postgresql://test:test@localhost:5432/test', ADMIN_API_KEY: 'test-admin-key-that-is-long-enough-123', MOCK_PROVIDER_ENABLED: true, ACCESS_GRANT_TTL_SECONDS: 60 };
const inactivePrisma = { applicationCredential: { findUnique: async () => null } } as never;
const app = createApp({ prisma: inactivePrisma, config });

test('versioned API rejects missing/invalid application credentials without disclosing data', async () => {
  const missing = await request(app).get('/api/v1/policies/00000000-0000-4000-8000-000000000001');
  const invalid = await request(app).get('/api/v1/policies/00000000-0000-4000-8000-000000000001').set('Authorization', 'Bearer fake.secret');
  assert.equal(missing.status, 401);
  assert.equal(invalid.status, 401);
  assert.deepEqual(Object.keys(invalid.body).sort(), ['error']);
  assert.equal(invalid.body.error.code, 'unauthorized');
});

test('mock verification endpoint is hidden in production', async () => {
  const production = createApp({ prisma: inactivePrisma, config: { ...config, NODE_ENV: 'production' } });
  const response = await request(production).post('/api/v1/verification-sessions/00000000-0000-4000-8000-000000000001/mock-result').send({ outcome: 'verified' });
  assert.equal(response.status, 401);
});

test('health endpoint exposes no configuration', async () => {
  const response = await request(app).get('/health');
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { status: 'ok' });
});

test('policy reads are constrained to the authenticated tenant and application', async () => {
  const tenantId = '10000000-0000-4000-8000-000000000001';
  const applicationId = '20000000-0000-4000-8000-000000000002';
  const policyId = '30000000-0000-4000-8000-000000000003';
  const clearSecret = 'test-application-secret';
  let capturedWhere: Record<string, unknown> | undefined;
  const scopedPrisma = {
    applicationCredential: { findUnique: async () => ({ id: 'credential-a', keyId: 'key-a', secretHash: await hashSecret(clearSecret), scopes: ['policies:read'], revokedAt: null, expiresAt: null, applicationId, application: { tenantId, status: 'ACTIVE', tenant: { status: 'ACTIVE' } } }) },
    policy: { findFirst: async ({ where }: { where: Record<string, unknown> }) => { capturedWhere = where; return null; } },
  } as never;
  const scopedApp = createApp({ prisma: scopedPrisma, config });
  const response = await request(scopedApp).get(`/api/v1/policies/${policyId}`).set('Authorization', `Bearer key-a.${clearSecret}`);
  assert.equal(response.status, 404);
  assert.deepEqual(capturedWhere, { id: policyId, tenantId, applicationId, status: 'ACTIVE' });
});
