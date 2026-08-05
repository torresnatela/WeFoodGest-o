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

async function resetDatabase() {
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
}

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("dashboard.newVsReturningClients()", () => {
  beforeEach(resetDatabase);

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

    expect(result).toEqual({ newClients: 1, returningClients: 0 });
  });
});

describe("dashboard.topClients()", () => {
  beforeAll(resetDatabase);

  test("ranks by total spent and respects the limit", async () => {
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
  beforeAll(resetDatabase);

  test("groups visits by the client's neighborhood and city, keeping nulls", async () => {
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
  beforeAll(resetDatabase);

  test("counts visits per collaborator and keeps unattributed visits", async () => {
    // user.findByEmail() only returns id/email/password/timestamps, which
    // lacks the `name` this assertion needs. Chain it with user.findById(),
    // which does return that shape, instead of inventing a new model
    // function or reaching into the users table here (same pattern as
    // tests/integration/migrations/dashboard-feature.test.js).
    const foundAdmin = await user.findByEmail("admin@admin.com.br");
    const adminUser = await user.findById(foundAdmin.id);
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
  beforeAll(resetDatabase);

  test("returns clients born in the month, ordered by day, ignoring the period", async () => {
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
