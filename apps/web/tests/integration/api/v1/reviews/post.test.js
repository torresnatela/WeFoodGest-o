const orchestrator = require("../../../../orchestrator");

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

async function postReview(body) {
  return fetch(`${orchestrator.webserverUrl}/api/v1/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/v1/reviews", () => {
  test("without a session, creates a review", async () => {
    const response = await postReview({ rating: 5, comment: "Atendimento ótimo" });

    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body.id).toBeDefined();
    expect(body.rating).toBe(5);
    expect(body.comment).toBe("Atendimento ótimo");
  });

  test("with only a rating, creates a review", async () => {
    const response = await postReview({ rating: 4 });

    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body.comment).toBeNull();
  });

  test("without a rating, returns 400", async () => {
    const response = await postReview({ comment: "Esqueci a nota" });

    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.message).toBeDefined();
    expect(body.action).toBeDefined();
  });

  test("with a rating above 5, returns 400", async () => {
    const response = await postReview({ rating: 6 });

    expect(response.status).toBe(400);
  });

  test("with a comment longer than 1000 characters, returns 400", async () => {
    const response = await postReview({ rating: 5, comment: "a".repeat(1001) });

    expect(response.status).toBe(400);
  });

  test("with an invalid body, returns 400", async () => {
    const response = await fetch(`${orchestrator.webserverUrl}/api/v1/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json",
    });

    expect(response.status).toBe(400);
  });
});
