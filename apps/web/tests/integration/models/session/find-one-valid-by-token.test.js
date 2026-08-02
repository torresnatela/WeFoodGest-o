const orchestrator = require("../../../orchestrator");
const session = require("@/models/session");
const user = require("@/models/user");
const database = require("@wefood/database");

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe("session.findOneValidByToken()", () => {
  test("returns the session when the token is valid and not expired", async () => {
    const createdUser = await user.create({
      email: "valida@wefood.com.br",
      password: "senha-segura",
    });
    const createdSession = await session.create(createdUser.id);

    const foundSession = await session.findOneValidByToken(createdSession.token);

    expect(foundSession.id).toBe(createdSession.id);
  });

  test("returns null when the token does not exist", async () => {
    const foundSession = await session.findOneValidByToken("token-inexistente");

    expect(foundSession).toBeNull();
  });

  test("returns null when the token is expired", async () => {
    const createdUser = await user.create({
      email: "expirada@wefood.com.br",
      password: "senha-segura",
    });
    const createdSession = await session.create(createdUser.id);

    await database.query({
      text: "UPDATE sessions SET expires_at = $1 WHERE id = $2;",
      values: [new Date(Date.now() - 1000), createdSession.id],
    });

    const foundSession = await session.findOneValidByToken(createdSession.token);

    expect(foundSession).toBeNull();
  });
});
