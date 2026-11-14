# Arquitetura proposta

## Primeira topologia

Monolito modular, implantavel como uma API e workers separados no mesmo repositorio. Evita custo operacional de microservicos antes de conhecer volume e limites dos fornecedores. Fronteiras internas permitem extrair componentes quando houver necessidade comprovada.

```text
Aplicacoes cliente -> API REST -> identidade/tenants/policies/verifications/authorizations
                                   |              |             |
                              PostgreSQL     fila/outbox    storage privado
                                                  |
                                          workers/adapters -> fornecedores
```

## Modulos

- Tenancy e aplicacoes: tenants, membros, ambientes, credenciais e quotas.
- Verification orchestration: sessoes, consentimentos, estados e adaptadores.
- Age assurance: politicas e resultados de maioridade provenientes de evidencias aceitas.
- Media governance: objetos privados, classificacoes, transformacoes e retencao.
- Authorization: decisoes e tokens curtos, com escopos/audiencia.
- Audit/security: eventos append-only, alertas e trilha administrativa.
- SaaS commerce futuro: planos, uso e cobranca, desacoplado da verificacao.

## Stack recomendada

- Node.js LTS + TypeScript: ecossistema comum aos projetos e tipos compartilhados.
- Express: adequado para API REST e familiaridade da equipe; validar middleware, validacao de entrada e limites de request. Alternativa: Fastify se benchmarks/contratos justificarem.
- PostgreSQL: transacoes, constraints e politicas de isolamento; nao e banco de arquivos biometricos.
- Prisma: produtividade para CRUD e migrations versionadas; SQL explicito apenas quando necessario e revisado.
- React + TypeScript + Tailwind: painel operacional; experiencia de verificacao pode ser pagina hospedada isolada.
- Sharp: somente para thumbnails/blur server-side em worker isolado, com limites de memoria/tamanho e sem substituir storage privado.
- Docker Compose: desenvolvimento local reproduzivel; nao implica containers de producao nesta fase.
- S3 compativel: objetos privados, criptografia, URLs presigned curtas, lifecycle e bloqueio publico. Separar bucket/conta por ambiente; KMS quando disponivel.

## Seguranca operacional

API stateless quando possivel; workers com fila/outbox e retries idempotentes; segredos em secret manager. Logs estruturados com IDs opacos. Tracing e metricas sem payloads sensiveis. Backups criptografados e testes de restauracao.

## Escala e isolamento

Cada tabela de dominio inclui tenant_id; constraints compostas impedem referencias cruzadas. Middleware autentica app e define tenant, mas cada consulta ainda filtra tenant e aplica autorizacao no servico. PostgreSQL RLS e defesa adicional a avaliar, nao substituto da autorizacao na aplicacao. Operacoes privilegiadas usam papel distinto e auditoria.

## Evolucao

Comecar com modular monolith; separar worker de processamento; extrair servico apenas quando isolamento regulatorio, escala ou disponibilidade exigirem. Registrar ADR para cada mudanca estrutural.
