const bcryptjs = require("bcryptjs");

exports.shorthands = undefined;

const ADMIN_EMAIL = "admin@admin.com.br";
const ADMIN_PASSWORD = "WeFood123456";
const ADMIN_NAME = "Admin";
const SALT_ROUNDS = 10;

const ADMIN_ROLE_KEY = "admin";
const ADMIN_ROLE_NAME = "Administrador";
const COLABORADOR_ROLE_KEY = "colaborador";
const COLABORADOR_ROLE_NAME = "Colaborador";

const MANAGE_USERS_FEATURE_KEY = "usuarios.gerenciar";
const MANAGE_USERS_FEATURE_NAME = "Gerenciar usuários";

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
  pgm.createTable("roles", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    key: {
      type: "text",
      notNull: true,
      unique: true,
    },
    name: {
      type: "text",
      notNull: true,
    },
    is_super: {
      type: "boolean",
      notNull: true,
      default: false,
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.createTable("features", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    key: {
      type: "text",
      notNull: true,
      unique: true,
    },
    name: {
      type: "text",
      notNull: true,
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.createTable("role_features", {
    role_id: {
      type: "uuid",
      notNull: true,
      references: "roles",
      onDelete: "CASCADE",
    },
    feature_id: {
      type: "uuid",
      notNull: true,
      references: "features",
      onDelete: "CASCADE",
    },
  }, {
    constraints: {
      primaryKey: ["role_id", "feature_id"],
    },
  });

  pgm.createTable("users", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    name: {
      type: "text",
      notNull: true,
    },
    email: {
      type: "text",
      notNull: true,
      unique: true,
    },
    password: {
      type: "text",
      notNull: false,
    },
    role_id: {
      type: "uuid",
      notNull: true,
      references: "roles",
      onDelete: "RESTRICT",
    },
    status: {
      type: "text",
      notNull: true,
      default: "pending",
      check: "status in ('pending', 'active')",
    },
    invite_token: {
      type: "text",
      unique: true,
    },
    invite_token_expires_at: {
      type: "timestamptz",
    },
    invited_by: {
      type: "uuid",
      references: "users",
      onDelete: "SET NULL",
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

  // Seed roles. The Admin role has no rows in role_features — access to
  // every feature (including ones created later) comes from is_super, not
  // from an enumerated list that would need updating every time a new
  // feature is added. Colaborador starts with zero features on purpose:
  // there are no business features yet to grant.
  pgm.sql(
    `INSERT INTO roles (key, name, is_super) VALUES (${escapeLiteral(ADMIN_ROLE_KEY)}, ${escapeLiteral(ADMIN_ROLE_NAME)}, true);`,
  );
  pgm.sql(
    `INSERT INTO roles (key, name, is_super) VALUES (${escapeLiteral(COLABORADOR_ROLE_KEY)}, ${escapeLiteral(COLABORADOR_ROLE_NAME)}, false);`,
  );

  pgm.sql(
    `INSERT INTO features (key, name) VALUES (${escapeLiteral(MANAGE_USERS_FEATURE_KEY)}, ${escapeLiteral(MANAGE_USERS_FEATURE_NAME)});`,
  );

  const adminPasswordHash = await bcryptjs.hash(ADMIN_PASSWORD, SALT_ROUNDS);

  pgm.sql(`
    INSERT INTO users (name, email, password, role_id, status)
    VALUES (
      ${escapeLiteral(ADMIN_NAME)},
      ${escapeLiteral(ADMIN_EMAIL)},
      ${escapeLiteral(adminPasswordHash)},
      (SELECT id FROM roles WHERE key = ${escapeLiteral(ADMIN_ROLE_KEY)}),
      'active'
    );
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.down = (pgm) => {
  pgm.dropTable("sessions");
  pgm.dropTable("users");
  pgm.dropTable("role_features");
  pgm.dropTable("features");
  pgm.dropTable("roles");
};
