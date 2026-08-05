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
