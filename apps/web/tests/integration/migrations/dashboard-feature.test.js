const database = require("@wefood/database");
const orchestrator = require("../../orchestrator");
const authorization = require("@/models/authorization");
const user = require("@/models/user");

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe("dashboard.visualizar feature", () => {
  test("is seeded into the features table", async () => {
    const result = await database.query({
      text: "SELECT key, name FROM features WHERE key = $1;",
      values: ["dashboard.visualizar"],
    });

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].name).toBe("Visualizar dashboard");
  });

  test("is granted to the seeded admin through its super role", async () => {
    // user.findByEmail() only returns id/email/password/timestamps, which
    // lacks the role/features shape authorization.userCan() needs. Chain it
    // with user.findById(), which does return that shape, instead of
    // inventing a new model function or reaching into the users table here.
    const foundUser = await user.findByEmail("admin@admin.com.br");
    const adminUser = await user.findById(foundUser.id);

    expect(authorization.userCan(adminUser, "dashboard.visualizar")).toBe(true);
  });

  test("is not granted to the colaborador role by default", async () => {
    const result = await database.query({
      text: `
        SELECT 1
        FROM role_features rf
        JOIN roles r ON r.id = rf.role_id
        JOIN features f ON f.id = rf.feature_id
        WHERE r.key = 'colaborador' AND f.key = 'dashboard.visualizar';
      `,
    });

    expect(result.rows).toHaveLength(0);
  });
});
