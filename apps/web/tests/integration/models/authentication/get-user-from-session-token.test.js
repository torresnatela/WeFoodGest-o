const orchestrator = require("../../../orchestrator");
const authentication = require("@/models/authentication");
const authorization = require("@/models/authorization");
const session = require("@/models/session");

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe("authentication.getUserFromSessionToken()", () => {
  test("hydrates the seeded admin with is_super and access to any feature", async () => {
    const admin = await authentication.getAuthenticatedUser("admin@admin.com.br", "WeFood123456");
    const createdSession = await session.create(admin.id);

    const hydratedUser = await authentication.getUserFromSessionToken(createdSession.token);

    expect(hydratedUser.role.key).toBe("admin");
    expect(hydratedUser.role.is_super).toBe(true);
    expect(authorization.userCan(hydratedUser, "usuarios.gerenciar")).toBe(true);
    expect(authorization.userCan(hydratedUser, "qualquer-feature-inventada")).toBe(true);
  });
});
