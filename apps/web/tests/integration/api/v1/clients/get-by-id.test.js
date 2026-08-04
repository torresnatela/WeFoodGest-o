const orchestrator = require("../../../../orchestrator");
const authentication = require("@/models/authentication");
const session = require("@/models/session");
const client = require("@/models/client");
const visit = require("@/models/visit");

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

async function createAdminSession() {
  const admin = await authentication.getAuthenticatedUser("admin@admin.com.br", "WeFood123456");
  return session.create(admin.id);
}

describe("GET /api/v1/clients/[id]", () => {
  test("returns the client and its visit history", async () => {
    const adminSession = await createAdminSession();
    const createdClient = await client.create({ name: "Cliente Detalhe", phone: "11966660001" });
    await visit.create({
      clientId: createdClient.id,
      registeredBy: null,
      amountSpent: 15,
      orderCategories: ["sorvete"],
      reason: "outro",
      discoverySource: "outro",
    });

    const response = await fetch(`${orchestrator.webserverUrl}/api/v1/clients/${createdClient.id}`, {
      headers: { Cookie: `session_id=${adminSession.token}` },
    });

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.client.id).toBe(createdClient.id);
    expect(body.visits).toHaveLength(1);
  });

  test("with an unknown id, returns 404", async () => {
    const adminSession = await createAdminSession();

    const response = await fetch(
      `${orchestrator.webserverUrl}/api/v1/clients/00000000-0000-0000-0000-000000000000`,
      { headers: { Cookie: `session_id=${adminSession.token}` } },
    );

    expect(response.status).toBe(404);
  });

  test("with a non-uuid id, returns 404", async () => {
    const adminSession = await createAdminSession();

    const response = await fetch(`${orchestrator.webserverUrl}/api/v1/clients/nao-e-um-uuid`, {
      headers: { Cookie: `session_id=${adminSession.token}` },
    });

    expect(response.status).toBe(404);
  });

  test("without a session, returns 401", async () => {
    const createdClient = await client.create({ name: "Cliente Sem Sessão", phone: "11966660002" });

    const response = await fetch(`${orchestrator.webserverUrl}/api/v1/clients/${createdClient.id}`);

    expect(response.status).toBe(401);
  });
});
