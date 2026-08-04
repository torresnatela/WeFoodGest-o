const orchestrator = require("../../../orchestrator");
const client = require("@/models/client");

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe("client.search()", () => {
  test("returns clients whose name contains the search term, case-insensitive", async () => {
    await client.create({ name: "Ana Souza", phone: "11999990030" });
    await client.create({ name: "Bruno Souza", phone: "11999990031" });
    await client.create({ name: "Carla Lima", phone: "11999990032" });

    const results = await client.search({ name: "souza" });

    const names = results.map((foundClient) => foundClient.name);
    expect(names).toContain("Ana Souza");
    expect(names).toContain("Bruno Souza");
    expect(names).not.toContain("Carla Lima");
  });

  test("returns all clients when no name is given", async () => {
    const results = await client.search({});

    expect(results.length).toBeGreaterThanOrEqual(3);
  });
});
