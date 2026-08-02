const orchestrator = require("../../../../orchestrator");
const session = require("@/models/session");
const user = require("@/models/user");

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe("DELETE /api/v1/sessions", () => {
  test("invalidates the current session and clears the cookie", async () => {
    const createdUser = await user.create({
      email: "logout@wefood.com.br",
      password: "senha-segura",
    });
    const createdSession = await session.create(createdUser.id);

    const response = await fetch(`${orchestrator.webserverUrl}/api/v1/sessions`, {
      method: "DELETE",
      headers: { Cookie: `session_id=${createdSession.token}` },
    });

    expect(response.status).toBe(200);

    const setCookie = response.headers.get("set-cookie");
    expect(setCookie).toContain("session_id=;");

    const sessionAfterLogout = await session.findOneValidByToken(createdSession.token);
    expect(sessionAfterLogout).toBeNull();
  });

  test("without a session cookie, returns 401", async () => {
    const response = await fetch(`${orchestrator.webserverUrl}/api/v1/sessions`, {
      method: "DELETE",
    });

    expect(response.status).toBe(401);
  });
});
