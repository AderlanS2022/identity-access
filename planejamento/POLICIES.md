# Politicas e avisos - proposta para revisao juridica

Este documento inventaria textos e regras necessarios. Nao e termo final, parecer juridico ou garantia de conformidade. Qualquer texto publicado requer revisao juridica e deve ser revisto quando mudarem lei, regulacao, fornecedor ou finalidade.

## Documentos separados

1. **Termos do marketplace**: contrato entre visitante e Lindas & Sexy, elegibilidade, conduta, contas, denuncias, suspensao e canais de contato.
2. **Aviso de privacidade do marketplace**: controlador, finalidades, dados, bases legais, compartilhamentos, retencao, direitos e contato do encarregado.
3. **Aviso de afericao de idade**: responsavel por cada etapa, metodo, finalidade, dados tratados, fornecedor, resultado, validade, alternativas e suporte.
4. **Termos B2B e aviso do Identity & Access**: escopo do servico central, papeis de cada parte, seguranca, auditoria, disponibilidade e retencao. A relacao com a aplicacao cliente e diferente do contrato com o visitante.
5. **Acordo de tratamento de dados (DPA)**: instrucoes, papeis, suboperadores, confidencialidade, incidentes, direitos, transferencias e descarte entre marketplace, Identity & Access e fornecedor.
6. **Politica de conteudo e moderacao**: publicacao, classificacao, denuncia, revisao, remocao e preservacao legal. Aferir idade nao substitui moderacao.

Todos devem ter versao, data de vigencia e historico. Aviso de privacidade nao deve ficar escondido dentro do aceite de termos. Consentimento, quando for a base legal aplicavel, deve ser especifico e separado; nao presumir que o aceite contratual sirva para biometria. Permissao tecnica da camera tambem nao define base legal.

## Avaliacao do popup descrito

Pela descricao do responsavel, o popup pergunta se a pessoa tem 18 anos ou mais e registra aceite dos termos. Ele pode informar a classificacao, permitir que quem responda "nao" saia e disponibilizar links para termos e privacidade. A resposta "sim" e o aceite nao comprovam maioridade e nao devem gerar uma flag permanente `isAdult` nem liberar a midia restrita por si so.

Para conteudo abrangido pelo art. 9 do ECA Digital, a lei exige medidas eficazes e mecanismo confiavel de afericao a cada acesso, vedando autodeclaracao como mecanismo suficiente. Assim, "sim" deve encaminhar para um mecanismo real de afericao quando aplicavel; "nao", abandono, falha, recusa, expiracao ou resultado inconclusivo mantem o recurso restrito bloqueado.

Isso nao significa automaticamente capturar novamente o rosto em cada clique. O backend deve avaliar cada requisicao de acesso, podendo considerar evidencia ou credencial valida e contextualizada se o metodo e a regra vigente permitirem. Escopo, finalidade, aplicacao, recurso e validade devem limitar qualquer reutilizacao. A politica concreta e a interpretacao da afericao por acesso precisam de revisao juridica.

## Experiencia recomendada

- Antes de conteudo restrito, informar classificacao e disponibilizar termos e aviso de privacidade.
- O popup de idade e aviso/triagem, nunca resultado de verificacao.
- Antes de abrir camera/documento, explicar finalidade, metodo, dados, fornecedor, retencao, alternativas e suporte.
- Separar aceite contratual, leitura do aviso e consentimento especifico quando aplicavel.
- Resultado aprovado permite pedir decisao contextual para um recurso, nao desbloqueio global permanente.
- Resultado inconclusivo ou indisponibilidade oferece retry, alternativa ou revisao conforme a politica, mantendo o original protegido.
- Oferecer sair, pedir ajuda e canais para exercer direitos sem UX coercitiva.

## Politicas funcionais do servico

- **Afericao de idade**: metodos aceitos por risco/contexto, assurance level, versao, validade, alternativa, erro e contestacao.
- **Verificacao de identidade**: fluxo separado, usado somente quando identidade civil for necessaria.
- **Autorizacao**: audience, recurso, escopo, finalidade, validade curta, revogacao e decisao por requisicao.
- **Biometria e fornecedor**: sem uso para treinamento ou outras finalidades por padrao; contrato deve fixar processamento, descarte, suboperadores e incidentes.
- **Midia**: aprovacao editorial separada da restricao etaria; originais privados; denuncia, revisao e exclusao documentadas.
- **Retencao e direitos**: prazo por categoria, acesso/correcao/exclusao, legal hold, backups e confirmacao de descarte do fornecedor.

## Referencias oficiais consultadas em 14/11/2026

- [Lei 15.211/2025 - ECA Digital](https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/l15211.htm)
- [Decreto 12.880/2026](https://bibliotecadigital.mj.gov.br/bitstream/1/16842/1/DEC_PR_2026_12880.html)
- [ANPD - ECA Digital e afericao de idade](https://www.gov.br/anpd/pt-br/assuntos/eca-digital)
- [ANPD - orientacoes preliminares para afericao confiavel](https://www.gov.br/anpd/pt-br/assuntos/eca-digital/mecanismos-confiaveis-de-afericao-de-idade-orientacoes-preliminares.pdf)
- [LGPD - Lei 13.709/2018](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)

Orientacoes da ANPD e regulamentacao estao em evolucao. Reconsultar atos vigentes antes do piloto e da publicacao dos textos. Este documento nao afirma que o popup ou o produto atual estejam conformes; o codigo do Lindas & Sexy nao foi inspecionado nesta revisao.
