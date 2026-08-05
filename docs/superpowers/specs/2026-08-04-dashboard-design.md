# Módulo Dashboard

## Contexto e objetivo

O cadastro de clientes e o registro de visitas (`251bd27`..`c32b856`) já coletam dados de quem visita a loja, quanto gasta, por que veio e de onde conheceu a WeFood. Até agora esses dados só podem ser lidos um cliente por vez, na ficha individual — não há nenhuma visão agregada.

Este módulo entrega essa visão: uma tela `/dashboard` que responde, para um período escolhido, quatro perguntas de gestão:

1. **Movimento e faturamento** — quantas visitas, quanto entrou, ticket médio, e como isso evoluiu no período.
2. **Marketing** — de onde os clientes conheceram a loja e por que vieram.
3. **Produto** — quais categorias foram pedidas e qual o ticket médio de cada uma.
4. **Clientes** — novos x recorrentes, quem mais gastou, de que bairros vêm, quem registrou as visitas, e quem faz aniversário no mês.

O dashboard é somente leitura. Nenhuma tabela nova é criada: tudo sai de `clients`, `visits`, `visit_order_items` e `users`.

## Decisões de arquitetura

**Model granular, página Server Component, sem rota de API.** `models/dashboard.js` expõe uma função por pergunta; a página `/dashboard` chama o model direto, como `/clientes` já faz. Não existe hoje nenhum consumidor dos dados agregados além da própria página, então uma rota de API seria uma camada sem uso — e a página perderia a renderização no servidor.

**Sem biblioteca de gráficos.** Cards com os números e barras feitas com `div` + Tailwind. Zero dependência nova, zero componente client, tudo renderizado no servidor.

**Sem componente client em todo o módulo.** O filtro de período são `<Link>`s que trocam `?periodo=` e recarregam a página. Nenhum arquivo do módulo leva `"use client"`.

## Período

Quatro atalhos, expostos pelo model como `PERIODS`:

| chave | rótulo | intervalo | granularidade do gráfico |
| --- | --- | --- | --- |
| `hoje` | Hoje | da meia-noite de hoje até agora | hora |
| `7d` | 7 dias | hoje mais os 6 dias anteriores | dia |
| `30d` | 30 dias | hoje mais os 29 dias anteriores | dia |
| `90d` | 90 dias | hoje mais os 89 dias anteriores | semana |

Padrão: `30d`. Chave ausente ou desconhecida na URL cai no padrão em vez de quebrar a página.

São dias de calendário, não janelas de 24 horas — é como o gestor da loja pensa em "últimos 7 dias".

### Fuso horário

Todas as fronteiras de dia são calculadas em `America/Sao_Paulo`, nunca em UTC. Em UTC, "hoje" começaria às 21h do dia anterior no horário da loja e as visitas da noite cairiam no dia errado.

`resolveRange` deriva o deslocamento do fuso via `Intl.DateTimeFormat` (`timeZone: "America/Sao_Paulo"`, `timeZoneName: "longOffset"`) na data de referência, em vez de fixar `-03:00` no código — assim continua correto se o horário de verão voltar. A constante `STORE_TIMEZONE` fica no topo do model e é usada tanto no JS quanto nas queries que agrupam por dia.

## Model (`apps/web/src/models/dashboard.js`)

### Resolução do período

```js
resolveRange(periodKey, now = new Date())
// → { key, label, from, to, granularity }
```

`from` e `to` são `Date` (instantes absolutos); `granularity` é `"hour" | "day" | "week"`. O parâmetro `now` é injetável para os testes serem determinísticos.

### Funções de consulta

Todas recebem `{ from, to }` e filtram `visits` por `created_at >= from AND created_at <= to` (ambas as fronteiras inclusivas).

| função | retorno |
| --- | --- |
| `summary({ from, to })` | `{ visits, revenue, averageTicket, clientsServed }` |
| `timeline({ from, to, granularity })` | `[{ bucket, visits, revenue }]`, série completa |
| `byDiscoverySource({ from, to })` | `[{ value, visits, percentage }]` |
| `byReason({ from, to })` | `[{ value, visits, percentage }]` |
| `byCategory({ from, to })` | `[{ value, visits, percentage, averageTicket }]` |
| `newVsReturningClients({ from, to })` | `{ newClients, returningClients }` |
| `topClients({ from, to, limit = 10 })` | `[{ id, name, visits, revenue }]` |
| `byNeighborhood({ from, to })` | `[{ neighborhood, city, visits }]` |
| `byCollaborator({ from, to })` | `[{ userId, name, visits, revenue }]` |
| `birthdaysOfMonth(month)` | `[{ id, name, phone, day }]` |
| `getOverview({ from, to, granularity })` | composição de todas, em `Promise.all` |

Detalhes que não são óbvios pela assinatura:

- **`summary.averageTicket`** sai de `COALESCE(AVG(amount_spent), 0)` — período vazio devolve `0`, sem divisão por zero. `clientsServed` é `COUNT(DISTINCT client_id)`.
- **`timeline`** usa `generate_series` em `LEFT JOIN` com as visitas agrupadas por `date_trunc($granularity, created_at AT TIME ZONE 'America/Sao_Paulo')`, para que horas/dias/semanas sem movimento apareçam como `visits: 0` em vez de sumirem da série. `granularity` é validada contra a lista fechada antes de ir para a query, e o intervalo do `generate_series` (`1 hour`/`1 day`/`1 week`) vem do mesmo mapa.
- **`timeline.bucket`** é uma **string** no formato `YYYY-MM-DDTHH:MM:SS`, produzida por `to_char`, representando a hora de parede em São Paulo. Não é um `Date`: devolver `Date` faria o horário ser reinterpretado no fuso do processo Node e o rótulo do gráfico sair deslocado. Como string, o que o model devolve é exatamente o que a tela mostra, e o teste consegue afirmar o valor exato.
- **`byDiscoverySource` / `byReason`** agrupam pela coluna, ordenam por `visits DESC` e calculam `percentage` sobre o total de visitas do período. Valores sem nenhuma visita no período são omitidos — a lista mostra o que aconteceu, não todas as opções possíveis.
- **`percentage`** é um `Number` de 0 a 100 arredondado em uma casa decimal, calculado no JS a partir das contagens (não no SQL), para que as porcentagens e os totais nunca discordem por arredondamento no banco.
- **`birthdaysOfMonth(month)`** recebe o mês como número de 1 a 12.
- **`byCategory`** conta `COUNT(DISTINCT v.id)` por categoria e calcula `averageTicket` como a média de `amount_spent` das visitas que incluíram aquela categoria. Como uma visita pode ter várias categorias, as porcentagens somam mais de 100% — a tela avisa isso explicitamente.
- **`newVsReturningClients`**: cliente **novo** é aquele cuja primeira visita registrada (`MIN(created_at)` sobre *todas* as visitas dele, sem filtro de período) cai dentro do período; **recorrente** é quem visitou no período mas já tinha visita anterior a ele. Conta clientes distintos, não visitas.
- **`topClients`** ordena por `revenue DESC`, depois `visits DESC`, depois `name` — o desempate por nome deixa o resultado estável entre execuções.
- **`byNeighborhood`** agrupa por `(neighborhood, city)` e devolve os nulos como `null`; a formatação "Não informado" é da tela, não do model.
- **`byCollaborator`** usa `LEFT JOIN users`, então visitas com `registered_by` nulo (usuário removido) viram uma linha com `userId: null`.
- **`birthdaysOfMonth`** filtra `EXTRACT(MONTH FROM birth_date) = $1`, ignora clientes sem data de nascimento e ordena por dia e nome. **Não** usa o filtro de período: é sempre o mês corrente. `getOverview` a chama com o mês atual em `America/Sao_Paulo`.

### Normalização de tipos

O driver `pg` devolve `numeric` **e** `bigint` (`COUNT`) como string. Toda função converte esses campos para `Number` antes de retornar, para a página e os testes receberem números. É a fronteira do model que faz isso — nenhum consumidor precisa saber que veio string.

## Rótulos compartilhados (`apps/web/src/models/visit-options.js`)

Os rótulos em português de categoria, motivo e origem estão hoje duplicados em `visitas/nova/register-visit-flow.js` e `clientes/[id]/page.js`. O dashboard seria a terceira cópia.

Novo módulo exporta `CATEGORY_OPTIONS`, `REASON_OPTIONS` e `DISCOVERY_OPTIONS` (listas de `{ value, label }`, na ordem de exibição) e os mapas `value → label` derivados delas. Os dois arquivos existentes passam a importar de lá e perdem suas constantes locais; o dashboard também importa. Os valores continuam batendo com os `CHECK` das tabelas.

Refatoração de escopo fechado: só move os rótulos, sem mudar comportamento nem tocar em nada além desses dois arquivos.

## Permissão

Nova migration insere a feature `dashboard.visualizar` ("Visualizar dashboard") em `features`, seguindo o estilo da migration de `users`/`sessions` (`pgm.sql` com `escapeLiteral`). O `down` remove a linha.

`role_features` não é tocada: o admin já enxerga tudo por `is_super`, e o colaborador começa sem a permissão — o admin concede quando quiser.

A página `/dashboard` chama `notFound()` para usuário sem a permissão, mesmo padrão de `/admin/colaboradores`, e `redirect("/login")` para quem não tem sessão. O link no home aparece só para quem pode ver, via `authorization.userCan`.

## Telas (`apps/web/src/app/dashboard/`)

Todos Server Components:

- `page.js` — autenticação, permissão, `resolveRange`, `getOverview` e a montagem das seções.
- `period-filter.js` — os quatro `<Link>` de período, destacando o ativo.
- `stat-card.js` — card de número grande com rótulo.
- `bar-list.js` — lista de barras horizontais: `[{ label, value, percentage, note }]`, largura da barra proporcional à maior linha. Reaproveitado por marketing, produto, bairros e colaboradores.
- `timeline-chart.js` — barras verticais do movimento, altura proporcional ao maior valor.
- `format.js` — `Intl.NumberFormat` pt-BR para moeda e números, e a formatação do rótulo de cada bucket a partir da string `YYYY-MM-DDTHH:MM:SS` (`"14h"`, `"04/08"`, `"04/08 – 10/08"`), por recorte da própria string, sem reconstruir um `Date`.

Seções da página, em ordem:

1. **Resumo** — quatro cards: Visitas · Faturamento · Ticket médio · Clientes atendidos.
2. **Movimento no período** — `timeline-chart`, com visitas e faturamento por bucket.
3. **Marketing** — duas `bar-list`: "De onde conheceram a loja" e "Por que vieram", cada linha com contagem e porcentagem.
4. **Produto** — `bar-list` das categorias, com o ticket médio como `note` de cada linha, e a observação de que uma visita pode ter mais de uma categoria.
5. **Clientes** — novos x recorrentes (dois números), top 10 por total gasto (tabela com link para a ficha), bairros/cidades e visitas por colaborador.
6. **Aniversariantes do mês** — nome, telefone e dia, com o aviso de que essa seção ignora o filtro de período.

## Erros e estados vazios

Período sem visitas: cards zerados, ticket médio `R$ 0,00`, gráfico com todas as barras em zero e cada lista com "Sem dados no período". Nenhuma dessas situações é erro — nenhuma exceção é lançada e nenhum `NotFoundError` é usado para "não há dados".

Bairro, cidade e colaborador nulos viram "Não informado" na tela.

## Testes

TDD contra Postgres real, sem mocks, seguindo `tests/orchestrator.js`.

**Fixture nova no orquestrador.** As tabelas preenchem `created_at` com `now()` e `visit.create` não aceita data, mas o dashboard só faz sentido com visitas espalhadas no tempo. `tests/orchestrator.js` ganha `createVisitAt({ clientId, createdAt, ... })`: cria a visita pelo `visit.create` real e depois ajusta `created_at` com um `UPDATE`. Assim os testes exercitam o caminho de inserção de verdade e ainda controlam a data.

**Unitários** (`tests/unit/models/dashboard/resolve-range.test.js`): cada chave de período com um `now` fixo, chave inválida e ausente caindo em `30d`, mapeamento de granularidade, e a fronteira de fuso — um `now` às 00h30 UTC deve resolver "hoje" para o dia anterior em São Paulo.

**Integração** (`tests/integration/models/dashboard/`), um arquivo por função:

- `summary` — totais, ticket médio, clientes distintos, período vazio devolvendo zeros.
- `timeline` — agrupamento por hora/dia/semana, buckets sem visita presentes com zero, e o `bucket` saindo como string de hora de parede em São Paulo (uma visita às 23h de São Paulo cai no dia dela, não no seguinte em UTC).
- `by-discovery-source` e `by-reason` — contagem, porcentagem, ordenação, valores sem visita omitidos.
- `by-category` — visita com várias categorias contada uma vez em cada, ticket médio por categoria, soma de porcentagens acima de 100%.
- `new-vs-returning-clients` — cliente cuja primeira visita está no período conta como novo; cliente com visita anterior conta como recorrente; cliente com duas visitas no período conta uma vez.
- `top-clients` — ordenação por total gasto, desempate, respeito ao `limit`.
- `by-neighborhood` — agrupamento e bairro/cidade nulos.
- `by-collaborator` — contagem por usuário e `registered_by` nulo virando linha com `userId: null`.
- `birthdays-of-month` — filtro por mês, ordenação por dia, clientes sem data de nascimento fora.
- `get-overview` — composição: todas as chaves presentes e coerentes com as funções individuais.

Fronteiras de período são testadas em `summary`: visita exatamente em `from` e exatamente em `to` entram; um segundo antes de `from` fica fora.

## Fora de escopo

- Comparação com o período anterior ("+12% vs. mês passado") e metas.
- Exportação (CSV/PDF) e impressão.
- Datas customizadas no filtro — só os quatro atalhos.
- Filtros cruzados (por colaborador, por categoria, por bairro).
- Cache/materialização das agregações: o volume de uma loja não justifica, as queries batem direto nas tabelas.
- Gráficos interativos (tooltip, zoom, drill-down).
- Dados de estoque, caixa ou custo — não existem no schema; o dashboard só enxerga visitas.
