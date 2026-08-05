exports.shorthands = undefined;

const FEATURE_KEY = "dashboard.visualizar";
const FEATURE_NAME = "Visualizar dashboard";

// pgm.createTable()/pgm.sql() only queue SQL to run in order at the end of
// the migration — pgm.db.query() runs immediately instead, before those
// queued statements exist. Values here are fixed constants (not user
// input), so a plain single-quote-doubling escape is safe.
function escapeLiteral(value) {
  return `'${value.replace(/'/g, "''")}'`;
}

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.up = (pgm) => {
  // role_features is deliberately untouched: the admin role reaches every
  // feature through is_super, and colaborador starts without this one so an
  // admin can decide who sees the dashboard.
  pgm.sql(
    `INSERT INTO features (key, name) VALUES (${escapeLiteral(FEATURE_KEY)}, ${escapeLiteral(FEATURE_NAME)});`,
  );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.down = (pgm) => {
  pgm.sql(`DELETE FROM features WHERE key = ${escapeLiteral(FEATURE_KEY)};`);
};
