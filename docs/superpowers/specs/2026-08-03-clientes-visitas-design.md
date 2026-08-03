# Cadastro de clientes e registro de visitas

## Contexto e objetivo

A WeFood quer reunir dados de clientes e de suas intenções/perfil para embasar decisões de marketing (o que a loja deve fazer, pra quem, e como). Esta é a primeira feature de negócio construída sobre a base de autenticação já existente (`05f3a05`).

Duas features, entregues juntas por serem dependentes uma da outra:

1. **Cadastro de cliente** — dados básicos do cliente.
2. **Registro de visita** — o que o cliente pediu, quanto gastou, o motivo de estar na loja e de onde conheceu a loja. Cada campo de escolha fechada vem acompanhado de um campo aberto, para a atendente registrar nuances que as opções fixas não cobrem.

Quem preenche o sistema é a atendente, durante ou logo após o atendimento — perguntando ao cliente os dados de motivo/origem/pedido e digitando as respostas.

## Modelo de dados

Nova migration em `packages/database/migrations/`, seguindo o padrão já usado na migration de `users`/`sessions` (tabelas explícitas, `CHECK` constraint no lugar de tipo enum, sem ORM).

### `clients`

| coluna | tipo | regras |
| --- | --- | --- |
| `id` | uuid | PK, `gen_random_uuid()` |
| `name` | text | not null |
| `phone` | text | not null, unique |
| `birth_date` | date | opcional |
| `neighborhood` | text | opcional |
| `city` | text | opcional |
| `created_at` | timestamptz | not null, default `now()` |
| `updated_at` | timestamptz | not null, default `now()` |

`phone` é único porque é a chave de busca no fluxo de registro de visita (a atendente busca o cliente pelo telefone antes de tudo).

### `visits`

| coluna | tipo | regras |
| --- | --- | --- |
| `id` | uuid | PK, `gen_random_uuid()` |
| `client_id` | uuid | not null, FK → `clients`, `ON DELETE CASCADE` |
| `registered_by` | uuid | FK → `users`, `ON DELETE SET NULL` — atendente logada que registrou a visita |
| `amount_spent` | numeric(10,2) | not null, default `0`, `CHECK (amount_spent >= 0)` |
| `order_details` | text | opcional — campo aberto sobre o pedido |
| `reason` | text | not null, `CHECK` em (`vontade_comer_beber`, `programa_familia_amigos`, `comemoracao`, `passando_em_frente`, `outro`) |
| `reason_details` | text | opcional — campo aberto do motivo |
| `discovery_source` | text | not null, `CHECK` em (`instagram`, `indicacao`, `google_internet`, `passou_em_frente`, `cliente_antigo`, `outro`) |
| `discovery_details` | text | opcional — campo aberto da origem |
| `created_at` | timestamptz | not null, default `now()` — data/hora da visita |
| `updated_at` | timestamptz | not null, default `now()` |

Não existe campo de data editável: a visita é registrada em tempo real, `created_at` já é a data/hora da visita.

### `visit_order_items`

Multi-seleção de categoria do que foi pedido (uma visita pode ter mais de uma categoria).

| coluna | tipo | regras |
| --- | --- | --- |
| `visit_id` | uuid | not null, FK → `visits`, `ON DELETE CASCADE` |
| `category` | text | not null, `CHECK` em (`sorvete`, `milkshake`, `lanche`, `bebida`, `sobremesa`, `outro`) |

PK composta (`visit_id`, `category`).

Segue o mesmo padrão relacional de `role_features`, já existente no schema.

## API (`apps/web/src/app/api/v1/...`)

Todas as rotas exigem sessão válida (mesmo padrão de `GET /api/v1/user`: lê `session_id` do cookie, resolve com `models/authentication`, 401 se não autenticado). Sem checagem de feature/permissão — qualquer usuário logado (admin ou colaborador) pode usar.

- `POST /api/v1/clients` — cria cliente. Body: `name`, `phone`, `birth_date?`, `neighborhood?`, `city?`.
- `GET /api/v1/clients?phone=...` — busca exata por telefone. Usado no fluxo de registrar visita.
- `GET /api/v1/clients?search=...` — busca por nome (contains, case-insensitive). Usado na listagem.
- `GET /api/v1/clients/[id]` — detalhe do cliente + lista de visitas (mais recente primeiro).
- `POST /api/v1/clients/[id]/visits` — registra visita. Body: `amount_spent`, `order_categories[]`, `order_details?`, `reason`, `reason_details?`, `discovery_source`, `discovery_details?`.

## Modelos (`apps/web/src/models/`)

- `client.js` — `create`, `findByPhone`, `findById`, `search({ name })`.
- `visit.js` — `create({ clientId, registeredBy, ... })`, `findByClientId(clientId)`.

## Telas

- `/clientes` — listagem com busca por nome, botão "novo cliente".
- `/clientes/novo` — formulário de cadastro básico (nome, telefone, nascimento, bairro, cidade).
- `/clientes/[id]` — dados do cliente + histórico de visitas + botão "registrar visita".
- `/visitas/nova` — busca por telefone:
  - se achar o cliente, mostra os dados e segue pro formulário de visita;
  - se não achar, mostra cadastro rápido (nome + telefone obrigatórios, demais campos opcionais) e, ao salvar, segue pro formulário de visita.
- Formulário de visita: categorias do pedido (checkboxes, múltipla escolha) + campo aberto de detalhe; valor gasto (obrigatório, aceita zero); motivo (rádio, escolha única) + campo aberto de detalhe; origem (rádio, escolha única) + campo aberto de detalhe.

## Erros e validação

Mesmo padrão de `infra/errors.js`:

- `ValidationError` (400) — telefone duplicado ao criar cliente, campos obrigatórios ausentes, nenhuma categoria de pedido selecionada, `amount_spent` negativo, `reason`/`discovery_source`/`category` fora da lista fechada.
- `NotFoundError` (404) — `client_id` inexistente ao registrar visita.
- `UnauthorizedError` (401) — sem sessão válida.

Todas retornam `{ message, action }`, igual ao formato já usado nas rotas existentes.

## Testes

TDD contra Postgres real, sem mocks (padrão do projeto via `tests/orchestrator.js`):

- **Modelos**: `tests/integration/models/client/` (create, find-by-phone, find-by-id, search — incluindo telefone duplicado) e `tests/integration/models/visit/` (create, find-by-client-id — incluindo categoria/motivo/origem inválidos).
- **API**: `tests/integration/api/v1/clients/` (POST, GET por telefone, GET por busca, GET `[id]`) e `tests/integration/api/v1/clients/[id]/visits/` (POST — sucesso, client_id inexistente, campos obrigatórios ausentes, valor fora do padrão, 401 sem sessão).

## Fora de escopo (por agora)

- Edição/exclusão de cliente ou visita.
- Tabelas de referência editáveis para as listas fechadas (motivo, origem, categoria) — hoje são `CHECK` fixo; migrar pra tabela de referência é um passo futuro se a lista precisar mudar sem deploy.
- Catálogo de produtos/cardápio — "o que pediu" fica em categorias fechadas + texto livre, não itens de um cardápio cadastrado.
- Dashboard de analytics/marketing sobre os dados coletados — este projeto cobre cadastro e listagem simples, não análise agregada.
- Endereço completo do cliente (rua, número, CEP) — só bairro e cidade.
