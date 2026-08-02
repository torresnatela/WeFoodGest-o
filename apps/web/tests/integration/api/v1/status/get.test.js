const orchestrator = require("../../../../orchestrator");

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("GET /api/v1/status", () => {
  test("returns 200 and reports the database as healthy", async () => {
    const response = await fetch(`${orchestrator.webserverUrl}/api/v1/status`);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.dependencies.database.status).toBe("healthy");
    expect(Date.parse(body.updated_at)).not.toBeNaN();
  });
});
