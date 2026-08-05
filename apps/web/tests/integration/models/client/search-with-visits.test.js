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
