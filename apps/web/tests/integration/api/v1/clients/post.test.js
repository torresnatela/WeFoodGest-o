const orchestrator = require("../../../../orchestrator");
const authentication = require("@/models/authentication");
const session = require("@/models/session");

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

async function createAdminSession() {
  const admin = await authentication.getAuthenticatedUser("admin@admin.com.br", "WeFood123456");
  return session.create(admin.id);
}

describe("POST /api/v1/clients", () => {
  test("with a valid session, creates a client", async () => {
    const adminSession = await createAdminSession();

    const response = await fetch(`${orchestrator.webserverUrl}/api/v1/clients`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: `session_id=${adminSession.token}` },
      body: JSON.stringify({
        name: "Cliente via API",
        phone: "11988880001",
        neighborhood: "Centro",
      }),
    });

    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body.id).toBeDefined();
    expect(body.name).toBe("Cliente via API");
    expect(body.neighborhood).toBe("Centro");
  });

  test("without a session, returns 401", async () => {
    const response = await fetch(`${orchestrator.webserverUrl}/api/v1/clients`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Cliente Anônimo", phone: "11988880002" }),
    });

    expect(response.status).toBe(401);
  });

  test("without a phone, returns 400", async () => {
    const adminSession = await createAdminSession();

    const response = await fetch(`${orchestrator.webserverUrl}/api/v1/clients`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: `session_id=${adminSession.token}` },
      body: JSON.stringify({ name: "Cliente Sem Telefone" }),
    });

    expect(response.status).toBe(400);
  });

  test("with a duplicate phone, returns 400", async () => {
    const adminSession = await createAdminSession();

    await fetch(`${orchestrator.webserverUrl}/api/v1/clients`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: `session_id=${adminSession.token}` },
      body: JSON.stringify({ name: "Cliente Original", phone: "11988880003" }),
    });

    const response = await fetch(`${orchestrator.webserverUrl}/api/v1/clients`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: `session_id=${adminSession.token}` },
      body: JSON.stringify({ name: "Cliente Duplicado", phone: "11988880003" }),
    });

    expect(response.status).toBe(400);
  });
});
