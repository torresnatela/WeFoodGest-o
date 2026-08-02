const orchestrator = require("../../../../orchestrator");
const user = require("@/models/user");

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/sessions", () => {
  test("with correct credentials, creates a session and sets a cookie", async () => {
    await user.create({
      name: "Usuária de teste",
      email: "login@wefood.com.br",
      password: "senha-correta",
    });

    const response = await fetch(`${orchestrator.webserverUrl}/api/v1/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "login@wefood.com.br",
        password: "senha-correta",
      }),
    });

    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body.id).toBeDefined();
    expect(body.token).toBeUndefined();

    const setCookie = response.headers.get("set-cookie");
    expect(setCookie).toContain("session_id=");
    expect(setCookie).toContain("HttpOnly");
  });

  test("with a wrong password, returns 401 and does not set a cookie", async () => {
    await user.create({
      name: "Usuária de teste",
      email: "senha-errada@wefood.com.br",
      password: "senha-correta",
    });

    const response = await fetch(`${orchestrator.webserverUrl}/api/v1/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "senha-errada@wefood.com.br",
        password: "senha-incorreta",
      }),
    });

    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toBeNull();

    const body = await response.json();
    expect(body.message).toBe("Dados de autenticação não conferem.");
  });

  test("with a non-existent email, returns 401 with the same generic message", async () => {
    const response = await fetch(`${orchestrator.webserverUrl}/api/v1/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "nao-cadastrado@wefood.com.br",
        password: "qualquer-senha",
      }),
    });

    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.message).toBe("Dados de autenticação não conferem.");
  });
});
