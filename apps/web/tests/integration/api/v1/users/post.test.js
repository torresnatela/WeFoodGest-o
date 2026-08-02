const orchestrator = require("../../../../orchestrator");
const authentication = require("@/models/authentication");
const session = require("@/models/session");
const user = require("@/models/user");

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

async function createAdminSession() {
  const admin = await authentication.getAuthenticatedUser("admin@admin.com.br", "WeFood123456");
  return session.create(admin.id);
}

describe("POST /api/v1/users", () => {
  test("as admin, creates a pending colaborador and returns an invite link", async () => {
    const adminSession = await createAdminSession();

    const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: `session_id=${adminSession.token}` },
      body: JSON.stringify({
        name: "Colaboradora Nova",
        email: "colaboradora-nova@wefood.com.br",
        role: "colaborador",
      }),
    });

    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body.user.email).toBe("colaboradora-nova@wefood.com.br");
    expect(body.user.status).toBe("pending");
    expect(body.invite.url).toContain("/cadastro/");
    expect(body.invite.expires_at).toBeDefined();
  });

  test("as an authenticated colaborador, is forbidden from creating another user", async () => {
    const colaborador = await user.create({
      name: "Colaboradora Sem Permissão",
      email: "sem-permissao-post-users@wefood.com.br",
      password: "senha-segura",
    });
    const colaboradorSession = await session.create(colaborador.id);

    const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: `session_id=${colaboradorSession.token}` },
      body: JSON.stringify({
        name: "Outra Colaboradora",
        email: "outra-colaboradora@wefood.com.br",
        role: "colaborador",
      }),
    });

    expect(response.status).toBe(403);
  });

  test("without a session, returns 401", async () => {
    const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Colaboradora Anônima",
        email: "anonima@wefood.com.br",
        role: "colaborador",
      }),
    });

    expect(response.status).toBe(401);
  });

  test("with a duplicate email, returns 400", async () => {
    const adminSession = await createAdminSession();

    const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: `session_id=${adminSession.token}` },
      body: JSON.stringify({
        name: "Admin Duplicado",
        email: "admin@admin.com.br",
        role: "colaborador",
      }),
    });

    expect(response.status).toBe(400);
  });

  test("with an unknown role, returns 404", async () => {
    const adminSession = await createAdminSession();

    const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: `session_id=${adminSession.token}` },
      body: JSON.stringify({
        name: "Colaboradora Gerente",
        email: "gerente@wefood.com.br",
        role: "gerente",
      }),
    });

    expect(response.status).toBe(404);
  });
});
