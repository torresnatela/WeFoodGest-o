# Funil de visita: entrou → viu → comprou

## Contexto e objetivo

Até aqui o registro de visita começava por um portão: `/visitas/nova` pedia o telefone, e sem telefone não havia cliente, sem cliente não havia visita (`visits.client_id` era `NOT NULL`). Além disso `visit.create()` exigia ao menos uma categoria de pedido, e `reason` e `discovery_source` eram `NOT NULL`. Só existia um tipo de visita registrável: **a pessoa deixou telefone e comprou**.

Isso apagava do sistema exatamente o que precisa ser medido:

1. **Quem entra, responde por que veio e vai embora sem comprar e sem deixar telefone.** O atendente inventava um telefone ou não registrava.
2. **Quem passa e não entra.** Invisível — e é a base do funil.

A visita passa a ser um registro que **sempre existe**, respondendo três perguntas observáveis do balcão. Tudo o mais — cliente, motivo, origem, pedido, valor — vira enriquecimento opcional. Com isso o dashboard ganha o número que não existia: **a taxa de conversão de quem passa em quem compra**.

> Este spec substitui *"Visita sem cliente e sem compra"*, que ficou no histórico do git e nunca foi implementado. Ele acertava a visita anônima e sem compra, mas mantinha motivo e origem obrigatórios e derivava "comprou" de `visit_order_items` — as duas coisas revistas aqui.

## Decisões de arquitetura

**O funil é a única coisa obrigatória.** Porque é a única coisa que o atendente sempre sabe: ele viu a pessoa. Motivo, origem, telefone e pedido dependem de a pessoa querer responder. Registrar uma visita "vazia" custa um toque, e é isso que torna o dado de quem não entrou coletável na prática.

**Três booleanos, não um estágio sequencial.** `entered_store`, `saw_products`, `purchased`. Um enum de quatro valores (`nao_entrou` → `entrou` → `viu_produtos` → `comprou`) seria mais simples e impediria estados incoerentes, mas não consegue representar quem **olhou a vitrine da calçada**: viu os produtos sem entrar. Esse caso é real e é justamente um dos que o funil existe para medir. O preço são três colunas e um `CHECK`.

**"Comprou" é coluna, não derivação.** A alternativa — derivar de `EXISTS (SELECT ... FROM visit_order_items)` — evita duplicar a verdade, mas quebra no fluxo que este spec desenha: a pergunta é respondida pelo atendente **antes** de existir qualquer item, e detalhar o pedido é opcional. Derivando, toda compra não-detalhada viraria uma não-compra e o funil mentiria no caso mais comum de pressa. O que impede a coluna de mentir na outra direção é o `CHECK (purchased OR amount_spent = 0)` mais a recusa do model a aceitar itens numa visita sem compra.

**Visita anônima, não cliente anônimo.** Sem contato, `visits.client_id` fica `NULL`. Não se cria cliente-fantasma nem se afrouxa `clients.phone`, que continua `NOT NULL` + `UNIQUE`. A tabela `clients` continua sendo o cadastro de quem de fato deixou telefone — que é o que a torna útil para marketing.

## Schema

Uma migration (`1786048980647_funil-de-visita.js`), em `visits`:

```sql
ALTER TABLE visits
  ADD COLUMN entered_store boolean NOT NULL DEFAULT true,
  ADD COLUMN saw_products  boolean NOT NULL DEFAULT true,
  ADD COLUMN purchased     boolean NOT NULL DEFAULT true;
-- e em seguida DROP DEFAULT nas três

ALTER TABLE visits ADD CONSTRAINT visits_purchase_implies_seen_check
  CHECK (saw_products OR NOT purchased);
ALTER TABLE visits ADD CONSTRAINT visits_amount_requires_purchase_check
  CHECK (purchased OR amount_spent = 0);

ALTER TABLE visits ALTER COLUMN client_id        DROP NOT NULL;
ALTER TABLE visits ALTER COLUMN reason           DROP NOT NULL;
ALTER TABLE visits ALTER COLUMN discovery_source DROP NOT NULL;

ALTER TABLE visits DROP CONSTRAINT visits_client_id_fkey;
ALTER TABLE visits ADD CONSTRAINT visits_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;
```

O `DEFAULT true` serve só para preencher as visitas já gravadas: toda visita anterior exigia ao menos uma categoria de pedido, então `true` nas três é a leitura correta do passado. Depois ele sai — visita nova responde o funil explicitamente, e um insert que esqueça uma resposta tem de falhar alto em vez de gravar em silêncio que a pessoa entrou, viu e comprou.

Não há `CHECK` ligando `entered_store` aos outros dois: é o que preserva "viu sem entrar".

Os `CHECK` de lista fechada de `reason` e `discovery_source` **não mudam**. `NULL IN (...)` avalia para `NULL`, e um `CHECK` só reprova em `FALSE` — aceitar nulo sai de graça ao remover o `NOT NULL`. `amount_spent` continua `NOT NULL DEFAULT 0`: visita sem compra grava `0`, não `NULL`.

A troca de `ON DELETE CASCADE` para `SET NULL` não corrige bug nenhum em produção (não existe rota de exclusão de cliente), mas só se torna possível agora que `client_id` aceita nulo: apagar um contato passa a anonimizar a visita em vez de destruir o faturamento daquele dia junto.

O `down` reverte tudo. Restaurar os `NOT NULL` falha se já houver visita anônima ou sem motivo gravada — comportamento correto: reverter destruiria dados.

## Model (`apps/web/src/models/visit.js`)

`create()` recebe `enteredStore`, `sawProducts`, `purchased` e dá default a tudo o que virou opcional (`clientId`, `amountSpent`, `orderCategories`, `reason`, `discoverySource`). Sai a regra "selecione ao menos uma categoria". Entram quatro validações:

| Condição | `message` |
|---|---|
| qualquer das três respostas não é `boolean` | `"Responda se o cliente entrou, viu os produtos e comprou."` |
| `purchased && !sawProducts` | `"Quem comprou necessariamente viu os produtos."` |
| `!purchased` com categorias | `"Uma visita sem compra não pode ter itens no pedido."` |
| `!purchased` com `amountSpent > 0` | `"Uma visita sem compra não pode ter valor gasto."` |

As duas últimas duplicam o que o banco já garante. Existem para dar a mensagem específica: zerar em silêncio esconderia um erro do chamador numa fronteira de API, e deixar o Postgres reclamar devolveria a mensagem genérica de *check violation*.

`summaryForToday()` passa a devolver `{ count, entered, total }`. `count` continua contando **todas** as visitas — é o número honesto de movimento — e `entered` existe para o primeiro número não mudar de significado sem avisar.

## API

Entra **`POST /api/v1/visits`** como rota canônica, com `client_id` opcional no corpo. A rota aninhada `POST /api/v1/clients/[id]/visits` continua existindo (a ficha do cliente linka para ela). Para as duas não divergirem, o corpo do handler mora em `app/api/v1/visits/create-visit.js` e ambas o chamam: `clientId` ausente significa "leia do corpo"; presente, o caminho manda e o `client_id` do corpo é ignorado.

Respostas: `201` com a visita criada, `400` corpo inválido ou incoerente, `401` sem sessão, `404` `client_id` inexistente. Sai o guard `"Valor gasto, motivo e origem são obrigatórios."` — nenhum dos três é obrigatório, e a única validação de presença passou a viver no model.

## Telas

**`/visitas/nova` em três passos** (`register-visit-flow.js`), começando sempre no funil — inclusive vindo de `?clientId=`, que pula só o passo de identificar quem é.

1. **Funil.** Três linhas `[Sim][Não]`. Uma cascata dá o padrão sem travar nada: `entrou = Não` responde as três (registro em um toque); `viu = Não` zera a compra; `comprou = Sim` marca "viu" porque o banco exige. Quem olhou a vitrine ainda marca "viu" depois de dizer que não entrou. O botão "Registrar visita" fica ativo assim que as três forem respondidas, em todos os passos seguintes.
2. **Cliente.** Busca por telefone, com "Continuar sem cliente" e "Cadastrar e continuar" como saídas. O telefone deixou de ser portão.
3. **Detalhes.** "O que pediu" e "Valor gasto" só aparecem quando `purchased` — o que torna estruturalmente impossível violar os dois `CHECK` pela interface. Motivo e origem viram chips desmarcáveis, sem pré-seleção.

O submit zera pedido e valor quando não houve compra: dá para preencher o pedido e voltar ao funil para desmarcar a compra, e a tela esconder os campos não apaga o estado.

**Ficha do cliente.** Motivo e origem nulos exibem "Não informado". Visita sem compra troca o valor por um `Badge` dizendo onde parou ("Não entrou", "Entrou, não viu os produtos", "Não comprou") — sem isso apareceria como uma visita normal de R$ 0,00 sem nenhum pedido.

**Tela de início.** O card passa a "Visitas hoje · Entraram · Faturamento".

## Dashboard (`apps/web/src/models/dashboard/`)

**`funnel.js` (novo).** Uma query com `COUNT(*) FILTER` por etapa. Toda taxa usa o **total de visitas** como denominador, não a etapa anterior: "viu ÷ entrou" pode passar de 100% por causa da vitrine, e o gráfico passaria a mentir. Sobre o total, as quatro linhas são sempre comparáveis e nenhuma estoura. `percentageOf()` já devolve 0 quando o total é zero.

**`movement.js`.** `average_ticket` ganha `FILTER (WHERE purchased)`. `visits` e `revenue` não mudam: o total passa a incluir as visitas sem compra (movimento honesto) e o faturamento não se altera porque elas somam zero.

**`marketing.js`.** `countByColumn()` ganha `AND <coluna> IS NOT NULL`. O denominador passa a ser quem respondeu — contar quem nunca foi perguntado diluiria todas as fatias.

**`product.js`.** A CTE `period_visits` ganha `AND purchased`. O `JOIN` não muda (visita sem compra não tem item), mas sem isso cada categoria teria a fatia diluída e a nota de rodapé sobre as porcentagens somarem mais de 100% deixaria de fazer sentido.

**`clients.js`.** Nenhuma query muda: todo `JOIN clients c ON c.id = v.client_id` descarta nulo naturalmente.

**Tela.** Nova seção "Funil de visitas" (quatro barras + "Taxa de conversão" + "Entraram e não compraram"). O rótulo "Clientes atendidos" vira **"Clientes identificados"**: `COUNT(DISTINCT client_id)` sempre ignorou nulos, e com visitas anônimas na base o número passaria a mostrar menos gente do que a loja atendeu. A conta é a mesma; o rótulo é que passou a dizer a verdade sobre si mesmo.

## Fora de escopo

- **Editar ou apagar visitas.** Não existia antes e este spec não introduz.
- **Anexar um contato a uma visita anônima depois.** Exige tela de edição de visita.
- **Tornar `clients.phone` opcional.** O cadastro continua sendo de quem deixou telefone.
- **Motivo da não-compra, tempo em loja e outras métricas novas.**
