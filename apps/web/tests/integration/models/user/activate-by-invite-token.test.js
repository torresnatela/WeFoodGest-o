const orchestrator = require("../../../orchestrator");
const user = require("@/models/user");

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe("user.activateByInviteToken()", () => {
  test("sets the password, activates the user, and clears the invite token", async () => {
    const { user: createdUser, inviteToken } = await user.createInvite({
      name: "Colaboradora Ativando",
      email: "ativando@wefood.com.br",
      roleKey: "colaborador",
      invitedBy: null,
    });

    const activatedUser = await user.activateByInviteToken(inviteToken, "senha-nova-123");

    expect(activatedUser.id).toBe(createdUser.id);
    expect(activatedUser.status).toBe("active");

    const foundUser = await user.findByEmail("ativando@wefood.com.br");
    expect(foundUser.password).not.toBe("senha-nova-123");
    expect(foundUser.password).toBeTruthy();

    const staleLookup = await user.findByValidInviteToken(inviteToken);
    expect(staleLookup).toBeNull();
  });

  test("rejects reusing an already-consumed token", async () => {
    const { inviteToken } = await user.createInvite({
      name: "Colaboradora Reuso",
      email: "reuso@wefood.com.br",
      roleKey: "colaborador",
      invitedBy: null,
    });

    await user.activateByInviteToken(inviteToken, "primeira-senha");

    await expect(user.activateByInviteToken(inviteToken, "segunda-senha")).rejects.toThrow(
      "Convite inválido, expirado ou já utilizado.",
    );
  });

  test("rejects an unknown token", async () => {
    await expect(user.activateByInviteToken("token-inexistente", "qualquer-senha")).rejects.toThrow(
      "Convite inválido, expirado ou já utilizado.",
    );
  });
});
