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

async function postVisit(body, { token } = {}) {
  return await fetch(`${orchestrator.webserverUrl}/api/v1/visits`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Cookie: `session_id=${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/v1/visits", () => {
  test("registra quem passou e não entrou, sem cliente nenhum", async () => {
    const adminSession = await createAdminSession();

    const response = await postVisit(
      {
        entered_store: false,
        saw_products: false,
        purchased: false,
      },
      { token: adminSession.token },
    );

    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body.client_id).toBeNull();
    expect(body.entered_store).toBe(false);
    expect(body.reason).toBeNull();
    expect(body.discovery_source).toBeNull();
    expect(body.order_categories).toEqual([]);
  });

  test("registra uma visita com cliente e compra", async () => {
    const admin = await authentication.getAuthenticatedUser("admin@admin.com.br", "WeFood123456");
    const adminSession = await session.create(admin.id);
    const createdClient = await client.create({
      name: "Cliente Visitas API",
      phone: "11933330001",
    });

    const response = await postVisit(
      {
        client_id: createdClient.id,
        entered_store: true,
        saw_products: true,
        purchased: true,
        amount_spent: 21.5,
        order_categories: ["sorvete"],
        reason: "comemoracao",
        discovery_source: "indicacao",
      },
      { token: adminSession.token },
    );

    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body.client_id).toBe(createdClient.id);
    expect(body.registered_by).toBe(admin.id);
    expect(body.order_categories).toEqual(["sorvete"]);
  });

  test("aceita uma visita sem motivo e sem origem", async () => {
    const adminSession = await createAdminSession();

    const response = await postVisit(
      {
        entered_store: true,
        saw_products: true,
        purchased: false,
      },
      { token: adminSession.token },
    );

    expect(response.status).toBe(201);
  });

  test("sem as três respostas do funil, devolve 400", async () => {
    const adminSession = await createAdminSession();

    const response = await postVisit(
      {
        entered_store: true,
        reason: "outro",
      },
      { token: adminSession.token },
    );

    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.message).toBe("Responda se o cliente entrou, viu os produtos e comprou.");
  });

  test("com valor gasto numa visita sem compra, devolve 400", async () => {
    const adminSession = await createAdminSession();

    const response = await postVisit(
      {
        entered_store: true,
        saw_products: true,
        purchased: false,
        amount_spent: 30,
      },
      { token: adminSession.token },
    );

    expect(response.status).toBe(400);
  });

  test("com um client_id inexistente, devolve 404", async () => {
    const adminSession = await createAdminSession();

    const response = await postVisit(
      {
        client_id: "00000000-0000-0000-0000-000000000000",
        entered_store: true,
        saw_products: true,
        purchased: true,
      },
      { token: adminSession.token },
    );

    expect(response.status).toBe(404);
  });

  test("com um client_id que não é uuid, devolve 404", async () => {
    const adminSession = await createAdminSession();

    const response = await postVisit(
      {
        client_id: "nao-e-um-uuid",
        entered_store: true,
        saw_products: true,
        purchased: true,
      },
      { token: adminSession.token },
    );

    expect(response.status).toBe(404);
  });

  test("sem sessão, devolve 401", async () => {
    const response = await postVisit({
      entered_store: true,
      saw_products: true,
      purchased: true,
    });

    expect(response.status).toBe(401);
  });
});
