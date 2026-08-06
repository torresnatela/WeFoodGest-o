const database = require("@wefood/database");
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
      enteredStore: true,
      sawProducts: true,
      purchased: true,
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
    expect(createdVisit.entered_store).toBe(true);
    expect(createdVisit.saw_products).toBe(true);
    expect(createdVisit.purchased).toBe(true);
  });

  test("registra quem passou em frente e não entrou", async () => {
    const createdVisit = await visit.create({
      registeredBy: null,
      enteredStore: false,
      sawProducts: false,
      purchased: false,
    });

    expect(createdVisit.id).toBeDefined();
    expect(createdVisit.client_id).toBeNull();
    expect(createdVisit.reason).toBeNull();
    expect(createdVisit.discovery_source).toBeNull();
    expect(Number(createdVisit.amount_spent)).toBe(0);
    expect(createdVisit.order_categories).toEqual([]);
    expect(createdVisit.entered_store).toBe(false);
  });

  test("registra quem viu a vitrine sem entrar", async () => {
    const createdVisit = await visit.create({
      registeredBy: null,
      enteredStore: false,
      sawProducts: true,
      purchased: false,
    });

    expect(createdVisit.entered_store).toBe(false);
    expect(createdVisit.saw_products).toBe(true);
  });

  test("registra quem entrou, respondeu o motivo e não comprou nem deixou telefone", async () => {
    const createdVisit = await visit.create({
      registeredBy: null,
      enteredStore: true,
      sawProducts: true,
      purchased: false,
      reason: "passando_em_frente",
      discoverySource: "passou_em_frente",
    });

    expect(createdVisit.client_id).toBeNull();
    expect(createdVisit.reason).toBe("passando_em_frente");
    expect(createdVisit.purchased).toBe(false);
    expect(createdVisit.order_categories).toEqual([]);

    const items = await database.query({
      text: "SELECT * FROM visit_order_items WHERE visit_id = $1;",
      values: [createdVisit.id],
    });
    expect(items.rows).toHaveLength(0);
  });

  test("aceita uma compra sem detalhar categorias nem valor", async () => {
    const createdClient = await client.create({ name: "Cliente Visita 2", phone: "11999991002" });

    const createdVisit = await visit.create({
      clientId: createdClient.id,
      registeredBy: null,
      enteredStore: true,
      sawProducts: true,
      purchased: true,
    });

    expect(createdVisit.purchased).toBe(true);
    expect(createdVisit.order_categories).toEqual([]);
    expect(Number(createdVisit.amount_spent)).toBe(0);
  });

  test("exige as três respostas do funil", async () => {
    await expect(
      visit.create({
        registeredBy: null,
        enteredStore: true,
        sawProducts: true,
      }),
    ).rejects.toThrow("Responda se o cliente entrou, viu os produtos e comprou.");
  });

  test("rejeita uma compra sem ter visto os produtos", async () => {
    await expect(
      visit.create({
        registeredBy: null,
        enteredStore: true,
        sawProducts: false,
        purchased: true,
      }),
    ).rejects.toThrow("Quem comprou necessariamente viu os produtos.");
  });

  test("rejeita itens de pedido numa visita sem compra", async () => {
    await expect(
      visit.create({
        registeredBy: null,
        enteredStore: true,
        sawProducts: true,
        purchased: false,
        orderCategories: ["sorvete"],
      }),
    ).rejects.toThrow("Uma visita sem compra não pode ter itens no pedido.");
  });

  test("rejeita valor gasto numa visita sem compra", async () => {
    await expect(
      visit.create({
        registeredBy: null,
        enteredStore: true,
        sawProducts: true,
        purchased: false,
        amountSpent: 10,
      }),
    ).rejects.toThrow("Uma visita sem compra não pode ter valor gasto.");
  });

  test("rejects an unknown client id", async () => {
    await expect(
      visit.create({
        clientId: "00000000-0000-0000-0000-000000000000",
        registeredBy: null,
        enteredStore: true,
        sawProducts: true,
        purchased: true,
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
        enteredStore: true,
        sawProducts: true,
        purchased: true,
        amountSpent: 10,
        orderCategories: ["sorvete"],
        reason: "motivo_invalido",
        discoverySource: "outro",
      }),
    ).rejects.toThrow("Algum valor enviado não é uma opção válida.");
  });

  test("apagar o cliente anonimiza a visita em vez de destruí-la", async () => {
    const createdClient = await client.create({ name: "Cliente Apagado", phone: "11999991004" });

    const createdVisit = await visit.create({
      clientId: createdClient.id,
      registeredBy: null,
      enteredStore: true,
      sawProducts: true,
      purchased: true,
      amountSpent: 42,
      orderCategories: ["lanche"],
      reason: "outro",
      discoverySource: "outro",
    });

    await database.query({
      text: "DELETE FROM clients WHERE id = $1;",
      values: [createdClient.id],
    });

    const survivor = await database.query({
      text: "SELECT client_id, amount_spent FROM visits WHERE id = $1;",
      values: [createdVisit.id],
    });

    expect(survivor.rows).toHaveLength(1);
    expect(survivor.rows[0].client_id).toBeNull();
    expect(Number(survivor.rows[0].amount_spent)).toBe(42);
  });
});
