# Módulo Dashboard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the store manager one screen, `/dashboard`, that aggregates the visit data already being collected — movement and revenue, marketing origin and reason, ordered categories, and client profile — over a chosen period.

**Architecture:** A read-only model under `apps/web/src/models/dashboard/`, one file per section of the screen, each exposing plain functions that take `{ from, to }` and return plain JS numbers. The page is a Server Component that calls the model directly (like `/clientes` already does) — no API route, no client component, no chart library. Bars are `div`s sized by percentage. Access is gated by a new `dashboard.visualizar` feature.

**Tech Stack:** Next.js App Router (JS, Server Components), `pg` raw SQL (no ORM), node-pg-migrate, Jest against a real local Postgres (no mocks), Tailwind v4 with the design tokens from the UX/UI redesign.

**Spec:** `docs/superpowers/specs/2026-08-04-dashboard-design.md`

## Status: Tasks 1–9 are done and merged

Tasks 1–9 (the whole data layer) were implemented, reviewed and committed on
`main` in `0a0f595..25654ba`. The full suite is green at 47 suites / 151 tests.
**Start at the checkpoint before Task 10.** Progress notes, deferred minors and
one adjudicated finding live in `.superpowers/sdd/2026-08-04-dashboard/progress.md`.

Two things Tasks 1–9 settled that change the text below:

- `apps/web/src/lib/visit-options.js` is **ESM** and also exports
  `CATEGORY_CHIP_CLASSES`, adopted byte-for-byte from the redesign worktree so
  the branches merge cleanly. Task 12 uses it for the category bar colors.
- The model is a directory, `apps/web/src/models/dashboard/`, with an
  `index.js` barrel — `require("@/models/dashboard")` is unchanged for consumers.

## ⚠️ Ordering dependency — read before starting

Tasks 9–13 consume pieces delivered by the **UX/UI redesign** (`docs/superpowers/specs/2026-08-04-ux-ui-redesign-design.md`): the theme tokens, the `Card` / `Badge` / `EmptyState` primitives in `src/components/ui/`, `formatCurrency` in `src/lib/`, `requireAuthenticatedUser()` in `src/app/require-auth.js`, and `AppShell` in `src/components/app-shell.js`.

- **Tasks 1–8 are independent** and can be implemented immediately — they are model, migration and test-only work that touches no UI file.
- **Tasks 9–13 are blocked** until the redesign is merged. Before starting Task 9, verify those files exist. If they do not, **stop and report** rather than recreating them — duplicating the design system is the one expensive way this module can go wrong.
- The prop names and signatures used in Tasks 9–13 come from the redesign spec. When you get there, open the real files and confirm them; if a name drifted, follow the real code and note the difference in the commit message.

## Deviation from the spec, on purpose

The spec names a single `apps/web/src/models/dashboard.js`. Ten SQL functions in one file would land around 350–400 lines — larger than every existing model in the repo (`user.js`, the biggest, is 211). This plan splits it into `apps/web/src/models/dashboard/` with one file per screen section. The public interface is unchanged: `require("@/models/dashboard")` still returns every function, re-exported from `index.js`.

## Global Constraints

- All user-facing copy (labels, headings, empty states) is in Portuguese (pt-BR).
- No new npm dependency. No chart library.
- No `"use client"` anywhere in this module — every component is a Server Component.
- No hex colors and no `dark:` classes in any new component. Colors come from the redesign tokens only.
- All money and count values cross the model boundary as JS `Number`, never as the strings `pg` returns for `numeric` and `bigint`.
- All day boundaries are computed in `America/Sao_Paulo`, never in UTC.
- No ORM: every query goes through `database.query()` from `@wefood/database`, like `apps/web/src/models/client.js`.
- Tests are integration tests against the real local Postgres via `apps/web/tests/orchestrator.js` — no mocks — except for pure functions (period resolution, label formatting), which get unit tests.
- Commit messages are imperative sentence case with no prefix, matching the repo's history ("Add client detail page with visit history"), and end with the `Co-Authored-By` trailer.
- Run the **full** suite with `npm test` from the repo root. It boots Next.js and Jest together.
- **`npm test -- <pattern>` does not filter tests in this repo.** The `test` script is `concurrently "next dev -p 3010" "jest ..."`, so the extra argument becomes a third command for `concurrently` and dies with `command not found`. The per-step commands below use `cd apps/web && npx jest --runInBand <path>`, which **requires a dev server already listening on 3010** — start one with `npm run dev` in another terminal and leave it running for the whole task. Without one, use `cd apps/web && npx concurrently --kill-others --success first "next dev -p 3010" "jest --runInBand --verbose <path>"` instead.
- Every test run does `DROP SCHEMA public CASCADE` on the database, which dev and test share. It wipes your local data and logs you out of the browser — expect to log back in after running tests.

---

### Task 1: Shared visit option labels

**Files:**
- Create: `apps/web/src/lib/visit-options.js`
- Test: `apps/web/tests/unit/lib/visit-options.test.js`

**Interfaces:**
- Produces: `CATEGORY_OPTIONS`, `REASON_OPTIONS`, `DISCOVERY_OPTIONS` (arrays of `{ value, label }` in display order) and `CATEGORY_LABELS`, `REASON_LABELS`, `DISCOVERY_LABELS` (maps `value → label`).

This task only **creates** the module. Pointing the existing screens at it happens in Task 13, after the redesign has finished rewriting those same files — doing it now would guarantee a conflict.

- [ ] **Step 1: Write the failing test**

Create `apps/web/tests/unit/lib/visit-options.test.js`:

```js
const {
  CATEGORY_OPTIONS,
  REASON_OPTIONS,
  DISCOVERY_OPTIONS,
  CATEGORY_LABELS,
  REASON_LABELS,
  DISCOVERY_LABELS,
} = require("@/lib/visit-options");

// These lists mirror the CHECK constraints in
// packages/database/migrations/1785801391247_create-clients-and-visits-tables.js
// If a constraint changes, this test is the thing that should fail first.
const CATEGORY_VALUES = ["sorvete", "milkshake", "lanche", "bebida", "sobremesa", "outro"];
const REASON_VALUES = [
  "vontade_comer_beber",
  "programa_familia_amigos",
  "comemoracao",
  "passando_em_frente",
  "outro",
];
const DISCOVERY_VALUES = [
  "instagram",
  "indicacao",
  "google_internet",
  "passou_em_frente",
  "cliente_antigo",
  "outro",
];

describe("lib/visit-options", () => {
  test("covers exactly the values allowed by the database CHECK constraints", () => {
    expect(CATEGORY_OPTIONS.map((option) => option.value)).toEqual(CATEGORY_VALUES);
    expect(REASON_OPTIONS.map((option) => option.value)).toEqual(REASON_VALUES);
    expect(DISCOVERY_OPTIONS.map((option) => option.value)).toEqual(DISCOVERY_VALUES);
  });

  test("gives every value a non-empty Portuguese label", () => {
    for (const option of [...CATEGORY_OPTIONS, ...REASON_OPTIONS, ...DISCOVERY_OPTIONS]) {
      expect(typeof option.label).toBe("string");
      expect(option.label.length).toBeGreaterThan(0);
    }
  });

  test("exposes label maps keyed by value", () => {
    expect(CATEGORY_LABELS.sorvete).toBe("Sorvete");
    expect(REASON_LABELS.comemoracao).toBe("Comemoração (aniversário etc)");
    expect(DISCOVERY_LABELS.instagram).toBe("Instagram/Redes sociais");
  });
});
```

- [ ] **Step 2: Run the test and watch it fail**

```bash
cd apps/web && npx jest --runInBand tests/unit/lib/visit-options.test.js
```

Expected: FAIL — `Cannot find module '@/lib/visit-options'`.

- [ ] **Step 3: Create the module**

Create `apps/web/src/lib/visit-options.js`. The labels are copied verbatim from the current constants in `apps/web/src/app/visitas/nova/register-visit-flow.js`, so no user-visible text changes:

```js
const CATEGORY_OPTIONS = [
  { value: "sorvete", label: "Sorvete" },
  { value: "milkshake", label: "Milkshake" },
  { value: "lanche", label: "Lanche" },
  { value: "bebida", label: "Bebida" },
  { value: "sobremesa", label: "Sobremesa" },
  { value: "outro", label: "Outro" },
];

const REASON_OPTIONS = [
  { value: "vontade_comer_beber", label: "Vontade de comer/beber algo" },
  { value: "programa_familia_amigos", label: "Programa com família/amigos" },
  { value: "comemoracao", label: "Comemoração (aniversário etc)" },
  { value: "passando_em_frente", label: "Passando em frente por acaso" },
  { value: "outro", label: "Outro" },
];

const DISCOVERY_OPTIONS = [
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

const CATEGORY_LABELS = toLabelMap(CATEGORY_OPTIONS);
const REASON_LABELS = toLabelMap(REASON_OPTIONS);
const DISCOVERY_LABELS = toLabelMap(DISCOVERY_OPTIONS);

module.exports = {
  CATEGORY_OPTIONS,
  REASON_OPTIONS,
  DISCOVERY_OPTIONS,
  CATEGORY_LABELS,
  REASON_LABELS,
  DISCOVERY_LABELS,
};
```

- [ ] **Step 4: Run the test and watch it pass**

```bash
cd apps/web && npx jest --runInBand tests/unit/lib/visit-options.test.js
```

Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/visit-options.js apps/web/tests/unit/lib/visit-options.test.js
git commit -m "$(cat <<'EOF'
Add a shared module for visit option labels

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Migration for the `dashboard.visualizar` feature

**Files:**
- Create: `packages/database/migrations/<timestamp>_add-dashboard-feature.js` (the CLI generates the timestamp in Step 1)
- Test: `apps/web/tests/integration/migrations/dashboard-feature.test.js`

**Interfaces:**
- Produces: a row in `features` with `key = 'dashboard.visualizar'`. Admin reaches it through `roles.is_super`; colaborador does not have it until an admin grants it.

- [ ] **Step 1: Generate the migration file**

```bash
npm run migrations:create -w packages/database -- add-dashboard-feature
```

Note the generated filename — you edit it in Step 4.

- [ ] **Step 2: Write the failing test**

Create `apps/web/tests/integration/migrations/dashboard-feature.test.js`:

```js
const database = require("@wefood/database");
const orchestrator = require("../../orchestrator");
const authorization = require("@/models/authorization");
const user = require("@/models/user");

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe("dashboard.visualizar feature", () => {
  test("is seeded into the features table", async () => {
    const result = await database.query({
      text: "SELECT key, name FROM features WHERE key = $1;",
      values: ["dashboard.visualizar"],
    });

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].name).toBe("Visualizar dashboard");
  });

  test("is granted to the seeded admin through its super role", async () => {
    const adminUser = await user.findByEmail("admin@admin.com.br");

    expect(authorization.userCan(adminUser, "dashboard.visualizar")).toBe(true);
  });

  test("is not granted to the colaborador role by default", async () => {
    const result = await database.query({
      text: `
        SELECT 1
        FROM role_features rf
        JOIN roles r ON r.id = rf.role_id
        JOIN features f ON f.id = rf.feature_id
        WHERE r.key = 'colaborador' AND f.key = 'dashboard.visualizar';
      `,
    });

    expect(result.rows).toHaveLength(0);
  });
});
```

- [ ] **Step 3: Run the test and watch it fail**

```bash
cd apps/web && npx jest --runInBand tests/integration/migrations/dashboard-feature.test.js
```

Expected: FAIL — the first test gets 0 rows.

If `user.findByEmail` does not exist under that name, open `apps/web/src/models/user.js` and use the real finder; the seeded admin's email is `admin@admin.com.br` (see the users/sessions migration).

- [ ] **Step 4: Write the migration**

Replace the entire contents of the generated file:

```js
exports.shorthands = undefined;

const FEATURE_KEY = "dashboard.visualizar";
const FEATURE_NAME = "Visualizar dashboard";

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.up = (pgm) => {
  // role_features is deliberately untouched: the admin role reaches every
  // feature through is_super, and colaborador starts without this one so an
  // admin can decide who sees revenue.
  pgm.sql(
    `INSERT INTO features (key, name) VALUES (${escapeLiteral(FEATURE_KEY)}, ${escapeLiteral(FEATURE_NAME)});`,
  );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.down = (pgm) => {
  pgm.sql(`DELETE FROM features WHERE key = ${escapeLiteral(FEATURE_KEY)};`);
};

function escapeLiteral(value) {
  return `'${value.replace(/'/g, "''")}'`;
}
```

Check how `escapeLiteral` is defined in `packages/database/migrations/1785707128214_create-users-and-sessions-tables.js` and reuse that exact approach instead of the local helper above if it is imported from somewhere.

- [ ] **Step 5: Run the test and watch it pass**

```bash
cd apps/web && npx jest --runInBand tests/integration/migrations/dashboard-feature.test.js
```

Expected: PASS, 3 tests.

- [ ] **Step 6: Commit**

```bash
git add packages/database/migrations apps/web/tests/integration/migrations
git commit -m "$(cat <<'EOF'
Add the dashboard.visualizar feature

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Period resolution

**Files:**
- Create: `apps/web/src/models/dashboard/period.js`
- Test: `apps/web/tests/unit/models/dashboard/resolve-range.test.js`

**Interfaces:**
- Produces: `STORE_TIMEZONE` (`"America/Sao_Paulo"`), `PERIODS` (array of `{ key, label, days, granularity }`), `DEFAULT_PERIOD_KEY` (`"30d"`), and `resolveRange(periodKey, now = new Date())` returning `{ key, label, from: Date, to: Date, granularity }` where `granularity` is `"hour" | "day" | "week"`.

- [ ] **Step 1: Write the failing test**

Create `apps/web/tests/unit/models/dashboard/resolve-range.test.js`:

```js
const { resolveRange, PERIODS } = require("@/models/dashboard/period");

// 2026-08-04 15:00 UTC is 12:00 in São Paulo on the same day.
const MIDDAY = new Date("2026-08-04T15:00:00Z");

describe("dashboard.resolveRange()", () => {
  test("'hoje' starts at midnight in São Paulo, not in UTC", () => {
    const range = resolveRange("hoje", MIDDAY);

    expect(range.from.toISOString()).toBe("2026-08-04T03:00:00.000Z");
    expect(range.to).toBe(MIDDAY);
    expect(range.granularity).toBe("hour");
  });

  test("resolves the day boundary by São Paulo's calendar, not UTC's", () => {
    // 00:30 UTC on the 5th is still 21:30 on the 4th in São Paulo, so "hoje"
    // must be the 4th. Getting this wrong shifts every evening visit by a day.
    const lateNight = new Date("2026-08-05T00:30:00Z");

    const range = resolveRange("hoje", lateNight);

    expect(range.from.toISOString()).toBe("2026-08-04T03:00:00.000Z");
  });

  test("'7d' covers today plus the six previous calendar days", () => {
    const range = resolveRange("7d", MIDDAY);

    expect(range.from.toISOString()).toBe("2026-07-29T03:00:00.000Z");
    expect(range.granularity).toBe("day");
  });

  test("'30d' covers today plus the twenty-nine previous days", () => {
    const range = resolveRange("30d", MIDDAY);

    expect(range.from.toISOString()).toBe("2026-07-06T03:00:00.000Z");
    expect(range.granularity).toBe("day");
  });

  test("'90d' groups by week", () => {
    const range = resolveRange("90d", MIDDAY);

    expect(range.from.toISOString()).toBe("2026-05-07T03:00:00.000Z");
    expect(range.granularity).toBe("week");
  });

  test("falls back to 30 days for an unknown or missing key", () => {
    const fromUnknown = resolveRange("mes-passado", MIDDAY);
    const fromMissing = resolveRange(undefined, MIDDAY);

    expect(fromUnknown.key).toBe("30d");
    expect(fromMissing.key).toBe("30d");
  });

  test("exposes the four periods in display order", () => {
    expect(PERIODS.map((period) => period.key)).toEqual(["hoje", "7d", "30d", "90d"]);
  });
});
```

- [ ] **Step 2: Run the test and watch it fail**

```bash
cd apps/web && npx jest --runInBand tests/unit/models/dashboard/resolve-range.test.js
```

Expected: FAIL — `Cannot find module '@/models/dashboard/period'`.

- [ ] **Step 3: Write the implementation**

Create `apps/web/src/models/dashboard/period.js`:

```js
const STORE_TIMEZONE = "America/Sao_Paulo";

const PERIODS = [
  { key: "hoje", label: "Hoje", days: 1, granularity: "hour" },
  { key: "7d", label: "7 dias", days: 7, granularity: "day" },
  { key: "30d", label: "30 dias", days: 30, granularity: "day" },
  { key: "90d", label: "90 dias", days: 90, granularity: "week" },
];

const DEFAULT_PERIOD_KEY = "30d";

// Reads the store's UTC offset out of the IANA database for this instant
// instead of hardcoding -03:00. Brazil has had no DST since 2019, but if it
// ever returns this keeps working.
function storeOffset(date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: STORE_TIMEZONE,
    timeZoneName: "longOffset",
  }).formatToParts(date);

  const timeZoneName = parts.find((part) => part.type === "timeZoneName")?.value ?? "";
  return timeZoneName.replace("GMT", "") || "+00:00";
}

// "2026-08-04" — the calendar date in the store's timezone, which is not
// necessarily the UTC date.
function storeDate(date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: STORE_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function resolveRange(periodKey, now = new Date()) {
  const period =
    PERIODS.find((candidate) => candidate.key === periodKey) ??
    PERIODS.find((candidate) => candidate.key === DEFAULT_PERIOD_KEY);

  const from = new Date(`${storeDate(now)}T00:00:00${storeOffset(now)}`);
  from.setUTCDate(from.getUTCDate() - (period.days - 1));

  return {
    key: period.key,
    label: period.label,
    from,
    to: now,
    granularity: period.granularity,
  };
}

function currentMonth(now = new Date()) {
  return Number(storeDate(now).slice(5, 7));
}

module.exports = {
  STORE_TIMEZONE,
  PERIODS,
  DEFAULT_PERIOD_KEY,
  resolveRange,
  currentMonth,
};
```

- [ ] **Step 4: Run the test and watch it pass**

```bash
cd apps/web && npx jest --runInBand tests/unit/models/dashboard/resolve-range.test.js
```

Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/models/dashboard/period.js apps/web/tests/unit/models/dashboard/resolve-range.test.js
git commit -m "$(cat <<'EOF'
Add dashboard period resolution in the store timezone

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Test fixture and the movement summary

**Files:**
- Modify: `apps/web/tests/orchestrator.js`
- Create: `apps/web/src/models/dashboard/numbers.js`
- Create: `apps/web/src/models/dashboard/movement.js`
- Test: `apps/web/tests/integration/models/dashboard/summary.test.js`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  - `orchestrator.createVisitAt({ createdAt, clientId, registeredBy, amountSpent, orderCategories, reason, discoverySource, ... })` → the created visit, with `created_at` forced to `createdAt`.
  - `numbers.toNumber(value)` → `Number` or `null`; `numbers.percentageOf(count, total)` → `Number` 0–100 with one decimal.
  - `movement.summary({ from, to })` → `{ visits, revenue, averageTicket, clientsServed }`, all `Number`.

The fixture lives here rather than in its own task because this is the first test that needs it — it is proven by the tests below.

- [ ] **Step 1: Add the fixture to the orchestrator**

In `apps/web/tests/orchestrator.js`, add the `visit` require at the top, next to the existing requires:

```js
const visit = require("@/models/visit");
```

Add this function above `module.exports`:

```js
// visits.created_at defaults to now() and visit.create() takes no date, but
// the dashboard is only meaningful with visits spread over time. This creates
// the visit through the real model and then backdates it, so the insert path
// under test stays real.
async function createVisitAt({ createdAt, ...visitInput }) {
  const createdVisit = await visit.create(visitInput);

  await database.query({
    text: "UPDATE visits SET created_at = $1 WHERE id = $2;",
    values: [createdAt, createdVisit.id],
  });

  return { ...createdVisit, created_at: createdAt };
}
```

And add `createVisitAt` to the exported object:

```js
module.exports = {
  waitForAllServices,
  dropAllTables,
  runPendingMigrations,
  createVisitAt,
  webserverUrl: webserver.host,
};
```

- [ ] **Step 2: Write the failing test**

Create `apps/web/tests/integration/models/dashboard/summary.test.js`:

```js
const orchestrator = require("../../../orchestrator");
const client = require("@/models/client");
const movement = require("@/models/dashboard/movement");

const FROM = new Date("2026-07-01T03:00:00Z");
const TO = new Date("2026-07-31T02:59:59Z");

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

function visitInput(clientId, overrides = {}) {
  return {
    clientId,
    registeredBy: null,
    amountSpent: 10,
    orderCategories: ["sorvete"],
    reason: "outro",
    discoverySource: "outro",
    ...overrides,
  };
}

describe("dashboard.summary()", () => {
  test("totals visits, revenue, average ticket and distinct clients in the period", async () => {
    const first = await client.create({ name: "Resumo Um", phone: "11900000001" });
    const second = await client.create({ name: "Resumo Dois", phone: "11900000002" });

    await orchestrator.createVisitAt({
      ...visitInput(first.id, { amountSpent: 30 }),
      createdAt: new Date("2026-07-10T15:00:00Z"),
    });
    await orchestrator.createVisitAt({
      ...visitInput(first.id, { amountSpent: 20 }),
      createdAt: new Date("2026-07-11T15:00:00Z"),
    });
    await orchestrator.createVisitAt({
      ...visitInput(second.id, { amountSpent: 10 }),
      createdAt: new Date("2026-07-12T15:00:00Z"),
    });

    const result = await movement.summary({ from: FROM, to: TO });

    expect(result).toEqual({
      visits: 3,
      revenue: 60,
      averageTicket: 20,
      clientsServed: 2,
    });
  });

  test("returns numbers, not the strings pg gives back for numeric and bigint", async () => {
    const result = await movement.summary({ from: FROM, to: TO });

    expect(typeof result.visits).toBe("number");
    expect(typeof result.revenue).toBe("number");
    expect(typeof result.averageTicket).toBe("number");
    expect(typeof result.clientsServed).toBe("number");
  });

  test("includes visits exactly on both boundaries and excludes the one just before", async () => {
    await orchestrator.dropAllTables();
    await orchestrator.runPendingMigrations();

    const onlyClient = await client.create({ name: "Fronteira", phone: "11900000003" });

    await orchestrator.createVisitAt({
      ...visitInput(onlyClient.id, { amountSpent: 1 }),
      createdAt: FROM,
    });
    await orchestrator.createVisitAt({
      ...visitInput(onlyClient.id, { amountSpent: 2 }),
      createdAt: TO,
    });
    await orchestrator.createVisitAt({
      ...visitInput(onlyClient.id, { amountSpent: 99 }),
      createdAt: new Date(FROM.getTime() - 1000),
    });

    const result = await movement.summary({ from: FROM, to: TO });

    expect(result.visits).toBe(2);
    expect(result.revenue).toBe(3);
  });

  test("returns zeros for a period with no visits, without dividing by zero", async () => {
    const result = await movement.summary({
      from: new Date("2020-01-01T00:00:00Z"),
      to: new Date("2020-01-31T00:00:00Z"),
    });

    expect(result).toEqual({
      visits: 0,
      revenue: 0,
      averageTicket: 0,
      clientsServed: 0,
    });
  });
});
```

- [ ] **Step 3: Run the test and watch it fail**

```bash
cd apps/web && npx jest --runInBand tests/integration/models/dashboard/summary.test.js
```

Expected: FAIL — `Cannot find module '@/models/dashboard/movement'`.

- [ ] **Step 4: Write the number helpers**

Create `apps/web/src/models/dashboard/numbers.js`:

```js
// pg returns numeric and bigint (COUNT) as strings. Everything the dashboard
// model hands out is converted here, so no consumer has to know that.
function toNumber(value) {
  return value === null || value === undefined ? null : Number(value);
}

function percentageOf(count, total) {
  if (!total) {
    return 0;
  }

  return Math.round((count / total) * 1000) / 10;
}

module.exports = {
  toNumber,
  percentageOf,
};
```

- [ ] **Step 5: Write the summary query**

Create `apps/web/src/models/dashboard/movement.js`:

```js
const database = require("@wefood/database");
const { toNumber } = require("./numbers");

async function summary({ from, to }) {
  const result = await database.query({
    text: `
      SELECT
        COUNT(*) AS visits,
        COALESCE(SUM(amount_spent), 0) AS revenue,
        COALESCE(AVG(amount_spent), 0) AS average_ticket,
        COUNT(DISTINCT client_id) AS clients_served
      FROM visits
      WHERE created_at >= $1 AND created_at <= $2;
    `,
    values: [from, to],
  });

  const row = result.rows[0];

  return {
    visits: toNumber(row.visits),
    revenue: toNumber(row.revenue),
    averageTicket: toNumber(row.average_ticket),
    clientsServed: toNumber(row.clients_served),
  };
}

module.exports = {
  summary,
};
```

- [ ] **Step 6: Run the test and watch it pass**

```bash
cd apps/web && npx jest --runInBand tests/integration/models/dashboard/summary.test.js
```

Expected: PASS, 4 tests.

- [ ] **Step 7: Commit**

```bash
git add apps/web/tests/orchestrator.js apps/web/src/models/dashboard apps/web/tests/integration/models/dashboard
git commit -m "$(cat <<'EOF'
Add the dashboard movement summary and a backdated-visit fixture

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Movement timeline

**Files:**
- Modify: `apps/web/src/models/dashboard/movement.js`
- Test: `apps/web/tests/integration/models/dashboard/timeline.test.js`

**Interfaces:**
- Consumes: `orchestrator.createVisitAt`, `numbers.toNumber`, `period.STORE_TIMEZONE`.
- Produces: `movement.timeline({ from, to, granularity })` → `[{ bucket, visits, revenue }]`, a **complete** series with no gaps. `bucket` is a **string** shaped `YYYY-MM-DDTHH:MM:SS` in store wall time.

- [ ] **Step 1: Write the failing test**

Create `apps/web/tests/integration/models/dashboard/timeline.test.js`:

```js
const orchestrator = require("../../../orchestrator");
const client = require("@/models/client");
const movement = require("@/models/dashboard/movement");

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

function visitInput(clientId, overrides = {}) {
  return {
    clientId,
    registeredBy: null,
    amountSpent: 10,
    orderCategories: ["sorvete"],
    reason: "outro",
    discoverySource: "outro",
    ...overrides,
  };
}

describe("dashboard.timeline()", () => {
  test("groups by day and fills days with no visits with zeros", async () => {
    const createdClient = await client.create({ name: "Serie Dia", phone: "11910000001" });

    // 2026-07-10 12:00 and 2026-07-12 12:00 in São Paulo. Nothing on the 11th.
    await orchestrator.createVisitAt({
      ...visitInput(createdClient.id, { amountSpent: 25 }),
      createdAt: new Date("2026-07-10T15:00:00Z"),
    });
    await orchestrator.createVisitAt({
      ...visitInput(createdClient.id, { amountSpent: 15 }),
      createdAt: new Date("2026-07-12T15:00:00Z"),
    });

    const series = await movement.timeline({
      from: new Date("2026-07-10T03:00:00Z"),
      to: new Date("2026-07-13T02:59:59Z"),
      granularity: "day",
    });

    expect(series).toEqual([
      { bucket: "2026-07-10T00:00:00", visits: 1, revenue: 25 },
      { bucket: "2026-07-11T00:00:00", visits: 0, revenue: 0 },
      { bucket: "2026-07-12T00:00:00", visits: 1, revenue: 15 },
    ]);
  });

  test("buckets a late-evening visit into the store's day, not the next UTC day", async () => {
    await orchestrator.dropAllTables();
    await orchestrator.runPendingMigrations();

    const createdClient = await client.create({ name: "Noite", phone: "11910000002" });

    // 2026-07-10 23:00 in São Paulo is already 2026-07-11 02:00 UTC.
    await orchestrator.createVisitAt({
      ...visitInput(createdClient.id, { amountSpent: 40 }),
      createdAt: new Date("2026-07-11T02:00:00Z"),
    });

    const series = await movement.timeline({
      from: new Date("2026-07-10T03:00:00Z"),
      to: new Date("2026-07-12T02:59:59Z"),
      granularity: "day",
    });

    const tenth = series.find((point) => point.bucket === "2026-07-10T00:00:00");
    const eleventh = series.find((point) => point.bucket === "2026-07-11T00:00:00");

    expect(tenth.visits).toBe(1);
    expect(eleventh.visits).toBe(0);
  });

  test("groups by hour", async () => {
    await orchestrator.dropAllTables();
    await orchestrator.runPendingMigrations();

    const createdClient = await client.create({ name: "Serie Hora", phone: "11910000003" });

    // 14:00 and 14:30 in São Paulo, same bucket.
    await orchestrator.createVisitAt({
      ...visitInput(createdClient.id, { amountSpent: 10 }),
      createdAt: new Date("2026-07-10T17:00:00Z"),
    });
    await orchestrator.createVisitAt({
      ...visitInput(createdClient.id, { amountSpent: 10 }),
      createdAt: new Date("2026-07-10T17:30:00Z"),
    });

    const series = await movement.timeline({
      from: new Date("2026-07-10T17:00:00Z"),
      to: new Date("2026-07-10T19:00:00Z"),
      granularity: "hour",
    });

    expect(series[0]).toEqual({ bucket: "2026-07-10T14:00:00", visits: 2, revenue: 20 });
    expect(series).toHaveLength(3);
  });

  test("groups by week", async () => {
    await orchestrator.dropAllTables();
    await orchestrator.runPendingMigrations();

    const createdClient = await client.create({ name: "Serie Semana", phone: "11910000004" });

    await orchestrator.createVisitAt({
      ...visitInput(createdClient.id, { amountSpent: 10 }),
      createdAt: new Date("2026-07-07T15:00:00Z"),
    });
    await orchestrator.createVisitAt({
      ...visitInput(createdClient.id, { amountSpent: 10 }),
      createdAt: new Date("2026-07-09T15:00:00Z"),
    });

    const series = await movement.timeline({
      from: new Date("2026-07-06T03:00:00Z"),
      to: new Date("2026-07-13T02:59:59Z"),
      granularity: "week",
    });

    // date_trunc('week') snaps to Monday; 2026-07-06 is a Monday.
    expect(series[0]).toEqual({ bucket: "2026-07-06T00:00:00", visits: 2, revenue: 20 });
  });

  test("rejects a granularity outside the closed list", async () => {
    await expect(
      movement.timeline({
        from: new Date("2026-07-10T03:00:00Z"),
        to: new Date("2026-07-11T03:00:00Z"),
        granularity: "month'; DROP TABLE visits; --",
      }),
    ).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run the test and watch it fail**

```bash
cd apps/web && npx jest --runInBand tests/integration/models/dashboard/timeline.test.js
```

Expected: FAIL — `movement.timeline is not a function`.

- [ ] **Step 3: Write the implementation**

In `apps/web/src/models/dashboard/movement.js`, add the require and the function, and export it:

```js
const database = require("@wefood/database");
const { toNumber } = require("./numbers");
const { STORE_TIMEZONE } = require("./period");

const GRANULARITY_INTERVALS = {
  hour: "1 hour",
  day: "1 day",
  week: "1 week",
};

async function timeline({ from, to, granularity }) {
  const interval = GRANULARITY_INTERVALS[granularity];

  if (!interval) {
    throw new Error(`Granularidade inválida: ${granularity}`);
  }

  const result = await database.query({
    text: `
      WITH buckets AS (
        SELECT generate_series(
          date_trunc($3, $1::timestamptz AT TIME ZONE $4),
          date_trunc($3, $2::timestamptz AT TIME ZONE $4),
          $5::interval
        ) AS bucket
      ),
      visits_by_bucket AS (
        SELECT
          date_trunc($3, created_at AT TIME ZONE $4) AS bucket,
          COUNT(*) AS visits,
          COALESCE(SUM(amount_spent), 0) AS revenue
        FROM visits
        WHERE created_at >= $1 AND created_at <= $2
        GROUP BY 1
      )
      SELECT
        to_char(b.bucket, 'YYYY-MM-DD"T"HH24:MI:SS') AS bucket,
        COALESCE(v.visits, 0) AS visits,
        COALESCE(v.revenue, 0) AS revenue
      FROM buckets b
      LEFT JOIN visits_by_bucket v ON v.bucket = b.bucket
      ORDER BY b.bucket;
    `,
    values: [from, to, granularity, STORE_TIMEZONE, interval],
  });

  return result.rows.map((row) => ({
    bucket: row.bucket,
    visits: toNumber(row.visits),
    revenue: toNumber(row.revenue),
  }));
}

module.exports = {
  summary,
  timeline,
};
```

`bucket` stays a string on purpose. Returning a `Date` would make Node re-read that wall-clock time in the process timezone and shift every chart label.

- [ ] **Step 4: Run the test and watch it pass**

```bash
cd apps/web && npx jest --runInBand tests/integration/models/dashboard/timeline.test.js
```

Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/models/dashboard/movement.js apps/web/tests/integration/models/dashboard/timeline.test.js
git commit -m "$(cat <<'EOF'
Add the dashboard movement timeline

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Marketing — discovery source and reason

**Files:**
- Create: `apps/web/src/models/dashboard/marketing.js`
- Test: `apps/web/tests/integration/models/dashboard/marketing.test.js`

**Interfaces:**
- Consumes: `numbers.toNumber`, `numbers.percentageOf`.
- Produces: `marketing.byDiscoverySource({ from, to })` and `marketing.byReason({ from, to })`, both → `[{ value, visits, percentage }]` ordered by `visits` descending, values with no visits omitted.

- [ ] **Step 1: Write the failing test**

Create `apps/web/tests/integration/models/dashboard/marketing.test.js`:

```js
const orchestrator = require("../../../orchestrator");
const client = require("@/models/client");
const marketing = require("@/models/dashboard/marketing");

const FROM = new Date("2026-07-01T03:00:00Z");
const TO = new Date("2026-08-01T02:59:59Z");

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();

  const createdClient = await client.create({ name: "Marketing", phone: "11920000001" });

  const visits = [
    { discoverySource: "instagram", reason: "comemoracao" },
    { discoverySource: "instagram", reason: "comemoracao" },
    { discoverySource: "instagram", reason: "outro" },
    { discoverySource: "indicacao", reason: "comemoracao" },
  ];

  for (const [index, current] of visits.entries()) {
    await orchestrator.createVisitAt({
      clientId: createdClient.id,
      registeredBy: null,
      amountSpent: 10,
      orderCategories: ["sorvete"],
      reason: current.reason,
      discoverySource: current.discoverySource,
      createdAt: new Date(`2026-07-1${index}T15:00:00Z`),
    });
  }
});

describe("dashboard.byDiscoverySource()", () => {
  test("counts visits per source, ordered by volume, with percentages", async () => {
    const result = await marketing.byDiscoverySource({ from: FROM, to: TO });

    expect(result).toEqual([
      { value: "instagram", visits: 3, percentage: 75 },
      { value: "indicacao", visits: 1, percentage: 25 },
    ]);
  });

  test("omits sources with no visits in the period instead of listing zeros", async () => {
    const result = await marketing.byDiscoverySource({ from: FROM, to: TO });
    const values = result.map((row) => row.value);

    expect(values).not.toContain("google_internet");
  });

  test("returns an empty array for a period with no visits", async () => {
    const result = await marketing.byDiscoverySource({
      from: new Date("2020-01-01T00:00:00Z"),
      to: new Date("2020-01-31T00:00:00Z"),
    });

    expect(result).toEqual([]);
  });
});

describe("dashboard.byReason()", () => {
  test("counts visits per reason, ordered by volume, with percentages", async () => {
    const result = await marketing.byReason({ from: FROM, to: TO });

    expect(result).toEqual([
      { value: "comemoracao", visits: 3, percentage: 75 },
      { value: "outro", visits: 1, percentage: 25 },
    ]);
  });
});
```

- [ ] **Step 2: Run the test and watch it fail**

```bash
cd apps/web && npx jest --runInBand tests/integration/models/dashboard/marketing.test.js
```

Expected: FAIL — `Cannot find module '@/models/dashboard/marketing'`.

- [ ] **Step 3: Write the implementation**

Create `apps/web/src/models/dashboard/marketing.js`:

```js
const database = require("@wefood/database");
const { toNumber, percentageOf } = require("./numbers");

// Whitelist: the column name is interpolated into SQL, so it must never come
// from anywhere but this file.
const COUNTABLE_COLUMNS = ["discovery_source", "reason"];

async function countByColumn(column, { from, to }) {
  if (!COUNTABLE_COLUMNS.includes(column)) {
    throw new Error(`Coluna inválida: ${column}`);
  }

  const result = await database.query({
    text: `
      SELECT ${column} AS value, COUNT(*) AS visits
      FROM visits
      WHERE created_at >= $1 AND created_at <= $2
      GROUP BY ${column}
      ORDER BY COUNT(*) DESC, ${column};
    `,
    values: [from, to],
  });

  // Both columns are NOT NULL, so every visit in the period lands in exactly
  // one row — the totals add up without a second query.
  const total = result.rows.reduce((sum, row) => sum + toNumber(row.visits), 0);

  return result.rows.map((row) => ({
    value: row.value,
    visits: toNumber(row.visits),
    percentage: percentageOf(toNumber(row.visits), total),
  }));
}

async function byDiscoverySource(range) {
  return countByColumn("discovery_source", range);
}

async function byReason(range) {
  return countByColumn("reason", range);
}

module.exports = {
  byDiscoverySource,
  byReason,
};
```

- [ ] **Step 4: Run the test and watch it pass**

```bash
cd apps/web && npx jest --runInBand tests/integration/models/dashboard/marketing.test.js
```

Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/models/dashboard/marketing.js apps/web/tests/integration/models/dashboard/marketing.test.js
git commit -m "$(cat <<'EOF'
Add dashboard breakdowns by discovery source and reason

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Product — ordered categories

**Files:**
- Create: `apps/web/src/models/dashboard/product.js`
- Test: `apps/web/tests/integration/models/dashboard/product.test.js`

**Interfaces:**
- Consumes: `numbers.toNumber`, `numbers.percentageOf`.
- Produces: `product.byCategory({ from, to })` → `[{ value, visits, percentage, averageTicket }]`. Percentages are over total visits in the period, so they sum above 100% when visits carry several categories.

- [ ] **Step 1: Write the failing test**

Create `apps/web/tests/integration/models/dashboard/product.test.js`:

```js
const orchestrator = require("../../../orchestrator");
const client = require("@/models/client");
const product = require("@/models/dashboard/product");

const FROM = new Date("2026-07-01T03:00:00Z");
const TO = new Date("2026-08-01T02:59:59Z");

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();

  const createdClient = await client.create({ name: "Produto", phone: "11930000001" });

  // Two visits. The first carries two categories, so the category counts add
  // up to 3 while there are only 2 visits.
  await orchestrator.createVisitAt({
    clientId: createdClient.id,
    registeredBy: null,
    amountSpent: 40,
    orderCategories: ["sorvete", "bebida"],
    reason: "outro",
    discoverySource: "outro",
    createdAt: new Date("2026-07-10T15:00:00Z"),
  });
  await orchestrator.createVisitAt({
    clientId: createdClient.id,
    registeredBy: null,
    amountSpent: 20,
    orderCategories: ["sorvete"],
    reason: "outro",
    discoverySource: "outro",
    createdAt: new Date("2026-07-11T15:00:00Z"),
  });
});

describe("dashboard.byCategory()", () => {
  test("counts each visit once per category it carried", async () => {
    const result = await product.byCategory({ from: FROM, to: TO });

    expect(result).toEqual([
      { value: "sorvete", visits: 2, percentage: 100, averageTicket: 30 },
      { value: "bebida", visits: 1, percentage: 50, averageTicket: 40 },
    ]);
  });

  test("lets percentages sum above 100 because a visit can have many categories", async () => {
    const result = await product.byCategory({ from: FROM, to: TO });
    const total = result.reduce((sum, row) => sum + row.percentage, 0);

    expect(total).toBeGreaterThan(100);
  });

  test("returns an empty array for a period with no visits", async () => {
    const result = await product.byCategory({
      from: new Date("2020-01-01T00:00:00Z"),
      to: new Date("2020-01-31T00:00:00Z"),
    });

    expect(result).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test and watch it fail**

```bash
cd apps/web && npx jest --runInBand tests/integration/models/dashboard/product.test.js
```

Expected: FAIL — `Cannot find module '@/models/dashboard/product'`.

- [ ] **Step 3: Write the implementation**

Create `apps/web/src/models/dashboard/product.js`:

```js
const database = require("@wefood/database");
const { toNumber, percentageOf } = require("./numbers");

async function byCategory({ from, to }) {
  const result = await database.query({
    text: `
      WITH period_visits AS (
        SELECT id, amount_spent
        FROM visits
        WHERE created_at >= $1 AND created_at <= $2
      )
      SELECT
        voi.category AS value,
        COUNT(DISTINCT v.id) AS visits,
        COALESCE(AVG(v.amount_spent), 0) AS average_ticket,
        (SELECT COUNT(*) FROM period_visits) AS total_visits
      FROM period_visits v
      JOIN visit_order_items voi ON voi.visit_id = v.id
      GROUP BY voi.category
      ORDER BY COUNT(DISTINCT v.id) DESC, voi.category;
    `,
    values: [from, to],
  });

  return result.rows.map((row) => ({
    value: row.value,
    visits: toNumber(row.visits),
    percentage: percentageOf(toNumber(row.visits), toNumber(row.total_visits)),
    averageTicket: toNumber(row.average_ticket),
  }));
}

module.exports = {
  byCategory,
};
```

- [ ] **Step 4: Run the test and watch it pass**

```bash
cd apps/web && npx jest --runInBand tests/integration/models/dashboard/product.test.js
```

Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/models/dashboard/product.js apps/web/tests/integration/models/dashboard/product.test.js
git commit -m "$(cat <<'EOF'
Add the dashboard breakdown by ordered category

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Clients — new vs returning, top spenders, neighborhoods, collaborators, birthdays

**Files:**
- Create: `apps/web/src/models/dashboard/clients.js`
- Test: `apps/web/tests/integration/models/dashboard/clients.test.js`

**Interfaces:**
- Consumes: `numbers.toNumber`.
- Produces:
  - `clients.newVsReturningClients({ from, to })` → `{ newClients, returningClients }`
  - `clients.topClients({ from, to, limit })` → `[{ id, name, visits, revenue }]`, `limit` defaults to 10
  - `clients.byNeighborhood({ from, to })` → `[{ neighborhood, city, visits }]`, nulls preserved
  - `clients.byCollaborator({ from, to })` → `[{ userId, name, visits, revenue }]`, `userId` null when the visit has no `registered_by`
  - `clients.birthdaysOfMonth(month)` → `[{ id, name, phone, day }]`, `month` is 1–12

- [ ] **Step 1: Write the failing test**

Create `apps/web/tests/integration/models/dashboard/clients.test.js`:

```js
const orchestrator = require("../../../orchestrator");
const client = require("@/models/client");
const user = require("@/models/user");
const clients = require("@/models/dashboard/clients");

const FROM = new Date("2026-07-01T03:00:00Z");
const TO = new Date("2026-08-01T02:59:59Z");

function visitInput(clientId, overrides = {}) {
  return {
    clientId,
    registeredBy: null,
    amountSpent: 10,
    orderCategories: ["sorvete"],
    reason: "outro",
    discoverySource: "outro",
    ...overrides,
  };
}

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe("dashboard.newVsReturningClients()", () => {
  test("counts a client as new when its very first visit falls in the period", async () => {
    const brandNew = await client.create({ name: "Novo", phone: "11940000001" });
    const returning = await client.create({ name: "Recorrente", phone: "11940000002" });

    // The returning client's first visit is before the period.
    await orchestrator.createVisitAt({
      ...visitInput(returning.id),
      createdAt: new Date("2026-05-10T15:00:00Z"),
    });

    await orchestrator.createVisitAt({
      ...visitInput(brandNew.id),
      createdAt: new Date("2026-07-10T15:00:00Z"),
    });
    await orchestrator.createVisitAt({
      ...visitInput(returning.id),
      createdAt: new Date("2026-07-11T15:00:00Z"),
    });

    const result = await clients.newVsReturningClients({ from: FROM, to: TO });

    expect(result).toEqual({ newClients: 1, returningClients: 1 });
  });

  test("counts a client once even with several visits inside the period", async () => {
    const frequent = await client.create({ name: "Frequente", phone: "11940000003" });

    await orchestrator.createVisitAt({
      ...visitInput(frequent.id),
      createdAt: new Date("2026-07-12T15:00:00Z"),
    });
    await orchestrator.createVisitAt({
      ...visitInput(frequent.id),
      createdAt: new Date("2026-07-13T15:00:00Z"),
    });

    const result = await clients.newVsReturningClients({ from: FROM, to: TO });

    expect(result).toEqual({ newClients: 2, returningClients: 1 });
  });
});

describe("dashboard.topClients()", () => {
  test("ranks by total spent and respects the limit", async () => {
    await orchestrator.dropAllTables();
    await orchestrator.runPendingMigrations();

    const big = await client.create({ name: "Gastou Muito", phone: "11940000004" });
    const small = await client.create({ name: "Gastou Pouco", phone: "11940000005" });

    await orchestrator.createVisitAt({
      ...visitInput(big.id, { amountSpent: 100 }),
      createdAt: new Date("2026-07-10T15:00:00Z"),
    });
    await orchestrator.createVisitAt({
      ...visitInput(big.id, { amountSpent: 50 }),
      createdAt: new Date("2026-07-11T15:00:00Z"),
    });
    await orchestrator.createVisitAt({
      ...visitInput(small.id, { amountSpent: 5 }),
      createdAt: new Date("2026-07-12T15:00:00Z"),
    });

    const result = await clients.topClients({ from: FROM, to: TO });

    expect(result).toEqual([
      { id: big.id, name: "Gastou Muito", visits: 2, revenue: 150 },
      { id: small.id, name: "Gastou Pouco", visits: 1, revenue: 5 },
    ]);

    const limited = await clients.topClients({ from: FROM, to: TO, limit: 1 });
    expect(limited).toHaveLength(1);
    expect(limited[0].id).toBe(big.id);
  });
});

describe("dashboard.byNeighborhood()", () => {
  test("groups visits by the client's neighborhood and city, keeping nulls", async () => {
    await orchestrator.dropAllTables();
    await orchestrator.runPendingMigrations();

    const located = await client.create({
      name: "Com Bairro",
      phone: "11940000006",
      neighborhood: "Centro",
      city: "Sorocaba",
    });
    const unknown = await client.create({ name: "Sem Bairro", phone: "11940000007" });

    await orchestrator.createVisitAt({
      ...visitInput(located.id),
      createdAt: new Date("2026-07-10T15:00:00Z"),
    });
    await orchestrator.createVisitAt({
      ...visitInput(located.id),
      createdAt: new Date("2026-07-11T15:00:00Z"),
    });
    await orchestrator.createVisitAt({
      ...visitInput(unknown.id),
      createdAt: new Date("2026-07-12T15:00:00Z"),
    });

    const result = await clients.byNeighborhood({ from: FROM, to: TO });

    expect(result).toEqual([
      { neighborhood: "Centro", city: "Sorocaba", visits: 2 },
      { neighborhood: null, city: null, visits: 1 },
    ]);
  });
});

describe("dashboard.byCollaborator()", () => {
  test("counts visits per collaborator and keeps unattributed visits", async () => {
    await orchestrator.dropAllTables();
    await orchestrator.runPendingMigrations();

    const adminUser = await user.findByEmail("admin@admin.com.br");
    const createdClient = await client.create({ name: "Atendido", phone: "11940000008" });

    await orchestrator.createVisitAt({
      ...visitInput(createdClient.id, { registeredBy: adminUser.id, amountSpent: 30 }),
      createdAt: new Date("2026-07-10T15:00:00Z"),
    });
    await orchestrator.createVisitAt({
      ...visitInput(createdClient.id, { amountSpent: 10 }),
      createdAt: new Date("2026-07-11T15:00:00Z"),
    });

    const result = await clients.byCollaborator({ from: FROM, to: TO });

    expect(result).toEqual([
      { userId: adminUser.id, name: adminUser.name, visits: 1, revenue: 30 },
      { userId: null, name: null, visits: 1, revenue: 10 },
    ]);
  });
});

describe("dashboard.birthdaysOfMonth()", () => {
  test("returns clients born in the month, ordered by day, ignoring the period", async () => {
    await orchestrator.dropAllTables();
    await orchestrator.runPendingMigrations();

    await client.create({
      name: "Aniversario Dia 20",
      phone: "11940000009",
      birthDate: "1990-03-20",
    });
    await client.create({
      name: "Aniversario Dia 5",
      phone: "11940000010",
      birthDate: "1985-03-05",
    });
    await client.create({ name: "Outro Mes", phone: "11940000011", birthDate: "1985-04-05" });
    await client.create({ name: "Sem Data", phone: "11940000012" });

    const result = await clients.birthdaysOfMonth(3);

    expect(result).toEqual([
      { id: expect.any(String), name: "Aniversario Dia 5", phone: "11940000010", day: 5 },
      { id: expect.any(String), name: "Aniversario Dia 20", phone: "11940000009", day: 20 },
    ]);
  });
});
```

- [ ] **Step 2: Run the test and watch it fail**

```bash
cd apps/web && npx jest --runInBand tests/integration/models/dashboard/clients.test.js
```

Expected: FAIL — `Cannot find module '@/models/dashboard/clients'`.

- [ ] **Step 3: Write the implementation**

Create `apps/web/src/models/dashboard/clients.js`:

```js
const database = require("@wefood/database");
const { toNumber } = require("./numbers");

async function newVsReturningClients({ from, to }) {
  const result = await database.query({
    text: `
      WITH first_visit AS (
        SELECT client_id, MIN(created_at) AS first_at
        FROM visits
        GROUP BY client_id
      ),
      period_clients AS (
        SELECT DISTINCT client_id
        FROM visits
        WHERE created_at >= $1 AND created_at <= $2
      )
      SELECT
        COUNT(*) FILTER (WHERE fv.first_at >= $1) AS new_clients,
        COUNT(*) FILTER (WHERE fv.first_at < $1) AS returning_clients
      FROM period_clients pc
      JOIN first_visit fv ON fv.client_id = pc.client_id;
    `,
    values: [from, to],
  });

  const row = result.rows[0];

  return {
    newClients: toNumber(row.new_clients),
    returningClients: toNumber(row.returning_clients),
  };
}

async function topClients({ from, to, limit = 10 }) {
  const result = await database.query({
    text: `
      SELECT
        c.id,
        c.name,
        COUNT(*) AS visits,
        COALESCE(SUM(v.amount_spent), 0) AS revenue
      FROM visits v
      JOIN clients c ON c.id = v.client_id
      WHERE v.created_at >= $1 AND v.created_at <= $2
      GROUP BY c.id, c.name
      ORDER BY SUM(v.amount_spent) DESC, COUNT(*) DESC, c.name
      LIMIT $3;
    `,
    values: [from, to, limit],
  });

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    visits: toNumber(row.visits),
    revenue: toNumber(row.revenue),
  }));
}

async function byNeighborhood({ from, to }) {
  const result = await database.query({
    text: `
      SELECT c.neighborhood, c.city, COUNT(*) AS visits
      FROM visits v
      JOIN clients c ON c.id = v.client_id
      WHERE v.created_at >= $1 AND v.created_at <= $2
      GROUP BY c.neighborhood, c.city
      ORDER BY COUNT(*) DESC, c.neighborhood NULLS LAST;
    `,
    values: [from, to],
  });

  return result.rows.map((row) => ({
    neighborhood: row.neighborhood,
    city: row.city,
    visits: toNumber(row.visits),
  }));
}

async function byCollaborator({ from, to }) {
  const result = await database.query({
    text: `
      SELECT
        u.id AS user_id,
        u.name,
        COUNT(*) AS visits,
        COALESCE(SUM(v.amount_spent), 0) AS revenue
      FROM visits v
      LEFT JOIN users u ON u.id = v.registered_by
      WHERE v.created_at >= $1 AND v.created_at <= $2
      GROUP BY u.id, u.name
      ORDER BY COUNT(*) DESC, u.name NULLS LAST;
    `,
    values: [from, to],
  });

  return result.rows.map((row) => ({
    userId: row.user_id,
    name: row.name,
    visits: toNumber(row.visits),
    revenue: toNumber(row.revenue),
  }));
}

// Deliberately period-free: the screen always shows the current month.
async function birthdaysOfMonth(month) {
  const result = await database.query({
    text: `
      SELECT id, name, phone, EXTRACT(DAY FROM birth_date)::int AS day
      FROM clients
      WHERE birth_date IS NOT NULL AND EXTRACT(MONTH FROM birth_date) = $1
      ORDER BY EXTRACT(DAY FROM birth_date), name;
    `,
    values: [month],
  });

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    phone: row.phone,
    day: toNumber(row.day),
  }));
}

module.exports = {
  newVsReturningClients,
  topClients,
  byNeighborhood,
  byCollaborator,
  birthdaysOfMonth,
};
```

- [ ] **Step 4: Run the test and watch it pass**

```bash
cd apps/web && npx jest --runInBand tests/integration/models/dashboard/clients.test.js
```

Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/models/dashboard/clients.js apps/web/tests/integration/models/dashboard/clients.test.js
git commit -m "$(cat <<'EOF'
Add the dashboard client breakdowns

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: Compose the overview

**Files:**
- Create: `apps/web/src/models/dashboard/index.js`
- Test: `apps/web/tests/integration/models/dashboard/get-overview.test.js`

**Interfaces:**
- Consumes: every function from Tasks 3–8.
- Produces: `require("@/models/dashboard")` exposing `PERIODS`, `DEFAULT_PERIOD_KEY`, `resolveRange`, `currentMonth`, every query function, and `getOverview({ from, to, granularity })` → `{ summary, timeline, discoverySources, reasons, categories, newVsReturningClients, topClients, neighborhoods, collaborators, birthdays }`.

- [ ] **Step 1: Write the failing test**

Create `apps/web/tests/integration/models/dashboard/get-overview.test.js`:

```js
const orchestrator = require("../../../orchestrator");
const client = require("@/models/client");
const dashboard = require("@/models/dashboard");

const RANGE = {
  from: new Date("2026-07-01T03:00:00Z"),
  to: new Date("2026-08-01T02:59:59Z"),
  granularity: "day",
};

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();

  const createdClient = await client.create({
    name: "Panorama",
    phone: "11950000001",
    neighborhood: "Centro",
    city: "Sorocaba",
    birthDate: "1990-07-15",
  });

  await orchestrator.createVisitAt({
    clientId: createdClient.id,
    registeredBy: null,
    amountSpent: 45,
    orderCategories: ["sorvete", "bebida"],
    reason: "comemoracao",
    discoverySource: "instagram",
    createdAt: new Date("2026-07-10T15:00:00Z"),
  });
});

describe("dashboard.getOverview()", () => {
  test("returns every section, agreeing with the individual functions", async () => {
    const overview = await dashboard.getOverview(RANGE);

    expect(overview.summary).toEqual(await dashboard.summary(RANGE));
    expect(overview.timeline).toEqual(await dashboard.timeline(RANGE));
    expect(overview.discoverySources).toEqual(await dashboard.byDiscoverySource(RANGE));
    expect(overview.reasons).toEqual(await dashboard.byReason(RANGE));
    expect(overview.categories).toEqual(await dashboard.byCategory(RANGE));
    expect(overview.newVsReturningClients).toEqual(await dashboard.newVsReturningClients(RANGE));
    expect(overview.topClients).toEqual(await dashboard.topClients(RANGE));
    expect(overview.neighborhoods).toEqual(await dashboard.byNeighborhood(RANGE));
    expect(overview.collaborators).toEqual(await dashboard.byCollaborator(RANGE));
  });

  test("carries the current month's birthdays, independent of the period", async () => {
    const overview = await dashboard.getOverview(RANGE);

    expect(Array.isArray(overview.birthdays)).toBe(true);
  });

  test("re-exports the period helpers so consumers need only one require", async () => {
    expect(dashboard.PERIODS.map((period) => period.key)).toEqual(["hoje", "7d", "30d", "90d"]);
    expect(typeof dashboard.resolveRange).toBe("function");
    expect(typeof dashboard.currentMonth).toBe("function");
  });
});
```

- [ ] **Step 2: Run the test and watch it fail**

```bash
cd apps/web && npx jest --runInBand tests/integration/models/dashboard/get-overview.test.js
```

Expected: FAIL — `Cannot find module '@/models/dashboard'`.

- [ ] **Step 3: Write the implementation**

Create `apps/web/src/models/dashboard/index.js`:

```js
const period = require("./period");
const movement = require("./movement");
const marketing = require("./marketing");
const product = require("./product");
const clients = require("./clients");

async function getOverview({ from, to, granularity }) {
  const range = { from, to };

  const [
    summary,
    timeline,
    discoverySources,
    reasons,
    categories,
    newVsReturningClients,
    topClients,
    neighborhoods,
    collaborators,
    birthdays,
  ] = await Promise.all([
    movement.summary(range),
    movement.timeline({ from, to, granularity }),
    marketing.byDiscoverySource(range),
    marketing.byReason(range),
    product.byCategory(range),
    clients.newVsReturningClients(range),
    clients.topClients(range),
    clients.byNeighborhood(range),
    clients.byCollaborator(range),
    clients.birthdaysOfMonth(period.currentMonth()),
  ]);

  return {
    summary,
    timeline,
    discoverySources,
    reasons,
    categories,
    newVsReturningClients,
    topClients,
    neighborhoods,
    collaborators,
    birthdays,
  };
}

module.exports = {
  ...period,
  ...movement,
  ...marketing,
  ...product,
  ...clients,
  getOverview,
};
```

- [ ] **Step 4: Run the test and watch it pass**

```bash
cd apps/web && npx jest --runInBand tests/integration/models/dashboard/get-overview.test.js
```

Expected: PASS, 3 tests.

- [ ] **Step 5: Run the whole suite**

```bash
npm test
```

Expected: every suite passes. This is the last model task — everything from here needs the redesign.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/models/dashboard/index.js apps/web/tests/integration/models/dashboard/get-overview.test.js
git commit -m "$(cat <<'EOF'
Compose the dashboard overview from its section models

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## 🚧 Checkpoint — the redesign must be merged before Task 10

Verify all of these exist before continuing. If any is missing, **stop and report**:

```bash
ls apps/web/src/components/ui/ apps/web/src/components/app-shell.js apps/web/src/app/require-auth.js apps/web/src/lib/
```

Expected: `Card`, `Badge` and `EmptyState` under `components/ui/`, plus `app-shell.js`, `require-auth.js` and a `lib/` holding `formatCurrency`.

Open each one and confirm the props before using them below — this plan's UI code is written against the redesign spec, not against code that existed when the plan was written.

---

### Task 10: Chart label formatting

**Files:**
- Create: `apps/web/src/app/dashboard/bucket-label.js`
- Test: `apps/web/tests/unit/app/dashboard/bucket-label.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `bucketLabel(bucket, granularity)` → the axis label string for a `YYYY-MM-DDTHH:MM:SS` bucket.

- [ ] **Step 1: Write the failing test**

Create `apps/web/tests/unit/app/dashboard/bucket-label.test.js`:

```js
const bucketLabel = require("@/app/dashboard/bucket-label");

describe("bucketLabel()", () => {
  test("formats an hourly bucket", () => {
    expect(bucketLabel("2026-07-10T14:00:00", "hour")).toBe("14h");
  });

  test("formats a daily bucket as day/month", () => {
    expect(bucketLabel("2026-07-10T00:00:00", "day")).toBe("10/07");
  });

  test("formats a weekly bucket as the week's range", () => {
    expect(bucketLabel("2026-07-06T00:00:00", "week")).toBe("06/07 – 12/07");
  });

  test("crosses the month boundary correctly on a weekly bucket", () => {
    expect(bucketLabel("2026-07-27T00:00:00", "week")).toBe("27/07 – 02/08");
  });
});
```

- [ ] **Step 2: Run the test and watch it fail**

```bash
cd apps/web && npx jest --runInBand tests/unit/app/dashboard/bucket-label.test.js
```

Expected: FAIL — `Cannot find module '@/app/dashboard/bucket-label'`.

- [ ] **Step 3: Write the implementation**

Create `apps/web/src/app/dashboard/bucket-label.js`:

```js
// The bucket arrives as wall-clock time in the store's timezone. It is sliced
// as text rather than parsed into a Date, because building a Date would
// re-read it in the process timezone and shift every label.
function bucketLabel(bucket, granularity) {
  const [date, time] = bucket.split("T");
  const [year, month, day] = date.split("-");

  if (granularity === "hour") {
    return `${time.slice(0, 2)}h`;
  }

  if (granularity === "week") {
    const end = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day) + 6));
    const endDay = String(end.getUTCDate()).padStart(2, "0");
    const endMonth = String(end.getUTCMonth() + 1).padStart(2, "0");

    return `${day}/${month} – ${endDay}/${endMonth}`;
  }

  return `${day}/${month}`;
}

module.exports = bucketLabel;
```

`Date.UTC` here is arithmetic on a plain calendar date, not a timezone conversion — it only rolls the day over the end of a month.

- [ ] **Step 4: Run the test and watch it pass**

```bash
cd apps/web && npx jest --runInBand tests/unit/app/dashboard/bucket-label.test.js
```

Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/dashboard/bucket-label.js apps/web/tests/unit/app/dashboard/bucket-label.test.js
git commit -m "$(cat <<'EOF'
Add chart bucket label formatting for the dashboard

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 11: Presentational components

**Files:**
- Create: `apps/web/src/app/dashboard/stat-card.js`
- Create: `apps/web/src/app/dashboard/bar-list.js`
- Create: `apps/web/src/app/dashboard/timeline-chart.js`
- Create: `apps/web/src/app/dashboard/period-filter.js`

**Interfaces:**
- Consumes: `Card` and `EmptyState` from `@/components/ui`, `formatCurrency` from `@/lib`, `bucketLabel` from Task 10, `PERIODS` from `@/models/dashboard`.
- Produces:
  - `<StatCard label value />`
  - `<BarList items />` where `items` is `[{ key, label, value, percentage, note, color }]`
  - `<TimelineChart points granularity />` where `points` is the `timeline()` output
  - `<PeriodFilter activeKey />`

These are Server Components with no data fetching and no state, so they carry no automated test — the repo has no React test infrastructure and the redesign decided not to add it. Verification is the browser check in Task 12.

- [ ] **Step 1: Write `stat-card.js`**

```js
import { Card } from "@/components/ui/card";

export default function StatCard({ label, value }) {
  return (
    <Card className="flex flex-col gap-1 p-4">
      <span className="text-sm text-muted">{label}</span>
      <span className="font-display text-2xl font-bold text-ink">{value}</span>
    </Card>
  );
}
```

- [ ] **Step 2: Write `bar-list.js`**

```js
import { EmptyState } from "@/components/ui/empty-state";

export default function BarList({ items }) {
  if (items.length === 0) {
    return <EmptyState title="Sem dados no período" />;
  }

  // Bars are scaled against the largest row, not the total, so the comparison
  // stays readable when even the top row is only a small share of visits.
  const largest = Math.max(...items.map((item) => item.value));

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.key} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-4 text-sm">
            <span className="text-ink">{item.label}</span>
            <span className="text-muted">
              {item.value}
              {item.percentage === undefined ? "" : ` · ${item.percentage}%`}
              {item.note ? ` · ${item.note}` : ""}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-pill bg-surface-2">
            <div
              className="h-full rounded-pill bg-brand-vivid"
              style={{
                width: `${largest === 0 ? 0 : (item.value / largest) * 100}%`,
                ...(item.color ? { backgroundColor: item.color } : {}),
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
```

Labels and values sit **outside** the bar: `--color-brand-vivid` only reaches 3,1:1 against white and must never carry light text.

- [ ] **Step 3: Write `timeline-chart.js`**

```js
import bucketLabel from "./bucket-label";
import { formatCurrency } from "@/lib/format-currency";

export default function TimelineChart({ points, granularity }) {
  const tallest = Math.max(...points.map((point) => point.visits), 0);

  return (
    <ul className="flex items-end gap-1 overflow-x-auto pb-2">
      {points.map((point) => (
        <li key={point.bucket} className="flex min-w-6 flex-1 flex-col items-center gap-1">
          <span className="text-xs text-muted">{point.visits}</span>
          <div
            className="w-full rounded-sm bg-brand-vivid"
            style={{ height: `${tallest === 0 ? 2 : Math.max((point.visits / tallest) * 96, 2)}px` }}
          />
          <span className="text-xs whitespace-nowrap text-muted">
            {bucketLabel(point.bucket, granularity)}
          </span>
          <span className="sr-only">{formatCurrency(point.revenue)}</span>
        </li>
      ))}
    </ul>
  );
}
```

Every bar carries its count as real text, so the chart is readable without seeing the bars at all.

- [ ] **Step 4: Write `period-filter.js`**

```js
import Link from "next/link";

import { PERIODS } from "@/models/dashboard";

export default function PeriodFilter({ activeKey }) {
  return (
    <nav className="flex flex-wrap gap-2" aria-label="Período">
      {PERIODS.map((period) => {
        const isActive = period.key === activeKey;

        return (
          <Link
            key={period.key}
            href={`/dashboard?periodo=${period.key}`}
            aria-current={isActive ? "page" : undefined}
            className={
              isActive
                ? "rounded-pill bg-brand px-4 py-2 text-sm font-medium text-white"
                : "rounded-pill border border-line bg-surface px-4 py-2 text-sm font-medium text-ink"
            }
          >
            {period.label}
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 5: Confirm the imports resolve**

```bash
npm run lint
```

Expected: no errors. If an import path is wrong (for example the redesign exports `Card` from `@/components/ui` rather than `@/components/ui/card`), fix the path to match the real code.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/dashboard
git commit -m "$(cat <<'EOF'
Add the dashboard presentational components

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 12: The dashboard page

**Files:**
- Create: `apps/web/src/app/dashboard/page.js`

**Interfaces:**
- Consumes: `requireAuthenticatedUser()` from `@/app/require-auth`, `authorization.userCan`, everything from `@/models/dashboard`, the components from Task 11, the label maps from Task 1, `formatCurrency`.
- Produces: the route `/dashboard`, reading `?periodo=`.

- [ ] **Step 1: Write the page**

Create `apps/web/src/app/dashboard/page.js`:

```js
import { notFound } from "next/navigation";

import requireAuthenticatedUser from "@/app/require-auth";
import authorization from "@/models/authorization";
import dashboard from "@/models/dashboard";
import { formatCurrency } from "@/lib/format-currency";
import {
  CATEGORY_LABELS,
  REASON_LABELS,
  DISCOVERY_LABELS,
  CATEGORY_CHIP_CLASSES,
} from "@/lib/visit-options";
import StatCard from "./stat-card";
import BarList from "./bar-list";
import TimelineChart from "./timeline-chart";
import PeriodFilter from "./period-filter";

const VIEW_DASHBOARD_FEATURE = "dashboard.visualizar";

const MONTH_NAMES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

function labelledItems(rows, labels) {
  return rows.map((row) => ({
    key: row.value,
    label: labels[row.value] ?? row.value,
    value: row.visits,
    percentage: row.percentage,
  }));
}

export default async function DashboardPage({ searchParams }) {
  const authenticatedUser = await requireAuthenticatedUser();

  if (!authorization.userCan(authenticatedUser, VIEW_DASHBOARD_FEATURE)) {
    notFound();
  }

  const { periodo } = await searchParams;
  const range = dashboard.resolveRange(periodo);
  const overview = await dashboard.getOverview(range);

  return (
    <div className="flex w-full flex-col gap-8 px-4 py-8">
      <div className="flex flex-col gap-4">
        <h1 className="font-display text-2xl font-bold text-ink">Dashboard</h1>
        <PeriodFilter activeKey={range.key} />
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Visitas" value={overview.summary.visits} />
        <StatCard label="Faturamento" value={formatCurrency(overview.summary.revenue)} />
        <StatCard label="Ticket médio" value={formatCurrency(overview.summary.averageTicket)} />
        <StatCard label="Clientes atendidos" value={overview.summary.clientsServed} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-bold text-ink">Movimento no período</h2>
        <TimelineChart points={overview.timeline} granularity={range.granularity} />
      </section>

      <section className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <div className="flex flex-1 flex-col gap-3">
          <h2 className="font-display text-lg font-bold text-ink">De onde conheceram a loja</h2>
          <BarList items={labelledItems(overview.discoverySources, DISCOVERY_LABELS)} />
        </div>
        <div className="flex flex-1 flex-col gap-3">
          <h2 className="font-display text-lg font-bold text-ink">Por que vieram</h2>
          <BarList items={labelledItems(overview.reasons, REASON_LABELS)} />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-bold text-ink">O que pediram</h2>
        <p className="text-sm text-muted">
          Uma visita pode ter mais de uma categoria, então as porcentagens somam mais de 100%.
        </p>
        <BarList
          items={overview.categories.map((row) => ({
            key: row.value,
            label: CATEGORY_LABELS[row.value] ?? row.value,
            value: row.visits,
            percentage: row.percentage,
            note: `ticket ${formatCurrency(row.averageTicket)}`,
            className: CATEGORY_CHIP_CLASSES[row.value],
          }))}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-bold text-ink">Clientes</h2>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Clientes novos" value={overview.newVsReturningClients.newClients} />
          <StatCard label="Clientes recorrentes" value={overview.newVsReturningClients.returningClients} />
        </div>

        <h3 className="mt-4 font-display text-base font-bold text-ink">Quem mais gastou</h3>
        <BarList
          items={overview.topClients.map((row) => ({
            key: row.id,
            label: row.name,
            value: row.visits,
            note: formatCurrency(row.revenue),
          }))}
        />

        <h3 className="mt-4 font-display text-base font-bold text-ink">De onde vêm</h3>
        <BarList
          items={overview.neighborhoods.map((row) => ({
            key: `${row.neighborhood ?? "sem-bairro"}-${row.city ?? "sem-cidade"}`,
            label: row.neighborhood
              ? `${row.neighborhood}${row.city ? ` — ${row.city}` : ""}`
              : "Não informado",
            value: row.visits,
          }))}
        />

        <h3 className="mt-4 font-display text-base font-bold text-ink">Visitas por colaborador</h3>
        <BarList
          items={overview.collaborators.map((row) => ({
            key: row.userId ?? "sem-colaborador",
            label: row.name ?? "Não informado",
            value: row.visits,
            note: formatCurrency(row.revenue),
          }))}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-bold text-ink">
          Aniversariantes de {MONTH_NAMES[dashboard.currentMonth() - 1]}
        </h2>
        <p className="text-sm text-muted">Esta seção não muda com o filtro de período.</p>
        {overview.birthdays.length === 0 ? (
          <p className="text-sm text-muted">Nenhum aniversariante este mês.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {overview.birthdays.map((birthday) => (
              <li key={birthday.id} className="flex justify-between gap-4 text-sm text-ink">
                <span>{birthday.name}</span>
                <span className="text-muted">
                  dia {birthday.day} · {birthday.phone}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
```

If `requireAuthenticatedUser` is a named export in the real file, adjust the import.

**Category colors — resolved during Task 1.** `apps/web/src/lib/visit-options.js` exports `CATEGORY_CHIP_CLASSES`, a map of category value to a Tailwind class pair (`"bg-cat-sorvete-bg text-cat-sorvete-fg"`). Import it alongside the label maps and pass it through as shown. `BarList` in Task 11 must therefore accept a `className` on each item and apply it to the bar element, instead of the `color` style property that task's code sketch used — adjust `bar-list.js` accordingly when you build it. The classes are written as literal strings on purpose so Tailwind's scanner finds them; never build them by interpolation.

Note that `visit-options.js` is ESM (`export const`), matching the redesign, not CommonJS like the model files.

- [ ] **Step 2: Verify in the browser**

```bash
npm run dev
```

Log in at http://localhost:3010/login as `admin@admin.com.br` / `WeFood123456`, then open http://localhost:3010/dashboard.

Check, at 375px and 1440px:
- the four cards render, with money as `R$ 0,00` style
- the four period links work and the active one is highlighted
- an empty period shows "Sem dados no período" instead of an error
- the page does not scroll horizontally
- the bar labels are readable in both light and dark system themes

Register a visit through `/visitas/nova` first if the database is empty — the test suite wipes it.

- [ ] **Step 3: Verify the permission gate**

Create a colaborador through `/admin/colaboradores`, accept the invite, log in as that user and open `/dashboard`. Expected: the 404 page, not the dashboard.

- [ ] **Step 4: Run lint and the full suite**

```bash
npm run lint && npm test
```

Expected: both pass.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/dashboard/page.js
git commit -m "$(cat <<'EOF'
Add the /dashboard page

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 13: Navigation entry and label cleanup

**Files:**
- Modify: `apps/web/src/components/app-shell.js`
- Modify: `apps/web/src/app/page.js`
- Modify: `apps/web/src/app/visitas/nova/register-visit-flow.js`
- Modify: `apps/web/src/app/clientes/[id]/page.js`

**Interfaces:**
- Consumes: `authorization.userCan`, `@/lib/visit-options` from Task 1.
- Produces: `AppShell` accepting `canViewDashboard`; the two existing screens importing their labels instead of declaring them.

- [ ] **Step 1: Add `canViewDashboard` to the shell**

In `apps/web/src/components/app-shell.js`, add `canViewDashboard` to the destructured props next to `canManageUsers`, and add the sidebar item between *Início* and *Clientes*, following exactly the markup the existing items use:

```js
{canViewDashboard && (
  <SidebarLink href="/dashboard">Dashboard</SidebarLink>
)}
```

Use whatever the file's real link component/markup is — match the neighbours rather than introducing a new pattern.

Leave the mobile bottom nav at three items. The redesign chose that on purpose; mobile access comes from the home panel in Step 2.

- [ ] **Step 2: Pass the prop and add the home entry**

In `apps/web/src/app/page.js`, compute the permission next to the existing `canManageUsers` calculation:

```js
const canViewDashboard = authorization.userCan(authenticatedUser, "dashboard.visualizar");
```

Pass it to `AppShell` wherever `canManageUsers` is passed, and add a Dashboard entry to the home panel guarded by `canViewDashboard`, matching the markup of the panel's existing entries.

- [ ] **Step 3: Point the two screens at the shared labels**

In `apps/web/src/app/visitas/nova/register-visit-flow.js`, delete the local `CATEGORY_OPTIONS`, `REASON_OPTIONS` and `DISCOVERY_OPTIONS` declarations and import them instead:

```js
import { CATEGORY_OPTIONS, REASON_OPTIONS, DISCOVERY_OPTIONS } from "@/lib/visit-options";
```

In `apps/web/src/app/clientes/[id]/page.js`, delete the local `CATEGORY_LABELS`, `REASON_LABELS` and `DISCOVERY_LABELS` declarations and import them instead:

```js
import { CATEGORY_LABELS, REASON_LABELS, DISCOVERY_LABELS } from "@/lib/visit-options";
```

If the redesign renamed these constants, keep its names and adapt the import — the goal is one source of truth, not a specific identifier.

- [ ] **Step 4: Verify in the browser**

```bash
npm run dev
```

- As admin: *Dashboard* appears in the sidebar at 1440px and on the home panel at 375px, and both open `/dashboard`.
- As a colaborador without the permission: neither entry appears.
- `/visitas/nova` still shows every category, reason and origin option with the same wording.
- A client's detail page still names the category, reason and origin of each visit.

- [ ] **Step 5: Run lint and the full suite**

```bash
npm run lint && npm test
```

Expected: both pass.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/app-shell.js apps/web/src/app/page.js apps/web/src/app/visitas/nova/register-visit-flow.js "apps/web/src/app/clientes/[id]/page.js"
git commit -m "$(cat <<'EOF'
Link to the dashboard and drop the duplicated visit labels

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Verification checklist

Before calling the module done:

- [ ] `npm run lint` passes
- [ ] `npm test` passes with no skipped suites
- [ ] `/dashboard` renders for an admin and 404s for a colaborador without the permission
- [ ] All four period shortcuts change the numbers; `?periodo=xyz` falls back to 30 days instead of erroring
- [ ] An empty period shows zeros and "Sem dados no período", never an error
- [ ] No `"use client"`, no hex color, and no `dark:` class in `apps/web/src/app/dashboard/`
- [ ] `grep -rn "CATEGORY_OPTIONS\|REASON_LABELS" apps/web/src` shows the definitions only in `src/lib/visit-options.js`
