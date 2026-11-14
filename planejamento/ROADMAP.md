# Roadmap

## Fase 0 - planejamento (atual)

Documentos, alternativas, riscos e decisoes pendentes. Aceite: revisao de produto, seguranca, privacidade, juridico e integracoes.

## Fase 1 - descoberta e desenho

Entrevistas com Lindas & Sexy/Chronos, mapa de dados, fluxo sem fornecedor, threat model, RIPD inicial, requisitos de nivel de garantia, avaliacao de fornecedores e matriz legal/privacidade. Especificar decisao contextual em cada requisicao de acesso, estados e validade. Sem biometria real antes dos gates aprovados.

Aceite: OpenAPI conceitual revisado; diagramas para allow/deny/verification_required/inconclusivo/timeout/retry; politica versionada; papeis e dados mapeados; matriz de ameacas; criterios de fornecedor e piloto; textos de UX marcados como minuta juridica.

## Fase 2 - fundacao tecnica

Repositorio e ambientes autorizados, pipeline, segredos, tenant/app/credenciais, API auth, auditoria, PostgreSQL/migrations, isolamento, limites e observabilidade. Aceite: autorizacao positiva/negativa, cross-tenant, rotacao/revogacao, CORS/callback allowlist, idempotencia e logs sem PII.

## Fase 3 - sandbox do fornecedor

Adaptador em sandbox, avisos separados, sessao, callback assinado/idempotente, estados de falha, UX mobile, alternativa e exclusao. Dados de teste; sem dados reais ate gates de privacidade. Callback falso/replay/duplicado rejeitado; timeout, inconclusivo, recusa e provedor indisponivel bloqueiam.

## Fase 4 - piloto controlado

Tenant e aplicacao piloto, escopo e usuarios limitados, monitoramento, revisao manual, incident response, medicao de falsos resultados e canal de titular. Gate juridico/seguranca antes de producao.

## Fase 5 - midia e autorizacao

Storage privado, pipeline de variantes, classificacao administrativa, grants curtos por audience/recurso, decisao por requisicao, revogacao, CDN/cache e bypass (URL direta, range/video, thumbnails e origins antigos). Aceite: original restrito nunca publico; grant expirado/revogado ou indisponibilidade nao entrega bytes.

## Fase 6 - SaaS

Self-service tenants/apps, planos, quotas, medicao, alertas, subscriptions e billing. Cobrança desacoplada da decisao de verificacao.

## Fase 7 - robustez e escala

Pentest, disaster recovery, SLO/SLA, multi-regiao conforme necessidade, auditorias periodicas, governanca de fornecedores e avaliacao de vies.

Cada fase requer criterios de aceite e autorizacao antes da seguinte. Cronograma depende das decisoes listadas em DECISIONS.md.
