# Historico

## 2026-11-14 - Endurecimento de acesso e credenciais

- Decisao de acesso agora exige correspondencia da sessao com a versao vigente da politica, proposito e tipo de verificacao; mismatch falha fechado e nao emite grant.
- Adicionados endpoints administrativos para emitir e revogar credenciais de aplicacao. O segredo e retornado apenas na emissao, armazenado como hash e os scopes nao podem exceder os scopes previamente concedidos a aplicacao.
- Rotacao/revogacao e auditoria sao transacionais; credencial revogada deixa de autenticar imediatamente.
- Integracao PostgreSQL expandida: contexto de verificacao, grant valido, recurso divergente, revogacao de grant e ciclo de credencial.
- Validacao local: 8 testes unitarios/API + 2 testes de integracao PostgreSQL aprovados; `prisma validate`, `prisma generate` e build TypeScript aprovados.
- Testes usaram somente dados sinteticos no banco dedicado `identity_access_dev`; limpeza confirmada. Sem migration, reset, fornecedor externo ou alteracao em Lindas & Sexy.

## 2026-11-14 - Fase 1 (implementacao local)

- Criada API Express/TypeScript versionada, schema Prisma PostgreSQL e migration inicial.
- Adicionados credenciais por aplicacao com hash scrypt, scopes, isolamento por tenant, policies versionadas, sessoes, resultados minimizados, decisoes/grants temporarios e auditoria.
- Mock de verificacao limitado a `development`/`test` e flag local explicita.
- Testes automatizados de credencial, scopes/evidencia/expiracao, mock em producao e rejeicao de credencial.
- Resultado local: 8 testes automatizados passaram; `prisma validate`, `prisma generate` e TypeScript build passaram.
- Banco local PostgreSQL 17 foi encontrado, mas conexao administrativa falhou sem senha (`fe_sendauth: no password supplied`). Migration nao aplicada e nenhum banco existente foi modificado.
- Tentativa `npm run prisma:migrate:dev -- --name initial` com credencial local deliberadamente invalida terminou em `Schema engine error`; migration continua pendente de credencial autorizada para o banco vazio dedicado.
- Nenhum provedor real, biometria, integration marketplace, deploy ou publicacao.

## 2026-11-14 - Banco de desenvolvimento e integracao

- Usadas as credenciais PostgreSQL do backend Lindas & Sexy somente para conectar ao host local; criada base independente `identity_access_dev`, proprietario `postgres`.
- Aplicada migration `20261114000000_initial`; Prisma confirmou banco sincronizado com schema.
- Testes de integracao reais no PostgreSQL cobrem isolamento entre dois tenants/apps e bloqueio de autorizacao para resultado mock; os registros sinteticos foram removidos e a limpeza foi confirmada.
- Resultado: 2 testes PostgreSQL, 8 testes unitarios/API, TypeScript build e validacao Prisma aprovados; 18 tabelas da aplicacao mais `_prisma_migrations`.
- Banco do Lindas & Sexy nao foi alterado; nenhuma credencial foi impressa, salva ou copiada ao projeto Identity-Access.

## 2026-11-14 - Revisao documental de acesso e politicas

- Formalizado fluxo contextual de decisao por recurso, estados de falha, validade e revogacao.
- Ampliado modelo conceitual com versoes de politica, evidencias minimas e registros de retencao.
- Adicionadas minutas de politicas e fluxo para integracao futura.
- Avaliado popup de autodeclaracao segundo fontes oficiais vigentes; nenhuma aplicacao foi alterada.
- Sem codigo, banco, migration, container, integracao ou deploy.

## 2026-10-31 - Fase 0

- Criada documentacao inicial de produto, arquitetura, banco conceitual, API, seguranca, integracoes, roadmap e decisoes.
- Nenhum codigo de aplicacao, banco, migration, container ou integracao foi criado.
