const orchestrator = require("../../../orchestrator");
const client = require("@/models/client");
const visit = require("@/models/visit");

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe("visit.findByClientId()", () => {
  test("returns all visits for the client, each with its order categories", async () => {
    const createdClient = await client.create({ name: "Cliente Historico", phone: "11999992001" });

    const firstVisit = await visit.create({
      clientId: createdClient.id,
      registeredBy: null,
      amountSpent: 10,
      orderCategories: ["lanche"],
      reason: "programa_familia_amigos",
      discoverySource: "indicacao",
    });
    const secondVisit = await visit.create({
      clientId: createdClient.id,
      registeredBy: null,
      amountSpent: 20,
      orderCategories: ["bebida", "sobremesa"],
      reason: "comemoracao",
      discoverySource: "cliente_antigo",
    });

    const visits = await visit.findByClientId(createdClient.id);

    expect(visits).toHaveLength(2);

    const foundFirst = visits.find((currentVisit) => currentVisit.id === firstVisit.id);
    const foundSecond = visits.find((currentVisit) => currentVisit.id === secondVisit.id);
    expect(foundFirst.order_categories).toEqual(["lanche"]);
    expect(foundSecond.order_categories.sort()).toEqual(["bebida", "sobremesa"]);
  });

  test("orders visits with the most recent first", async () => {
    const createdClient = await client.create({ name: "Cliente Ordenado", phone: "11999992003" });

    const olderVisit = await visit.create({
      clientId: createdClient.id,
      registeredBy: null,
      amountSpent: 5,
      orderCategories: ["sorvete"],
      reason: "outro",
      discoverySource: "outro",
    });
    await new Promise((resolve) => setTimeout(resolve, 10));
    const newerVisit = await visit.create({
      clientId: createdClient.id,
      registeredBy: null,
      amountSpent: 5,
      orderCategories: ["sorvete"],
      reason: "outro",
      discoverySource: "outro",
    });

    const visits = await visit.findByClientId(createdClient.id);

    expect(visits[0].id).toBe(newerVisit.id);
    expect(visits[1].id).toBe(olderVisit.id);
  });

  test("returns an empty array for a client with no visits", async () => {
    const createdClient = await client.create({ name: "Cliente Sem Visita", phone: "11999992002" });

    const visits = await visit.findByClientId(createdClient.id);

    expect(visits).toEqual([]);
  });
});
