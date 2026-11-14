# Fluxo de verificacao e acesso

## Responsabilidades

O marketplace classifica o recurso e protege sua origem. Identity & Access avalia evidencia e politica contratada e devolve resultado minimo. O fornecedor executa o metodo contratado. Nenhuma parte presume que outra aplicou controles sem autenticacao, contrato e evidencia auditavel.

## Sequencia conceitual

1. Visitante solicita uma midia adulta. A UI recebe apenas uma previa segura; nao recebe URL publica do original.
2. Marketplace informa restricao e apresenta links para termos e privacidade. O popup de idade nao aprova.
3. Backend autenticado do marketplace pede uma decisao contextual a Identity & Access, com referencia opaca do recurso, finalidade e escopos. Tenant e aplicacao derivam das credenciais servidor-servidor.
4. Servico verifica se ha evidencia elegivel, valida e adequada a policy version. Sem evidencia, responde `verification_required`.
5. Visitante conclui fluxo hospedado ou do fornecedor por URL temporaria e de uso limitado.
6. Callback autenticado e validado contra replay e duplicidade atualiza o estado. Resultado enviado pelo navegador nao e confiavel.
7. Backend do marketplace solicita decisao para aquela requisicao. Recusa, inconclusivo, expirado, erro ou timeout nao autorizam.
8. Se permitido, backend valida grant curto ligado a recurso, audience e escopo; obtém o objeto privado e transmite somente a variante autorizada.
9. Registrar auditoria minima e expirar/revogar grants conforme validade, mudanca de estado ou policy.

```text
Visitante -> UI Marketplace -> API Marketplace -> Identity & Access -> Provedor
                                  |                     ^              |
                                  |---- decisao --------|<-- callback--|
                                  |---- grant valido -> Storage privado
```

## Estados

`created`, `verification_required`, `pending_user`, `processing`, `verified`, `not_verified`, `inconclusive`, `manual_review`, `expired`, `cancelled`, `provider_error`, `revoked`.

Somente evidencia valida, nivel de garantia exigido e policy version vigente podem contribuir para `allow`. Sessao verificada nao significa acesso a qualquer recurso.

## Endpoints candidatos

- `POST /v1/verification-sessions`: cria sessao autorizada e idempotente.
- `GET /v1/verification-sessions/{id}`: consulta status minimo no mesmo tenant/app.
- `POST /v1/verification-sessions/{id}/cancel`: cancela sessao.
- `POST /v1/access-decisions`: avalia acesso contextual e retorna `allow`, `deny` ou `verification_required`.
- `POST /v1/access-grants`: opcional; emite grant curto depois de `allow`.
- `POST /v1/access-grants/{id}/revoke`: revoga grant.
- `POST /v1/provider-callbacks/{provider}`: callback assinado, com timestamp, anti-replay e deduplicacao.

O cliente nao envia `approved=true`, nao escolhe tenant pelo body nem relaxa policy. Dominios permitidos e CORS nao substituem autenticacao do backend.

## Contrato minimo de decisao

O pedido contem `resource_ref` opaca, `purpose`, escopos pretendidos e chave de idempotencia. Credencial determina tenant/app; servidor determina policy version, assurance, validade maxima e elegibilidade da evidencia. Resposta inclui decision ID, outcome, reason code minimo, policy version e expiracao. Grant, se houver, vincula recurso e audience. Nenhum body precisa de imagem ou documento.

## Falhas obrigatoriamente fechadas

| Situacao | Resultado | Midia |
|---|---|---|
| Evidencia elegivel | decisao contextual permitida | servir por backend/storage privado |
| Sem evidencia | `verification_required` | bloqueada |
| Recusada/expirada/revogada | `deny` | bloqueada |
| Inconclusiva | `manual_review` ou `deny` | bloqueada; alternativa/suporte |
| Provedor indisponivel/timeout | erro temporario | bloqueada; retry controlado |
| Callback falso, replay ou duplicado | rejeitar/ignorar idempotentemente e auditar | bloqueada |
| Grant errado, expirado ou de outro recurso | `deny` | nenhum byte do original |
| URL direta ao original | acesso negado no storage/CDN | nenhum byte |

## Reuso de evidencia

A exigencia de aferir a cada acesso nao deve virar uma aprovacao unica permanente. O backend solicita decisao para cada requisicao. Evidencia/credencial previamente verificada so pode ser reutilizada com escopo, contexto, prazo e metodo permitidos pelas regras aplicaveis. Nao presumir que precisa nova captura biometrica a cada clique nem fixar prazo sem validacao legal.

## Integracao futura com Lindas & Sexy

1. Cadastrar app/tenant e credenciais diferentes por ambiente.
2. Mapear classificacao das midias usando referencias opacas.
3. Mover originais para storage privado antes de ativar qualquer grant.
4. Proteger todas as entregas por backend/CDN autenticado e remover rotas/URLs antigas publicas.
5. Tratar o popup como aviso e encaminhamento; verificacao ocorre no fluxo central.
6. Testar resultado negativo, inconclusivo, offline e metodo alternativo.
7. Homologar bypass e contrato antes da ativacao. Esta fase nao altera a aplicacao marketplace.
