const database = require("@wefood/database");
const { ValidationError } = require("@/infra/errors");

const CHECK_VIOLATION = "23514";
const MAX_COMMENT_LENGTH = 1000;

async function create({ rating, comment }) {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new ValidationError({
      message: "A nota precisa ser um número de 1 a 5.",
      action: "Escolha de 1 a 5 estrelas.",
    });
  }

  const trimmedComment = comment?.trim() || null;

  if (trimmedComment && trimmedComment.length > MAX_COMMENT_LENGTH) {
    throw new ValidationError({
      message: `O comentário pode ter no máximo ${MAX_COMMENT_LENGTH} caracteres.`,
      action: "Escreva um comentário mais curto.",
    });
  }

  try {
    const result = await database.query({
      text: `
        INSERT INTO reviews (rating, comment)
        VALUES ($1, $2)
        RETURNING id, rating, comment, created_at;
      `,
      values: [rating, trimmedComment],
    });

    return result.rows[0];
  } catch (error) {
    if (error.code === CHECK_VIOLATION) {
      throw new ValidationError({
        message: "Algum valor enviado não é uma opção válida.",
        action: "Verifique a nota e o comentário informados.",
      });
    }

    throw error;
  }
}

async function findAll() {
  const result = await database.query(`
    SELECT id, rating, comment, created_at
    FROM reviews
    ORDER BY created_at DESC;
  `);

  return result.rows;
}

async function getSummary() {
  const result = await database.query(`
    SELECT COUNT(*)::int AS total, AVG(rating)::float AS average
    FROM reviews;
  `);

  return result.rows[0];
}

module.exports = {
  create,
  findAll,
  getSummary,
};
