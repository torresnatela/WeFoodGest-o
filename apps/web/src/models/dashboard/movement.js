const database = require("@wefood/database");
const { toNumber } = require("./numbers");

async function summary({ from, to }) {
  const result = await database.query({
    text: `
      SELECT
        COUNT(*) AS visits,
        COALESCE(SUM(amount_spent), 0) AS revenue,
        COALESCE(AVG(amount_spent), 0) AS average_ticket,
        COUNT(DISTINCT client_id) AS clients_served
      FROM visits
      WHERE created_at >= $1 AND created_at <= $2;
    `,
    values: [from, to],
  });

  const row = result.rows[0];

  return {
    visits: toNumber(row.visits),
    revenue: toNumber(row.revenue),
    averageTicket: toNumber(row.average_ticket),
    clientsServed: toNumber(row.clients_served),
  };
}

module.exports = {
  summary,
};
