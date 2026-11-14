# Requisitos

## Funcionais candidatos

- Administrar tenants, membros, aplicacoes, ambientes e credenciais.
- Criar uma sessao de verificacao vinculada a finalidade, politica, aplicacao e referencia opaca do cliente.
- Redirecionar ou incorporar fluxo do fornecedor sem revelar segredo de servidor ao navegador.
- Receber callbacks autenticados, idempotentes e verificaveis.
- Representar estados: criada, aguardando pessoa, em processamento, aprovada, recusada, revisao manual, expirada, cancelada e erro do fornecedor.
- Retornar ao cliente apenas resultado minimo e referencia de auditoria.
- Emitir autorizacao de recurso com audiencia, tenant, escopo, prazo curto e identificador unico; permitir revogacao/consulta quando aplicavel.
- Registrar classificacao de midia, motivo/categoria, decisor e versao da politica sem publicar a origem privada.
- Administrar retencao, solicitacoes de titular, exportacao, exclusao e incidentes conforme politica aprovada.
- Medir uso por tenant/aplicacao e aplicar limites configurados.
- Fornecer painel administrativo com RBAC e trilha de auditoria.

## Nao funcionais

- Isolamento entre tenants e ambientes.
- TLS em transito e criptografia gerenciada em repouso; chaves separadas por ambiente e rotacionadas.
- API versionada, contratos documentados, idempotencia e limites contra abuso.
- Observabilidade sem documentos, imagens, tokens ou biometria em logs.
- Disponibilidade, RTO/RPO, latencia e capacidade definidos com base no piloto.
- Acessibilidade e experiencia mobile, incluindo permissao de camera e alternativas.
- Testes de autorizacao negativa, concorrencia, isolamento e recuperacao.

## Criterios bloqueadores do piloto

Fornecedor e contrato avaliados; papeis LGPD definidos; base legal e aviso aprovados; DPIA/RIPD avaliado; retencao e descarte testados; politica de falha aprovada; seguranca ofensiva revisada; segregacao multi-tenant testada; caminho de suporte/manual review; planos de resposta a incidente e indisponibilidade.

## Decisao

Os requisitos ainda sao candidatos. Regras legais, limiares, prazos, disponibilidade e forma de verificacao dependem de analise juridica, risco do conteudo e fornecedor escolhido.
