const orchestrator = require("../../../orchestrator");
const user = require("@/models/user");
const database = require("@wefood/database");

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe("user.findByValidInviteToken()", () => {
  test("returns the invited user for a valid, unexpired token", async () => {
    const { user: createdUser, inviteToken } = await user.createInvite({
      name: "Convidada Válida",
      email: "valida-convite@wefood.com.br",
      roleKey: "colaborador",
      invitedBy: null,
    });

    const foundUser = await user.findByValidInviteToken(inviteToken);

    expect(foundUser.id).toBe(createdUser.id);
    expect(foundUser.email).toBe("valida-convite@wefood.com.br");
  });

  test("returns null for a token that does not exist", async () => {
    const foundUser = await user.findByValidInviteToken("token-inexistente");

    expect(foundUser).toBeNull();
  });

  test("returns null for an expired token", async () => {
    const { user: createdUser, inviteToken } = await user.createInvite({
      name: "Convidada Expirada",
      email: "expirada-convite@wefood.com.br",
      roleKey: "colaborador",
      invitedBy: null,
    });

    await database.query({
      text: "UPDATE users SET invite_token_expires_at = $1 WHERE id = $2;",
      values: [new Date(Date.now() - 1000), createdUser.id],
    });

    const foundUser = await user.findByValidInviteToken(inviteToken);

    expect(foundUser).toBeNull();
  });
});
