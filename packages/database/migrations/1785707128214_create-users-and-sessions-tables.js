const bcryptjs = require("bcryptjs");

exports.shorthands = undefined;

const ADMIN_EMAIL = "admin@admin.com.br";
const ADMIN_PASSWORD = "WeFood123456";
const SALT_ROUNDS = 10;

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
exports.up = async (pgm) => {
  pgm.createTable("users", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    email: {
      type: "text",
      notNull: true,
      unique: true,
    },
    password: {
      type: "text",
      notNull: true,
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.createTable("sessions", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    token: {
      type: "text",
      notNull: true,
      unique: true,
    },
    user_id: {
      type: "uuid",
      notNull: true,
      references: "users",
      onDelete: "CASCADE",
    },
    expires_at: {
      type: "timestamptz",
      notNull: true,
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  const adminPasswordHash = await bcryptjs.hash(ADMIN_PASSWORD, SALT_ROUNDS);

  pgm.sql(
    `INSERT INTO users (email, password) VALUES (${escapeLiteral(ADMIN_EMAIL)}, ${escapeLiteral(adminPasswordHash)});`,
  );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.down = (pgm) => {
  pgm.dropTable("sessions");
  pgm.dropTable("users");
};
