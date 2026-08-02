const orchestrator = require("../../../orchestrator");
const user = require("@/models/user");

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe("user.create()", () => {
  test("creates a user with the password hashed", async () => {
    const createdUser = await user.create({
      email: "loja@wefood.com.br",
      password: "senha-segura",
    });

    expect(createdUser.id).toBeDefined();
    expect(createdUser.email).toBe("loja@wefood.com.br");
    expect(createdUser.password).not.toBe("senha-segura");
  });

  test("rejects a duplicate email", async () => {
    await user.create({
      email: "duplicado@wefood.com.br",
      password: "senha-segura",
    });

    await expect(
      user.create({
        email: "duplicado@wefood.com.br",
        password: "outra-senha",
      }),
    ).rejects.toThrow("O email informado já está sendo usado.");
  });
});
