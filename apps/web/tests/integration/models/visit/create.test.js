const orchestrator = require("../../../orchestrator");
const client = require("@/models/client");
const visit = require("@/models/visit");

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe("visit.create()", () => {
  test("creates a visit with its order categories", async () => {
    const createdClient = await client.create({ name: "Cliente Visita 1", phone: "11999991001" });

    const createdVisit = await visit.create({
      clientId: createdClient.id,
      registeredBy: null,
      amountSpent: 25.5,
      orderCategories: ["sorvete", "milkshake"],
      orderDetails: "1 sundae de chocolate, 1 milkshake de morango",
      reason: "vontade_comer_beber",
      reasonDetails: "",
      discoverySource: "instagram",
      discoveryDetails: "Viu um post no feed",
    });

    expect(createdVisit.id).toBeDefined();
    expect(createdVisit.client_id).toBe(createdClient.id);
    expect(Number(createdVisit.amount_spent)).toBe(25.5);
    expect(createdVisit.order_categories.sort()).toEqual(["milkshake", "sorvete"]);
  });

  test("rejects a visit with no order category", async () => {
    const createdClient = await client.create({ name: "Cliente Visita 2", phone: "11999991002" });

    await expect(
      visit.create({
        clientId: createdClient.id,
        registeredBy: null,
        amountSpent: 10,
        orderCategories: [],
        reason: "outro",
        discoverySource: "outro",
      }),
    ).rejects.toThrow("Selecione ao menos uma categoria do pedido.");
  });

  test("rejects an unknown client id", async () => {
    await expect(
      visit.create({
        clientId: "00000000-0000-0000-0000-000000000000",
        registeredBy: null,
        amountSpent: 10,
        orderCategories: ["sorvete"],
        reason: "outro",
        discoverySource: "outro",
      }),
    ).rejects.toThrow("Cliente não encontrado.");
  });

  test("rejects an invalid reason", async () => {
    const createdClient = await client.create({ name: "Cliente Visita 3", phone: "11999991003" });

    await expect(
      visit.create({
        clientId: createdClient.id,
        registeredBy: null,
        amountSpent: 10,
        orderCategories: ["sorvete"],
        reason: "motivo_invalido",
        discoverySource: "outro",
      }),
    ).rejects.toThrow("Algum valor enviado não é uma opção válida.");
  });
});
