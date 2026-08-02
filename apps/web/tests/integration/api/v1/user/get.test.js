const orchestrator = require("../../../../orchestrator");
const session = require("@/models/session");
const user = require("@/models/user");

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/user", () => {
  test("with a valid session, returns the authenticated user without the password", async () => {
    const createdUser = await user.create({
      email: "logado@wefood.com.br",
      password: "senha-segura",
    });
    const createdSession = await session.create(createdUser.id);

    const response = await fetch(`${orchestrator.webserverUrl}/api/v1/user`, {
      headers: { Cookie: `session_id=${createdSession.token}` },
    });

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.id).toBe(createdUser.id);
    expect(body.email).toBe("logado@wefood.com.br");
    expect(body.password).toBeUndefined();
  });

  test("without a session cookie, returns 401", async () => {
    const response = await fetch(`${orchestrator.webserverUrl}/api/v1/user`);

    expect(response.status).toBe(401);
  });

  test("with an expired session, returns 401", async () => {
    const createdUser = await user.create({
      email: "expirado@wefood.com.br",
      password: "senha-segura",
    });
    const createdSession = await session.create(createdUser.id);
    await session.expireById(createdSession.id);

    const response = await fetch(`${orchestrator.webserverUrl}/api/v1/user`, {
      headers: { Cookie: `session_id=${createdSession.token}` },
    });

    expect(response.status).toBe(401);
  });
});
