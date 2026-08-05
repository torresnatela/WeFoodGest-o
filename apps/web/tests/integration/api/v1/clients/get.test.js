const orchestrator = require("../../../../orchestrator");
const authentication = require("@/models/authentication");
const session = require("@/models/session");
const client = require("@/models/client");

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

async function createAdminSession() {
  const admin = await authentication.getAuthenticatedUser("admin@admin.com.br", "WeFood123456");
  return session.create(admin.id);
}

describe("GET /api/v1/clients", () => {
  test("with a phone query, returns a single matching client", async () => {
    const adminSession = await createAdminSession();
    await client.create({ name: "Cliente Telefone", phone: "11977770001" });

    const response = await fetch(`${orchestrator.webserverUrl}/api/v1/clients?phone=11977770001`, {
      headers: { Cookie: `session_id=${adminSession.token}` },
    });

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.clients).toHaveLength(1);
    expect(body.clients[0].phone).toBe("11977770001");
  });

  test("with a phone query that matches nothing, returns an empty list", async () => {
    const adminSession = await createAdminSession();

    const response = await fetch(`${orchestrator.webserverUrl}/api/v1/clients?phone=11900000099`, {
      headers: { Cookie: `session_id=${adminSession.token}` },
    });

    const body = await response.json();
    expect(body.clients).toEqual([]);
  });

  test("with a search query, returns clients whose name matches", async () => {
    const adminSession = await createAdminSession();
    await client.create({ name: "Fernanda Pesquisa", phone: "11977770002" });

    const response = await fetch(`${orchestrator.webserverUrl}/api/v1/clients?search=fernanda`, {
      headers: { Cookie: `session_id=${adminSession.token}` },
    });

    const body = await response.json();
    const names = body.clients.map((foundClient) => foundClient.name);
    expect(names).toContain("Fernanda Pesquisa");
  });

  test("com busca por nome, cada cliente traz visit_count e last_visit_at", async () => {
    const adminSession = await createAdminSession();
    await client.create({ name: "Gustavo Contagem", phone: "11977770003" });

    const response = await fetch(`${orchestrator.webserverUrl}/api/v1/clients?search=Gustavo Contagem`, {
      headers: { Cookie: `session_id=${adminSession.token}` },
    });

    const body = await response.json();
    expect(body.clients[0].visit_count).toBe(0);
    expect(body.clients[0].last_visit_at).toBeNull();
  });

  test("without a session, returns 401", async () => {
    const response = await fetch(`${orchestrator.webserverUrl}/api/v1/clients`);

    expect(response.status).toBe(401);
  });
});
