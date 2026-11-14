# Banco de dados

## Tecnologia e limites

PostgreSQL proprio, separado dos bancos de Lindas & Sexy e Chronos. Um banco por ambiente, credenciais distintas, migracoes revisadas e backup independente. PostgreSQL guarda metadados e resultados minimos; documentos, fotos, videos e templates biometricos nao devem ser armazenados em colunas por padrao.

## Modelo conceitual

- Tenant 1:N Application, Tenant 1:N Membership.
- Application 1:N Credential, Policy, VerificationSession, WebhookEndpoint e UsageRecord.
- Policy 1:N PolicyVersion; versao publicada e imutavel e cada sessao/decisao aponta para a versao avaliada.
- VerificationSession 1:N VerificationAttempt; Attempt aponta para Provider e guarda estado, referencias externas opacas e timestamps.
- VerificationSession 0..N ConsentRecord, com finalidade, versao do aviso, acao e timestamp; nunca guardar texto livre sensivel sem necessidade.
- VerificationEvidence 0..N por sessao, com metodo, referencia opaca, nivel de garantia e validade; sem payload biometrico. Distinguir comprovacao de idade de verificacao de identidade civil.
- VerificationResult 0..1 por sessao, com tipo, outcome, assurance level, motivos codificados, policy version, origem, validade e revogacao. Resultado nao deve conter imagem, documento, estimativa detalhada ou score facial bruto.
- Resource 1:N MediaAsset; MediaAsset aponta para storage key privada, tipo, checksum e metadados tecnicos minimizados. MediaClassification guarda categoria, decisor, politica, versao e estado.
- AccessDecision referencia tenant, application, session/evidencia, resource, finalidade, policy version, audience, scope, outcome, instante de decisao, expiry e revocation. Registrar cada avaliacao contextual de acesso.
- RetentionRecord representa regra/versionamento e estado de descarte de entidade, sem duplicar dados pessoais.
- AuditEvent append-only referencia ator e entidade por IDs opacos e guarda acao, outcome, timestamp e correlation ID.
- Plan/Subscription/UsageMeter/BillingRecord futuros, isolados do core de verificacao.

## Entidades/campos conceituais

Tenant(id, status, region, created_at); Application(id, tenant_id, environment, status); Credential(id, application_id, secret_hash, scopes, created_at, expires_at, revoked_at); Policy(id, application_id, purpose, status); PolicyVersion(id, policy_id, version, rules_digest, effective_from, effective_until, approved_by); VerificationSession(id, tenant_id, application_id, external_ref_hash, purpose, policy_version_id, status, expires_at); VerificationAttempt(id, session_id, provider_id, state, provider_ref_ciphertext, started_at, completed_at); VerificationEvidence(id, session_id, method, assurance_level, evidence_ref_hash, collected_at, valid_until, deleted_at); VerificationResult(id, session_id, kind, outcome, assurance_level, reason_codes, policy_version_id, issued_at, valid_until, revoked_at); MediaAsset(id, tenant_id, object_key, status, checksum, created_at, delete_at); AccessDecision(id, tenant_id, application_id, session_id, resource_ref_hash, purpose, policy_version_id, outcome, reason_code, scope, audience, decided_at, expires_at, revoked_at); RetentionRecord(id, tenant_id, entity_type, entity_ref, rule_version, delete_after, deletion_status, deleted_at); AuditEvent(id, tenant_id, actor_type, actor_ref, action, entity_ref, outcome, occurred_at).

Esquema ilustrativo; nao e schema Prisma nem instrucao SQL. Identity Verification (identidade civil) e Age Assurance devem ser fluxos separados; identidade so e coletada quando necessaria. Campos e cardinalidades dependem do fluxo, fornecedor e parecer juridico.

## Isolamento multi-tenant

tenant_id NOT NULL em entidades tenant-scoped; FKs compostas (tenant_id,id); unique indexes por tenant; tenant extraido de credencial validada, nunca confiado do body. Testes negativos de acesso cruzado em cada endpoint. Avaliar RLS com role que nao possa ignorar policies; jobs administrativos explicitamente segregados.

## Dados sensiveis e retencao

Nao reter selfie/documento/video apos callback se fornecedor permitir processamento efemero. Se retencao operacional for imprescindivel, aprovar finalidade, base legal, prazo, cifragem envelope, acesso break-glass, trilha e descarte verificavel antes de armazenar. Chaves de objeto aleatorias, sem PII em nomes. Hashes nao tornam automaticamente dados anonimos.

Consentimentos e evidencias de decisao podem ter prazos distintos de biometria. Definir tabela de retencao por categoria, legal hold e fluxo de exclusao que alcance banco, storage, replicas e backups conforme ciclo documentado.

## Backup e recuperacao

Backups PostgreSQL cifrados, PITR se suportado, acesso separado, retencao definida e restauracao periodica em ambiente isolado. Storage com versionamento/lifecycle conforme risco; testar eliminacao e recuperacao. Definir RPO/RTO antes do SLA.

## Migrations/versionamento

Prisma migrations imutaveis e revisadas em PR; aplicar primeiro em teste com snapshot anonimizado/sintetico, depois homologacao e producao com backup verificado. Expand/contract para mudancas compativeis; rollback por migration corretiva, evitando down destructive. Sem migrate reset/db push em producao. Versionar schema e politica de API juntos.
