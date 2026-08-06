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
    expect(overview.funnel).toEqual(await dashboard.funnel(RANGE));
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

  // A página escreve "Aniversariantes de <mês>" a partir daqui, em vez de
  // chamar currentMonth() de novo por fora.
  test("reports the month it used for the birthdays", async () => {
    const overview = await dashboard.getOverview(RANGE);

    expect(overview.month).toBe(dashboard.currentMonth());
    expect(overview.month).toBeGreaterThanOrEqual(1);
    expect(overview.month).toBeLessThanOrEqual(12);
  });

  test("re-exports the period helpers so consumers need only one require", async () => {
    expect(dashboard.PERIODS.map((period) => period.key)).toEqual(["hoje", "7d", "30d", "90d"]);
    expect(typeof dashboard.resolveRange).toBe("function");
    expect(typeof dashboard.currentMonth).toBe("function");
  });
});
