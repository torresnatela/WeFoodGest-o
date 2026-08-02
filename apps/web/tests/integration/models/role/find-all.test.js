const orchestrator = require("../../../orchestrator");
const role = require("@/models/role");

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe("role.findAll()", () => {
  test("returns both seeded roles", async () => {
    const roles = await role.findAll();

    const keys = roles.map((currentRole) => currentRole.key);
    expect(keys).toContain("admin");
    expect(keys).toContain("colaborador");
  });
});
