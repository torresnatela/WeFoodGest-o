const orchestrator = require("../../../orchestrator");
const client = require("@/models/client");

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe("client.findById()", () => {
  test("returns the client with a matching id", async () => {
    const createdClient = await client.create({ name: "Cliente por Id", phone: "11999990020" });

    const foundClient = await client.findById(createdClient.id);

    expect(foundClient.name).toBe("Cliente por Id");
  });

  test("returns null for an unknown id", async () => {
    const foundClient = await client.findById("00000000-0000-0000-0000-000000000000");

    expect(foundClient).toBeNull();
  });
});
