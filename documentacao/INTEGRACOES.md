# Integracoes

## Modelo

Cada tenant registra aplicacoes distintas por ambiente (desenvolvimento, homologacao, producao). Cada aplicacao recebe identificador e credenciais proprias, com escopos, limites, origem/callbacks permitidos, validade e possibilidade de rotacao e revogacao. Segredos de servidor nunca sao entregues ao frontend.

Consumidores previstos: Lindas & Sexy, Chronos e futuros produtos. Eles chamam a API REST sobre TLS e nao acessam PostgreSQL nem o armazenamento central diretamente.

## Autenticacao servidor-servidor

Avaliar OAuth 2.0 Client Credentials com credenciais rotativas e escopos restritos; para callbacks de fornecedores, assinatura HMAC com timestamp e protecao contra replay. mTLS pode ser opcional para clientes de maior risco. Definir idempotency key para criacao de verificacoes e eventos.

## Fornecedores de verificacao

Usar adaptadores isolados por fornecedor para verificacao documental, prova de vida e eventual estimativa etaria complementar. Avaliar jurisdicao, suboperadores, transferencia internacional, certificacoes, retencao, exclusao, treinamento de modelos, vies e evidencias de desempenho. Nenhum fornecedor e selecionado nesta fase.

## Fluxo conceitual

1. Cliente solicita sessao com finalidade, politica, retorno e referencia interna opaca.
2. Servico autentica aplicacao e verifica limites/politica.
3. Servico cria sessao e entrega URL/token temporario de uso unico.
4. Pessoa conclui o fluxo no fornecedor ou experiencia hospedada.
5. Callback validado e reconciliado de forma idempotente.
6. Cliente consulta resultado minimo ou recebe webhook assinado.
7. Para recurso restrito, o cliente pede autorizacao vinculada ao recurso; token curto nao e URL publica da midia.

## Falhas e eventos

Timeout, callback duplicado, assinatura invalida, indisponibilidade, resultado inconclusivo e expiracao devem possuir estados distintos. Webhooks levam ID do evento, versao, timestamp, tenant/app, referencia de sessao e resultado minimo; retries com backoff, assinatura e deduplicacao. Nao incluir dados biometricos ou documentos.

## SaaS futuro

Catalogo de planos, limites por periodo, medicao de consumo, alertas, assinaturas e cobranca ficam atras de interfaces substituiveis. Cobranca nao participa da decisao individual de maioridade nem da emissao de autorizacao.
