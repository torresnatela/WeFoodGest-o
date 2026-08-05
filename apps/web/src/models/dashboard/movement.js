const database = require("@wefood/database");
const { toNumber } = require("./numbers");
const { STORE_TIMEZONE } = require("./period");

const GRANULARITY_INTERVALS = {
  hour: "1 hour",
  day: "1 day",
  week: "1 week",
};

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

async function timeline({ from, to, granularity }) {
  const interval = GRANULARITY_INTERVALS[granularity];

  if (!interval) {
    throw new Error(`Granularidade inválida: ${granularity}`);
  }

  const result = await database.query({
    text: `
      WITH buckets AS (
        SELECT generate_series(
          date_trunc($3, $1::timestamptz AT TIME ZONE $4),
          date_trunc($3, $2::timestamptz AT TIME ZONE $4),
          $5::interval
        ) AS bucket
      ),
      visits_by_bucket AS (
        SELECT
          date_trunc($3, created_at AT TIME ZONE $4) AS bucket,
          COUNT(*) AS visits,
          COALESCE(SUM(amount_spent), 0) AS revenue
        FROM visits
        WHERE created_at >= $1 AND created_at <= $2
        GROUP BY 1
      )
      SELECT
        to_char(b.bucket, 'YYYY-MM-DD"T"HH24:MI:SS') AS bucket,
        COALESCE(v.visits, 0) AS visits,
        COALESCE(v.revenue, 0) AS revenue
      FROM buckets b
      LEFT JOIN visits_by_bucket v ON v.bucket = b.bucket
      ORDER BY b.bucket;
    `,
    values: [from, to, granularity, STORE_TIMEZONE, interval],
  });

  return result.rows.map((row) => ({
    bucket: row.bucket,
    visits: toNumber(row.visits),
    revenue: toNumber(row.revenue),
  }));
}

module.exports = {
  summary,
  timeline,
};
