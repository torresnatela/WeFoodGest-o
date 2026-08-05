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
