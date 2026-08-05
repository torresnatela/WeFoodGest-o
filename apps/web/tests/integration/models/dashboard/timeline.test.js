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
