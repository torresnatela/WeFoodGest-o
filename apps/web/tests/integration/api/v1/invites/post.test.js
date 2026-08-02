const orchestrator = require("../../../../orchestrator");
const user = require("@/models/user");

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

async function createInvitedUser(email) {
  const { inviteToken } = await user.createInvite({
    name: "Colaboradora Convite",
    email,
    roleKey: "colaborador",
    invitedBy: null,
  });
  return inviteToken;
}

describe("POST /api/v1/invites/[token]", () => {
  test("accepts the invite, sets the password, and logs the user in automatically", async () => {
    const inviteToken = await createInvitedUser("aceita-convite@wefood.com.br");

    const response = await fetch(`${orchestrator.webserverUrl}/api/v1/invites/${inviteToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        password: "senha-do-convite-123",
        password_confirmation: "senha-do-convite-123",
      }),
    });

    expect(response.status).toBe(200);

    const setCookie = response.headers.get("set-cookie");
    expect(setCookie).toContain("session_id=");

    const sessionCookie = setCookie.match(/session_id=([^;]+)/)[1];

    const meResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/user`, {
      headers: { Cookie: `session_id=${sessionCookie}` },
    });

    expect(meResponse.status).toBe(200);
    const me = await meResponse.json();
    expect(me.email).toBe("aceita-convite@wefood.com.br");
  });

  test("rejects reusing an already-consumed token", async () => {
    const inviteToken = await createInvitedUser("reuso-rota@wefood.com.br");

    await fetch(`${orchestrator.webserverUrl}/api/v1/invites/${inviteToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        password: "primeira-senha-123",
        password_confirmation: "primeira-senha-123",
      }),
    });

    const response = await fetch(`${orchestrator.webserverUrl}/api/v1/invites/${inviteToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        password: "segunda-senha-123",
        password_confirmation: "segunda-senha-123",
      }),
    });

    expect(response.status).toBe(404);
  });

  test("rejects a password shorter than 8 characters", async () => {
    const inviteToken = await createInvitedUser("senha-curta@wefood.com.br");

    const response = await fetch(`${orchestrator.webserverUrl}/api/v1/invites/${inviteToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "curta", password_confirmation: "curta" }),
    });

    expect(response.status).toBe(400);
  });

  test("rejects a password confirmation that does not match", async () => {
    const inviteToken = await createInvitedUser("confirmacao-diferente@wefood.com.br");

    const response = await fetch(`${orchestrator.webserverUrl}/api/v1/invites/${inviteToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "senha-valida-123", password_confirmation: "outra-senha-123" }),
    });

    expect(response.status).toBe(400);
  });
});
