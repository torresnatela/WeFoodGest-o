const orchestrator = require("../../../orchestrator");
const review = require("@/models/review");

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe("review.create()", () => {
  test("creates a review with a rating and a comment", async () => {
    const createdReview = await review.create({
      rating: 5,
      comment: "Atendimento ótimo e sorvete muito bom.",
    });

    expect(createdReview.id).toBeDefined();
    expect(createdReview.rating).toBe(5);
    expect(createdReview.comment).toBe("Atendimento ótimo e sorvete muito bom.");
    expect(createdReview.created_at).toBeDefined();
  });

  test("creates a review with only a rating", async () => {
    const createdReview = await review.create({ rating: 3 });

    expect(createdReview.rating).toBe(3);
    expect(createdReview.comment).toBeNull();
  });

  test("stores an empty comment as null", async () => {
    const createdReview = await review.create({ rating: 4, comment: "   " });

    expect(createdReview.comment).toBeNull();
  });

  test("rejects a rating below 1", async () => {
    await expect(review.create({ rating: 0 })).rejects.toThrow(
      "A nota precisa ser um número de 1 a 5.",
    );
  });

  test("rejects a rating above 5", async () => {
    await expect(review.create({ rating: 6 })).rejects.toThrow(
      "A nota precisa ser um número de 1 a 5.",
    );
  });

  test("rejects a non-integer rating", async () => {
    await expect(review.create({ rating: 4.5 })).rejects.toThrow(
      "A nota precisa ser um número de 1 a 5.",
    );
  });

  test("rejects a missing rating", async () => {
    await expect(review.create({ comment: "Sem nota" })).rejects.toThrow(
      "A nota precisa ser um número de 1 a 5.",
    );
  });

  test("rejects a comment longer than 1000 characters", async () => {
    await expect(review.create({ rating: 5, comment: "a".repeat(1001) })).rejects.toThrow(
      "O comentário pode ter no máximo 1000 caracteres.",
    );
  });

  test("accepts a comment with exactly 1000 characters", async () => {
    const createdReview = await review.create({ rating: 5, comment: "a".repeat(1000) });

    expect(createdReview.comment).toHaveLength(1000);
  });
});
