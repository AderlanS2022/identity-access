# Decisoes pendentes

## Registrar decisao

Para cada ADR: contexto, opcoes, decisao, responsavel, data, impactos, dados considerados e gatilho de revisao. Ate aprovacao, itens abaixo sao propostas.

## A decidir antes do piloto

1. Nome definitivo, dominio e jurisdicoes de operacao.
2. Papel legal de cada parte (controlador/operador) e finalidades por cliente.
3. Tipo de conteudo e nivel de garantia exigido; fluxo documental, idade por token ou outra evidencia.
4. Fornecedor(es), localizacao, suboperadores, contrato, retencao e transferencias.
5. Alternativas acessiveis e politica de revisao/recusa.
6. Quais dados/resultados precisam persistir e por quanto tempo.
7. Tenant isolation: schema compartilhado com RLS/constraints ou bancos dedicados para tiers.
8. OAuth2, mTLS ou ambos; emissao/revogacao de grants e estrategia de cache.
9. Storage S3 e KMS disponiveis, regiao e proprietario operacional.
10. SLAs, RPO/RTO, suporte, incidentes e operacao fora do horario.
11. Metricas de qualidade e limiares, sem depender apenas de acuracia agregada.
12. Modelo comercial, quotas, unidade faturavel e integracao futura de cobranca.
13. Evidencia reutilizavel e validade da afericao por tipo de recurso/acesso, conforme norma vigente e parecer juridico.
14. Papeis legais e documentos separados: termos marketplace, privacidade marketplace, aviso de verificacao, termos B2B Identity & Access e DPA.
15. Conteudos acessiveis antes de afericao, persistencia de preferencias e proibicao de contas/perfis por menores no servico pornografico, conforme enquadramento legal.
16. Alternativas acessiveis, contestacao/revisao humana e suporte a inconclusivos.

## Propostas iniciais

- Monolito modular; PostgreSQL; REST v1; tenant_id e constraints compostas; storage privado.
- Fornecedor especializado para documentos e prova de vida na primeira versao.
- Resultado central minimizado; nenhuma biometria bruta no banco por padrao.
- Fail closed para conteudo restrito e grants de curta duracao.
- Declaracao de maioridade e aceite de termos nunca sao resultado de afericao.
- Marketplace solicita decisao no backend por requisicao a recurso restrito; evidencia verificada pode ser reaproveitada apenas sob regra/contexto/validade autorizados.

Registrar aprovacao formal antes de converter propostas em contratos de API/schema ou iniciar desenvolvimento.
