# Visita sem cliente e sem compra

## Contexto e objetivo

Hoje toda visita exige um cliente, e todo cliente exige um telefone. O fluxo de `/visitas/nova` começa pela busca por telefone: sem telefone não há cliente, sem cliente não há visita. `visits.client_id` é `NOT NULL` e `visit.create()` rejeita qualquer visita sem ao menos uma categoria de pedido.

Isso deixa de fora dois casos reais do balcão:

1. **A pessoa não quer deixar contato.** Ela veio, consumiu, e não quis dar o telefone. Hoje o atendente ou inventa um telefone ou não registra a visita.
2. **A pessoa entrou e não comprou nada.** Olhou, não quis, saiu. Hoje isso é invisível para o sistema — e é exatamente o dado que diz se a loja está convertendo quem entra.

O objetivo é desacoplar três coisas que hoje andam grudadas: **a visita aconteceu**, **quem foi** e **o que comprou**. A visita passa a ser o registro central e sempre existe; o contato e a compra viram opcionais.

O que **continua obrigatório em toda visita** é justamente o que dá valor de gestão ao registro: o **motivo da visita** e **de onde a pessoa conheceu a loja**.

## Decisões de arquitetura

**Visita anônima, não cliente anônimo.** Quando não há contato, `visits.client_id` fica `NULL`. Não se cria cliente-fantasma nem se afrouxa `clients.phone`, que continua `NOT NULL` + `UNIQUE` e segue sendo a chave de busca do fluxo. A tabela `clients` continua sendo o cadastro de quem de fato deixou telefone — que é o que a torna útil para marketing.

**"Comprou" é derivado, não armazenado.** Uma visita teve compra se existe ao menos uma linha em `visit_order_items` apontando para ela. Nenhuma coluna nova. A alternativa — um booleano `purchased` — cria um segundo lugar onde mora a mesma verdade, e um estado onde o banco afirma "comprou" sem ter nenhum item; o dashboard passaria a mentir sem ninguém perceber. O custo da derivação é um `EXISTS` nas queries de métrica, e o dashboard já faz join em `visit_order_items` para o gráfico de categorias.

**A não-compra é explícita na interface, derivada no banco.** O atendente marca "Não comprou nada"; o que chega ao banco é simplesmente uma visita sem itens. A explicitação vive na UI (onde evita o preenchimento incompleto se passar por não-compra) sem virar estado duplicado no schema.

## Schema

Uma migration, duas alterações em `visits`:

```sql
ALTER TABLE visits ALTER COLUMN client_id DROP NOT NULL;

ALTER TABLE visits DROP CONSTRAINT visits_client_id_fkey;
ALTER TABLE visits ADD CONSTRAINT visits_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;
```

`reason` e `discovery_source` **permanecem** `NOT NULL`, com os mesmos `CHECK` de hoje. `amount_spent` permanece `NOT NULL DEFAULT 0` com `CHECK (amount_spent >= 0)` — uma visita sem compra grava `0`, não `NULL`.

Sobre a troca de `ON DELETE CASCADE` para `ON DELETE SET NULL`: **não existe rota de exclusão de cliente na aplicação hoje**, então isso não corrige nenhum bug em produção. É uma correção de semântica que só se torna possível agora que `client_id` é anulável — apagar um contato passa a anonimizar a visita em vez de destruir o faturamento daquele dia junto. Custa uma linha na migration que já vai ser escrita.

A migration de `down` reverte a FK para `CASCADE` e restaura o `NOT NULL`. Restaurar o `NOT NULL` falha se já houver visitas anônimas gravadas — o que é o comportamento correto: reverter destruiria dados.

## Model (`apps/web/src/models/visit.js`)

`create()` muda em dois pontos:

- **`clientId` passa a ser opcional**, `null` por padrão. Continua validado quando presente: id inexistente ou não-uuid seguem levantando `NotFoundError`, como hoje.
- **A regra "selecione ao menos uma categoria" deixa de ser absoluta.** `orderCategories` vazio passa a significar não-compra, que é válida.

Entra uma regra de coerência no lugar da que saiu:

> `orderCategories` vazio com `amountSpent > 0` levanta `ValidationError`: *"Uma visita sem compra não pode ter valor gasto."*

Zerar o valor em silêncio seria mais permissivo, mas esconderia um erro do chamador numa fronteira de API. O erro explícito é preferível.

`findByClientId()` não muda — visitas anônimas simplesmente não aparecem em ficha nenhuma, por definição.

## API

Hoje só existe `POST /api/v1/clients/[id]/visits`, com o cliente no caminho da URL. Visita anônima não tem caminho possível nessa rota.

Entra **`POST /api/v1/visits`** como rota canônica, com `client_id` opcional no corpo:

```json
{
  "client_id": "uuid ou ausente/null",
  "amount_spent": 0,
  "order_categories": [],
  "order_details": null,
  "reason": "passando_em_frente",
  "reason_details": null,
  "discovery_source": "passou_em_frente",
  "discovery_details": null
}
```

A rota aninhada **continua existindo** — a ficha do cliente tem um botão "Registrar visita" que já leva o cliente escolhido, e há testes de integração cobrindo-a. Para as duas não divergirem, o corpo do handler (leitura da sessão, parse do corpo, validação dos campos obrigatórios, tradução de `ValidationError`/`NotFoundError` em 400/404) sai para uma função compartilhada que ambas chamam. A rota aninhada passa o `client_id` do caminho; a nova, o do corpo.

Respostas: `201` com a visita criada, `400` para corpo inválido ou incoerente, `401` sem sessão, `404` para `client_id` inexistente.

## Telas (`apps/web/src/app/(app)/visitas/nova/`)

**Etapa de busca.** Abaixo do campo de telefone e do botão "Buscar", entra um botão secundário **"Registrar sem contato"**, que pula direto para o formulário com `foundClient` em `null`. O campo de telefone deixa de ser um portão: passa a ser um dos dois caminhos.

**Formulário.** No topo, um toggle **"Não comprou nada"**. Marcado, ele esconde as seções "O QUE PEDIU" e "Valor gasto" e zera ambos os estados. Motivo da visita e "de onde conheceu a loja" seguem sempre visíveis e obrigatórios, em qualquer combinação.

**Cabeçalho do formulário.** Com cliente, continua mostrando nome e "Nª visita · última <data>". Sem cliente, mostra "Visita sem contato" — o formulário nunca fica sem cabeçalho.

As quatro combinações (com/sem contato × com/sem compra) são todas válidas e alcançáveis.

## Dashboard (`apps/web/src/models/dashboard/`)

Visitas sem compra entram na base e distorcem três números que hoje assumem que toda visita é uma venda.

**`movement.js` — `summary()`.** `average_ticket` hoje é `AVG(amount_spent)` sobre todas as visitas do período; passa a ser a média só sobre as visitas com compra. `visits` e `revenue` não mudam: o total de visitas passa a incluir as sem compra (é o número honesto de movimento) e o faturamento não se altera, porque as sem compra somam zero.

Entra **`conversionRate`**: visitas com compra ÷ total de visitas do período, exposto como um card **Taxa de conversão**. Reutiliza o `percentageOf()` de `numbers.js`, que já devolve `0` quando o total é zero — um período sem nenhuma visita mostra 0%, não quebra a página.

Nos dois casos o período pode não ter nenhuma visita com compra, e aí `AVG` devolve `NULL`: o ticket médio mantém o `COALESCE(..., 0)` que já existe.

**`product.js` — `byCategory()`.** O denominador dos percentuais é `(SELECT COUNT(*) FROM period_visits)`, ou seja, todas as visitas. Passa a contar só as visitas com compra. Sem isso, cada categoria teria seu percentual diluído por visitas que nunca poderiam ter pedido nada, e a nota de rodapé da tela ("uma visita pode ter mais de uma categoria, então as porcentagens somam mais de 100%") deixaria de fazer sentido.

**`clients.js`.** Nenhuma query muda: todos os `JOIN clients c ON c.id = v.client_id` descartam `client_id` nulo naturalmente. O significado passa a ser "entre os clientes identificados", que é o que sempre foi.

**Rename de rótulo.** `clients_served` é `COUNT(DISTINCT client_id)`, que já ignora `NULL`. Com visitas anônimas na base, o card "Clientes atendidos" passaria a exibir menos gente do que a loja de fato atendeu. O rótulo na tela muda para **"Clientes identificados"** — o número não muda, só passa a dizer a verdade sobre si mesmo.

## Testes

TDD contra Postgres real, como o resto do projeto.

**Model (`tests/integration/models/visit/`)**
- cria visita sem `clientId` → persiste com `client_id` nulo
- cria visita sem categorias → persiste, `amount_spent` zero, sem linhas em `visit_order_items`
- cria visita sem categorias com `amountSpent > 0` → `ValidationError`
- cria visita anônima e sem compra ao mesmo tempo → persiste, com motivo e origem gravados
- apagar um cliente com visitas → visitas sobrevivem com `client_id` nulo (`ON DELETE SET NULL`)

**API (`tests/integration/api/v1/visits/`)**
- `POST /api/v1/visits` sem `client_id` → 201
- `POST /api/v1/visits` com `client_id` válido → 201, visita associada
- `POST /api/v1/visits` com `client_id` inexistente → 404
- `POST /api/v1/visits` sem motivo ou sem origem → 400
- `POST /api/v1/visits` sem sessão → 401
- a rota aninhada continua passando nos testes que já existem

**Dashboard (`tests/integration/models/dashboard/`)**
- ticket médio ignora visitas sem compra
- faturamento e contagem de visitas incluem as sem compra
- taxa de conversão com mistura de visitas com e sem compra
- percentuais de categoria usam só visitas com compra como denominador

## Fora de escopo

- **Editar ou apagar visitas.** Não existe hoje e este spec não introduz.
- **Anexar um contato a uma visita anônima depois.** Plausível como próximo passo ("aquela pessoa voltou e agora deixou o telefone"), mas exige uma tela de edição de visita, que não existe.
- **Tornar `clients.phone` opcional.** O cadastro de clientes continua sendo de quem deixou telefone.
- **Métricas novas além da taxa de conversão** (motivo da não-compra, tempo em loja, etc.).
