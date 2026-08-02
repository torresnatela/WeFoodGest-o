const orchestrator = require("../../../orchestrator");
const user = require("@/models/user");

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe("user.findAll()", () => {
  test("includes the seeded admin and a newly invited user, with their roles", async () => {
    await user.createInvite({
      name: "Colaboradora Listada",
      email: "listada@wefood.com.br",
      roleKey: "colaborador",
      invitedBy: null,
    });

    const users = await user.findAll();

    const admin = users.find((currentUser) => currentUser.email === "admin@admin.com.br");
    expect(admin.role.key).toBe("admin");
    expect(admin.status).toBe("active");

    const invited = users.find((currentUser) => currentUser.email === "listada@wefood.com.br");
    expect(invited.role.key).toBe("colaborador");
    expect(invited.status).toBe("pending");
  });
});
