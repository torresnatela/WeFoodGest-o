const database = require("@wefood/database");
const { toNumber } = require("./numbers");

async function newVsReturningClients({ from, to }) {
  const result = await database.query({
    text: `
      WITH first_visit AS (
        SELECT client_id, MIN(created_at) AS first_at
        FROM visits
        GROUP BY client_id
      ),
      period_clients AS (
        SELECT DISTINCT client_id
        FROM visits
        WHERE created_at >= $1 AND created_at <= $2
      )
      SELECT
        COUNT(*) FILTER (WHERE fv.first_at >= $1) AS new_clients,
        COUNT(*) FILTER (WHERE fv.first_at < $1) AS returning_clients
      FROM period_clients pc
      JOIN first_visit fv ON fv.client_id = pc.client_id;
    `,
    values: [from, to],
  });

  const row = result.rows[0];

  return {
    newClients: toNumber(row.new_clients),
    returningClients: toNumber(row.returning_clients),
  };
}

async function topClients({ from, to, limit = 10 }) {
  const result = await database.query({
    text: `
      SELECT
        c.id,
        c.name,
        COUNT(*) AS visits,
        COALESCE(SUM(v.amount_spent), 0) AS revenue
      FROM visits v
      JOIN clients c ON c.id = v.client_id
      WHERE v.created_at >= $1 AND v.created_at <= $2
      GROUP BY c.id, c.name
      ORDER BY SUM(v.amount_spent) DESC, COUNT(*) DESC, c.name
      LIMIT $3;
    `,
    values: [from, to, limit],
  });

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    visits: toNumber(row.visits),
    revenue: toNumber(row.revenue),
  }));
}

async function byNeighborhood({ from, to }) {
  const result = await database.query({
    text: `
      SELECT c.neighborhood, c.city, COUNT(*) AS visits
      FROM visits v
      JOIN clients c ON c.id = v.client_id
      WHERE v.created_at >= $1 AND v.created_at <= $2
      GROUP BY c.neighborhood, c.city
      ORDER BY COUNT(*) DESC, c.neighborhood NULLS LAST;
    `,
    values: [from, to],
  });

  return result.rows.map((row) => ({
    neighborhood: row.neighborhood,
    city: row.city,
    visits: toNumber(row.visits),
  }));
}

async function byCollaborator({ from, to }) {
  const result = await database.query({
    text: `
      SELECT
        u.id AS user_id,
        u.name,
        COUNT(*) AS visits,
        COALESCE(SUM(v.amount_spent), 0) AS revenue
      FROM visits v
      LEFT JOIN users u ON u.id = v.registered_by
      WHERE v.created_at >= $1 AND v.created_at <= $2
      GROUP BY u.id, u.name
      ORDER BY COUNT(*) DESC, u.name NULLS LAST;
    `,
    values: [from, to],
  });

  return result.rows.map((row) => ({
    userId: row.user_id,
    name: row.name,
    visits: toNumber(row.visits),
    revenue: toNumber(row.revenue),
  }));
}

// Deliberately period-free: the screen always shows the current month.
async function birthdaysOfMonth(month) {
  const result = await database.query({
    text: `
      SELECT id, name, phone, EXTRACT(DAY FROM birth_date)::int AS day
      FROM clients
      WHERE birth_date IS NOT NULL AND EXTRACT(MONTH FROM birth_date) = $1
      ORDER BY EXTRACT(DAY FROM birth_date), name;
    `,
    values: [month],
  });

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    phone: row.phone,
    day: toNumber(row.day),
  }));
}

module.exports = {
  newVsReturningClients,
  topClients,
  byNeighborhood,
  byCollaborator,
  birthdaysOfMonth,
};
