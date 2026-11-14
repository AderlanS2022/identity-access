# Identity & Access API

Backend inicial local da Fase 1. Usa Express 5, TypeScript, PostgreSQL e Prisma 6. Ainda nao implementa autenticacao facial/documental real, provedor pago, frontend, storage de midia ou OAuth2 completo.

## Requisitos locais

- Node.js 20.19+ ou 22.12+.
- PostgreSQL local e uma credencial propria com permissao para criar/usar o banco de desenvolvimento `identity_access_dev`.
- Configure `DATABASE_URL` e `ADMIN_API_KEY` apenas no ambiente do processo/gerenciador local de segredos. Nao versionar `.env` nem usar banco de outro projeto.

No PowerShell, na pasta `backend`, configure variaveis temporarias para a sessao:

```powershell
$env:DATABASE_URL = 'postgresql://identity_access_dev:SENHA_LOCAL@localhost:5432/identity_access_dev?schema=public'
$env:ADMIN_API_KEY = 'CHAVE_LOCAL_ALEATORIA_COM_32_OU_MAIS_CARACTERES'
npm install
npm run prisma:validate
npm run prisma:generate
npm run prisma:migrate:dev
npm test
npm run test:db
npm run build
npm run dev
```

O banco local dedicado `identity_access_dev` ja foi criado e recebeu a migration inicial nesta Fase 1. Para uma nova instalacao, use um banco novo e dedicado. `migrate:dev` cria/altera tabelas apenas nesse banco configurado; nao rode apontando a banco de Lindas & Sexy, Chronos, compartilhado ou producao. A migration versionada pode ser aplicada com `npm run prisma:migrate:deploy` em ambiente controlado.

`test:db` exige `DATABASE_URL` para o banco dedicado `identity_access_dev`, cria somente dados sintéticos com nomes `Integration ...` e remove-os em `finally`. O teste se recusa a iniciar quando o nome do banco difere.

## API inicial

- `GET /health`
- Admin com `Authorization: Bearer <ADMIN_API_KEY>`: `POST /api/v1/tenants`, `POST /api/v1/applications`, `POST /api/v1/applications/:id/credentials` (emite segredo uma única vez; scopes limitados ao conjunto já concedido à aplicação) e `POST /api/v1/applications/:applicationId/credentials/:credentialId/revoke`.
- Aplicacao com `Authorization: Bearer <keyId.secret>`: `POST/GET /api/v1/policies`, `POST/GET /api/v1/verification-sessions`, `POST /api/v1/verification-sessions/:id/cancel`, `POST /api/v1/access-decisions`, `POST /api/v1/access-grants/validate`, `POST /api/v1/access-grants/:id/revoke`.
- Mock local: `POST /api/v1/verification-sessions/:id/mock-result`; requer `NODE_ENV=development` ou `test` e `MOCK_PROVIDER_ENABLED=true`. Sempre retorna `assuranceLevel=mock-only`; nao comprova idade e nao pode operar em `production`.

As credenciais de integracao devem permanecer no backend consumidor. API escuta somente `127.0.0.1` nesta etapa. CORS nao esta habilitado; os endpoints sao servidor-servidor. Credencial retornada na criacao da aplicacao/rotacao e exibida uma unica vez, somente o hash e persistido. Rotacao requer chave administrativa; a revogacao invalida imediatamente a credencial.

Uma decisao de acesso exige que a sessao esteja vinculada exatamente a versao vigente da politica solicitada, com mesmo proposito e tipo de verificacao. Divergencia resulta em `DENY` (`verification_context_mismatch`), sem grant.

## Limites de seguranca

Ainda faltam OAuth2/token exchange, console administrativo, enforcement de origins/callbacks, persistencia de provider attempts/evidence, sistema de revogacao de sessoes, validacao de grant no fluxo real de midia, RLS/Postgres composite foreign keys, filas/webhooks e hardening operacional. Nunca considere o mock uma verificacao real. Falhas/inconclusivos nao concedem acesso.

Migration e testes podem ser revisados sem um banco ativo; executar migrate requer credencial autorizada para banco vazio dedicado. Nenhum banco remoto/compartilhado deve ser usado.
