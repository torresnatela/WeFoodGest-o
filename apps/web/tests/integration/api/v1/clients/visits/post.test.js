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
          entered_store: true,
          saw_products: true,
          purchased: true,
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
    expect(body.purchased).toBe(true);
  });

  test("with a non-uuid client id, returns 404", async () => {
    const adminSession = await createAdminSession();

    const response = await fetch(
      `${orchestrator.webserverUrl}/api/v1/clients/nao-e-um-uuid/visits`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: `session_id=${adminSession.token}` },
        body: JSON.stringify({
          entered_store: true,
          saw_products: true,
          purchased: true,
          amount_spent: 10,
          order_categories: ["sorvete"],
          reason: "outro",
          discovery_source: "outro",
        }),
      },
    );

    expect(response.status).toBe(404);
  });

  test("sem as três respostas do funil, devolve 400", async () => {
    const adminSession = await createAdminSession();
    const createdClient = await client.create({
      name: "Cliente Sem Funil",
      phone: "11955550002",
    });

    const response = await fetch(
      `${orchestrator.webserverUrl}/api/v1/clients/${createdClient.id}/visits`,
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

    expect(response.status).toBe(400);
  });

  test("aceita uma visita sem pedido, sem motivo e sem origem", async () => {
    const adminSession = await createAdminSession();
    const createdClient = await client.create({
      name: "Cliente Só Olhou",
      phone: "11955550004",
    });

    const response = await fetch(
      `${orchestrator.webserverUrl}/api/v1/clients/${createdClient.id}/visits`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: `session_id=${adminSession.token}` },
        body: JSON.stringify({
          entered_store: true,
          saw_products: true,
          purchased: false,
        }),
      },
    );

    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body.client_id).toBe(createdClient.id);
    expect(body.order_categories).toEqual([]);
  });

  // O cliente do caminho é a verdade: a ficha do cliente linka para cá e não
  // deve ser sobreponível por um corpo que mande outro client_id.
  test("ignora o client_id do corpo e usa o do caminho", async () => {
    const adminSession = await createAdminSession();
    const pathClient = await client.create({ name: "Cliente Do Caminho", phone: "11955550005" });
    const bodyClient = await client.create({ name: "Cliente Do Corpo", phone: "11955550006" });

    const response = await fetch(
      `${orchestrator.webserverUrl}/api/v1/clients/${pathClient.id}/visits`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: `session_id=${adminSession.token}` },
        body: JSON.stringify({
          client_id: bodyClient.id,
          entered_store: true,
          saw_products: true,
          purchased: false,
        }),
      },
    );

    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body.client_id).toBe(pathClient.id);
  });

  test("with an unknown client id, returns 404", async () => {
    const adminSession = await createAdminSession();

    const response = await fetch(
      `${orchestrator.webserverUrl}/api/v1/clients/00000000-0000-0000-0000-000000000000/visits`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: `session_id=${adminSession.token}` },
        body: JSON.stringify({
          entered_store: true,
          saw_products: true,
          purchased: true,
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
    const createdClient = await client.create({
      name: "Cliente Sem Sessão Visita",
      phone: "11955550003",
    });

    const response = await fetch(
      `${orchestrator.webserverUrl}/api/v1/clients/${createdClient.id}/visits`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entered_store: true,
          saw_products: true,
          purchased: true,
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
