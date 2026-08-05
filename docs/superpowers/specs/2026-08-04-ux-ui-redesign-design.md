# Redesign de UX/UI — Design Spec

**Data:** 2026-08-04
**Escopo:** toda a interface autenticada do WeFood Gestão (login, início, clientes, visitas, colaboradores).

## Problema

A interface atual é o tema padrão do `create-next-app`: paleta zinc/preto/branco, sem identidade da WeFood, sem shell de navegação, sem estados de carregamento, vazio ou erro, e sem confirmação de sucesso. O formulário de visita — a tela mais usada da loja — empilha 17 controles nativos com alvos de toque de ~20px, num app que o atendente usa em pé, no celular, com cliente esperando.

Além do visual, há dois defeitos concretos no código atual:

1. `globals.css` define `font-family: Arial, Helvetica, sans-serif` no `body`, anulando a fonte Geist carregada em `layout.js`. A fonte é baixada e nunca usada.
2. `layout.js` declara `<html lang="en">` num aplicativo inteiramente em português.

## Decisões tomadas

| Decisão | Escolha |
|---|---|
| Origem da paleta | Proposta aqui, com os hex isolados em tokens para troca posterior pelos oficiais |
| Contexto de uso | Celular no balcão **e** PC no escritório |
| Base técnica | Design system próprio em Tailwind v4 — zero dependência de UI nova |
| Esqueleto de navegação | Home-painel + nav inferior simples de 3 itens |
| Formulário de visita | Rolagem única com botão de envio fixo |
| Pergunta de origem | Só para cliente novo; recorrente vê a da 1ª visita, com opção de alterar |
| Contagem de visitas na lista | Entra no escopo |

## Não faz parte deste trabalho

Biblioteca de componentes de terceiros, animações elaboradas, temas customizáveis pelo usuário, alternância manual claro/escuro (segue o sistema operacional), gráficos, e dashboard analítico. Um painel de análise dos dados de visita é um projeto próprio, com spec própria.

Fora de escopo mas anotado como dívida: os quatro Route Handlers duplicam o mesmo bloco de autenticação (`cookies()` → `getUserFromSessionToken` → 401). Vale extrair, mas não neste trabalho.

---

## 1. Fundação: tokens

Todo o tema vive em `apps/web/src/app/globals.css`, seguindo o padrão que o arquivo já usa (variáveis em `:root`, expostas via `@theme inline`). Nenhum componente escreve hex; nenhum componente escreve `dark:`.

O ganho estrutural: hoje um cartão carrega `bg-white dark:bg-zinc-950 border-black/[.08] dark:border-white/[.145]`. Passa a ser `bg-surface border-line`, com as variáveis virando sozinhas no modo escuro. Isso reduz o volume de classes do código atual.

### Cores base

| Token | Claro | Escuro | Uso |
|---|---|---|---|
| `--color-brand` | `#D93A26` | `#FF5A3C` | Ações com texto branco |
| `--color-brand-hover` | `#B22D1C` | `#FF7A5C` | Estado hover/pressed |
| `--color-brand-vivid` | `#FF5A3C` | `#FF7A5C` | Preenchimentos, ícones, acentos decorativos |
| `--color-brand-tint` | `#FFF1EE` | `#33201B` | Fundo de chip selecionado, badge |
| `--color-accent` | `#FFB020` | `#FFC24D` | Destaques que levam texto escuro |
| `--color-success` | `#0E7C4A` | `#3DBE85` | Confirmações |
| `--color-danger` | `#B3261E` | `#FF8A80` | Erros |
| `--color-bg` | `#FDF8F3` | `#14100D` | Fundo da página |
| `--color-surface` | `#FFFFFF` | `#201A16` | Cartões, campos, barras |
| `--color-surface-2` | `#FBF5EF` | `#251E19` | Cabeçalho de tabela, faixas |
| `--color-line` | `#EFE4D9` | `#2E2620` | Bordas e divisores |
| `--color-ink` | `#24170F` | `#F7F0EA` | Texto principal |
| `--color-muted` | `#6E5B4E` | `#A2938A` | Texto secundário |

Contrastes verificados (WCAG 2.1):

- branco sobre `--color-brand` claro: **4,58:1** — passa AA para texto normal
- `--color-ink` sobre `--color-bg`: **≈16,5:1**
- `--color-muted` sobre `--color-bg`: **6,08:1**
- `--color-ink` sobre `--color-accent`: **≈9,5:1**

`--color-brand-vivid` (`#FF5A3C`) rende apenas **3,1:1** contra branco e **não deve receber texto claro em tamanho nenhum** — fica abaixo até do mínimo de 3:1 exigido para texto grande. É tom decorativo: preenchimentos, ícones, barras. Onde precisar de rótulo sobre ele, o texto é `--color-ink`.

### Cores de categoria

Um par (fundo, texto) por categoria de pedido, para os chips e a timeline. Todos com contraste ≥ 4,5:1 do texto sobre o próprio fundo.

| Categoria | Fundo claro | Texto claro | Fundo escuro | Texto escuro |
|---|---|---|---|---|
| `sorvete` | `#FFE3DC` | `#9C2A16` | `#3B211A` | `#FFB4A0` |
| `milkshake` | `#FFF0D2` | `#7A4E00` | `#3A2E15` | `#FFD68A` |
| `lanche` | `#FFE7D1` | `#8A4300` | `#3A2718` | `#FFC08F` |
| `bebida` | `#D9F1F7` | `#0B5F73` | `#17313A` | `#8FD9EA` |
| `sobremesa` | `#EEE0FB` | `#5C2E8E` | `#2B2038` | `#CFAEF2` |
| `outro` | `#F1E9E1` | `#5C4C42` | `#2B2420` | `#BFAEA2` |

### Espaço, raio, sombra, tipografia

- Raios: `--radius-sm: 8px`, `--radius-md: 12px`, `--radius-lg: 16px`, `--radius-pill: 999px`
- Sombras: `--shadow-card` discreta, `--shadow-raised` para a barra de ação fixa
- Corpo e números: **Geist** (já carregada — basta remover o `font-family: Arial` que a anula hoje)
- Títulos: **Nunito** (`next/font/google`, subset latin, weights 700/800), exposta como `--font-display` e aplicada em `h1`–`h3`

A Nunito é a decisão que mais contribui para o tom "vivo" pedido, e é isolada: sai com a remoção do import e da variável.

---

## 2. Primitivos

Em `apps/web/src/components/ui/`. Cada arquivo abaixo de ~80 linhas, sem dependência nova.

| Componente | Interface | Notas |
|---|---|---|
| `Button` | `{ variant: "primary" \| "secondary" \| "ghost", size: "sm" \| "md" \| "lg", isLoading, disabled, ...props }` | Altura mínima 44px em `md`, 52px em `lg`. Quando `isLoading`, mostra rótulo alternativo e fica `disabled` com `aria-busy` |
| `Input` | `{ label, error, hint, inputMode, ...props }` | `id` gerado com `useId`, `<label htmlFor>`, erro com `role="alert"` e `aria-describedby` |
| `PhoneInput` | `{ label, value, onChange, error }` | `inputMode="numeric"`, máscara ao digitar, **emite só dígitos** para o estado |
| `CurrencyInput` | `{ label, value, onChange, error }` | `inputMode="decimal"`, exibe `R$ 32,50`, emite `Number` |
| `Chip` | `{ selected, onToggle, tone, children }` | Alvo ≥48px. `role="checkbox"` ou `role="radio"` conforme `role` recebido, com `aria-checked` |
| `Card` | `{ as, children, ...props }` | `bg-surface border-line rounded-lg` |
| `Badge` | `{ tone: "brand" \| "neutral" \| "success", children }` | Contagens e rótulos curtos |
| `EmptyState` | `{ icon, title, description, action }` | Estado vazio de listas |
| `Toast` / `ToastProvider` | `toast.success(msg)`, `toast.error(msg)` | Contexto React, região `aria-live="polite"`, some em 4s, fecha no toque |

Utilitários em `apps/web/src/lib/`:

- `formatPhone(digits)` → `(15) 99123-4001` para 11 dígitos, `(15) 3123-4001` para 10, devolve a entrada crua para outros tamanhos
- `formatCurrency(value)` → `R$ 32,50` (`Intl.NumberFormat` pt-BR)
- `formatRelativeDate(date)` → `hoje`, `ontem`, `há 3 dias`, `há 2 semanas`, e data absoluta acima de 60 dias

---

## 3. Shell e navegação

`AppShell` em `apps/web/src/components/app-shell.js`, recebendo `{ user, canManageUsers, children }`.

- **≥1024px:** sidebar fixa de 240px — marca, botão destacado *Registrar visita*, itens *Início*, *Clientes* e *Colaboradores* (só quando `canManageUsers`), e no rodapé o nome do usuário com *Sair*. O item ativo é marcado com `aria-current="page"`.
- **<1024px:** topbar com marca e acesso ao perfil; nav inferior fixa de 3 itens (*Início*, *Clientes*, *Perfil*), com `padding-bottom: env(safe-area-inset-bottom)`.

Como o esqueleto escolhido não põe *Registrar visita* na nav inferior, o caminho rápido é preservado por atalhos: cada cartão de cliente na lista e a ficha do cliente têm um botão direto de registrar visita.

Para eliminar a repetição do bloco de autenticação hoje presente em seis páginas, `apps/web/src/app/require-auth.js` exporta `requireAuthenticatedUser()`, que lê o cookie, resolve o usuário e redireciona para `/login` quando não houver sessão. Cada página passa a chamá-la numa linha.

---

## 4. Dados

Duas mudanças de consulta. Nenhuma migration e nenhuma mudança de schema. `GET /api/v1/clients` passa a devolver dois campos a mais em cada cliente — mudança puramente aditiva, que não quebra consumidor nem teste existente.

### 4.1 `client.search()` devolve visitas

```sql
SELECT c.id, c.name, c.phone, c.birth_date, c.neighborhood, c.city,
       c.created_at, c.updated_at,
       COUNT(v.id)::int AS visit_count,
       MAX(v.created_at) AS last_visit_at
FROM clients c
LEFT JOIN visits v ON v.client_id = c.id
WHERE c.name ILIKE $1
GROUP BY c.id
ORDER BY c.name;
```

Os campos novos são aditivos: os testes atuais de `client.search()` e de `GET /api/v1/clients` continuam válidos. Um teste novo cobre `visit_count` e `last_visit_at`, incluindo cliente sem visita (`0` e `null`).

### 4.2 Resumo do dia para a home

`visit.summaryForToday()` → `{ count, total }`, com o dia no fuso de São Paulo:

```sql
SELECT COUNT(*)::int AS count, COALESCE(SUM(amount_spent), 0) AS total
FROM visits
WHERE created_at >= date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo') AT TIME ZONE 'America/Sao_Paulo';
```

Testes: zero visitas devolve `{ count: 0, total: 0 }`; visitas de hoje somam; visita de ontem não entra.

### 4.3 Origem da primeira visita

Nenhum endpoint novo. Quando o fluxo de `/visitas/nova` identifica o cliente, ele chama o já existente `GET /api/v1/clients/{id}`, que devolve `visits` em ordem decrescente. O último item do array é a primeira visita — dele sai `discovery_source` e `discovery_details` para pré-preencher. O tamanho do array dá a contagem exibida no cabeçalho ("7ª visita"). Se o array vier vazio, o cliente é novo e a pergunta de origem aparece normalmente.

O campo continua sendo gravado em toda visita: o que muda é só quem digita.

---

## 5. Telas

### `/login`
Cartão centrado com a marca, `Input` com `autoComplete="email"` e `"current-password"`, erro em `role="alert"`, botão em estado de carregamento.

### `/` — Início
Painel, conforme o esqueleto escolhido:
- Saudação com o nome do usuário
- Faixa com **visitas de hoje** e **faturamento do dia** (de `visit.summaryForToday()`)
- Card grande e destacado *Registrar visita*
- Atalhos secundários: *Clientes*, *Novo cliente*, e *Colaboradores* quando permitido

### `/clientes`
- Busca com debounce de 300ms que atualiza a URL — sem clicar em botão. O campo continua dentro de um `<form method="GET">` com botão de envio, de modo que a busca funciona igual se o JavaScript falhar; o debounce é só um aprimoramento por cima.
- **Celular:** cartões tocáveis com nome, telefone formatado, bairro, `Badge` de visitas, última visita relativa e atalho de registrar visita.
- **PC:** tabela com Nome, Telefone, Bairro, Visitas, Última visita.
- `EmptyState` distinguindo "nenhum cliente cadastrado" de "nada encontrado para esta busca".

### `/clientes/novo`
Campos agrupados em `Card`, `PhoneInput` com máscara. No erro de telefone duplicado, além da mensagem, um link para a ficha do cliente já existente — hoje o atendente recebe o erro e fica sem saída.

### `/clientes/[id]`
- Cabeçalho: nome, telefone formatado, bairro/cidade, `Badge` com total de visitas, e botão *Registrar visita*
- Timeline de visitas: data relativa com hora, valor em destaque, chips coloridos por categoria, e motivo/origem como texto secundário — só aparecendo quando houver detalhe
- `EmptyState` quando não há visitas

### `/visitas/nova`
Rolagem única, com o botão fixo no rodapé:
1. **Busca** — `PhoneInput`, teclado numérico, botão em estado de carregamento
2. **Cadastro rápido** — quando o telefone não existe, com o telefone já preenchido
3. **Formulário** — cabeçalho com nome e "Nª visita · última há X"; chips de 48px para categorias; `CurrencyInput` em destaque; chips de motivo; bloco de origem **oculto para cliente recorrente**, mostrando a origem conhecida com um botão *alterar* que revela os chips
4. **Sucesso** — `toast.success` e redirecionamento para a ficha

Os campos de detalhe livre (pedido, motivo, origem) só aparecem depois que a escolha correspondente é feita, para não ocupar tela à toa.

### `/admin/colaboradores`
Mesma linguagem visual. O botão *copiar link* do convite já existe — passa a confirmar por toast em vez do texto "Copiado!".

### `/avaliacoes` e `/avaliar`
Telas do módulo de avaliações (`3edff4c`..`48dee01`), construído em paralelo a este redesenho e entregue no tema antigo. `/avaliacoes` é autenticada e entra no shell; `/avaliar` é a **única tela pública** do sistema — destino do QR code da loja — e fica fora do shell, junto de `/login` e `/cadastro/[token]`.

Em `/avaliacoes`: nota média em número grande com estrelas, datas relativas em vez de timestamp completo, e estado vazio quando não há avaliações. Em `/avaliar`: marca no topo, estrelas em `--color-accent` com alvo de 48px (hoje têm ~40px), e erro com `role="alert"`. É a tela tocada por clientes da loja, sem treino nenhum — o alvo de toque importa mais aqui do que em qualquer outra.

### `/cadastro/[token]`
Primeira tela que um colaborador novo vê; fica fora do shell, por não haver sessão ainda. Recebe a marca no topo, os campos com `Input`, e o cartão de convite inválido deixa de ser um parágrafo solto.

Corrige também um defeito de conteúdo: o texto está fixo no feminino ("Bem-vinda", "Você foi convidada"), o que erra o gênero de qualquer pessoa cujo gênero não seja esse. Como o sistema não guarda gênero, a redação passa a ser neutra ("Boas-vindas", "Seu convite é para o papel de …").

---

## 6. Estados, erros e acessibilidade

- `loading.js` por rota com skeletons no formato do conteúdo real
- `error.js` com mensagem e ação de tentar de novo
- `not-found.js` próprio, em português, com link para o início
- Toasts para sucesso e erro de todas as ações de escrita
- `<html lang="pt-BR">`
- Foco visível em todos os interativos (`focus-visible` com anel na cor da marca)
- Alvos de toque ≥44px, chips ≥48px
- Chips com `role` e `aria-checked` corretos; grupos com `fieldset`/`legend`
- Toasts em região `aria-live="polite"`
- `prefers-reduced-motion` respeitado nas transições

---

## 7. Verificação

O projeto testa contra Postgres real, sem mocks. Este trabalho segue a mesma regra:

- **Testes de integração** para as duas consultas novas (`client.search` com contagem, `visit.summaryForToday`) e para o campo novo em `GET /api/v1/clients`.
- **Sem testes automatizados de componente visual** — o projeto não tem infraestrutura de teste de React hoje, e montá-la não faz parte deste trabalho. Cada tarefa de UI define a verificação manual no navegador, nos dois tamanhos (375px e 1440px).
- A suíte existente precisa continuar verde: nenhuma mudança aqui altera contrato de API.

## 8. Riscos

| Risco | Mitigação |
|---|---|
| A paleta proposta não bate com a marca real | Todos os hex num bloco só do `globals.css`; troca sem tocar em componente |
| `LEFT JOIN` na busca de clientes degrada com volume | Volume é de centenas de linhas; se crescer, índice em `visits(client_id)` |
| Nunito não agradar | Remoção de um import e uma variável |
| Redesenho amplo quebrar telas silenciosamente | Verificação manual por tarefa nos dois tamanhos, e a suíte de API como rede de segurança |
