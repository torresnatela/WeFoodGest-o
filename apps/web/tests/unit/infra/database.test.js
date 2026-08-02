const database = require("@wefood/database");

describe("infra/database", () => {
  test("query() runs a simple query against the local Postgres", async () => {
    const result = await database.query("SELECT 1 + 1 AS sum;");

    expect(result.rows[0].sum).toBe(2);
  });
});
