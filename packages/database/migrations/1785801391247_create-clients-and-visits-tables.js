exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.up = (pgm) => {
  pgm.createTable("clients", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    name: {
      type: "text",
      notNull: true,
    },
    phone: {
      type: "text",
      notNull: true,
      unique: true,
    },
    birth_date: {
      type: "date",
    },
    neighborhood: {
      type: "text",
    },
    city: {
      type: "text",
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

  pgm.createTable("visits", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    client_id: {
      type: "uuid",
      notNull: true,
      references: "clients",
      onDelete: "CASCADE",
    },
    registered_by: {
      type: "uuid",
      references: "users",
      onDelete: "SET NULL",
    },
    amount_spent: {
      type: "numeric(10,2)",
      notNull: true,
      default: 0,
      check: "amount_spent >= 0",
    },
    order_details: {
      type: "text",
    },
    reason: {
      type: "text",
      notNull: true,
      check:
        "reason in ('vontade_comer_beber', 'programa_familia_amigos', 'comemoracao', 'passando_em_frente', 'outro')",
    },
    reason_details: {
      type: "text",
    },
    discovery_source: {
      type: "text",
      notNull: true,
      check:
        "discovery_source in ('instagram', 'indicacao', 'google_internet', 'passou_em_frente', 'cliente_antigo', 'outro')",
    },
    discovery_details: {
      type: "text",
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

  pgm.createTable(
    "visit_order_items",
    {
      visit_id: {
        type: "uuid",
        notNull: true,
        references: "visits",
        onDelete: "CASCADE",
      },
      category: {
        type: "text",
        notNull: true,
        check: "category in ('sorvete', 'milkshake', 'lanche', 'bebida', 'sobremesa', 'outro')",
      },
    },
    {
      constraints: {
        primaryKey: ["visit_id", "category"],
      },
    },
  );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.down = (pgm) => {
  pgm.dropTable("visit_order_items");
  pgm.dropTable("visits");
  pgm.dropTable("clients");
};
