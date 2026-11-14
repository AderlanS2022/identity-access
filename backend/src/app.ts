import express, { type NextFunction, type Request, type Response } from 'express';
import { timingSafeEqual } from 'node:crypto';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import type { PrismaClient } from '@prisma/client';
import type { Config } from './config/env.js';
import { HttpError } from './core/errors.js';
import { hashSecret, randomToken, safeEqualHex, sha256, verifySecret } from './core/crypto.js';
import { digestResource, evaluateAccess } from './core/policy.js';
import { LocalMockProvider } from './plugins/mock-provider.js';

type Dependencies = { prisma: PrismaClient; config: Config };
type Principal = { tenantId: string; applicationId: string; credentialId: string; scopes: string[] };
type AuthedRequest = Request & { principal: Principal };
const idSchema = z.string().uuid();
const scopeSchema = z.array(z.string().min(1).max(80)).min(1).max(16);

async function safeAudit(db: PrismaClient, fields: { tenantId?: string; applicationId?: string; actorType: string; actorRef?: string; action: string; entityRef?: string; outcome: string; correlationId: string; metadata?: object }) {
  await db.auditEvent.create({ data: { ...fields, metadata: fields.metadata } });
}

export function createApp({ prisma, config }: Dependencies) {
  const app = express();
  const mock = new LocalMockProvider(config.MOCK_PROVIDER_ENABLED, config.NODE_ENV);
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(express.json({ limit: '32kb', strict: true }));
  app.use(rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: 'draft-8', legacyHeaders: false }));
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  const adminAuth = (req: Request, _res: Response, next: NextFunction) => {
    const supplied = req.header('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
    const a = Buffer.from(supplied); const b = Buffer.from(config.ADMIN_API_KEY);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return next(new HttpError(401, 'unauthorized'));
    next();
  };

  app.post('/api/v1/tenants', adminAuth, async (req, res) => {
    const body = z.object({ name: z.string().trim().min(2).max(160) }).strict().parse(req.body);
    const tenant = await prisma.tenant.create({ data: { name: body.name } });
    await safeAudit(prisma, { actorType: 'admin', action: 'tenant.create', entityRef: tenant.id, outcome: 'success', correlationId: req.header('x-correlation-id') ?? randomToken(12) });
    res.status(201).json({ id: tenant.id, name: tenant.name, status: tenant.status });
  });

  app.post('/api/v1/applications', adminAuth, async (req, res) => {
    const body = z.object({ tenantId: idSchema, name: z.string().trim().min(2).max(160), environment: z.enum(['development', 'staging', 'production']), allowedOrigins: z.array(z.string().url()).max(20).default([]), scopes: scopeSchema }).strict().parse(req.body);
    const tenant = await prisma.tenant.findUnique({ where: { id: body.tenantId } });
    if (!tenant || tenant.status !== 'ACTIVE') throw new HttpError(404, 'not_found');
    const secret = randomToken(32); const keyId = randomToken(12);
    const appRecord = await prisma.application.create({ data: { tenantId: tenant.id, name: body.name, environment: body.environment, allowedOrigins: body.allowedOrigins, credentials: { create: { keyId, secretHash: await hashSecret(secret), scopes: body.scopes } } }, include: { credentials: true } });
    await safeAudit(prisma, { tenantId: tenant.id, applicationId: appRecord.id, actorType: 'admin', action: 'application.create', entityRef: appRecord.id, outcome: 'success', correlationId: req.header('x-correlation-id') ?? randomToken(12) });
    res.status(201).json({ id: appRecord.id, tenantId: tenant.id, name: appRecord.name, environment: appRecord.environment, allowedOrigins: appRecord.allowedOrigins, credential: { keyId, secret: `${keyId}.${secret}` } });
  });

  app.post('/api/v1/applications/:id/credentials', adminAuth, async (req, res) => {
    const applicationId = idSchema.parse(req.params.id);
    const body = z.object({ scopes: scopeSchema, expiresAt: z.string().datetime({ offset: true }).optional() }).strict().parse(req.body);
    const appRecord = await prisma.application.findUnique({ where: { id: applicationId }, select: { id: true, tenantId: true, status: true, credentials: { select: { scopes: true } } } });
    if (!appRecord || appRecord.status !== 'ACTIVE') throw new HttpError(404, 'not_found');
    const allowedScopes = new Set(appRecord.credentials.flatMap(credential => credential.scopes));
    if (!body.scopes.every(scope => allowedScopes.has(scope))) throw new HttpError(403, 'forbidden');
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
    if (expiresAt && expiresAt <= new Date()) throw new HttpError(400, 'invalid_request');
    const secret = randomToken(32); const keyId = randomToken(12);
    const credential = await prisma.$transaction(async tx => {
      const created = await tx.applicationCredential.create({ data: { applicationId, keyId, secretHash: await hashSecret(secret), scopes: body.scopes, expiresAt } });
      await tx.auditEvent.create({ data: { tenantId: appRecord.tenantId, applicationId, actorType: 'admin', action: 'application.credential.create', entityRef: created.id, outcome: 'success', correlationId: req.header('x-correlation-id') ?? randomToken(12) } });
      return created;
    });
    res.status(201).json({ id: credential.id, applicationId, keyId, secret: `${keyId}.${secret}`, scopes: credential.scopes, expiresAt: credential.expiresAt });
  });

  app.post('/api/v1/applications/:applicationId/credentials/:credentialId/revoke', adminAuth, async (req, res) => {
    const applicationId = idSchema.parse(req.params.applicationId);
    const credentialId = idSchema.parse(req.params.credentialId);
    const appRecord = await prisma.application.findUnique({ where: { id: applicationId }, select: { id: true, tenantId: true } });
    const credential = await prisma.applicationCredential.findFirst({ where: { id: credentialId, applicationId, revokedAt: null }, select: { id: true } });
    if (!appRecord || !credential) throw new HttpError(404, 'not_found');
    await prisma.$transaction(async tx => {
      await tx.applicationCredential.update({ where: { id: credential.id }, data: { revokedAt: new Date() } });
      await tx.auditEvent.create({ data: { tenantId: appRecord.tenantId, applicationId, actorType: 'admin', action: 'application.credential.revoke', entityRef: credential.id, outcome: 'success', correlationId: req.header('x-correlation-id') ?? randomToken(12) } });
    });
    res.status(204).end();
  });

  const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const token = req.header('authorization')?.match(/^Bearer\s+([^.]+)\.(.+)$/i);
      if (!token?.[1] || !token[2]) throw new HttpError(401, 'unauthorized');
      const credential = await prisma.applicationCredential.findUnique({ where: { keyId: token[1] }, include: { application: { include: { tenant: true } } } });
      if (!credential || credential.revokedAt || (credential.expiresAt && credential.expiresAt <= new Date()) || credential.application.status !== 'ACTIVE' || credential.application.tenant.status !== 'ACTIVE' || !(await verifySecret(token[2], credential.secretHash))) throw new HttpError(401, 'unauthorized');
      (req as AuthedRequest).principal = { tenantId: credential.application.tenantId, applicationId: credential.applicationId, credentialId: credential.id, scopes: credential.scopes };
      next();
    } catch (error) { next(error); }
  };
  const requireScope = (scope: string) => (req: Request, _res: Response, next: NextFunction) => (req as AuthedRequest).principal.scopes.includes(scope) ? next() : next(new HttpError(403, 'forbidden'));
  const api = express.Router();
  api.use(authenticate);

  api.post('/policies', requireScope('policies:write'), async (req, res) => {
    const principal = (req as AuthedRequest).principal;
    const body = z.object({ name: z.string().trim().min(2).max(120), purpose: z.string().trim().min(2).max(120), rules: z.object({ requiredScopes: scopeSchema, verificationKind: z.enum(['AGE', 'IDENTITY']).default('AGE'), validitySeconds: z.number().int().min(60).max(86400).default(900) }).strict() }).strict().parse(req.body);
    const policy = await prisma.policy.create({ data: { tenantId: principal.tenantId, applicationId: principal.applicationId, name: body.name, purpose: body.purpose, versions: { create: { version: 1, rules: body.rules, rulesDigest: sha256(JSON.stringify(body.rules)) } } }, include: { versions: true } });
    await safeAudit(prisma, { tenantId: principal.tenantId, applicationId: principal.applicationId, actorType: 'application', actorRef: principal.credentialId, action: 'policy.create', entityRef: policy.id, outcome: 'success', correlationId: randomToken(12) });
    res.status(201).json({ id: policy.id, purpose: policy.purpose, version: 1 });
  });

  api.get('/policies/:id', requireScope('policies:read'), async (req, res) => {
    const principal = (req as AuthedRequest).principal;
    const policy = await prisma.policy.findFirst({ where: { id: idSchema.parse(req.params.id), tenantId: principal.tenantId, applicationId: principal.applicationId, status: 'ACTIVE' }, include: { versions: { orderBy: { version: 'desc' }, take: 1 } } });
    if (!policy) throw new HttpError(404, 'not_found');
    res.json({ id: policy.id, name: policy.name, purpose: policy.purpose, version: policy.versions[0]?.version });
  });

  api.post('/verification-sessions', requireScope('verification:write'), async (req, res) => {
    const principal = (req as AuthedRequest).principal;
    const body = z.object({ policyId: idSchema, externalRef: z.string().min(8).max(200), purpose: z.string().trim().min(2).max(120) }).strict().parse(req.body);
    const policy = await prisma.policy.findFirst({ where: { id: body.policyId, tenantId: principal.tenantId, applicationId: principal.applicationId, status: 'ACTIVE' }, include: { versions: { orderBy: { version: 'desc' }, take: 1 } } });
    const version = policy?.versions[0];
    if (!policy || !version || policy.purpose !== body.purpose) throw new HttpError(404, 'not_found');
    const session = await prisma.verificationSession.create({ data: { tenantId: principal.tenantId, applicationId: principal.applicationId, policyVersionId: version.id, externalRefHash: sha256(body.externalRef), purpose: body.purpose, kind: (version.rules as { verificationKind?: 'AGE'|'IDENTITY' }).verificationKind ?? 'AGE', expiresAt: new Date(Date.now() + 10 * 60_000), status: 'PENDING_USER' } });
    await safeAudit(prisma, { tenantId: principal.tenantId, applicationId: principal.applicationId, actorType: 'application', actorRef: principal.credentialId, action: 'verification.create', entityRef: session.id, outcome: 'success', correlationId: randomToken(12) });
    res.status(201).json({ id: session.id, status: session.status, expiresAt: session.expiresAt });
  });

  api.get('/verification-sessions/:id', requireScope('verification:read'), async (req, res) => {
    const principal = (req as AuthedRequest).principal;
    const session = await prisma.verificationSession.findFirst({ where: { id: idSchema.parse(req.params.id), tenantId: principal.tenantId, applicationId: principal.applicationId }, include: { result: true } });
    if (!session) throw new HttpError(404, 'not_found');
    res.json({ id: session.id, status: session.status, expiresAt: session.expiresAt, result: session.result ? { outcome: session.result.outcome, assuranceLevel: session.result.assuranceLevel, validUntil: session.result.validUntil } : null });
  });

  api.post('/verification-sessions/:id/cancel', requireScope('verification:write'), async (req, res) => {
    const principal = (req as AuthedRequest).principal;
    const session = await prisma.verificationSession.findFirst({ where: { id: idSchema.parse(req.params.id), tenantId: principal.tenantId, applicationId: principal.applicationId } });
    if (!session || ['VERIFIED', 'NOT_VERIFIED', 'EXPIRED', 'CANCELLED', 'REVOKED'].includes(session.status)) throw new HttpError(404, 'not_found');
    const updated = await prisma.verificationSession.update({ where: { id: session.id }, data: { status: 'CANCELLED' } });
    await safeAudit(prisma, { tenantId: principal.tenantId, applicationId: principal.applicationId, actorType: 'application', actorRef: principal.credentialId, action: 'verification.cancel', entityRef: session.id, outcome: 'success', correlationId: randomToken(12) });
    res.json({ id: updated.id, status: updated.status });
  });

  api.post('/verification-sessions/:id/mock-result', requireScope('verification:write'), async (req, res) => {
    mock.assertEnabled();
    const principal = (req as AuthedRequest).principal;
    const body = z.object({ outcome: z.enum(['verified', 'not_verified', 'inconclusive']) }).strict().parse(req.body);
    const session = await prisma.verificationSession.findFirst({ where: { id: idSchema.parse(req.params.id), tenantId: principal.tenantId, applicationId: principal.applicationId } });
    if (!session || session.expiresAt <= new Date()) throw new HttpError(404, 'not_found');
    const result = mock.result(body.outcome);
    const updated = await prisma.$transaction(async tx => {
      await tx.verificationSession.update({ where: { id: session.id }, data: { status: result.status } });
      return tx.verificationResult.upsert({ where: { sessionId: session.id }, create: { sessionId: session.id, outcome: result.outcome, assuranceLevel: result.assuranceLevel, reasonCodes: result.reasonCodes, validUntil: result.validUntil }, update: { outcome: result.outcome, assuranceLevel: result.assuranceLevel, reasonCodes: result.reasonCodes, validUntil: result.validUntil, revokedAt: null } });
    });
    await safeAudit(prisma, { tenantId: principal.tenantId, applicationId: principal.applicationId, actorType: 'local_mock', action: 'verification.mock_result', entityRef: session.id, outcome: result.outcome, correlationId: randomToken(12) });
    res.json({ status: result.status, result: { outcome: updated.outcome, assuranceLevel: updated.assuranceLevel, validUntil: updated.validUntil } });
  });

  api.post('/access-decisions', requireScope('access:decide'), async (req, res) => {
    const principal = (req as AuthedRequest).principal;
    const body = z.object({ sessionId: idSchema.optional(), policyId: idSchema, resourceRef: z.string().min(1).max(300), audience: z.string().min(1).max(200), purpose: z.string().min(2).max(120), requestedScopes: scopeSchema }).strict().parse(req.body);
    if (!body.requestedScopes.every(scope => principal.scopes.includes(scope))) throw new HttpError(403, 'forbidden');
    const policy = await prisma.policy.findFirst({ where: { id: body.policyId, tenantId: principal.tenantId, applicationId: principal.applicationId, status: 'ACTIVE' }, include: { versions: { orderBy: { version: 'desc' }, take: 1 } } });
    const version = policy?.versions[0];
    if (!policy || !version || policy.purpose !== body.purpose) throw new HttpError(404, 'not_found');
    const session = body.sessionId ? await prisma.verificationSession.findFirst({ where: { id: body.sessionId, tenantId: principal.tenantId, applicationId: principal.applicationId }, include: { result: true, policyVersion: { select: { policyId: true } } } }) : null;
    const rules = version.rules as { requiredScopes: string[]; validitySeconds: number; verificationKind?: 'AGE' | 'IDENTITY' };
    const sessionMatchesPolicy = !!session && session.policyVersionId === version.id && session.policyVersion.policyId === policy.id && session.purpose === body.purpose && session.kind === (rules.verificationKind ?? 'AGE');
    const evaluated = session && !sessionMatchesPolicy
      ? { outcome: 'DENY' as const, reasonCode: 'verification_context_mismatch' }
      : evaluateAccess({ session, scopes: body.requestedScopes, requiredScopes: rules.requiredScopes, now: new Date() });
    const allowedScopes = evaluated.outcome === 'ALLOW' ? body.requestedScopes : [];
    const grantSecret = evaluated.outcome === 'ALLOW' ? randomToken(32) : null;
    const ttl = Math.min(config.ACCESS_GRANT_TTL_SECONDS, rules.validitySeconds);
    const decision = await prisma.accessDecision.create({ data: { tenantId: principal.tenantId, applicationId: principal.applicationId, sessionId: session?.id, policyVersionId: version.id, resourceRefHash: digestResource(body.resourceRef), purpose: body.purpose, audience: body.audience, scope: allowedScopes, outcome: evaluated.outcome, reasonCode: evaluated.reasonCode, grantHash: grantSecret ? sha256(grantSecret) : null, expiresAt: evaluated.outcome === 'ALLOW' ? new Date(Date.now() + ttl * 1000) : null } });
    await safeAudit(prisma, { tenantId: principal.tenantId, applicationId: principal.applicationId, actorType: 'application', actorRef: principal.credentialId, action: 'access.decision', entityRef: decision.id, outcome: evaluated.outcome, correlationId: randomToken(12) });
    res.status(201).json({ id: decision.id, outcome: evaluated.outcome.toLowerCase(), reasonCode: evaluated.reasonCode, expiresAt: decision.expiresAt, grant: grantSecret ? `${decision.id}.${grantSecret}` : null });
  });

  api.post('/access-grants/validate', requireScope('access:validate'), async (req, res) => {
    const principal = (req as AuthedRequest).principal;
    const body = z.object({ grant: z.string().min(20), resourceRef: z.string().min(1).max(300), audience: z.string().min(1).max(200), requiredScopes: scopeSchema }).strict().parse(req.body);
    const [decisionId, secret] = body.grant.split('.', 2);
    const decision = decisionId ? await prisma.accessDecision.findFirst({ where: { id: idSchema.parse(decisionId), tenantId: principal.tenantId, applicationId: principal.applicationId, outcome: 'ALLOW', resourceRefHash: digestResource(body.resourceRef), audience: body.audience } }) : null;
    const valid = !!decision && !!secret && !!decision.grantHash && safeEqualHex(decision.grantHash, sha256(secret)) && !decision.revokedAt && !!decision.expiresAt && decision.expiresAt > new Date() && body.requiredScopes.every(scope => decision.scope.includes(scope));
    if (!valid) throw new HttpError(403, 'forbidden');
    res.json({ valid: true, expiresAt: decision.expiresAt });
  });

  api.post('/access-grants/:id/revoke', requireScope('access:revoke'), async (req, res) => {
    const principal = (req as AuthedRequest).principal;
    const decision = await prisma.accessDecision.findFirst({ where: { id: idSchema.parse(req.params.id), tenantId: principal.tenantId, applicationId: principal.applicationId, outcome: 'ALLOW', revokedAt: null } });
    if (!decision) throw new HttpError(404, 'not_found');
    await prisma.accessDecision.update({ where: { id: decision.id }, data: { revokedAt: new Date() } });
    await safeAudit(prisma, { tenantId: principal.tenantId, applicationId: principal.applicationId, actorType: 'application', actorRef: principal.credentialId, action: 'access.revoke', entityRef: decision.id, outcome: 'success', correlationId: randomToken(12) });
    res.status(204).end();
  });

  app.use('/api/v1', api);
  app.use((_req, _res, next) => next(new HttpError(404, 'not_found')));
  app.use((error: unknown, req: Request, res: Response, _next: NextFunction) => {
    const correlationId = req.header('x-correlation-id')?.slice(0, 80) ?? randomToken(12);
    if (error instanceof z.ZodError) return res.status(400).json({ error: { code: 'invalid_request', correlationId } });
    if (error instanceof HttpError) return res.status(error.status).json({ error: { code: error.code, correlationId } });
    if (typeof error === 'object' && error !== null && 'type' in error && error.type === 'entity.parse.failed') return res.status(400).json({ error: { code: 'invalid_json', correlationId } });
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') return res.status(409).json({ error: { code: 'conflict', correlationId } });
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2025') return res.status(404).json({ error: { code: 'not_found', correlationId } });
    console.error(JSON.stringify({ level: 'error', correlationId, errorType: error instanceof Error ? error.name : 'unknown' }));
    return res.status(500).json({ error: { code: 'internal_error', correlationId } });
  });
  return app;
}
