# Avaliação da loja por link público

## Contexto e objetivo

A WeFood já coleta dados de cliente e de visita pela mão da atendente (`/clientes`, `/visitas/nova`). Falta a voz do próprio cliente: hoje não existe nenhum canal onde ele diga o que achou da loja.

Este módulo adiciona esse canal: um **link público, sem login**, que vira QR code em mesa/balcão. O cliente escaneia, dá uma nota de 1 a 5 e, se quiser, escreve um comentário. A equipe lê tudo numa tela interna com a média no topo.

Decisões de produto:

- **Acesso por link público fixo** (`/avaliar`), não por token de visita. Sem identificação do cliente — a avaliação é anônima.
- **Nota geral 1–5 + comentário opcional.** Sem critérios separados, sem NPS.
- **Tela de leitura interna** (`/avaliacoes`) já nesta entrega, com média geral no topo.
- **Sem anti-spam por enquanto.** Risco baixo num QR dentro da loja; entra quando virar problema.

## Modelo de dados

Nova migration em `packages/database/migrations/`, mesmo padrão das anteriores (tabela explícita, `CHECK` no lugar de tipo enum, sem ORM).

### `reviews`

| coluna | tipo | regras |
| --- | --- | --- |
| `id` | uuid | PK, `gen_random_uuid()` |
| `rating` | integer | not null, `CHECK (rating BETWEEN 1 AND 5)` |
| `comment` | text | opcional, `CHECK (char_length(comment) <= 1000)` |
| `created_at` | timestamptz | not null, default `now()` |

Duas diferenças propositais em relação a `clients`/`visits`:

- **Sem `updated_at`** — avaliação não é editável (não há tela de edição, e não haverá).
- **Sem FK para `clients` ou `visits`** — o link é anônimo por decisão de produto. Ligar avaliação a cliente é uma migration futura (`client_id` nullable), não um requisito de agora.

O `CHECK` no tamanho do comentário existe porque `POST /api/v1/reviews` é o **primeiro endpoint de escrita sem autenticação** do sistema: sem esse limite, qualquer um na internet grava texto ilimitado no banco.

## Modelo (`apps/web/src/models/review.js`)

No estilo de `client.js`:

- `create({ rating, comment })` → linha criada. Valida `rating` inteiro entre 1 e 5 e `comment` ≤ 1000 antes do INSERT (`ValidationError`), com `CHECK_VIOLATION` (`23514`) do Postgres como rede de segurança — mesmo tratamento de erro de `visit.js`.
- `findAll()` → todas as avaliações, mais recente primeiro.
- `getSummary()` → `{ total, average }` (`average` é `null` quando não há avaliações).

## API (`apps/web/src/app/api/v1/reviews/route.js`)

- `POST /api/v1/reviews` — **público, sem checagem de sessão**. Body `{ rating, comment? }` → `201` com a avaliação criada; `400` com `{ message, action }` em nota ausente/fora da faixa ou comentário longo demais.

Não existe `GET /api/v1/reviews`. A tela `/avaliacoes` é server component e chama `review.findAll()`/`review.getSummary()` direto, igual `/clientes/page.js` faz com `client.search()`. Endpoint de leitura só entra quando algo no browser precisar dele.

## Telas

- `/avaliar` — pública. Server component sem checagem de cookie (não existe middleware global de auth no projeto, então basta não checar), renderizando `review-form.js` (`"use client"`): 5 estrelas + textarea opcional + botão. Em caso de sucesso o formulário é substituído por um agradecimento — sem redirect, o visitante não tem para onde ir. Layout mobile-first, já que o acesso vem de QR code.
- `/avaliacoes` — interna. Checagem de sessão + `redirect("/login")`, igual `/clientes/page.js`. Média e total no topo, lista abaixo (estrelas, data, comentário), e uma linha discreta mostrando a URL pública para a equipe saber o que colocar no QR.
- Link "Avaliações" adicionado em `apps/web/src/app/page.js`, ao lado de "Clientes" e "Registrar visita".

Sem feature/permissão nova: qualquer usuário logado lê `/avaliacoes`, mesma regra de `/clientes`.

## Erros e validação

Mesmo padrão de `infra/errors.js`, resposta sempre `{ message, action }`:

- `ValidationError` (400) — nota ausente, não inteira ou fora de 1–5; comentário acima de 1000 caracteres.

Não há `NotFoundError` nem `UnauthorizedError` neste módulo: a escrita é pública e não há recurso buscado por id.

## Testes

TDD contra Postgres real, sem mocks (padrão do projeto via `tests/orchestrator.js`):

- **Modelo**: `tests/integration/models/review/` — `create` (com e sem comentário, nota inválida, comentário longo demais), `find-all` (ordem e lista vazia), `get-summary` (média e caso vazio).
- **API**: `tests/integration/api/v1/reviews/post.test.js` — o caso central é **criar avaliação sem nenhuma sessão** (201); mais nota ausente, nota fora da faixa e comentário longo demais (400).

## Fora de escopo (por agora)

- Vincular avaliação a cliente ou visita (token por visita, telefone no formulário).
- Anti-spam / rate limiting no endpoint público.
- Notas por critério (atendimento, produto, ambiente) e NPS.
- Redirecionar nota alta para avaliação no Google.
- Edição, exclusão ou resposta a avaliações.
- Dashboard/analytics — `/avaliacoes` é lista simples com média, não análise agregada.
- Geração do QR code dentro do sistema — a equipe gera o QR da URL por fora.
