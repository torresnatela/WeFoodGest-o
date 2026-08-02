const crypto = require("node:crypto");

const database = require("@wefood/database");

const EXPIRATION_IN_MILLISECONDS = 30 * 24 * 60 * 60 * 1000; // 30 days

async function create(userId) {
  const token = crypto.randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);

  const result = await database.query({
    text: `
      INSERT INTO sessions (token, user_id, expires_at)
      VALUES ($1, $2, $3)
      RETURNING id, token, user_id, expires_at, created_at, updated_at;
    `,
    values: [token, userId, expiresAt],
  });

  return result.rows[0];
}

async function findOneValidByToken(token) {
  const result = await database.query({
    text: `
      SELECT id, token, user_id, expires_at, created_at, updated_at
      FROM sessions
      WHERE token = $1
        AND expires_at > now();
    `,
    values: [token],
  });

  return result.rows[0] ?? null;
}

async function expireById(id) {
  const result = await database.query({
    text: `
      UPDATE sessions
      SET expires_at = now() - interval '1 second'
      WHERE id = $1
      RETURNING id, token, user_id, expires_at, created_at, updated_at;
    `,
    values: [id],
  });

  return result.rows[0];
}

module.exports = {
  create,
  findOneValidByToken,
  expireById,
  EXPIRATION_IN_MILLISECONDS,
};
