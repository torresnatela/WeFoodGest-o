const orchestrator = require("../../../../orchestrator");
const authentication = require("@/models/authentication");
const session = require("@/models/session");
const user = require("@/models/user");

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/roles", () => {
  test("as admin, returns the seeded roles", async () => {
    const admin = await authentication.getAuthenticatedUser("admin@admin.com.br", "WeFood123456");
    const adminSession = await session.create(admin.id);

    const response = await fetch(`${orchestrator.webserverUrl}/api/v1/roles`, {
      headers: { Cookie: `session_id=${adminSession.token}` },
    });

    expect(response.status).toBe(200);

    const body = await response.json();
    const keys = body.roles.map((role) => role.key);
    expect(keys).toContain("admin");
    expect(keys).toContain("colaborador");
  });

  test("as a colaborador without the feature, returns 403", async () => {
    const colaborador = await user.create({
      name: "Colaboradora Sem Permissão",
      email: "sem-permissao-roles@wefood.com.br",
      password: "senha-segura",
    });
    const colaboradorSession = await session.create(colaborador.id);

    const response = await fetch(`${orchestrator.webserverUrl}/api/v1/roles`, {
      headers: { Cookie: `session_id=${colaboradorSession.token}` },
    });

    expect(response.status).toBe(403);
  });

  test("without a session, returns 401", async () => {
    const response = await fetch(`${orchestrator.webserverUrl}/api/v1/roles`);

    expect(response.status).toBe(401);
  });
});
