const orchestrator = require("../../../orchestrator");
const client = require("@/models/client");
const marketing = require("@/models/dashboard/marketing");

const FROM = new Date("2026-07-01T03:00:00Z");
const TO = new Date("2026-08-01T02:59:59Z");

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();

  const createdClient = await client.create({ name: "Marketing", phone: "11920000001" });

  const visits = [
    { discoverySource: "instagram", reason: "comemoracao" },
    { discoverySource: "instagram", reason: "comemoracao" },
    { discoverySource: "instagram", reason: "outro" },
    { discoverySource: "indicacao", reason: "comemoracao" },
  ];

  for (const [index, current] of visits.entries()) {
    await orchestrator.createVisitAt({
      clientId: createdClient.id,
      registeredBy: null,
      amountSpent: 10,
      orderCategories: ["sorvete"],
      reason: current.reason,
      discoverySource: current.discoverySource,
      createdAt: new Date(`2026-07-1${index}T15:00:00Z`),
    });
  }
});

describe("dashboard.byDiscoverySource()", () => {
  test("counts visits per source, ordered by volume, with percentages", async () => {
    const result = await marketing.byDiscoverySource({ from: FROM, to: TO });

    expect(result).toEqual([
      { value: "instagram", visits: 3, percentage: 75 },
      { value: "indicacao", visits: 1, percentage: 25 },
    ]);
  });

  test("omits sources with no visits in the period instead of listing zeros", async () => {
    const result = await marketing.byDiscoverySource({ from: FROM, to: TO });
    const values = result.map((row) => row.value);

    expect(values).not.toContain("google_internet");
  });

  test("returns an empty array for a period with no visits", async () => {
    const result = await marketing.byDiscoverySource({
      from: new Date("2020-01-01T00:00:00Z"),
      to: new Date("2020-01-31T00:00:00Z"),
    });

    expect(result).toEqual([]);
  });
});

describe("dashboard.byReason()", () => {
  test("counts visits per reason, ordered by volume, with percentages", async () => {
    const result = await marketing.byReason({ from: FROM, to: TO });

    expect(result).toEqual([
      { value: "comemoracao", visits: 3, percentage: 75 },
      { value: "outro", visits: 1, percentage: 25 },
    ]);
  });
});
