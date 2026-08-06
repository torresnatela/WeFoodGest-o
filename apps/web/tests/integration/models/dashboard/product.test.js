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

  test("usa só as visitas com compra como denominador", async () => {
    // Sem esta regra a visita abaixo entraria no total e diluiria as duas
    // categorias (sorvete cairia de 100% para 66,7%) sem que ninguém tivesse
    // deixado de pedir sorvete.
    await orchestrator.createVisitAt({
      registeredBy: null,
      enteredStore: true,
      sawProducts: true,
      purchased: false,
      amountSpent: 0,
      orderCategories: [],
      createdAt: new Date("2026-07-12T15:00:00Z"),
    });

    const result = await product.byCategory({ from: FROM, to: TO });

    expect(result).toEqual([
      { value: "sorvete", visits: 2, percentage: 100, averageTicket: 30 },
      { value: "bebida", visits: 1, percentage: 50, averageTicket: 40 },
    ]);
  });

  test("returns an empty array for a period with no visits", async () => {
    const result = await product.byCategory({
      from: new Date("2020-01-01T00:00:00Z"),
      to: new Date("2020-01-31T00:00:00Z"),
    });

    expect(result).toEqual([]);
  });
});
