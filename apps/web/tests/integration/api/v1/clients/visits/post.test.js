const orchestrator = require("../../../../../orchestrator");
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

describe("POST /api/v1/clients/[id]/visits", () => {
  test("with a valid session, registers a visit", async () => {
    const admin = await authentication.getAuthenticatedUser("admin@admin.com.br", "WeFood123456");
    const adminSession = await session.create(admin.id);
    const createdClient = await client.create({ name: "Cliente Visita API", phone: "11955550001" });

    const response = await fetch(
      `${orchestrator.webserverUrl}/api/v1/clients/${createdClient.id}/visits`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: `session_id=${adminSession.token}` },
        body: JSON.stringify({
          amount_spent: 18.9,
          order_categories: ["milkshake"],
          order_details: "Milkshake de ninho",
          reason: "vontade_comer_beber",
          discovery_source: "google_internet",
        }),
      },
    );

    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body.client_id).toBe(createdClient.id);
    expect(body.order_categories).toEqual(["milkshake"]);
    expect(body.registered_by).toBe(admin.id);
  });

  test("with a non-uuid client id, returns 404", async () => {
    const adminSession = await createAdminSession();

    const response = await fetch(
      `${orchestrator.webserverUrl}/api/v1/clients/nao-e-um-uuid/visits`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: `session_id=${adminSession.token}` },
        body: JSON.stringify({
          amount_spent: 10,
          order_categories: ["sorvete"],
          reason: "outro",
          discovery_source: "outro",
        }),
      },
    );

    expect(response.status).toBe(404);
  });

  test("without an order category, returns 400", async () => {
    const adminSession = await createAdminSession();
    const createdClient = await client.create({ name: "Cliente Sem Categoria", phone: "11955550002" });

    const response = await fetch(
      `${orchestrator.webserverUrl}/api/v1/clients/${createdClient.id}/visits`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: `session_id=${adminSession.token}` },
        body: JSON.stringify({
          amount_spent: 10,
          order_categories: [],
          reason: "outro",
          discovery_source: "outro",
        }),
      },
    );

    expect(response.status).toBe(400);
  });

  test("with an unknown client id, returns 404", async () => {
    const adminSession = await createAdminSession();

    const response = await fetch(
      `${orchestrator.webserverUrl}/api/v1/clients/00000000-0000-0000-0000-000000000000/visits`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: `session_id=${adminSession.token}` },
        body: JSON.stringify({
          amount_spent: 10,
          order_categories: ["sorvete"],
          reason: "outro",
          discovery_source: "outro",
        }),
      },
    );

    expect(response.status).toBe(404);
  });

  test("without a session, returns 401", async () => {
    const createdClient = await client.create({ name: "Cliente Sem Sessão Visita", phone: "11955550003" });

    const response = await fetch(
      `${orchestrator.webserverUrl}/api/v1/clients/${createdClient.id}/visits`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount_spent: 10,
          order_categories: ["sorvete"],
          reason: "outro",
          discovery_source: "outro",
        }),
      },
    );

    expect(response.status).toBe(401);
  });
});
