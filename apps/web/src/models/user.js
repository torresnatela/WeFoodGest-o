const database = require("@wefood/database");
const { ValidationError } = require("@/infra/errors");
const password = require("./password");

const UNIQUE_VIOLATION = "23505";

async function create({ email, password: plainTextPassword }) {
  const hashedPassword = await password.hash(plainTextPassword);

  try {
    const result = await database.query({
      text: `
        INSERT INTO users (email, password)
        VALUES ($1, $2)
        RETURNING id, email, password, created_at, updated_at;
      `,
      values: [email, hashedPassword],
    });

    return result.rows[0];
  } catch (error) {
    if (error.code === UNIQUE_VIOLATION) {
      throw new ValidationError({
        message: "O email informado já está sendo usado.",
        action: "Utilize outro email para realizar o cadastro.",
      });
    }

    throw error;
  }
}

async function findByEmail(email) {
  const result = await database.query({
    text: `
      SELECT id, email, password, created_at, updated_at
      FROM users
      WHERE email = $1;
    `,
    values: [email],
  });

  return result.rows[0] ?? null;
}

async function findById(id) {
  const result = await database.query({
    text: `
      SELECT id, email, password, created_at, updated_at
      FROM users
      WHERE id = $1;
    `,
    values: [id],
  });

  return result.rows[0] ?? null;
}

module.exports = {
  create,
  findByEmail,
  findById,
};
