# Visao do produto

## Problema

Aplicacoes que hospedam conteudo restrito precisam aplicar verificacoes de identidade/idade e decidir se uma sessao pode acessar um recurso, sem duplicar fluxos sensiveis em cada produto.

## Proposta

Um servico central autenticado que orquestra verificacoes, integra fornecedores especializados, emite autorizacoes curtas e auditaveis e fornece ferramentas operacionais para clientes e equipe interna. Cada empresa e aplicacao mantem credenciais e politicas proprias. Aplicacoes consumidoras nunca consultam o banco central.

## Usuarios e partes interessadas

- Pessoa visitante: inicia uma verificacao e recebe explicacao clara, alternativa e resultado compreensivel.
- Cliente integrador: cria aplicacoes, configura ambientes, politicas e webhooks.
- Operacao/compliance: acompanha filas e incidentes com acesso minimo e auditado.
- Administracao SaaS: gerencia tenants, planos, limites e faturamento futuro.
- Fornecedor: processa somente os dados necessarios a uma verificacao contratada.

## Principios

1. Minimizar dados, especialmente biometria e documentos.
2. Usar fornecedores especializados avaliados; nao construir modelo biometrico proprio na primeira versao.
3. Separar verificacao, classificacao de conteudo e autorizacao de acesso.
4. Falhar de forma fechada para conteudo restrito quando nao houver decisao valida; oferecer caminho de recuperacao e suporte.
5. Explicar finalidade, dados, retencao e alternativas antes da captura.
6. Nao expor a aplicacao cliente dados brutos ou detalhes do fornecedor desnecessarios.
7. Ser multi-tenant por desenho, com autorizacao em cada recurso.

## Limites

Identity & Access nao substitui aconselhamento juridico, politica editorial/moderacao do cliente, controles de seguranca do dispositivo, nem a responsabilidade do cliente sobre conteudos e bases legais. Uma estimativa facial isolada nao sera tratada como comprovacao suficiente de maioridade.

## Indicadores a definir

Taxa de conclusao, latencia, disponibilidade, custo por verificacao, taxa de revisao manual, falsos aceites/rejeicoes reportados pelo fornecedor, incidentes de privacidade e sucesso de revogacao. Definir metas, amostras e limites antes do piloto; nao otimizar apenas conversao.
