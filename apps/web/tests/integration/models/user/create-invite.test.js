const orchestrator = require("../../../orchestrator");
const user = require("@/models/user");

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe("user.createInvite()", () => {
  test("creates a pending user without a password and returns a raw invite token", async () => {
    const { user: createdUser, inviteToken } = await user.createInvite({
      name: "Colaboradora Convidada",
      email: "convidada@wefood.com.br",
      roleKey: "colaborador",
      invitedBy: null,
    });

    expect(createdUser.id).toBeDefined();
    expect(createdUser.status).toBe("pending");
    expect(createdUser.password).toBeFalsy();
    expect(inviteToken).toMatch(/^[0-9a-f]{64}$/);
  });

  test("rejects a duplicate email", async () => {
    await user.createInvite({
      name: "Primeira Convidada",
      email: "duplicada-convite@wefood.com.br",
      roleKey: "colaborador",
      invitedBy: null,
    });

    await expect(
      user.createInvite({
        name: "Segunda Convidada",
        email: "duplicada-convite@wefood.com.br",
        roleKey: "colaborador",
        invitedBy: null,
      }),
    ).rejects.toThrow("O email informado já está sendo usado.");
  });

  test("rejects an unknown role key", async () => {
    await expect(
      user.createInvite({
        name: "Convidada Sem Role",
        email: "sem-role@wefood.com.br",
        roleKey: "gerente",
        invitedBy: null,
      }),
    ).rejects.toThrow("A role informada não foi encontrada.");
  });
});
