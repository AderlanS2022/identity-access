# API proposta

## Convencoes

REST JSON sob `/v1`, TLS obrigatorio, OpenAPI versionado. OAuth2 Client Credentials como primeira opcao para servidor-servidor; scopes minimos e segredo armazenado como hash quando possivel. Rate limit por tenant/app/IP, tamanho maximo, validacao estrita, `Idempotency-Key` em operacoes criadoras e correlation ID.

## Recursos candidatos

- `POST /v1/verification-sessions`: abre sessao com purpose, policy, callback e referencia opaca do consumidor.
- `GET /v1/verification-sessions/{id}`: consulta estado e resultado minimo autorizado.
- `POST /v1/verification-sessions/{id}/cancel`: cancela sessao ativa.
- `POST /v1/access-decisions`: verifica se principal/sessao pode acessar resource e scope.
- `POST /v1/access-grants`: emite grant curto, audience-bound e recurso-especifico, se a arquitetura exigir token.
- `POST /v1/access-grants/{id}/revoke`: revoga grant.
- `POST /v1/webhook-endpoints`: configura endpoint permitido e segredo de assinatura.
- `GET /v1/policies/{policyId}`: opcional, retorna apenas politica publicada e autorizada para a app autenticada.

Os caminhos e payloads sao rascunhos, sujeitos a threat modeling. Nao expor endpoints de upload biometricos diretamente ao cliente integrador sem decisao de arquitetura.

Ha sobreposicao a resolver entre `POST /access-decisions` e `/access-grants`: a decisao devolve `allow`, `deny` ou `verification_required`; somente `allow` pode iniciar grant curto. Tenant e application derivam da credencial, nao do body. Pedido inclui referencia opaca do recurso, finalidade e escopos. Servidor resolve policy/version, assurance level e validade maxima. `Idempotency-Key` em criacao; callbacks assinados, anti-replay e deduplicados. Allowlist de dominios/callbacks e CORS nao substituem autenticacao servidor-servidor.

## Resultado minimo

Retornar status, classe de resultado (por exemplo `verified`, `not_verified`, `review_required`, `expired`), nivel de garantia, validade e referencia opaca. Nao retornar imagem, documento, embedding, score de idade ou detalhe do fornecedor sem justificativa e permissao explicita.

## Erros e callbacks

Usar codigos estaveis: invalid_request, unauthorized, forbidden, not_found, conflict, rate_limited, provider_unavailable, expired. Respostas nao devem confirmar existencia de recursos cross-tenant. Webhooks assinados sobre corpo canonico, timestamp tolerante limitado, nonce/event ID, retries e deduplicacao.

## Autorizacao

Toda sessao, recurso e grant valida tenant, application, audience, scope, validade, politica/versao e estado de revogacao. Token de acesso a midia deve ser curto, nao reutilizavel quando viavel, sem URL permanente. Cache tem TTL limitado e invalidacao/revogacao definida.

Backend do consumidor valida autorizacao a cada requisicao ao recurso e resolve a referencia opaca para objeto privado. Nenhuma URL publica permanente do original. Resultado inconclusivo, expirado, recusado ou erro do fornecedor nunca retorna allow. A verificacao anterior so pode ser reaproveitada quando evidencia e regra vigentes permitem, sem grant global ou permanente.

## Compatibilidade

Mudancas aditivas na versao atual; breaking changes em nova versao e calendario de sunset. Contratos gerados e testes de consumidor antes de integrar Lindas & Sexy ou Chronos.
