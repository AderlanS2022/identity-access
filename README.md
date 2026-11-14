# Identity & Access

Plataforma independente para coordenar verificacao de identidade, maioridade, prova de vida e autorizacao de acesso a conteudos. O primeiro consumidor previsto e Lindas & Sexy; Chronos e outros sistemas poderao integrar-se pela mesma API.

## Estado

Fase 1 local implementada: backend API e migration aplicada ao banco de desenvolvimento dedicado `identity_access_dev`. Ainda nao ha integracao com fornecedor nem validacao juridica de conformidade. Consulte o changelog para o estado comprovado.

## Documentacao

- [Visao do produto](documentacao/VISAO-DO-PRODUTO.md)
- [Requisitos](documentacao/REQUISITOS.md)
- [Integracoes](documentacao/INTEGRACOES.md)
- [Arquitetura](planejamento/ARCHITECTURE.md)
- [Banco de dados](planejamento/DATABASE.md)
- [API](planejamento/API.md)
- [Seguranca e privacidade](planejamento/SECURITY.md)
- [Politicas e avisos - proposta](planejamento/POLICIES.md)
- [Fluxo de verificacao e acesso](planejamento/ACCESS-FLOW.md)
- [Backend API](backend/README.md)
- [Roadmap](planejamento/ROADMAP.md)
- [Decisoes em aberto](planejamento/DECISIONS.md)
- [Historico](historico/CHANGELOG.md)

## Recomendacao inicial

Iniciar como um monolito modular com Node.js/TypeScript, API REST, PostgreSQL, armazenamento privado compativel com S3 e adaptadores para fornecedores especializados. Manter verificacao documental e biometria delegadas a fornecedores avaliados; o Identity & Access deve controlar consentimentos, estados, auditoria e decisoes de acesso sem armazenar biometria bruta por padrao.

Antes de qualquer piloto, definir controlador/operador, base legal, avaliacao de impacto, fornecedor, retencao e comportamento seguro quando o servico central estiver indisponivel.

Aceitar termos ou declarar "sou maior de 18" nao equivale a aferir idade. Consulte as minutas e a avaliacao do popup em [POLICIES.md](planejamento/POLICIES.md); sao orientacoes de produto para revisao juridica, nao textos legais finais. Nenhuma aplicacao foi inspecionada ou alterada nesta revisao.
