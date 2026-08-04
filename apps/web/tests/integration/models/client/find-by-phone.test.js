const orchestrator = require("../../../orchestrator");
const client = require("@/models/client");

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe("client.findByPhone()", () => {
  test("returns the client with a matching phone", async () => {
    const createdClient = await client.create({ name: "Cliente Buscado", phone: "11999990010" });

    const foundClient = await client.findByPhone("11999990010");

    expect(foundClient.id).toBe(createdClient.id);
  });

  test("returns null when no client matches", async () => {
    const foundClient = await client.findByPhone("11900000000");

    expect(foundClient).toBeNull();
  });
});
