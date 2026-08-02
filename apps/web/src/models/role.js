const database = require("@wefood/database");

async function findByKey(key) {
  const result = await database.query({
    text: `
      SELECT id, key, name, is_super, created_at
      FROM roles
      WHERE key = $1;
    `,
    values: [key],
  });

  return result.rows[0] ?? null;
}

async function findAll() {
  const result = await database.query(`
    SELECT id, key, name, is_super, created_at
    FROM roles
    ORDER BY name;
  `);

  return result.rows;
}

module.exports = {
  findByKey,
  findAll,
};
