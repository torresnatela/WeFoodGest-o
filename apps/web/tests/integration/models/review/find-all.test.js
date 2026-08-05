const orchestrator = require("../../../orchestrator");
const review = require("@/models/review");

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe("review.findAll()", () => {
  test("returns an empty array when there are no reviews", async () => {
    const reviews = await review.findAll();

    expect(reviews).toEqual([]);
  });

  test("returns every review with the most recent first", async () => {
    const olderReview = await review.create({ rating: 2, comment: "Demorou pra sair" });
    await new Promise((resolve) => setTimeout(resolve, 10));
    const newerReview = await review.create({ rating: 5 });

    const reviews = await review.findAll();

    expect(reviews).toHaveLength(2);
    expect(reviews[0].id).toBe(newerReview.id);
    expect(reviews[1].id).toBe(olderReview.id);
    expect(reviews[1].comment).toBe("Demorou pra sair");
  });
});
