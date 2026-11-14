-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'REVOKED');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('CREATED', 'PENDING_USER', 'PROCESSING', 'VERIFIED', 'NOT_VERIFIED', 'INCONCLUSIVE', 'MANUAL_REVIEW', 'EXPIRED', 'CANCELLED', 'PROVIDER_ERROR', 'REVOKED');

-- CreateEnum
CREATE TYPE "VerificationKind" AS ENUM ('AGE', 'IDENTITY');

-- CreateEnum
CREATE TYPE "DecisionOutcome" AS ENUM ('ALLOW', 'DENY', 'VERIFICATION_REQUIRED');

-- CreateTable
CREATE TABLE "tenants" (
    "id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "environment" VARCHAR(24) NOT NULL,
    "allowed_origins" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_credentials" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "key_id" VARCHAR(48) NOT NULL,
    "secret_hash" VARCHAR(256) NOT NULL,
    "scopes" TEXT[],
    "expires_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policies" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "purpose" VARCHAR(120) NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policy_versions" (
    "id" UUID NOT NULL,
    "policy_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "rules" JSONB NOT NULL,
    "rules_digest" VARCHAR(64) NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_until" TIMESTAMP(3),

    CONSTRAINT "policy_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_sessions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "policy_version_id" UUID NOT NULL,
    "external_ref_hash" VARCHAR(64) NOT NULL,
    "purpose" VARCHAR(120) NOT NULL,
    "kind" "VerificationKind" NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'CREATED',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_results" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "outcome" VARCHAR(40) NOT NULL,
    "assurance_level" VARCHAR(40) NOT NULL,
    "reason_codes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "valid_until" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "providers" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "kind" "VerificationKind" NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_attempts" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "provider_id" UUID NOT NULL,
    "state" VARCHAR(40) NOT NULL,
    "provider_ref_ciphertext" VARCHAR(512),
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "verification_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_evidence" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "method" VARCHAR(60) NOT NULL,
    "assurance_level" VARCHAR(40) NOT NULL,
    "evidence_ref_hash" VARCHAR(64) NOT NULL,
    "collected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valid_until" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "verification_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consent_records" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "session_id" UUID,
    "policy_version_id" UUID,
    "purpose" VARCHAR(120) NOT NULL,
    "notice_version" VARCHAR(40) NOT NULL,
    "action" VARCHAR(24) NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consent_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "resource_ref_hash" VARCHAR(64) NOT NULL,
    "object_key" VARCHAR(512) NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "checksum" VARCHAR(64),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delete_at" TIMESTAMP(3),

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_classifications" (
    "id" UUID NOT NULL,
    "media_asset_id" UUID NOT NULL,
    "category" VARCHAR(60) NOT NULL,
    "status" VARCHAR(40) NOT NULL,
    "policy_version" VARCHAR(40) NOT NULL,
    "decided_by" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_classifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retention_records" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "entity_type" VARCHAR(60) NOT NULL,
    "entity_ref_hash" VARCHAR(64) NOT NULL,
    "rule_version" VARCHAR(40) NOT NULL,
    "delete_after" TIMESTAMP(3) NOT NULL,
    "deletion_status" VARCHAR(32) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "retention_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_endpoints" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "url" VARCHAR(2048) NOT NULL,
    "secret_hash" VARCHAR(256) NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_endpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_records" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "meter" VARCHAR(60) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_decisions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "session_id" UUID,
    "policy_version_id" UUID NOT NULL,
    "resource_ref_hash" VARCHAR(64) NOT NULL,
    "purpose" VARCHAR(120) NOT NULL,
    "audience" VARCHAR(200) NOT NULL,
    "scope" TEXT[],
    "outcome" "DecisionOutcome" NOT NULL,
    "reason_code" VARCHAR(64) NOT NULL,
    "grant_hash" VARCHAR(64),
    "decided_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "access_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "application_id" UUID,
    "actor_type" VARCHAR(40) NOT NULL,
    "actor_ref" VARCHAR(100),
    "action" VARCHAR(100) NOT NULL,
    "entity_ref" VARCHAR(100),
    "outcome" VARCHAR(40) NOT NULL,
    "correlation_id" VARCHAR(80) NOT NULL,
    "metadata" JSONB,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "applications_tenant_id_status_idx" ON "applications"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "applications_tenant_id_id_key" ON "applications"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "application_credentials_key_id_key" ON "application_credentials"("key_id");

-- CreateIndex
CREATE INDEX "application_credentials_application_id_revoked_at_idx" ON "application_credentials"("application_id", "revoked_at");

-- CreateIndex
CREATE INDEX "policies_tenant_id_application_id_status_idx" ON "policies"("tenant_id", "application_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "policies_tenant_id_id_key" ON "policies"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "policy_versions_policy_id_version_key" ON "policy_versions"("policy_id", "version");

-- CreateIndex
CREATE INDEX "verification_sessions_tenant_id_application_id_status_expir_idx" ON "verification_sessions"("tenant_id", "application_id", "status", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "verification_sessions_tenant_id_application_id_external_ref_key" ON "verification_sessions"("tenant_id", "application_id", "external_ref_hash");

-- CreateIndex
CREATE UNIQUE INDEX "verification_sessions_tenant_id_id_key" ON "verification_sessions"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "verification_results_session_id_key" ON "verification_results"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "providers_name_kind_key" ON "providers"("name", "kind");

-- CreateIndex
CREATE INDEX "verification_attempts_session_id_started_at_idx" ON "verification_attempts"("session_id", "started_at");

-- CreateIndex
CREATE INDEX "verification_evidence_session_id_valid_until_idx" ON "verification_evidence"("session_id", "valid_until");

-- CreateIndex
CREATE INDEX "consent_records_tenant_id_application_id_purpose_recorded_a_idx" ON "consent_records"("tenant_id", "application_id", "purpose", "recorded_at");

-- CreateIndex
CREATE UNIQUE INDEX "media_assets_tenant_id_resource_ref_hash_key" ON "media_assets"("tenant_id", "resource_ref_hash");

-- CreateIndex
CREATE INDEX "media_classifications_media_asset_id_created_at_idx" ON "media_classifications"("media_asset_id", "created_at");

-- CreateIndex
CREATE INDEX "retention_records_tenant_id_delete_after_deletion_status_idx" ON "retention_records"("tenant_id", "delete_after", "deletion_status");

-- CreateIndex
CREATE INDEX "webhook_endpoints_tenant_id_application_id_status_idx" ON "webhook_endpoints"("tenant_id", "application_id", "status");

-- CreateIndex
CREATE INDEX "usage_records_tenant_id_application_id_meter_occurred_at_idx" ON "usage_records"("tenant_id", "application_id", "meter", "occurred_at");

-- CreateIndex
CREATE UNIQUE INDEX "access_decisions_grant_hash_key" ON "access_decisions"("grant_hash");

-- CreateIndex
CREATE INDEX "access_decisions_tenant_id_application_id_resource_ref_hash_idx" ON "access_decisions"("tenant_id", "application_id", "resource_ref_hash", "expires_at");

-- CreateIndex
CREATE INDEX "audit_events_tenant_id_occurred_at_idx" ON "audit_events"("tenant_id", "occurred_at");

-- CreateIndex
CREATE INDEX "audit_events_correlation_id_idx" ON "audit_events"("correlation_id");

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_credentials" ADD CONSTRAINT "application_credentials_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policies" ADD CONSTRAINT "policies_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policies" ADD CONSTRAINT "policies_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_versions" ADD CONSTRAINT "policy_versions_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "policies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_sessions" ADD CONSTRAINT "verification_sessions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_sessions" ADD CONSTRAINT "verification_sessions_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_sessions" ADD CONSTRAINT "verification_sessions_policy_version_id_fkey" FOREIGN KEY ("policy_version_id") REFERENCES "policy_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_results" ADD CONSTRAINT "verification_results_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "verification_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_attempts" ADD CONSTRAINT "verification_attempts_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "verification_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_attempts" ADD CONSTRAINT "verification_attempts_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_evidence" ADD CONSTRAINT "verification_evidence_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "verification_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "verification_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_policy_version_id_fkey" FOREIGN KEY ("policy_version_id") REFERENCES "policy_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_classifications" ADD CONSTRAINT "media_classifications_media_asset_id_fkey" FOREIGN KEY ("media_asset_id") REFERENCES "media_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retention_records" ADD CONSTRAINT "retention_records_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_endpoints" ADD CONSTRAINT "webhook_endpoints_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_endpoints" ADD CONSTRAINT "webhook_endpoints_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_decisions" ADD CONSTRAINT "access_decisions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_decisions" ADD CONSTRAINT "access_decisions_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_decisions" ADD CONSTRAINT "access_decisions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "verification_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_decisions" ADD CONSTRAINT "access_decisions_policy_version_id_fkey" FOREIGN KEY ("policy_version_id") REFERENCES "policy_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
