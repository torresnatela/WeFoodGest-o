# Redesign de UX/UI — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o tema padrão do `create-next-app` por uma interface com a identidade da WeFood, navegável em celular e PC, com estados de carregamento/vazio/erro/sucesso e um formulário de visita que se preenche em ~8 toques.

**Architecture:** Todo o tema vive em variáveis CSS no `globals.css`, expostas como utilitários Tailwind v4 via `@theme inline` — nenhum componente escreve hex nem usa variantes `dark:`. Oito primitivos sem dependências novas ficam em `src/components/ui/`. As páginas autenticadas passam para um route group `(app)` cujo layout renderiza o `AppShell` (sidebar no PC, nav inferior no celular); `/login` e `/cadastro/[token]` ficam de fora dele.

**Tech Stack:** Next.js 16 App Router (JavaScript), Tailwind CSS v4, `next/font/google`, `pg` puro, Jest contra Postgres real.

**Spec:** `docs/superpowers/specs/2026-08-04-ux-ui-redesign-design.md`

## Global Constraints

- Toda a interface é em português (pt-BR). Nenhum texto novo em inglês.
- Nenhuma dependência de runtime nova além da fonte via `next/font/google`. Nada de biblioteca de componentes.
- Nenhum componente escreve valor de cor literal. Cores só via classes de token (`bg-surface`, `text-ink`, `bg-brand`…).
- Nenhum componente usa a variante `dark:`. O modo escuro acontece pela troca das variáveis CSS em `globals.css`.
- Nenhuma migration. O schema do banco não muda.
- Contratos de API existentes não mudam; só recebem campos aditivos.
- Alvos de toque: mínimo 44px em botões, 48px em chips.
- Componentes de UI ficam abaixo de ~80 linhas. Se passar disso, é sinal de que faltou separar.
- Arquivos com `useState`/`useEffect`/handlers levam `"use client"` na primeira linha; páginas que fazem `await` em dados são Server Components e não levam.

## Como rodar os testes

O `npm test` na raiz sobe o Next e o Jest juntos e **apaga os dados de desenvolvimento** (`DROP SCHEMA public CASCADE`). Para rodar um subconjunto durante a implementação:

- **Testes unitários** (funções puras, não precisam de servidor) — de `apps/web`:
  `npx jest --runInBand tests/unit/lib/format.test.js`
- **Testes de integração** (precisam do servidor e do banco) — com `npm run dev` rodando em outro terminal, de `apps/web`:
  `npx jest --runInBand tests/integration/models/client`
- **Suíte completa**, antes de encerrar uma tarefa — da raiz: `npm test`

---

### Task 1: Tokens de cor, tipografia e `lang`

**Files:**
- Modify: `apps/web/src/app/globals.css` (arquivo inteiro)
- Modify: `apps/web/src/app/layout.js` (arquivo inteiro)

**Interfaces:**
- Produces: utilitários Tailwind `bg-bg`, `bg-surface`, `bg-surface-2`, `border-line`, `text-ink`, `text-muted`, `bg-brand`, `bg-brand-hover`, `bg-brand-vivid`, `bg-brand-tint`, `text-brand`, `bg-accent`, `text-success`, `text-danger`, `bg-danger`, `rounded-md`/`rounded-lg`, `shadow-card`, `shadow-raised`, e os pares `bg-cat-<categoria>-bg` / `text-cat-<categoria>-fg` para as seis categorias. Também a fonte de títulos via `font-display`.

- [ ] **Step 1: Substituir `globals.css` inteiro**

```css
@import "tailwindcss";

:root {
  --bg: #fdf8f3;
  --surface: #ffffff;
  --surface-2: #fbf5ef;
  --line: #efe4d9;
  --ink: #24170f;
  --muted: #6e5b4e;

  --brand: #d93a26;
  --brand-hover: #b22d1c;
  --brand-vivid: #ff5a3c;
  --brand-tint: #fff1ee;
  --accent: #ffb020;
  --success: #0e7c4a;
  --danger: #b3261e;

  --cat-sorvete-bg: #ffe3dc;
  --cat-sorvete-fg: #9c2a16;
  --cat-milkshake-bg: #fff0d2;
  --cat-milkshake-fg: #7a4e00;
  --cat-lanche-bg: #ffe7d1;
  --cat-lanche-fg: #8a4300;
  --cat-bebida-bg: #d9f1f7;
  --cat-bebida-fg: #0b5f73;
  --cat-sobremesa-bg: #eee0fb;
  --cat-sobremesa-fg: #5c2e8e;
  --cat-outro-bg: #f1e9e1;
  --cat-outro-fg: #5c4c42;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #14100d;
    --surface: #201a16;
    --surface-2: #251e19;
    --line: #2e2620;
    --ink: #f7f0ea;
    --muted: #a2938a;

    --brand: #ff5a3c;
    --brand-hover: #ff7a5c;
    --brand-vivid: #ff7a5c;
    --brand-tint: #33201b;
    --accent: #ffc24d;
    --success: #3dbe85;
    --danger: #ff8a80;

    --cat-sorvete-bg: #3b211a;
    --cat-sorvete-fg: #ffb4a0;
    --cat-milkshake-bg: #3a2e15;
    --cat-milkshake-fg: #ffd68a;
    --cat-lanche-bg: #3a2718;
    --cat-lanche-fg: #ffc08f;
    --cat-bebida-bg: #17313a;
    --cat-bebida-fg: #8fd9ea;
    --cat-sobremesa-bg: #2b2038;
    --cat-sobremesa-fg: #cfaef2;
    --cat-outro-bg: #2b2420;
    --cat-outro-fg: #bfaea2;
  }
}

@theme inline {
  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-surface-2: var(--surface-2);
  --color-line: var(--line);
  --color-ink: var(--ink);
  --color-muted: var(--muted);

  --color-brand: var(--brand);
  --color-brand-hover: var(--brand-hover);
  --color-brand-vivid: var(--brand-vivid);
  --color-brand-tint: var(--brand-tint);
  --color-accent: var(--accent);
  --color-success: var(--success);
  --color-danger: var(--danger);

  --color-cat-sorvete-bg: var(--cat-sorvete-bg);
  --color-cat-sorvete-fg: var(--cat-sorvete-fg);
  --color-cat-milkshake-bg: var(--cat-milkshake-bg);
  --color-cat-milkshake-fg: var(--cat-milkshake-fg);
  --color-cat-lanche-bg: var(--cat-lanche-bg);
  --color-cat-lanche-fg: var(--cat-lanche-fg);
  --color-cat-bebida-bg: var(--cat-bebida-bg);
  --color-cat-bebida-fg: var(--cat-bebida-fg);
  --color-cat-sobremesa-bg: var(--cat-sobremesa-bg);
  --color-cat-sobremesa-fg: var(--cat-sobremesa-fg);
  --color-cat-outro-bg: var(--cat-outro-bg);
  --color-cat-outro-fg: var(--cat-outro-fg);

  --radius-md: 12px;
  --radius-lg: 16px;

  --shadow-card: 0 1px 2px rgb(36 23 15 / 0.06);
  --shadow-raised: 0 -2px 12px rgb(36 23 15 / 0.08);

  --font-sans: var(--font-geist-sans);
  --font-display: var(--font-nunito);
}

body {
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-geist-sans), system-ui, sans-serif;
}

h1,
h2,
h3 {
  font-family: var(--font-nunito), var(--font-geist-sans), sans-serif;
  letter-spacing: -0.01em;
}

:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

O `font-family: Arial` que existia no `body` foi removido de propósito: ele anulava a fonte Geist carregada no layout.

- [ ] **Step 2: Substituir `layout.js` inteiro**

```jsx
import { Geist, Nunito } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["700", "800"],
});

export const metadata = {
  title: "WeFood Gestão",
  description: "Sistema de gestão da WeFood Alimentos",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${nunito.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-bg text-ink">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
```

O `ToastProvider` só existe a partir da Task 6. Até lá o app não compila — por isso a Task 6 vem antes de qualquer tela. Se quiser manter o app rodando entre uma tarefa e outra, faça a Task 6 imediatamente após esta.

- [ ] **Step 3: Criar o `ToastProvider` mínimo para destravar o build**

Crie `apps/web/src/components/ui/toast.js` com o esqueleto abaixo. A Task 6 substitui o arquivo pela versão completa.

```jsx
"use client";

export function ToastProvider({ children }) {
  return children;
}
```

- [ ] **Step 4: Verificar no navegador**

Com `npm run dev` rodando, abra `http://localhost:3010/login`. Esperado: o fundo deixa de ser branco/zinc e fica creme (`#FDF8F3`), o texto fica marrom-escuro, e a fonte do corpo deixa de ser Arial (as letras ficam visivelmente mais estreitas e modernas). Confirme no DevTools que `<html lang="pt-BR">`.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/globals.css apps/web/src/app/layout.js apps/web/src/components/ui/toast.js
git commit -m "Add WeFood color tokens, display font, and pt-BR lang"
```

---

### Task 2: Utilitários de formatação

**Files:**
- Create: `apps/web/src/lib/format.js`
- Test: `apps/web/tests/unit/lib/format.test.js`

**Interfaces:**
- Produces: `formatPhone(digits)` → `string`; `formatCurrency(value)` → `string`; `formatRelativeDate(date)` → `string`; `onlyDigits(text)` → `string`.

- [ ] **Step 1: Escrever os testes que falham**

`apps/web/tests/unit/lib/format.test.js`:

```js
const { formatPhone, formatCurrency, formatRelativeDate, onlyDigits } = require("@/lib/format");

describe("onlyDigits()", () => {
  test("remove tudo que não for dígito", () => {
    expect(onlyDigits("(15) 99123-4001")).toBe("15991234001");
  });

  test("devolve string vazia para entrada vazia", () => {
    expect(onlyDigits("")).toBe("");
  });
});

describe("formatPhone()", () => {
  test("formata celular de 11 dígitos", () => {
    expect(formatPhone("15991234001")).toBe("(15) 99123-4001");
  });

  test("formata fixo de 10 dígitos", () => {
    expect(formatPhone("1531234001")).toBe("(15) 3123-4001");
  });

  test("formata parcialmente enquanto o usuário digita", () => {
    expect(formatPhone("15")).toBe("(15");
    expect(formatPhone("159912")).toBe("(15) 9912");
  });

  test("devolve string vazia para entrada vazia ou nula", () => {
    expect(formatPhone("")).toBe("");
    expect(formatPhone(null)).toBe("");
  });
});

describe("formatCurrency()", () => {
  test("formata número como real", () => {
    expect(formatCurrency(32.5)).toBe("R$ 32,50");
  });

  test("formata string numérica vinda do Postgres", () => {
    expect(formatCurrency("32.50")).toBe("R$ 32,50");
  });

  test("formata zero", () => {
    expect(formatCurrency(0)).toBe("R$ 0,00");
  });
});

describe("formatRelativeDate()", () => {
  function daysAgo(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
  }

  test("hoje", () => {
    expect(formatRelativeDate(new Date())).toBe("hoje");
  });

  test("ontem", () => {
    expect(formatRelativeDate(daysAgo(1))).toBe("ontem");
  });

  test("poucos dias", () => {
    expect(formatRelativeDate(daysAgo(3))).toBe("há 3 dias");
  });

  test("semanas", () => {
    expect(formatRelativeDate(daysAgo(14))).toBe("há 2 semanas");
  });

  test("acima de 60 dias vira data absoluta", () => {
    const old = new Date("2020-03-15T12:00:00Z");
    expect(formatRelativeDate(old)).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  test("devolve traço para nulo", () => {
    expect(formatRelativeDate(null)).toBe("—");
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

De `apps/web`: `npx jest --runInBand tests/unit/lib/format.test.js`
Esperado: FAIL com `Cannot find module '@/lib/format'`.

- [ ] **Step 3: Escrever a implementação**

`apps/web/src/lib/format.js`:

```js
const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function onlyDigits(text) {
  return String(text ?? "").replace(/\D/g, "");
}

function formatPhone(value) {
  const digits = onlyDigits(value);

  if (digits.length === 0) {
    return "";
  }

  if (digits.length <= 2) {
    return `(${digits}`;
  }

  const areaCode = digits.slice(0, 2);
  const rest = digits.slice(2, 11);

  if (rest.length <= 4) {
    return `(${areaCode}) ${rest}`;
  }

  const splitAt = rest.length > 8 ? 5 : 4;
  return `(${areaCode}) ${rest.slice(0, splitAt)}-${rest.slice(splitAt)}`;
}

function formatCurrency(value) {
  return currencyFormatter.format(Number(value ?? 0)).replace(" ", " ");
}

function formatRelativeDate(value) {
  if (!value) {
    return "—";
  }

  const date = value instanceof Date ? value : new Date(value);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfDate = new Date(date);
  startOfDate.setHours(0, 0, 0, 0);

  const days = Math.round((startOfToday - startOfDate) / 86400000);

  if (days <= 0) {
    return "hoje";
  }
  if (days === 1) {
    return "ontem";
  }
  if (days < 7) {
    return `há ${days} dias`;
  }
  if (days <= 60) {
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? "há 1 semana" : `há ${weeks} semanas`;
  }

  return dateFormatter.format(date);
}

module.exports = { onlyDigits, formatPhone, formatCurrency, formatRelativeDate };
```

`formatCurrency` troca o espaço não-quebrável que o `Intl` insere por um espaço normal, para que a comparação nos testes e a busca de texto no navegador funcionem.

- [ ] **Step 4: Rodar e confirmar que passa**

De `apps/web`: `npx jest --runInBand tests/unit/lib/format.test.js`
Esperado: PASS, 15 testes.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/format.js apps/web/tests/unit/lib/format.test.js
git commit -m "Add phone, currency, and relative date formatters"
```

---

### Task 3: Primitivos de apresentação — `Button`, `Card`, `Badge`, `EmptyState`

**Files:**
- Create: `apps/web/src/components/ui/button.js`
- Create: `apps/web/src/components/ui/card.js`
- Create: `apps/web/src/components/ui/badge.js`
- Create: `apps/web/src/components/ui/empty-state.js`

**Interfaces:**
- Produces:
  - `<Button variant="primary"|"secondary"|"ghost" size="sm"|"md"|"lg" isLoading loadingLabel {...props} />`
  - `<Card as="div" className="" >…</Card>`
  - `<Badge tone="brand"|"neutral"|"success">…</Badge>`
  - `<EmptyState icon title description action />`

- [ ] **Step 1: Escrever `button.js`**

```jsx
const VARIANTS = {
  primary: "bg-brand text-white hover:bg-brand-hover shadow-card",
  secondary: "bg-surface text-ink border border-line hover:bg-surface-2",
  ghost: "text-ink hover:bg-surface-2",
};

const SIZES = {
  sm: "min-h-9 px-3 text-sm",
  md: "min-h-11 px-5 text-sm",
  lg: "min-h-13 px-6 text-base",
};

export default function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  loadingLabel = "Aguarde...",
  className = "",
  children,
  disabled,
  ...props
}) {
  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    >
      {isLoading ? loadingLabel : children}
    </button>
  );
}
```

- [ ] **Step 2: Escrever `card.js`**

```jsx
export default function Card({ as: Tag = "div", className = "", children, ...props }) {
  return (
    <Tag
      {...props}
      className={`rounded-lg border border-line bg-surface shadow-card ${className}`}
    >
      {children}
    </Tag>
  );
}
```

- [ ] **Step 3: Escrever `badge.js`**

```jsx
const TONES = {
  brand: "bg-brand-tint text-brand",
  neutral: "bg-surface-2 text-muted",
  success: "bg-surface-2 text-success",
};

export default function Badge({ tone = "neutral", className = "", children }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
```

- [ ] **Step 4: Escrever `empty-state.js`**

```jsx
export default function EmptyState({ icon = "🍦", title, description, action }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-line px-6 py-12 text-center">
      <span aria-hidden="true" className="text-3xl">
        {icon}
      </span>
      <p className="font-semibold text-ink">{title}</p>
      {description && <p className="max-w-xs text-sm text-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
```

- [ ] **Step 5: Verificar no navegador**

Adicione temporariamente ao topo de `apps/web/src/app/login/page.js`, dentro do `<form>`:

```jsx
<Button variant="primary" size="lg">Teste primário</Button>
<Button variant="secondary">Teste secundário</Button>
<Badge tone="brand">7</Badge>
```

(com `import Button from "@/components/ui/button";` e `import Badge from "@/components/ui/badge";`)

Abra `http://localhost:3010/login`. Esperado: botão vermelho `#D93A26` arredondado com pelo menos 52px de altura no `lg`, botão secundário branco com borda creme, badge rosa-claro. **Remova o trecho de teste antes de commitar.**

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/ui/button.js apps/web/src/components/ui/card.js apps/web/src/components/ui/badge.js apps/web/src/components/ui/empty-state.js
git commit -m "Add Button, Card, Badge, and EmptyState primitives"
```

---

### Task 4: Campos de formulário — `Input`, `PhoneInput`, `CurrencyInput`

**Files:**
- Create: `apps/web/src/components/ui/input.js`
- Create: `apps/web/src/components/ui/phone-input.js`
- Create: `apps/web/src/components/ui/currency-input.js`

**Interfaces:**
- Consumes: `formatPhone`, `onlyDigits`, `formatCurrency` de `@/lib/format` (Task 2).
- Produces:
  - `<Input label error hint {...inputProps} />`
  - `<PhoneInput label value onChange error required />` — `value` e `onChange` trabalham com **string só de dígitos**
  - `<CurrencyInput label value onChange error required />` — `value` e `onChange` trabalham com **Number**

- [ ] **Step 1: Escrever `input.js`**

```jsx
"use client";

import { useId } from "react";

export default function Input({ label, error, hint, className = "", ...props }) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-muted">
        {label}
      </label>
      <input
        {...props}
        id={id}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        className={`min-h-11 rounded-md border bg-surface px-3 py-2 text-ink placeholder:text-muted ${
          error ? "border-danger" : "border-line"
        } ${className}`}
      />
      {hint && !error && (
        <p id={hintId} className="text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Escrever `phone-input.js`**

```jsx
"use client";

import Input from "./input";
import { formatPhone, onlyDigits } from "@/lib/format";

export default function PhoneInput({ label = "Telefone", value, onChange, ...props }) {
  function handleChange(event) {
    onChange(onlyDigits(event.target.value).slice(0, 11));
  }

  return (
    <Input
      {...props}
      label={label}
      type="tel"
      inputMode="numeric"
      autoComplete="tel"
      placeholder="(15) 99123-4001"
      value={formatPhone(value)}
      onChange={handleChange}
    />
  );
}
```

O estado do pai guarda só dígitos; a máscara é aplicada apenas na exibição. Por isso o `POST /api/v1/clients` continua recebendo o telefone como hoje.

- [ ] **Step 3: Escrever `currency-input.js`**

```jsx
"use client";

import Input from "./input";
import { onlyDigits } from "@/lib/format";

export default function CurrencyInput({ label = "Valor gasto", value, onChange, ...props }) {
  function handleChange(event) {
    const digits = onlyDigits(event.target.value).slice(0, 9);
    onChange(digits === "" ? 0 : Number(digits) / 100);
  }

  const display = Number(value ?? 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <Input
      {...props}
      label={label}
      type="text"
      inputMode="decimal"
      value={`R$ ${display}`}
      onChange={handleChange}
      className="text-2xl font-bold tracking-tight"
    />
  );
}
```

O usuário digita só números e os centavos se preenchem da direita para a esquerda — o padrão de caixa registradora, que evita erro de vírgula no balcão.

- [ ] **Step 4: Verificar no navegador**

Adicione temporariamente a `apps/web/src/app/login/page.js` um `PhoneInput` e um `CurrencyInput` com estado local. Digite `15991234001` no telefone: deve aparecer `(15) 99123-4001`. Digite `3250` no valor: deve aparecer `R$ 32,50`. No celular (ou no modo dispositivo do DevTools), confirme que o teclado numérico é acionado. **Remova o trecho de teste antes de commitar.**

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/ui/input.js apps/web/src/components/ui/phone-input.js apps/web/src/components/ui/currency-input.js
git commit -m "Add Input, PhoneInput, and CurrencyInput components"
```

---

### Task 5: `Chip` e o mapa de categorias

**Files:**
- Create: `apps/web/src/components/ui/chip.js`
- Create: `apps/web/src/lib/visit-options.js`

**Interfaces:**
- Produces:
  - `<Chip selected onToggle role="checkbox"|"radio" tone>…</Chip>`
  - de `@/lib/visit-options`: `CATEGORY_OPTIONS`, `REASON_OPTIONS`, `DISCOVERY_OPTIONS` (cada um `{value, label}[]`), `CATEGORY_LABELS`, `REASON_LABELS`, `DISCOVERY_LABELS` (mapas `value → label`) e `CATEGORY_CHIP_CLASSES` (mapa `value → string de classes`).

- [ ] **Step 1: Escrever `visit-options.js`**

Estas listas hoje estão duplicadas entre `register-visit-flow.js` e `clientes/[id]/page.js`. Passam a ter um dono só.

```js
export const CATEGORY_OPTIONS = [
  { value: "sorvete", label: "Sorvete" },
  { value: "milkshake", label: "Milkshake" },
  { value: "lanche", label: "Lanche" },
  { value: "bebida", label: "Bebida" },
  { value: "sobremesa", label: "Sobremesa" },
  { value: "outro", label: "Outro" },
];

export const REASON_OPTIONS = [
  { value: "vontade_comer_beber", label: "Vontade de comer/beber algo" },
  { value: "programa_familia_amigos", label: "Programa com família/amigos" },
  { value: "comemoracao", label: "Comemoração (aniversário etc)" },
  { value: "passando_em_frente", label: "Passando em frente por acaso" },
  { value: "outro", label: "Outro" },
];

export const DISCOVERY_OPTIONS = [
  { value: "instagram", label: "Instagram/Redes sociais" },
  { value: "indicacao", label: "Indicação de amigo/família" },
  { value: "google_internet", label: "Google/Internet" },
  { value: "passou_em_frente", label: "Passou em frente e viu a loja" },
  { value: "cliente_antigo", label: "Já é cliente antigo" },
  { value: "outro", label: "Outro" },
];

function toLabelMap(options) {
  return Object.fromEntries(options.map((option) => [option.value, option.label]));
}

export const CATEGORY_LABELS = toLabelMap(CATEGORY_OPTIONS);
export const REASON_LABELS = toLabelMap(REASON_OPTIONS);
export const DISCOVERY_LABELS = toLabelMap(DISCOVERY_OPTIONS);

// Strings literais: o Tailwind precisa encontrar cada classe no código-fonte.
export const CATEGORY_CHIP_CLASSES = {
  sorvete: "bg-cat-sorvete-bg text-cat-sorvete-fg",
  milkshake: "bg-cat-milkshake-bg text-cat-milkshake-fg",
  lanche: "bg-cat-lanche-bg text-cat-lanche-fg",
  bebida: "bg-cat-bebida-bg text-cat-bebida-fg",
  sobremesa: "bg-cat-sobremesa-bg text-cat-sobremesa-fg",
  outro: "bg-cat-outro-bg text-cat-outro-fg",
};
```

- [ ] **Step 2: Escrever `chip.js`**

```jsx
"use client";

export default function Chip({
  selected = false,
  onToggle,
  role = "checkbox",
  className = "",
  children,
}) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={selected}
      onClick={onToggle}
      className={`min-h-12 rounded-full px-4 text-sm font-semibold transition-colors ${
        selected
          ? "bg-brand text-white"
          : "border border-line bg-surface text-muted hover:bg-surface-2"
      } ${className}`}
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 3: Verificar no navegador**

Adicione temporariamente a `login/page.js` dois `Chip` com estado local, um `checkbox` e um `radio`. Confirme: altura de 48px, vermelho sólido quando selecionado, e que o inspetor de acessibilidade do DevTools mostra `checkbox`/`radio` com `checked` correto. **Remova antes de commitar.**

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/ui/chip.js apps/web/src/lib/visit-options.js
git commit -m "Add Chip component and shared visit option lists"
```

---

### Task 6: `Toast`

**Files:**
- Modify: `apps/web/src/components/ui/toast.js` (substitui o esqueleto da Task 1)

**Interfaces:**
- Produces: `<ToastProvider>` (já usado em `layout.js`) e o hook `useToast()` → `{ success(message), error(message) }`.

- [ ] **Step 1: Substituir `toast.js` inteiro**

```jsx
"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((tone, message) => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, tone, message }]);
    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4000);
  }, []);

  const value = useMemo(
    () => ({
      success: (message) => push("success", message),
      error: (message) => push("error", message),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4 sm:bottom-6"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto w-full max-w-sm rounded-lg px-4 py-3 text-sm font-semibold text-white shadow-card ${
              toast.tone === "error" ? "bg-danger" : "bg-success"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast precisa estar dentro de um ToastProvider.");
  }

  return context;
}
```

O `bottom-24` no celular mantém o toast acima da nav inferior; a partir de `sm` ele desce para `bottom-6`.

- [ ] **Step 2: Verificar no navegador**

Em `login/page.js`, troque temporariamente o `setError(...)` do erro por `toast.error(body.message)` (com `const toast = useToast();`). Tente entrar com senha errada. Esperado: faixa vermelha aparece embaixo e some em 4s. **Reverta antes de commitar** — o `/login` é redesenhado na Task 10.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/ui/toast.js
git commit -m "Add Toast provider with aria-live announcements"
```

---

### Task 7: `requireAuthenticatedUser`, `AppShell` e o route group `(app)`

**Files:**
- Create: `apps/web/src/app/require-auth.js`
- Create: `apps/web/src/components/app-shell.js`
- Create: `apps/web/src/components/logout-button.js`
- Create: `apps/web/src/app/(app)/layout.js`
- Move: `apps/web/src/app/page.js` → `apps/web/src/app/(app)/page.js`
- Move: `apps/web/src/app/clientes/` → `apps/web/src/app/(app)/clientes/`
- Move: `apps/web/src/app/visitas/` → `apps/web/src/app/(app)/visitas/`
- Move: `apps/web/src/app/admin/` → `apps/web/src/app/(app)/admin/`
- Move: `apps/web/src/app/avaliacoes/` → `apps/web/src/app/(app)/avaliacoes/`
- Move: `apps/web/src/app/clientes/client-form.js` → `apps/web/src/components/client-form.js`
- Delete: `apps/web/src/app/logout-button.js`

`/avaliacoes` é autenticada e entra no route group. `/avaliar` **não** entra: é a página pública para onde o QR code da loja aponta, e o cliente nunca está logado — assim como `/login` e `/cadastro/[token]`, ela fica fora do shell.

**Interfaces:**
- Consumes: `Button` (Task 3).
- Produces: `requireAuthenticatedUser()` → objeto do usuário autenticado (redireciona para `/login` quando não houver sessão); `<AppShell user canManageUsers>…</AppShell>`.

- [ ] **Step 1: Mover os arquivos**

```bash
cd apps/web/src/app
mkdir -p "(app)"
git mv page.js "(app)/page.js"
git mv clientes "(app)/clientes"
git mv visitas "(app)/visitas"
git mv admin "(app)/admin"
git mv avaliacoes "(app)/avaliacoes"
git mv "(app)/clientes/client-form.js" ../components/client-form.js
git rm logout-button.js
```

Route groups entre parênteses não aparecem na URL: `(app)/page.js` continua servindo `/`.

- [ ] **Step 2: Corrigir os imports quebrados pela mudança**

Em `apps/web/src/app/(app)/visitas/nova/register-visit-flow.js`, troque:

```js
import ClientForm from "@/app/clientes/client-form";
```

por:

```js
import ClientForm from "@/components/client-form";
```

Em `apps/web/src/app/(app)/clientes/novo/new-client-page-form.js`, troque:

```js
import ClientForm from "../client-form";
```

por:

```js
import ClientForm from "@/components/client-form";
```

Em `apps/web/src/app/(app)/page.js`, troque `import LogoutButton from "./logout-button";` por `import LogoutButton from "@/components/logout-button";`.

- [ ] **Step 3: Escrever `require-auth.js`**

```js
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import authentication from "@/models/authentication";

export default async function requireAuthenticatedUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_id")?.value;
  const authenticatedUser = await authentication.getUserFromSessionToken(token);

  if (!authenticatedUser) {
    redirect("/login");
  }

  return authenticatedUser;
}
```

- [ ] **Step 4: Escrever `logout-button.js`**

```jsx
"use client";

export default function LogoutButton({ className = "" }) {
  async function handleLogout() {
    await fetch("/api/v1/sessions", { method: "DELETE" });
    window.location.href = "/login";
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={`text-sm font-medium text-muted hover:text-ink ${className}`}
    >
      Sair
    </button>
  );
}
```

- [ ] **Step 5: Escrever `app-shell.js`**

```jsx
import Link from "next/link";

import LogoutButton from "./logout-button";

// Estes três são a nav inferior do celular — o esqueleto escolhido fixou três itens.
const PRIMARY_NAV = [
  { href: "/", label: "Início", icon: "🏠" },
  { href: "/clientes", label: "Clientes", icon: "👥" },
  { href: "/avaliacoes", label: "Avaliações", icon: "⭐" },
];

export default function AppShell({ user, canManageUsers = false, children }) {
  const sidebarItems = canManageUsers
    ? [...PRIMARY_NAV, { href: "/admin/colaboradores", label: "Colaboradores", icon: "🧑‍🍳" }]
    : PRIMARY_NAV;

  return (
    <div className="flex min-h-full flex-1 flex-col lg:flex-row">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-surface p-4 lg:flex">
        <p className="mb-6 font-display text-xl font-extrabold text-brand">WeFood</p>
        <Link
          href="/visitas/nova"
          className="mb-6 rounded-full bg-brand px-4 py-3 text-center text-sm font-bold text-white hover:bg-brand-hover"
        >
          Registrar visita
        </Link>
        <nav className="flex flex-col gap-1">
          {sidebarItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted hover:bg-surface-2 hover:text-ink"
            >
              <span aria-hidden="true" className="mr-2">
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-1 border-t border-line pt-4">
          <p className="text-sm font-semibold text-ink">{user.name}</p>
          <LogoutButton className="text-left" />
        </div>
      </aside>

      <header className="flex items-center justify-between border-b border-line bg-surface px-4 py-3 lg:hidden">
        <p className="font-display text-lg font-extrabold text-brand">WeFood</p>
        <LogoutButton />
      </header>

      <main className="flex flex-1 flex-col pb-24 lg:pb-0">{children}</main>

      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        {PRIMARY_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium text-muted"
          >
            <span aria-hidden="true" className="text-lg">
              {item.icon}
            </span>
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
```

- [ ] **Step 6: Escrever `(app)/layout.js`**

```jsx
import requireAuthenticatedUser from "../require-auth";
import authorization from "@/models/authorization";
import AppShell from "@/components/app-shell";

const MANAGE_USERS_FEATURE = "usuarios.gerenciar";

export default async function AppLayout({ children }) {
  const authenticatedUser = await requireAuthenticatedUser();

  return (
    <AppShell
      user={authenticatedUser}
      canManageUsers={authorization.userCan(authenticatedUser, MANAGE_USERS_FEATURE)}
    >
      {children}
    </AppShell>
  );
}
```

As páginas continuam chamando `requireAuthenticatedUser()` por conta própria — o layout não substitui a checagem por página, que é o padrão recomendado no App Router.

- [ ] **Step 7: Verificar no navegador**

Com `npm run dev`, entre no app e visite `/`, `/clientes`, `/visitas/nova` e `/avaliacoes`. Esperado, em 1440px: sidebar creme fixa à esquerda com "WeFood" em vermelho, botão *Registrar visita*, os itens de navegação (com *Colaboradores* só para admin), e nome do usuário com *Sair* no rodapé. Em 375px (modo dispositivo do DevTools): topbar em cima, nav inferior fixa com exatamente três itens — Início, Clientes e Avaliações — e o conteúdo não fica escondido atrás dela.

Saia da sessão e confirme que `/login`, `/cadastro/<token>` e **`/avaliar`** não mostram o shell. O `/avaliar` é o caso que mais importa aqui: é a página pública do QR code, e um cliente da loja não pode ver a navegação interna nem o nome de quem está logado.

- [ ] **Step 8: Rodar a suíte completa**

Da raiz: `npm test`
Esperado: PASS. Nenhum teste toca em UI, mas isso confirma que a movimentação de arquivos não quebrou nenhum import de model.

- [ ] **Step 9: Commit**

```bash
git add -A apps/web/src
git commit -m "Add AppShell with responsive navigation and (app) route group"
```

---

### Task 8: `client.search()` devolve contagem e data da última visita

**Files:**
- Modify: `apps/web/src/models/client.js` (função `search`)
- Test: `apps/web/tests/integration/models/client/search-with-visits.test.js`
- Test: `apps/web/tests/integration/api/v1/clients/get.test.js` (acrescentar um teste)

**Interfaces:**
- Produces: cada linha de `client.search({ name })` passa a ter `visit_count` (Number) e `last_visit_at` (Date ou `null`). `GET /api/v1/clients` reflete os dois campos automaticamente, por já devolver as linhas do model.

- [ ] **Step 1: Escrever o teste que falha**

`apps/web/tests/integration/models/client/search-with-visits.test.js`:

```js
const orchestrator = require("../../../orchestrator");
const client = require("@/models/client");
const visit = require("@/models/visit");

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe("client.search() com dados de visita", () => {
  test("devolve a contagem de visitas e a data da última", async () => {
    const createdClient = await client.create({ name: "Ana Frequente", phone: "11955551001" });

    await visit.create({
      clientId: createdClient.id,
      registeredBy: null,
      amountSpent: 10,
      orderCategories: ["sorvete"],
      reason: "outro",
      discoverySource: "outro",
    });
    await new Promise((resolve) => setTimeout(resolve, 10));
    const lastVisit = await visit.create({
      clientId: createdClient.id,
      registeredBy: null,
      amountSpent: 20,
      orderCategories: ["lanche"],
      reason: "outro",
      discoverySource: "outro",
    });

    const results = await client.search({ name: "Ana Frequente" });

    expect(results).toHaveLength(1);
    expect(results[0].visit_count).toBe(2);
    expect(new Date(results[0].last_visit_at).toISOString()).toBe(
      new Date(lastVisit.created_at).toISOString(),
    );
  });

  test("devolve zero e null para cliente sem visita", async () => {
    await client.create({ name: "Bruno Sem Visita", phone: "11955551002" });

    const results = await client.search({ name: "Bruno Sem Visita" });

    expect(results[0].visit_count).toBe(0);
    expect(results[0].last_visit_at).toBeNull();
  });

  test("continua ordenando por nome", async () => {
    await client.create({ name: "Zelia Ordem", phone: "11955551003" });
    await client.create({ name: "Alberto Ordem", phone: "11955551004" });

    const results = await client.search({ name: "Ordem" });

    expect(results.map((row) => row.name)).toEqual(["Alberto Ordem", "Zelia Ordem"]);
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Com `npm run dev` rodando, de `apps/web`:
`npx jest --runInBand tests/integration/models/client/search-with-visits.test.js`
Esperado: FAIL — `visit_count` é `undefined`.

- [ ] **Step 3: Trocar a função `search` em `apps/web/src/models/client.js`**

```js
async function search({ name }) {
  const result = await database.query({
    text: `
      SELECT
        c.id, c.name, c.phone, c.birth_date, c.neighborhood, c.city,
        c.created_at, c.updated_at,
        COUNT(v.id)::int AS visit_count,
        MAX(v.created_at) AS last_visit_at
      FROM clients c
      LEFT JOIN visits v ON v.client_id = c.id
      WHERE c.name ILIKE $1
      GROUP BY c.id
      ORDER BY c.name;
    `,
    values: [`%${name ?? ""}%`],
  });

  return result.rows;
}
```

O restante do arquivo não muda.

- [ ] **Step 4: Rodar e confirmar que passa**

`npx jest --runInBand tests/integration/models/client/search-with-visits.test.js`
Esperado: PASS, 3 testes.

- [ ] **Step 5: Acrescentar o teste de API**

Em `apps/web/tests/integration/api/v1/clients/get.test.js`, dentro do `describe("GET /api/v1/clients", ...)`, adicione:

```js
  test("com busca por nome, cada cliente traz visit_count e last_visit_at", async () => {
    const adminSession = await createAdminSession();
    await client.create({ name: "Gustavo Contagem", phone: "11977770003" });

    const response = await fetch(`${orchestrator.webserverUrl}/api/v1/clients?search=Gustavo Contagem`, {
      headers: { Cookie: `session_id=${adminSession.token}` },
    });

    const body = await response.json();
    expect(body.clients[0].visit_count).toBe(0);
    expect(body.clients[0].last_visit_at).toBeNull();
  });
```

- [ ] **Step 6: Rodar os testes de API de clientes**

`npx jest --runInBand tests/integration/api/v1/clients`
Esperado: PASS — inclusive os testes que já existiam, que não conheciam os campos novos.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/models/client.js apps/web/tests/integration/models/client/search-with-visits.test.js apps/web/tests/integration/api/v1/clients/get.test.js
git commit -m "Return visit count and last visit date from client.search()"
```

---

### Task 9: `visit.summaryForToday()`

**Files:**
- Modify: `apps/web/src/models/visit.js` (nova função + export)
- Test: `apps/web/tests/integration/models/visit/summary-for-today.test.js`

**Interfaces:**
- Produces: `visit.summaryForToday()` → `{ count: Number, total: Number }`, com o dia calculado no fuso `America/Sao_Paulo`.

- [ ] **Step 1: Escrever o teste que falha**

`apps/web/tests/integration/models/visit/summary-for-today.test.js`:

```js
const database = require("@wefood/database");
const orchestrator = require("../../../orchestrator");
const client = require("@/models/client");
const visit = require("@/models/visit");

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe("visit.summaryForToday()", () => {
  test("devolve zeros quando não há visitas", async () => {
    const summary = await visit.summaryForToday();

    expect(summary).toEqual({ count: 0, total: 0 });
  });

  test("soma as visitas de hoje", async () => {
    const createdClient = await client.create({ name: "Cliente Hoje", phone: "11944441001" });

    await visit.create({
      clientId: createdClient.id,
      registeredBy: null,
      amountSpent: 10.5,
      orderCategories: ["sorvete"],
      reason: "outro",
      discoverySource: "outro",
    });
    await visit.create({
      clientId: createdClient.id,
      registeredBy: null,
      amountSpent: 4.5,
      orderCategories: ["bebida"],
      reason: "outro",
      discoverySource: "outro",
    });

    const summary = await visit.summaryForToday();

    expect(summary.count).toBe(2);
    expect(summary.total).toBe(15);
  });

  test("ignora visita de ontem", async () => {
    const createdClient = await client.create({ name: "Cliente Ontem", phone: "11944441002" });

    const createdVisit = await visit.create({
      clientId: createdClient.id,
      registeredBy: null,
      amountSpent: 99,
      orderCategories: ["lanche"],
      reason: "outro",
      discoverySource: "outro",
    });

    await database.query({
      text: "UPDATE visits SET created_at = now() - interval '2 days' WHERE id = $1;",
      values: [createdVisit.id],
    });

    const summary = await visit.summaryForToday();

    expect(summary.count).toBe(2);
    expect(summary.total).toBe(15);
  });
});
```

Os números do terceiro teste são os do segundo de propósito: os testes rodam em sequência no mesmo banco, e a visita de 99 empurrada para dois dias atrás não pode alterar o resultado.

- [ ] **Step 2: Rodar e confirmar que falha**

`npx jest --runInBand tests/integration/models/visit/summary-for-today.test.js`
Esperado: FAIL — `visit.summaryForToday is not a function`.

- [ ] **Step 3: Acrescentar a função em `apps/web/src/models/visit.js`**

Antes do `module.exports`:

```js
async function summaryForToday() {
  const result = await database.query({
    text: `
      SELECT
        COUNT(*)::int AS count,
        COALESCE(SUM(amount_spent), 0)::float AS total
      FROM visits
      WHERE created_at >= date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo')
        AT TIME ZONE 'America/Sao_Paulo';
    `,
  });

  return result.rows[0];
}
```

E troque o export para:

```js
module.exports = {
  create,
  findByClientId,
  summaryForToday,
};
```

- [ ] **Step 4: Rodar e confirmar que passa**

`npx jest --runInBand tests/integration/models/visit/summary-for-today.test.js`
Esperado: PASS, 3 testes.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/models/visit.js apps/web/tests/integration/models/visit/summary-for-today.test.js
git commit -m "Add visit.summaryForToday() for the home panel"
```

---

### Task 10: `/login` redesenhado

**Files:**
- Modify: `apps/web/src/app/login/page.js` (arquivo inteiro)

**Interfaces:**
- Consumes: `Button` (Task 3), `Input` (Task 4).

- [ ] **Step 1: Substituir `login/page.js` inteiro**

```jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Input from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    let response;
    try {
      response = await fetch("/api/v1/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
    } catch {
      setIsSubmitting(false);
      setError("Não foi possível falar com o servidor. Tente de novo.");
      return;
    }

    setIsSubmitting(false);

    if (!response.ok) {
      const body = await response.json();
      setError(body.message ?? "Não foi possível entrar.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="text-center">
          <p className="font-display text-3xl font-extrabold text-brand">WeFood</p>
          <p className="text-sm text-muted">Sistema de gestão</p>
        </div>

        <Card as="form" onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          <Input
            label="Email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <Input
            label="Senha"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={error}
          />

          <Button type="submit" size="lg" isLoading={isSubmitting} loadingLabel="Entrando...">
            Entrar
          </Button>
        </Card>
      </div>
    </div>
  );
}
```

O `try/catch` no `fetch` é o mesmo defeito que já foi corrigido em `register-visit-flow.js` no commit `c32b856`: sem ele, uma falha de rede deixa o botão travado em "Entrando..." para sempre.

- [ ] **Step 2: Verificar no navegador**

Abra `/login`. Esperado: marca "WeFood" em vermelho no topo, cartão branco sobre fundo creme, campos com 44px de altura. Entre com senha errada: a mensagem aparece embaixo do campo de senha, em vermelho, e o campo ganha borda vermelha. Entre corretamente: vai para `/` com o shell.

- [ ] **Step 3: Rodar os testes de sessão**

`npx jest --runInBand tests/integration/api/v1/sessions`
Esperado: PASS — a API não mudou, isto é só uma rede de segurança.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/login/page.js
git commit -m "Redesign the login screen"
```

---

### Task 11: `/` — home como painel

**Files:**
- Modify: `apps/web/src/app/(app)/page.js` (arquivo inteiro)

**Interfaces:**
- Consumes: `requireAuthenticatedUser` (Task 7), `visit.summaryForToday` (Task 9), `formatCurrency` (Task 2), `Card` (Task 3), `authorization.userCan`.

A home atual tem um link para `/avaliacoes`, acrescentado pelo módulo de avaliações no commit `48dee01`. Ele é preservado como um dos atalhos — substituir o arquivo sem repô-lo apagaria silenciosamente aquele trabalho.

- [ ] **Step 1: Substituir `(app)/page.js` inteiro**

```jsx
import Link from "next/link";

import requireAuthenticatedUser from "../require-auth";
import authorization from "@/models/authorization";
import visit from "@/models/visit";
import Card from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

const MANAGE_USERS_FEATURE = "usuarios.gerenciar";

export default async function Home() {
  const authenticatedUser = await requireAuthenticatedUser();
  const summary = await visit.summaryForToday();

  const shortcuts = [
    { href: "/clientes", label: "Clientes", icon: "👥" },
    { href: "/clientes/novo", label: "Novo cliente", icon: "➕" },
    { href: "/avaliacoes", label: "Avaliações", icon: "⭐" },
  ];

  if (authorization.userCan(authenticatedUser, MANAGE_USERS_FEATURE)) {
    shortcuts.push({ href: "/admin/colaboradores", label: "Colaboradores", icon: "🧑‍🍳" });
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <div>
        <p className="text-sm text-muted">Bem-vindo,</p>
        <h1 className="text-2xl font-extrabold text-ink">{authenticatedUser.name}</h1>
      </div>

      <Card className="flex divide-x divide-line">
        <div className="flex-1 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Visitas hoje</p>
          <p className="text-2xl font-extrabold text-ink">{summary.count}</p>
        </div>
        <div className="flex-1 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Faturamento</p>
          <p className="text-2xl font-extrabold text-ink">{formatCurrency(summary.total)}</p>
        </div>
      </Card>

      <Link
        href="/visitas/nova"
        className="flex flex-col gap-1 rounded-lg bg-brand p-6 text-white shadow-card transition-colors hover:bg-brand-hover"
      >
        <span aria-hidden="true" className="text-3xl">
          ➕
        </span>
        <span className="text-lg font-extrabold">Registrar visita</span>
        <span className="text-sm opacity-90">Buscar o cliente pelo telefone</span>
      </Link>

      <div className="grid grid-cols-2 gap-3">
        {shortcuts.map((shortcut) => (
          <Card
            key={shortcut.href}
            as={Link}
            href={shortcut.href}
            className="flex flex-col gap-1 p-4 transition-colors hover:bg-surface-2"
          >
            <span aria-hidden="true" className="text-xl">
              {shortcut.icon}
            </span>
            <span className="text-sm font-semibold text-ink">{shortcut.label}</span>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar no navegador**

Abra `/`. Esperado: saudação, faixa com "Visitas hoje" e "Faturamento" (registre uma visita e recarregue para ver os números subirem), card vermelho grande *Registrar visita*, e os atalhos em duas colunas. O item *Colaboradores* só aparece para o admin — confirme entrando com um colaborador, se houver.

- [ ] **Step 3: Commit**

```bash
git add "apps/web/src/app/(app)/page.js"
git commit -m "Turn the home page into an action panel with the day's summary"
```

---

### Task 12: `/clientes` — cartões no celular, tabela no PC, busca com debounce

**Files:**
- Modify: `apps/web/src/app/(app)/clientes/page.js` (arquivo inteiro)
- Create: `apps/web/src/app/(app)/clientes/clients-search.js`

**Interfaces:**
- Consumes: `client.search` com os campos da Task 8, `formatPhone`/`formatRelativeDate` (Task 2), `Card`, `Badge`, `EmptyState`, `Button`.
- Produces: `<ClientsSearch defaultValue />` — campo de busca que atualiza a URL com debounce de 300ms.

- [ ] **Step 1: Escrever `clients-search.js`**

```jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ClientsSearch({ defaultValue = "" }) {
  const router = useRouter();
  const [term, setTerm] = useState(defaultValue);

  useEffect(() => {
    if (term === defaultValue) {
      return;
    }

    const timer = setTimeout(() => {
      router.replace(term ? `/clientes?search=${encodeURIComponent(term)}` : "/clientes");
    }, 300);

    return () => clearTimeout(timer);
  }, [term, defaultValue, router]);

  return (
    <form className="flex gap-2" role="search">
      <input
        type="search"
        name="search"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        placeholder="Buscar por nome"
        aria-label="Buscar clientes por nome"
        className="min-h-11 flex-1 rounded-md border border-line bg-surface px-3 py-2 text-ink placeholder:text-muted"
      />
      <button
        type="submit"
        className="min-h-11 rounded-full border border-line bg-surface px-4 text-sm font-semibold text-ink hover:bg-surface-2"
      >
        Buscar
      </button>
    </form>
  );
}
```

O `<form method="GET">` continua funcionando se o JavaScript falhar; o debounce é só um aprimoramento por cima.

- [ ] **Step 2: Substituir `(app)/clientes/page.js` inteiro**

```jsx
import Link from "next/link";

import requireAuthenticatedUser from "../../require-auth";
import client from "@/models/client";
import Badge from "@/components/ui/badge";
import Card from "@/components/ui/card";
import EmptyState from "@/components/ui/empty-state";
import { formatPhone, formatRelativeDate } from "@/lib/format";
import ClientsSearch from "./clients-search";

export default async function ClientesPage({ searchParams }) {
  await requireAuthenticatedUser();

  const { search } = await searchParams;
  const clients = await client.search({ name: search });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Clientes</h1>
          <p className="text-sm text-muted">
            {clients.length} {clients.length === 1 ? "cliente" : "clientes"}
          </p>
        </div>
        <Link
          href="/clientes/novo"
          className="min-h-11 rounded-full bg-brand px-5 py-3 text-sm font-bold text-white hover:bg-brand-hover"
        >
          Novo cliente
        </Link>
      </div>

      <ClientsSearch defaultValue={search ?? ""} />

      {clients.length === 0 ? (
        <EmptyState
          icon={search ? "🔎" : "🍦"}
          title={search ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
          description={
            search
              ? `Nada corresponde a "${search}". Confira a grafia ou cadastre um novo cliente.`
              : "Cadastre o primeiro cliente para começar a registrar visitas."
          }
          action={
            <Link
              href="/clientes/novo"
              className="min-h-11 rounded-full bg-brand px-5 py-3 text-sm font-bold text-white hover:bg-brand-hover"
            >
              Novo cliente
            </Link>
          }
        />
      ) : (
        <>
          <div className="flex flex-col gap-2 sm:hidden">
            {clients.map((listedClient) => (
              <Card key={listedClient.id} className="flex items-center gap-3 p-4">
                <Link href={`/clientes/${listedClient.id}`} className="flex-1">
                  <p className="font-semibold text-ink">{listedClient.name}</p>
                  <p className="text-sm text-muted">
                    {formatPhone(listedClient.phone)}
                    {listedClient.neighborhood ? ` · ${listedClient.neighborhood}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Última visita: {formatRelativeDate(listedClient.last_visit_at)}
                  </p>
                </Link>
                <Badge tone="brand">{listedClient.visit_count}</Badge>
                <Link
                  href={`/visitas/nova?clientId=${listedClient.id}`}
                  aria-label={`Registrar visita de ${listedClient.name}`}
                  className="flex min-h-11 min-w-11 items-center justify-center rounded-full bg-brand-tint text-lg font-bold text-brand"
                >
                  +
                </Link>
              </Card>
            ))}
          </div>

          <Card className="hidden overflow-hidden sm:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-2 text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 font-bold">Nome</th>
                  <th scope="col" className="px-4 py-3 font-bold">Telefone</th>
                  <th scope="col" className="px-4 py-3 font-bold">Bairro</th>
                  <th scope="col" className="px-4 py-3 font-bold">Visitas</th>
                  <th scope="col" className="px-4 py-3 font-bold">Última visita</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((listedClient) => (
                  <tr key={listedClient.id} className="border-t border-line">
                    <td className="px-4 py-3">
                      <Link href={`/clientes/${listedClient.id}`} className="font-semibold text-ink hover:text-brand">
                        {listedClient.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted">{formatPhone(listedClient.phone)}</td>
                    <td className="px-4 py-3 text-muted">{listedClient.neighborhood ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge tone="brand">{listedClient.visit_count}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {formatRelativeDate(listedClient.last_visit_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verificar no navegador**

Em 1440px: tabela com as cinco colunas, telefone formatado `(15) 99123-4001`, badge com a contagem, e "ontem"/"há 3 dias" na última coluna. Em 375px: cartões, com o botão `+` levando direto a `/visitas/nova?clientId=…`. Digite na busca sem apertar nada: a lista atualiza sozinha após ~300ms e a URL ganha `?search=`. Busque por algo inexistente: aparece o estado vazio de busca, diferente do estado vazio de lista sem clientes.

- [ ] **Step 4: Commit**

```bash
git add "apps/web/src/app/(app)/clientes/page.js" "apps/web/src/app/(app)/clientes/clients-search.js"
git commit -m "Redesign the clients list with cards, table, and debounced search"
```

---

### Task 13: `ClientForm` e `/clientes/novo`

**Files:**
- Modify: `apps/web/src/components/client-form.js` (arquivo inteiro)
- Modify: `apps/web/src/app/(app)/clientes/novo/page.js` (arquivo inteiro)

**Interfaces:**
- Consumes: `Input`, `PhoneInput`, `Button`, `Card`, `useToast`, `requireAuthenticatedUser`.
- Produces: `<ClientForm onCreated submitLabel initialPhone />` — mesma interface de antes, agora com telefone em dígitos e erro de duplicidade com link.

- [ ] **Step 1: Substituir `client-form.js` inteiro**

```jsx
"use client";

import { useState } from "react";
import Link from "next/link";

import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Input from "@/components/ui/input";
import PhoneInput from "@/components/ui/phone-input";

export default function ClientForm({ onCreated, submitLabel = "Cadastrar", initialPhone = "" }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState(initialPhone);
  const [birthDate, setBirthDate] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [error, setError] = useState(null);
  const [duplicateId, setDuplicateId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setDuplicateId(null);
    setIsSubmitting(true);

    let response;
    try {
      response = await fetch("/api/v1/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          birth_date: birthDate || null,
          neighborhood: neighborhood || null,
          city: city || null,
        }),
      });
    } catch {
      setIsSubmitting(false);
      setError("Não foi possível falar com o servidor. Tente de novo.");
      return;
    }

    if (!response.ok) {
      const body = await response.json();
      setError(body.message ?? "Não foi possível cadastrar o cliente.");

      const lookup = await fetch(`/api/v1/clients?phone=${encodeURIComponent(phone)}`);
      if (lookup.ok) {
        const lookupBody = await lookup.json();
        setDuplicateId(lookupBody.clients[0]?.id ?? null);
      }

      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    onCreated(await response.json());
  }

  return (
    <Card as="form" onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
      <Input
        label="Nome"
        type="text"
        required
        value={name}
        onChange={(event) => setName(event.target.value)}
      />

      <PhoneInput required value={phone} onChange={setPhone} error={error} />

      {duplicateId && (
        <Link href={`/clientes/${duplicateId}`} className="text-sm font-semibold text-brand underline">
          Ver o cliente já cadastrado com esse telefone
        </Link>
      )}

      <Input
        label="Data de nascimento"
        type="date"
        hint="Opcional"
        value={birthDate}
        onChange={(event) => setBirthDate(event.target.value)}
      />

      <Input
        label="Bairro"
        type="text"
        hint="Opcional"
        value={neighborhood}
        onChange={(event) => setNeighborhood(event.target.value)}
      />

      <Input
        label="Cidade"
        type="text"
        hint="Opcional"
        value={city}
        onChange={(event) => setCity(event.target.value)}
      />

      <Button type="submit" size="lg" isLoading={isSubmitting} loadingLabel="Cadastrando...">
        {submitLabel}
      </Button>
    </Card>
  );
}
```

- [ ] **Step 2: Substituir `(app)/clientes/novo/page.js` inteiro**

```jsx
import requireAuthenticatedUser from "../../../require-auth";
import NewClientPageForm from "./new-client-page-form";

export default async function NovoClientePage() {
  await requireAuthenticatedUser();

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-5 px-4 py-8">
      <h1 className="text-2xl font-extrabold text-ink">Novo cliente</h1>
      <NewClientPageForm />
    </div>
  );
}
```

`new-client-page-form.js` não muda além do import já corrigido na Task 7.

- [ ] **Step 3: Verificar no navegador**

Abra `/clientes/novo`. Cadastre um cliente digitando só números no telefone — deve aparecer mascarado, e o cliente é criado. Cadastre de novo com o mesmo telefone: a mensagem "O telefone informado já está cadastrado." aparece sob o campo, com borda vermelha, **e** o link "Ver o cliente já cadastrado com esse telefone" leva à ficha certa.

- [ ] **Step 4: Rodar os testes de API de clientes**

`npx jest --runInBand tests/integration/api/v1/clients`
Esperado: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/client-form.js "apps/web/src/app/(app)/clientes/novo/page.js"
git commit -m "Redesign the client form with phone mask and duplicate link"
```

---

### Task 14: `/clientes/[id]` — ficha com timeline

**Files:**
- Modify: `apps/web/src/app/(app)/clientes/[id]/page.js` (arquivo inteiro)

**Interfaces:**
- Consumes: `visit-options` (Task 5), `format` (Task 2), `Card`, `Badge`, `EmptyState`, `requireAuthenticatedUser`.

- [ ] **Step 1: Substituir `(app)/clientes/[id]/page.js` inteiro**

```jsx
import Link from "next/link";
import { notFound } from "next/navigation";

import requireAuthenticatedUser from "../../../require-auth";
import client from "@/models/client";
import visit from "@/models/visit";
import Badge from "@/components/ui/badge";
import Card from "@/components/ui/card";
import EmptyState from "@/components/ui/empty-state";
import { formatCurrency, formatPhone, formatRelativeDate } from "@/lib/format";
import {
  CATEGORY_CHIP_CLASSES,
  CATEGORY_LABELS,
  DISCOVERY_LABELS,
  REASON_LABELS,
} from "@/lib/visit-options";

export default async function ClienteDetailPage({ params }) {
  await requireAuthenticatedUser();

  const { id } = await params;
  const foundClient = await client.findById(id);

  if (!foundClient) {
    notFound();
  }

  const visits = await visit.findByClientId(id);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">{foundClient.name}</h1>
          <p className="text-sm text-muted">
            {formatPhone(foundClient.phone)}
            {foundClient.neighborhood ? ` · ${foundClient.neighborhood}` : ""}
            {foundClient.city ? `, ${foundClient.city}` : ""}
          </p>
          <div className="mt-2 flex gap-2">
            <Badge tone="brand">
              {visits.length} {visits.length === 1 ? "visita" : "visitas"}
            </Badge>
            {visits.length > 0 && (
              <Badge tone="neutral">Última {formatRelativeDate(visits[0].created_at)}</Badge>
            )}
          </div>
        </div>
        <Link
          href={`/visitas/nova?clientId=${foundClient.id}`}
          className="min-h-11 rounded-full bg-brand px-5 py-3 text-sm font-bold text-white hover:bg-brand-hover"
        >
          Registrar visita
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-bold text-ink">Histórico de visitas</h2>

        {visits.length === 0 ? (
          <EmptyState
            title="Nenhuma visita registrada"
            description="Quando este cliente vier à loja, registre a visita para começar o histórico."
          />
        ) : (
          visits.map((currentVisit) => (
            <Card key={currentVisit.id} className="flex flex-col gap-3 p-4">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-ink">
                  {formatRelativeDate(currentVisit.created_at)}
                  <span className="ml-2 font-normal text-muted">
                    {new Date(currentVisit.created_at).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </p>
                <p className="text-lg font-extrabold text-ink">
                  {formatCurrency(currentVisit.amount_spent)}
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {currentVisit.order_categories.map((category) => (
                  <span
                    key={category}
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${CATEGORY_CHIP_CLASSES[category]}`}
                  >
                    {CATEGORY_LABELS[category]}
                  </span>
                ))}
              </div>

              {currentVisit.order_details && (
                <p className="text-sm text-muted">{currentVisit.order_details}</p>
              )}

              <dl className="grid grid-cols-1 gap-1 border-t border-line pt-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted">Motivo</dt>
                  <dd className="text-ink">
                    {REASON_LABELS[currentVisit.reason]}
                    {currentVisit.reason_details ? ` — ${currentVisit.reason_details}` : ""}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted">Origem</dt>
                  <dd className="text-ink">
                    {DISCOVERY_LABELS[currentVisit.discovery_source]}
                    {currentVisit.discovery_details ? ` — ${currentVisit.discovery_details}` : ""}
                  </dd>
                </div>
              </dl>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar no navegador**

Abra a ficha de um cliente com visitas. Esperado: nome grande, telefone mascarado, badges de contagem e "Última ontem", e cada visita como cartão com data relativa, hora, valor em destaque à direita, e chips coloridos por categoria (sorvete em rosa, bebida em azul, etc.). Abra a ficha de um cliente sem visitas: aparece o estado vazio.

- [ ] **Step 3: Commit**

```bash
git add "apps/web/src/app/(app)/clientes/[id]/page.js"
git commit -m "Redesign the client detail page with a visit timeline"
```

---

### Task 15: `/visitas/nova` — fluxo de registro

**Files:**
- Modify: `apps/web/src/app/(app)/visitas/nova/register-visit-flow.js` (arquivo inteiro)
- Modify: `apps/web/src/app/(app)/visitas/nova/page.js` (arquivo inteiro)

**Interfaces:**
- Consumes: todos os primitivos, `visit-options` (Task 5), `useToast` (Task 6), `GET /api/v1/clients/[id]` (já existente) para descobrir a origem da primeira visita.

- [ ] **Step 1: Substituir `(app)/visitas/nova/page.js` inteiro**

```jsx
import requireAuthenticatedUser from "../../../require-auth";
import client from "@/models/client";
import RegisterVisitFlow from "./register-visit-flow";

export default async function NovaVisitaPage({ searchParams }) {
  await requireAuthenticatedUser();

  const { clientId } = await searchParams;
  const initialClient = clientId ? await client.findById(clientId) : null;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-4 py-8">
      <RegisterVisitFlow initialClient={initialClient} />
    </div>
  );
}
```

- [ ] **Step 2: Substituir `register-visit-flow.js` inteiro**

```jsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Chip from "@/components/ui/chip";
import CurrencyInput from "@/components/ui/currency-input";
import Input from "@/components/ui/input";
import PhoneInput from "@/components/ui/phone-input";
import ClientForm from "@/components/client-form";
import { useToast } from "@/components/ui/toast";
import { formatPhone, formatRelativeDate } from "@/lib/format";
import {
  CATEGORY_OPTIONS,
  DISCOVERY_LABELS,
  DISCOVERY_OPTIONS,
  REASON_OPTIONS,
} from "@/lib/visit-options";

export default function RegisterVisitFlow({ initialClient }) {
  const router = useRouter();
  const toast = useToast();

  const [step, setStep] = useState(initialClient ? "visit-form" : "search");
  const [foundClient, setFoundClient] = useState(initialClient);
  const [history, setHistory] = useState(null);
  const [phone, setPhone] = useState("");
  const [searchError, setSearchError] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const [categories, setCategories] = useState([]);
  const [orderDetails, setOrderDetails] = useState("");
  const [amountSpent, setAmountSpent] = useState(0);
  const [reason, setReason] = useState(REASON_OPTIONS[0].value);
  const [reasonDetails, setReasonDetails] = useState("");
  const [discoverySource, setDiscoverySource] = useState(DISCOVERY_OPTIONS[0].value);
  const [discoveryDetails, setDiscoveryDetails] = useState("");
  const [isEditingDiscovery, setIsEditingDiscovery] = useState(false);
  const [visitError, setVisitError] = useState(null);
  const [isSubmittingVisit, setIsSubmittingVisit] = useState(false);

  const loadHistory = useCallback(async (clientId) => {
    try {
      const response = await fetch(`/api/v1/clients/${clientId}`);
      if (!response.ok) {
        return;
      }
      const body = await response.json();
      setHistory(body.visits);

      const firstVisit = body.visits[body.visits.length - 1];
      if (firstVisit) {
        setDiscoverySource(firstVisit.discovery_source);
        setDiscoveryDetails(firstVisit.discovery_details ?? "");
      }
    } catch {
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    if (foundClient) {
      loadHistory(foundClient.id);
    }
  }, [foundClient, loadHistory]);

  async function handleSearch(event) {
    event.preventDefault();
    setSearchError(null);
    setIsSearching(true);

    let response;
    try {
      response = await fetch(`/api/v1/clients?phone=${encodeURIComponent(phone)}`);
    } catch {
      setIsSearching(false);
      setSearchError("Não foi possível falar com o servidor. Tente de novo.");
      return;
    }

    setIsSearching(false);
    const body = await response.json();

    if (!response.ok) {
      setSearchError(body.message ?? "Não foi possível buscar o cliente.");
      return;
    }

    if (body.clients.length === 0) {
      setStep("quick-create");
      return;
    }

    setFoundClient(body.clients[0]);
    setStep("visit-form");
  }

  function handleClientCreated(createdClient) {
    setFoundClient(createdClient);
    setHistory([]);
    setStep("visit-form");
  }

  function toggleCategory(value) {
    setCategories((current) =>
      current.includes(value)
        ? current.filter((category) => category !== value)
        : [...current, value],
    );
  }

  async function handleSubmitVisit(event) {
    event.preventDefault();
    setVisitError(null);

    if (categories.length === 0) {
      setVisitError("Selecione ao menos uma categoria do pedido.");
      return;
    }

    setIsSubmittingVisit(true);

    let response;
    try {
      response = await fetch(`/api/v1/clients/${foundClient.id}/visits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount_spent: amountSpent,
          order_categories: categories,
          order_details: orderDetails,
          reason,
          reason_details: reasonDetails,
          discovery_source: discoverySource,
          discovery_details: discoveryDetails,
        }),
      });
    } catch {
      setIsSubmittingVisit(false);
      setVisitError("Não foi possível falar com o servidor. Tente de novo.");
      return;
    }

    setIsSubmittingVisit(false);

    if (!response.ok) {
      const body = await response.json();
      setVisitError(body.message ?? "Não foi possível registrar a visita.");
      return;
    }

    toast.success(`Visita de ${foundClient.name} registrada.`);
    router.push(`/clientes/${foundClient.id}`);
    router.refresh();
  }

  if (step === "search") {
    return (
      <Card as="form" onSubmit={handleSearch} className="flex flex-col gap-4 p-6">
        <h1 className="text-xl font-extrabold text-ink">Registrar visita</h1>
        <PhoneInput
          label="Telefone do cliente"
          required
          value={phone}
          onChange={setPhone}
          error={searchError}
        />
        <Button type="submit" size="lg" isLoading={isSearching} loadingLabel="Buscando...">
          Buscar
        </Button>
      </Card>
    );
  }

  if (step === "quick-create") {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-ink">Cliente novo</h1>
          <p className="text-sm text-muted">
            Ninguém cadastrado com {formatPhone(phone)}. Cadastre antes de continuar.
          </p>
        </div>
        <ClientForm
          onCreated={handleClientCreated}
          submitLabel="Cadastrar e continuar"
          initialPhone={phone}
        />
      </div>
    );
  }

  const isReturning = history !== null && history.length > 0;
  const showDiscoveryChips = !isReturning || isEditingDiscovery;

  return (
    <form onSubmit={handleSubmitVisit} className="flex flex-col gap-5 pb-24">
      <div>
        <h1 className="text-xl font-extrabold text-ink">{foundClient.name}</h1>
        <p className="text-sm text-muted">
          {isReturning
            ? `${history.length + 1}ª visita · última ${formatRelativeDate(history[0].created_at)}`
            : "Primeira visita"}
        </p>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-xs font-bold uppercase tracking-wide text-muted">
          O que pediu
        </legend>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              role="checkbox"
              selected={categories.includes(option.value)}
              onToggle={() => toggleCategory(option.value)}
            >
              {option.label}
            </Chip>
          ))}
        </div>
        {categories.length > 0 && (
          <Input
            label="Detalhe do pedido"
            hint="Opcional"
            type="text"
            value={orderDetails}
            onChange={(event) => setOrderDetails(event.target.value)}
          />
        )}
      </fieldset>

      <CurrencyInput required value={amountSpent} onChange={setAmountSpent} />

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-xs font-bold uppercase tracking-wide text-muted">
          Motivo da visita
        </legend>
        <div className="flex flex-wrap gap-2">
          {REASON_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              role="radio"
              selected={reason === option.value}
              onToggle={() => setReason(option.value)}
            >
              {option.label}
            </Chip>
          ))}
        </div>
        <Input
          label="Detalhe do motivo"
          hint="Opcional"
          type="text"
          value={reasonDetails}
          onChange={(event) => setReasonDetails(event.target.value)}
        />
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-xs font-bold uppercase tracking-wide text-muted">
          De onde conheceu a loja
        </legend>

        {showDiscoveryChips ? (
          <>
            <div className="flex flex-wrap gap-2">
              {DISCOVERY_OPTIONS.map((option) => (
                <Chip
                  key={option.value}
                  role="radio"
                  selected={discoverySource === option.value}
                  onToggle={() => setDiscoverySource(option.value)}
                >
                  {option.label}
                </Chip>
              ))}
            </div>
            <Input
              label="Detalhe da origem"
              hint="Opcional"
              type="text"
              value={discoveryDetails}
              onChange={(event) => setDiscoveryDetails(event.target.value)}
            />
          </>
        ) : (
          <div className="flex items-center justify-between gap-3 rounded-md border border-dashed border-line px-4 py-3">
            <p className="text-sm text-ink">{DISCOVERY_LABELS[discoverySource]}</p>
            <button
              type="button"
              onClick={() => setIsEditingDiscovery(true)}
              className="min-h-11 text-sm font-bold text-brand"
            >
              Alterar
            </button>
          </div>
        )}
      </fieldset>

      {visitError && (
        <p role="alert" className="text-sm text-danger">
          {visitError}
        </p>
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg px-4 py-3 shadow-raised lg:static lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
        <div className="mx-auto max-w-md pb-[env(safe-area-inset-bottom)]">
          <Button
            type="submit"
            size="lg"
            className="w-full"
            isLoading={isSubmittingVisit}
            loadingLabel="Registrando..."
          >
            Registrar visita
          </Button>
        </div>
      </div>
    </form>
  );
}
```

Três coisas a notar: o `pb-24` no formulário reserva espaço para a barra fixa; `history[body.visits.length - 1]` pega a **primeira** visita porque a API devolve em ordem decrescente; e o campo de origem continua sendo enviado em toda visita — só deixa de ser digitado.

- [ ] **Step 3: Verificar no navegador — cliente novo**

Vá a `/visitas/nova`, digite um telefone inexistente e busque. Esperado: cai no cadastro rápido com o telefone já preenchido. Cadastre. No formulário: cabeçalho diz "Primeira visita", e o bloco "De onde conheceu a loja" **mostra os chips**. Preencha e registre. Esperado: toast verde "Visita de … registrada." e redirecionamento para a ficha, já com a visita.

- [ ] **Step 4: Verificar no navegador — cliente recorrente**

Volte a `/visitas/nova` e busque o telefone do cliente que acabou de registrar. Esperado: cabeçalho diz "2ª visita · última hoje", e o bloco de origem aparece **fechado**, mostrando a origem escolhida na primeira visita e um botão *Alterar* que revela os chips. Confira também que o botão *Registrar visita* fica fixo no rodapé ao rolar, em 375px.

- [ ] **Step 5: Rodar os testes de visitas**

`npx jest --runInBand tests/integration/api/v1/clients/visits`
Esperado: PASS.

- [ ] **Step 6: Commit**

```bash
git add "apps/web/src/app/(app)/visitas/nova"
git commit -m "Redesign the visit flow with chips, currency input, and smart discovery"
```

---

### Task 16: `/admin/colaboradores`

**Files:**
- Modify: `apps/web/src/app/(app)/admin/colaboradores/page.js` (arquivo inteiro)
- Modify: `apps/web/src/app/(app)/admin/colaboradores/new-user-form.js` (arquivo inteiro)

**Interfaces:**
- Consumes: `Card`, `Badge`, `Input`, `Button`, `useToast`, `requireAuthenticatedUser`, `authorization.userCan`.

- [ ] **Step 1: Substituir `page.js` inteiro**

```jsx
import { notFound } from "next/navigation";

import requireAuthenticatedUser from "../../../require-auth";
import authorization from "@/models/authorization";
import user from "@/models/user";
import Badge from "@/components/ui/badge";
import Card from "@/components/ui/card";
import NewUserForm from "./new-user-form";

const MANAGE_USERS_FEATURE = "usuarios.gerenciar";

const STATUS_LABELS = {
  active: "Ativo",
  pending: "Pendente",
};

export default async function ColaboradoresPage() {
  const authenticatedUser = await requireAuthenticatedUser();

  if (!authorization.userCan(authenticatedUser, MANAGE_USERS_FEATURE)) {
    notFound();
  }

  const users = await user.findAll();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-extrabold text-ink">Colaboradores</h1>

      <NewUserForm />

      <div className="flex flex-col gap-2">
        {users.map((listedUser) => (
          <Card key={listedUser.id} className="flex items-center justify-between gap-3 p-4">
            <div>
              <p className="font-semibold text-ink">{listedUser.name}</p>
              <p className="text-sm text-muted">{listedUser.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone="neutral">{listedUser.role.name}</Badge>
              <Badge tone={listedUser.status === "active" ? "success" : "brand"}>
                {STATUS_LABELS[listedUser.status] ?? listedUser.status}
              </Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Substituir `new-user-form.js` inteiro**

```jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Input from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

export default function NewUserForm() {
  const router = useRouter();
  const toast = useToast();
  const [roles, setRoles] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("colaborador");
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteUrl, setInviteUrl] = useState(null);

  useEffect(() => {
    async function loadRoles() {
      const response = await fetch("/api/v1/roles");
      if (!response.ok) {
        return;
      }
      const body = await response.json();
      setRoles(body.roles);
      if (body.roles.length > 0) {
        setRole(body.roles.find((r) => r.key === "colaborador")?.key ?? body.roles[0].key);
      }
    }
    loadRoles();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setInviteUrl(null);
    setIsSubmitting(true);

    let response;
    try {
      response = await fetch("/api/v1/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, role }),
      });
    } catch {
      setIsSubmitting(false);
      setError("Não foi possível falar com o servidor. Tente de novo.");
      return;
    }

    setIsSubmitting(false);

    if (!response.ok) {
      const body = await response.json();
      setError(body.message ?? "Não foi possível cadastrar o colaborador.");
      return;
    }

    const body = await response.json();
    setInviteUrl(body.invite.url);
    setName("");
    setEmail("");
    toast.success("Colaborador cadastrado. Copie o link do convite.");
    router.refresh();
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(inviteUrl);
    toast.success("Link copiado.");
  }

  return (
    <Card className="flex flex-col gap-4 p-6">
      <h2 className="text-lg font-bold text-ink">Novo colaborador</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Nome"
          type="text"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />

        <Input
          label="Email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={error}
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="new-user-role" className="text-sm font-medium text-muted">
            Papel
          </label>
          <select
            id="new-user-role"
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="min-h-11 rounded-md border border-line bg-surface px-3 py-2 text-ink"
          >
            {roles.map((currentRole) => (
              <option key={currentRole.key} value={currentRole.key}>
                {currentRole.name}
              </option>
            ))}
          </select>
        </div>

        <Button type="submit" isLoading={isSubmitting} loadingLabel="Cadastrando...">
          Cadastrar
        </Button>
      </form>

      {inviteUrl && (
        <div className="flex flex-col gap-2 rounded-md border border-line bg-surface-2 p-4">
          <p className="text-sm text-muted">Envie este link para o colaborador definir a senha:</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={inviteUrl}
              aria-label="Link do convite"
              className="min-h-11 flex-1 rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
            />
            <Button type="button" variant="secondary" onClick={handleCopy}>
              Copiar
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
```

- [ ] **Step 3: Verificar no navegador**

Como admin, abra `/admin/colaboradores`. Cadastre um colaborador. Esperado: toast verde, a lista abaixo atualiza com o novo nome e badge "Pendente" em rosa, e o bloco do convite aparece. Clique em *Copiar*: toast "Link copiado.". Entre com um usuário sem a permissão e confirme que a rota devolve 404.

- [ ] **Step 4: Rodar os testes de usuários**

`npx jest --runInBand tests/integration/api/v1/users`
Esperado: PASS.

- [ ] **Step 5: Commit**

```bash
git add "apps/web/src/app/(app)/admin/colaboradores"
git commit -m "Redesign the collaborators screen"
```

---

### Task 17: Estados de carregamento, erro e 404

**Files:**
- Create: `apps/web/src/app/(app)/loading.js`
- Create: `apps/web/src/app/(app)/error.js`
- Create: `apps/web/src/app/not-found.js`

**Interfaces:**
- Consumes: `Button` (Task 3).

- [ ] **Step 1: Escrever `(app)/loading.js`**

```jsx
export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-8">
      <div className="h-8 w-48 animate-pulse rounded-md bg-surface-2" />
      <div className="h-20 animate-pulse rounded-lg bg-surface-2" />
      <div className="h-16 animate-pulse rounded-lg bg-surface-2" />
      <div className="h-16 animate-pulse rounded-lg bg-surface-2" />
      <span className="sr-only">Carregando…</span>
    </div>
  );
}
```

- [ ] **Step 2: Escrever `(app)/error.js`**

```jsx
"use client";

import Button from "@/components/ui/button";

export default function Error({ reset }) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
      <span aria-hidden="true" className="text-4xl">
        🫠
      </span>
      <h1 className="text-xl font-extrabold text-ink">Algo deu errado</h1>
      <p className="text-sm text-muted">
        Não conseguimos carregar esta tela. Tente de novo — se continuar, avise o suporte.
      </p>
      <Button type="button" onClick={reset}>
        Tentar de novo
      </Button>
    </div>
  );
}
```

- [ ] **Step 3: Escrever `not-found.js`**

```jsx
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <span aria-hidden="true" className="text-4xl">
        🍨
      </span>
      <h1 className="text-xl font-extrabold text-ink">Página não encontrada</h1>
      <p className="text-sm text-muted">O endereço acessado não existe ou foi removido.</p>
      <Link
        href="/"
        className="min-h-11 rounded-full bg-brand px-5 py-3 text-sm font-bold text-white hover:bg-brand-hover"
      >
        Voltar ao início
      </Link>
    </div>
  );
}
```

- [ ] **Step 4: Verificar no navegador**

Abra `/clientes/00000000-0000-0000-0000-000000000000`: deve aparecer a página 404 em português com o link de voltar. Para ver o skeleton, no DevTools use *Network → Slow 3G* e navegue de `/` para `/clientes`.

- [ ] **Step 5: Rodar a suíte completa**

Da raiz: `npm test`
Esperado: PASS em toda a suíte. Este é o portão final do redesenho.

- [ ] **Step 6: Rodar o lint**

Da raiz: `npm run lint`
Esperado: sem erros.

- [ ] **Step 7: Commit**

```bash
git add "apps/web/src/app/(app)/loading.js" "apps/web/src/app/(app)/error.js" apps/web/src/app/not-found.js
git commit -m "Add loading skeletons, error boundary, and not-found page"
```

---

### Task 18: `/cadastro/[token]` — aceite do convite

**Files:**
- Modify: `apps/web/src/app/cadastro/[token]/page.js` (arquivo inteiro)
- Modify: `apps/web/src/app/cadastro/[token]/accept-invite-form.js` (arquivo inteiro)

**Interfaces:**
- Consumes: `Button` (Task 3), `Card` (Task 3), `Input` (Task 4).

Esta é a primeira tela que um colaborador novo vê, e fica fora do route group `(app)` porque ainda não há sessão. Além do visual, corrige-se aqui um defeito de conteúdo: o texto atual está fixo no feminino ("Bem-vinda", "Você foi convidada"), o que erra o gênero de qualquer pessoa convidada cujo gênero não seja esse. O sistema não guarda gênero, então a redação passa a ser neutra.

- [ ] **Step 1: Substituir `page.js` inteiro**

```jsx
import user from "@/models/user";
import Card from "@/components/ui/card";
import AcceptInviteForm from "./accept-invite-form";

export default async function CadastroPage({ params }) {
  const { token } = await params;

  const invitedUser = await user.findByValidInviteToken(token);

  if (!invitedUser) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="flex max-w-sm flex-col gap-2 p-6 text-center">
          <span aria-hidden="true" className="text-3xl">
            ⏳
          </span>
          <h1 className="text-lg font-extrabold text-ink">Convite inválido ou expirado</h1>
          <p className="text-sm text-muted">
            Solicite um novo convite a um administrador para concluir seu cadastro.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <AcceptInviteForm token={token} name={invitedUser.name} roleName={invitedUser.role.name} />
    </div>
  );
}
```

- [ ] **Step 2: Substituir `accept-invite-form.js` inteiro**

```jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Input from "@/components/ui/input";

export default function AcceptInviteForm({ token, name, roleName }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    let response;
    try {
      response = await fetch(`/api/v1/invites/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, password_confirmation: passwordConfirmation }),
      });
    } catch {
      setIsSubmitting(false);
      setError("Não foi possível falar com o servidor. Tente de novo.");
      return;
    }

    setIsSubmitting(false);

    if (!response.ok) {
      const body = await response.json();
      setError(body.message ?? "Não foi possível concluir o cadastro.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <div className="text-center">
        <p className="font-display text-3xl font-extrabold text-brand">WeFood</p>
        <p className="text-sm text-muted">Sistema de gestão</p>
      </div>

      <Card as="form" onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
        <div>
          <h1 className="text-xl font-extrabold text-ink">Boas-vindas, {name}</h1>
          <p className="text-sm text-muted">
            Seu convite é para o papel de {roleName}. Defina uma senha para concluir o cadastro.
          </p>
        </div>

        <Input
          label="Senha"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          hint="Mínimo de 8 caracteres"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <Input
          label="Confirmar senha"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={passwordConfirmation}
          onChange={(event) => setPasswordConfirmation(event.target.value)}
          error={error}
        />

        <Button type="submit" size="lg" isLoading={isSubmitting} loadingLabel="Concluindo...">
          Concluir cadastro
        </Button>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Verificar no navegador**

Como admin, gere um convite em `/admin/colaboradores` e copie o link. Abra-o numa janela anônima. Esperado: marca no topo, cartão com "Boas-vindas, <nome>" (sem flexão de gênero), dois campos de senha, e a dica "Mínimo de 8 caracteres". Envie senhas diferentes: a mensagem de erro aparece sob o campo de confirmação. Envie senhas iguais: o cadastro conclui e cai em `/` já com o shell. Abra um token inventado: aparece o cartão de convite inválido.

- [ ] **Step 4: Rodar os testes de convites**

`npx jest --runInBand tests/integration/api/v1/invites`
Esperado: PASS.

- [ ] **Step 5: Commit**

```bash
git add "apps/web/src/app/cadastro"
git commit -m "Redesign the invite acceptance screen and use gender-neutral copy"
```

---

### Task 19: `/avaliacoes` e `/avaliar` — módulo de avaliações

**Files:**
- Modify: `apps/web/src/app/(app)/avaliacoes/page.js` (arquivo inteiro)
- Modify: `apps/web/src/app/avaliar/page.js` (arquivo inteiro)
- Modify: `apps/web/src/app/avaliar/review-form.js` (arquivo inteiro)

**Interfaces:**
- Consumes: `Card`, `Badge`, `EmptyState`, `Button`, `requireAuthenticatedUser`, `formatRelativeDate`.
- Não altera `models/review.js` nem `POST /api/v1/reviews`.

Estas telas vieram do módulo de avaliações (`3edff4c`..`48dee01`), construído em paralelo a este redesenho, e ficaram no tema antigo. `/avaliar` é a única tela **pública** do sistema — é para onde o QR code da loja aponta — e por isso continua fora do route group `(app)`, sem shell.

- [ ] **Step 1: Substituir `(app)/avaliacoes/page.js` inteiro**

```jsx
import requireAuthenticatedUser from "../../require-auth";
import review from "@/models/review";
import Badge from "@/components/ui/badge";
import Card from "@/components/ui/card";
import EmptyState from "@/components/ui/empty-state";
import { formatRelativeDate } from "@/lib/format";

function Stars({ rating }) {
  return (
    <span aria-label={`Nota ${rating} de 5`} className="text-lg leading-none">
      <span className="text-accent">{"★".repeat(rating)}</span>
      <span className="text-line">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export default async function AvaliacoesPage() {
  await requireAuthenticatedUser();

  const summary = await review.getSummary();
  const reviews = await review.findAll();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Avaliações</h1>
        <p className="text-sm text-muted">
          Link público do QR code da loja: <span className="font-mono">/avaliar</span>
        </p>
      </div>

      {summary.total === 0 ? (
        <EmptyState
          icon="⭐"
          title="Nenhuma avaliação ainda"
          description="Deixe o QR code da loja apontando para /avaliar e as notas dos clientes aparecem aqui."
        />
      ) : (
        <>
          <Card className="flex items-center gap-4 p-6">
            <p className="font-display text-4xl font-extrabold text-ink">
              {summary.average.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
            </p>
            <div>
              <Stars rating={Math.round(summary.average)} />
              <p className="text-sm text-muted">
                {summary.total === 1 ? "1 avaliação" : `${summary.total} avaliações`}
              </p>
            </div>
          </Card>

          <ul className="flex flex-col gap-3">
            {reviews.map((listedReview) => (
              <Card as="li" key={listedReview.id} className="flex flex-col gap-2 p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <Stars rating={listedReview.rating} />
                  <Badge tone="neutral">{formatRelativeDate(listedReview.created_at)}</Badge>
                </div>
                {listedReview.comment && (
                  <p className="text-sm text-ink">{listedReview.comment}</p>
                )}
              </Card>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Substituir `avaliar/page.js` inteiro**

```jsx
import ReviewForm from "./review-form";

export const metadata = {
  title: "Avaliar a WeFood",
  description: "Conte pra gente o que você achou da loja",
};

// Página pública: sem checagem de sessão de propósito — é para onde o QR code
// da loja aponta, e o cliente nunca está logado.
export default function AvaliarPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="text-center">
          <p className="font-display text-3xl font-extrabold text-brand">WeFood</p>
          <h1 className="mt-2 text-xl font-extrabold text-ink">Como foi sua visita?</h1>
          <p className="text-sm text-muted">Leva menos de um minuto e é anônimo.</p>
        </div>
        <ReviewForm />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Substituir `avaliar/review-form.js` inteiro**

```jsx
"use client";

import { useState } from "react";

import Button from "@/components/ui/button";
import Card from "@/components/ui/card";

const RATING_OPTIONS = [1, 2, 3, 4, 5];
const MAX_COMMENT_LENGTH = 1000;

export default function ReviewForm() {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);

    if (rating === 0) {
      setError("Escolha uma nota de 1 a 5 estrelas.");
      return;
    }

    setIsSubmitting(true);

    let response;
    try {
      response = await fetch("/api/v1/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });
    } catch {
      setIsSubmitting(false);
      setError("Não foi possível enviar sua avaliação. Verifique sua conexão e tente de novo.");
      return;
    }

    setIsSubmitting(false);

    if (!response.ok) {
      const body = await response.json();
      setError(body.message ?? "Não foi possível enviar sua avaliação.");
      return;
    }

    setIsSent(true);
  }

  if (isSent) {
    return (
      <Card className="flex flex-col items-center gap-2 p-8 text-center">
        <p className="text-4xl leading-none" aria-hidden="true">
          🍦
        </p>
        <h2 className="text-xl font-extrabold text-ink">Obrigado pela sua avaliação!</h2>
        <p className="text-sm text-muted">Sua opinião ajuda a WeFood a melhorar a cada dia.</p>
      </Card>
    );
  }

  return (
    <Card as="form" onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium text-muted">
          Que nota você dá para a loja?
        </legend>
        <div className="flex justify-center gap-1">
          {RATING_OPTIONS.map((value) => (
            <label key={value} className="flex min-h-12 min-w-12 cursor-pointer items-center justify-center">
              <input
                type="radio"
                name="rating"
                value={value}
                checked={rating === value}
                onChange={() => setRating(value)}
                className="peer sr-only"
              />
              <span
                aria-hidden="true"
                className={`block text-4xl leading-none transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-current ${
                  value <= rating ? "text-accent" : "text-line"
                }`}
              >
                ★
              </span>
              <span className="sr-only">{value === 1 ? "1 estrela" : `${value} estrelas`}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="review-comment" className="text-sm font-medium text-muted">
          Comentário (opcional)
        </label>
        <textarea
          id="review-comment"
          rows={4}
          maxLength={MAX_COMMENT_LENGTH}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Quer contar mais alguma coisa pra gente?"
          className="rounded-md border border-line bg-surface px-3 py-2 text-ink placeholder:text-muted"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" isLoading={isSubmitting} loadingLabel="Enviando...">
        Enviar avaliação
      </Button>
    </Card>
  );
}
```

As estrelas ganharam alvo de 48px (eram ~40px com `p-1`), que é o mínimo do design system — e essa é a tela tocada por clientes da loja, no celular deles, sem nenhum treino.

- [ ] **Step 4: Verificar no navegador**

Abra `/avaliar` numa janela anônima. Esperado: marca WeFood no topo, cartão creme, cinco estrelas em âmbar (`--color-accent`) que preenchem da esquerda até a tocada, alvo de toque de 48px cada, e **nenhuma navegação interna visível**. Envie sem escolher nota: mensagem de erro em vermelho com `role="alert"`. Envie com nota: o cartão vira a confirmação com o sorvete.

Depois, logado, abra `/avaliacoes`. Esperado: nota média em número grande com as estrelas ao lado, e a lista com data relativa ("hoje", "ontem") em vez do timestamp completo. Sem nenhuma avaliação no banco, aparece o estado vazio.

- [ ] **Step 5: Rodar os testes de avaliações**

`npx jest --runInBand tests/integration/api/v1/reviews`
Esperado: PASS — a API não muda; é rede de segurança.

- [ ] **Step 6: Commit**

```bash
git add "apps/web/src/app/(app)/avaliacoes" apps/web/src/app/avaliar
git commit -m "Restyle the review screens with the design system"
```

---

## Verificação final

Depois da Task 19, percorra o fluxo inteiro em 375px e em 1440px:

1. `/login` → entrar
2. Home: conferir visitas de hoje e faturamento
3. `/clientes`: buscar, abrir uma ficha
4. Registrar uma visita para cliente recorrente (origem fechada) e para um cliente novo (origem aberta)
5. Confirmar o toast de sucesso e a visita nova no topo da timeline
6. `/avaliacoes` logado, e `/avaliar` numa janela anônima — confirmando que a pública não mostra navegação interna
7. Alternar o tema do sistema operacional entre claro e escuro e reconferir contraste e legibilidade em cada tela
