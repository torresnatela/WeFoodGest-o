const orchestrator = require("../../../orchestrator");
const review = require("@/models/review");

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe("review.getSummary()", () => {
  test("returns zero total and null average when there are no reviews", async () => {
    const summary = await review.getSummary();

    expect(summary).toEqual({ total: 0, average: null });
  });

  test("returns the total and the average rating", async () => {
    await review.create({ rating: 5 });
    await review.create({ rating: 4 });
    await review.create({ rating: 3 });

    const summary = await review.getSummary();

    expect(summary.total).toBe(3);
    expect(summary.average).toBe(4);
  });
});
