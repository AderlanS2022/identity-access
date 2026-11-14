# Seguranca e privacidade

## Governanca

Mapear controlador, operador e suboperadores por finalidade. Avaliar LGPD, dados pessoais sensiveis biometricos, direitos do titular, melhor interesse de criancas/adolescentes, ECA Digital e regras aplicaveis a cada conteudo e jurisdicao. Elaborar RIPD/DPIA antes de piloto biometrico. Este plano nao e parecer juridico nem certifica conformidade.

## Verificacao

Nao usar declaracao de idade ou estimativa facial isolada como comprovacao. Na primeira versao, avaliar fornecedores de verificacao documental e prova de vida com evidencias independentes de desempenho, vies, ataques, acessibilidade, retencao, suboperadores, localizacao e exclusao. Definir revisao manual e alternativa para quem nao consegue usar camera/documento.

Separar aviso etario, afericao de idade, verificacao de identidade civil e autorizacao do recurso. Aferir idade nao prova identidade; identidade nao aprova automaticamente cada acesso; aceitar termos nao comprova idade. A estimativa facial isolada nao deve ser tratada como evidência suficiente. Avaliar primeiro metodos menos intrusivos e credenciais verificaveis quando adequados.

Solicitar decisao do backend para cada requisicao a recurso restrito. Evidencia previamente verificada pode ser reutilizada apenas com escopo, audience, finalidade, validade e regra compatíveis; nao emitir desbloqueio permanente. A exigencia legal de afericao a cada acesso nao implica necessariamente nova captura facial a cada interacao: o mecanismo concreto e sua validade devem ser aprovados conforme regulamentacao e parecer juridico.

## Criptografia e credenciais

TLS moderno em transito; cifragem em repouso para banco, backups e objetos. Envelope encryption/KMS para dados que precisem ser retidos. Segredos fora do codigo, separados por ambiente, com rotacao, escopo, expiracao e revogacao. Hash de credencial client secret com algoritmo adequado; nunca registrar tokens.

## Controle de acesso

RBAC para painel e scopes para integracoes; menor privilegio, MFA para operacao, sessao curta, segregacao de funcao e revisao periodica. Break-glass com justificativa e alerta. Autorizacao por tenant e objeto em toda chamada. Protecao contra IDOR, CSRF quando cookies, SSRF em callbacks, replay, brute force e abuso de custos.

## Midia restrita

Originais em bucket privado, sem rota estaticamente publica. Proxy/endpoint de entrega revalida grant em cada acesso e gera versao apropriada. Preview borrado server-side; CSS blur nao protege a origem. Cache/CDN, thumbnails, backups e URLs antigas entram no threat model. Classificacao de moderador separa aprovacao editorial da liberacao por idade.

## Falhas

Conteudo restrito permanece bloqueado se Identity & Access estiver indisponivel, grant expirado ou callback inconclusivo. Produtos clientes precisam exibir erro recuperavel, retry controlado e suporte; nao manter autorizacao local indefinidamente. Acordar SLA, circuit breaker, fila e procedimento de contingencia sem bypass permissivo.

## Auditoria e resposta

Eventos append-only, sincronizacao de relogio, acesso restrito, integridade e alerta. Logs nao carregam PII, biometria, documentos, URLs assinadas ou corpo de callback. Plano de incidente inclui isolamento, revogacao de credenciais/grants, notificacao e preservacao de evidencias conforme orientacao juridica.

## Retencao e direitos

Inventariar cada campo, finalidade e prazo. Coletar apenas o minimo e apagar quando finalidade/base legal terminar, respeitando obrigacoes documentadas. Automatizar acesso/correcao/exclusao e propagacao a fornecedores; nao prometer apagamento de backups sem prazo operacional definido.

Separar termos de uso, aviso de privacidade e aviso de verificacao. O consentimento, quando aplicavel, deve ser especifico e separado; nao presumir que seja a base legal adequada para todo tratamento. Permissao tecnica de camera nao e base legal. Definir controladores/operadores e responsabilidades por finalidade entre marketplace, Identity & Access e fornecedor.

### Fluxo de acesso e falhas

Grant deve vincular tenant, application, recurso/audience, escopo, finalidade, policy version, evidencia elegivel, emissao e expiracao. Marketplace valida o grant no backend e entrega objeto privado. Resultado pendente, inconclusivo, expirado, recusado, callback invalido ou fornecedor indisponivel mantem bloqueio e oferece retry, alternativa ou suporte. Revogar ao expirar ou quando mudanca de estado/politica exigir.
