exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.up = (pgm) => {
  // No updated_at: a review is never edited. No client_id: the review link is
  // public and anonymous by product decision.
  pgm.createTable("reviews", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    rating: {
      type: "integer",
      notNull: true,
      check: "rating BETWEEN 1 AND 5",
    },
    // POST /api/v1/reviews is the first unauthenticated write endpoint in the
    // system — without this bound, anyone on the internet could store
    // unlimited text.
    comment: {
      type: "text",
      check: "char_length(comment) <= 1000",
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.down = (pgm) => {
  pgm.dropTable("reviews");
};
