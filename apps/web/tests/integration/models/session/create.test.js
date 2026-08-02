const orchestrator = require("../../../orchestrator");
const session = require("@/models/session");
const user = require("@/models/user");

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe("session.create()", () => {
  test("creates a session with a token that expires 30 days from now", async () => {
    const createdUser = await user.create({
      email: "sessao@wefood.com.br",
      password: "senha-segura",
    });

    const beforeCreate = Date.now();
    const createdSession = await session.create(createdUser.id);
    const afterCreate = Date.now();

    expect(createdSession.token).toHaveLength(96);
    expect(createdSession.user_id).toBe(createdUser.id);

    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    const expiresAt = new Date(createdSession.expires_at).getTime();
    expect(expiresAt).toBeGreaterThanOrEqual(beforeCreate + thirtyDaysInMs - 1000);
    expect(expiresAt).toBeLessThanOrEqual(afterCreate + thirtyDaysInMs + 1000);
  });
});
