const database = require("@wefood/database");
const { ValidationError, NotFoundError } = require("@/infra/errors");

const FOREIGN_KEY_VIOLATION = "23503";
const CHECK_VIOLATION = "23514";
const INVALID_TEXT_REPRESENTATION = "22P02";

async function create({
  clientId,
  registeredBy,
  amountSpent,
  orderCategories,
  orderDetails,
  reason,
  reasonDetails,
  discoverySource,
  discoveryDetails,
}) {
  if (!orderCategories || orderCategories.length === 0) {
    throw new ValidationError({
      message: "Selecione ao menos uma categoria do pedido.",
      action: "Escolha uma ou mais categorias do que o cliente pediu.",
    });
  }

  const dbClient = await database.getNewClient();

  try {
    await dbClient.query("BEGIN");

    const visitResult = await dbClient.query({
      text: `
        INSERT INTO visits (
          client_id, registered_by, amount_spent, order_details,
          reason, reason_details, discovery_source, discovery_details
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, client_id, registered_by, amount_spent, order_details,
          reason, reason_details, discovery_source, discovery_details,
          created_at, updated_at;
      `,
      values: [
        clientId,
        registeredBy,
        amountSpent,
        orderDetails ?? null,
        reason,
        reasonDetails ?? null,
        discoverySource,
        discoveryDetails ?? null,
      ],
    });

    const createdVisit = visitResult.rows[0];

    for (const category of orderCategories) {
      await dbClient.query({
        text: `
          INSERT INTO visit_order_items (visit_id, category)
          VALUES ($1, $2);
        `,
        values: [createdVisit.id, category],
      });
    }

    await dbClient.query("COMMIT");

    return { ...createdVisit, order_categories: orderCategories };
  } catch (error) {
    await dbClient.query("ROLLBACK");

    if (error.code === FOREIGN_KEY_VIOLATION || error.code === INVALID_TEXT_REPRESENTATION) {
      throw new NotFoundError({
        message: "Cliente não encontrado.",
        action: "Verifique se o cliente informado existe.",
      });
    }

    if (error.code === CHECK_VIOLATION) {
      throw new ValidationError({
        message: "Algum valor enviado não é uma opção válida.",
        action: "Verifique a categoria, o motivo e a origem informados.",
      });
    }

    throw error;
  } finally {
    await dbClient.end();
  }
}

async function findByClientId(clientId) {
  const result = await database.query({
    text: `
      SELECT
        v.id, v.client_id, v.registered_by, v.amount_spent, v.order_details,
        v.reason, v.reason_details, v.discovery_source, v.discovery_details,
        v.created_at, v.updated_at,
        COALESCE(
          array_agg(voi.category ORDER BY voi.category) FILTER (WHERE voi.category IS NOT NULL),
          '{}'
        ) AS order_categories
      FROM visits v
      LEFT JOIN visit_order_items voi ON voi.visit_id = v.id
      WHERE v.client_id = $1
      GROUP BY v.id
      ORDER BY v.created_at DESC;
    `,
    values: [clientId],
  });

  return result.rows;
}

async function summaryForToday() {
  const result = await database.query({
    text: `
      SELECT
        COUNT(*)::int AS count,
        COALESCE(SUM(amount_spent), 0)::float AS total
      FROM visits
      WHERE created_at >= date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo')
        AT TIME ZONE 'America/Sao_Paulo';
    `,
  });

  return result.rows[0];
}

module.exports = {
  create,
  findByClientId,
  summaryForToday,
};
