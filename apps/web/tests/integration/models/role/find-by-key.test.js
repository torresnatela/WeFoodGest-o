const orchestrator = require("../../../orchestrator");
const role = require("@/models/role");

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe("role.findByKey()", () => {
  test("returns the admin role with is_super true", async () => {
    const foundRole = await role.findByKey("admin");

    expect(foundRole.key).toBe("admin");
    expect(foundRole.is_super).toBe(true);
  });

  test("returns the colaborador role with is_super false", async () => {
    const foundRole = await role.findByKey("colaborador");

    expect(foundRole.key).toBe("colaborador");
    expect(foundRole.is_super).toBe(false);
  });

  test("returns null for an unknown key", async () => {
    const foundRole = await role.findByKey("gerente");

    expect(foundRole).toBeNull();
  });
});
