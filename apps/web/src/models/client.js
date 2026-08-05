const database = require("@wefood/database");
const { ValidationError } = require("@/infra/errors");

const UNIQUE_VIOLATION = "23505";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
  if (!UUID_PATTERN.test(id ?? "")) {
    return null;
  }

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
      SELECT
        c.id, c.name, c.phone, c.birth_date, c.neighborhood, c.city,
        c.created_at, c.updated_at,
        COUNT(v.id)::int AS visit_count,
        MAX(v.created_at) AS last_visit_at
      FROM clients c
      LEFT JOIN visits v ON v.client_id = c.id
      WHERE c.name ILIKE $1
      GROUP BY c.id
      ORDER BY c.name;
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
