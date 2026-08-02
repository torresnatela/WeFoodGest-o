const orchestrator = require("../../../orchestrator");
const user = require("@/models/user");

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe("user.findByEmail()", () => {
  test("returns the user when the email exists", async () => {
    await user.create({
      name: "Usuária de teste",
      email: "encontrada@wefood.com.br",
      password: "senha-segura",
    });

    const foundUser = await user.findByEmail("encontrada@wefood.com.br");

    expect(foundUser.email).toBe("encontrada@wefood.com.br");
  });

  test("returns null when the email does not exist", async () => {
    const foundUser = await user.findByEmail("nao-existe@wefood.com.br");

    expect(foundUser).toBeNull();
  });
});
