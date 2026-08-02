const orchestrator = require("../../../../orchestrator");
const user = require("@/models/user");

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/invites/[token]", () => {
  test("with a valid token, returns the invited user's name, email and role", async () => {
    const { inviteToken } = await user.createInvite({
      name: "Convidada Rota",
      email: "convidada-rota@wefood.com.br",
      roleKey: "colaborador",
      invitedBy: null,
    });

    const response = await fetch(`${orchestrator.webserverUrl}/api/v1/invites/${inviteToken}`);

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.name).toBe("Convidada Rota");
    expect(body.email).toBe("convidada-rota@wefood.com.br");
    expect(body.role.key).toBe("colaborador");
  });

  test("with a non-existent token, returns 404", async () => {
    const response = await fetch(`${orchestrator.webserverUrl}/api/v1/invites/token-inexistente`);

    expect(response.status).toBe(404);
  });
});
