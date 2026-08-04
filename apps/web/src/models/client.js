const database = require("@wefood/database");
const { ValidationError } = require("@/infra/errors");

const UNIQUE_VIOLATION = "23505";

async function create({ name, phone, birthDate, neighborhood, city }) {
  try {
    const result = await database.query({
      text: `
        INSERT INTO clients (name, phone, birth_date, neighborhood, city)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, name, phone, birth_date, neighborhood, city, created_at, updated_at;
      `,
      values: [name, phone, birthDate ?? null, neighborhood ?? null, city ?? null],
    });

    return result.rows[0];
  } catch (error) {
    if (error.code === UNIQUE_VIOLATION) {
      throw new ValidationError({
        message: "O telefone informado já está cadastrado.",
        action: "Busque o cliente pelo telefone em vez de cadastrar novamente.",
      });
    }

    throw error;
  }
}

async function findByPhone(phone) {
  const result = await database.query({
    text: `
      SELECT id, name, phone, birth_date, neighborhood, city, created_at, updated_at
      FROM clients
      WHERE phone = $1;
    `,
    values: [phone],
  });

  return result.rows[0] ?? null;
}

async function findById(id) {
  const result = await database.query({
    text: `
      SELECT id, name, phone, birth_date, neighborhood, city, created_at, updated_at
      FROM clients
      WHERE id = $1;
    `,
    values: [id],
  });

  return result.rows[0] ?? null;
}

async function search({ name }) {
  const result = await database.query({
    text: `
      SELECT id, name, phone, birth_date, neighborhood, city, created_at, updated_at
      FROM clients
      WHERE name ILIKE $1
      ORDER BY name;
    `,
    values: [`%${name ?? ""}%`],
  });

  return result.rows;
}

module.exports = {
  create,
  findByPhone,
  findById,
  search,
};
