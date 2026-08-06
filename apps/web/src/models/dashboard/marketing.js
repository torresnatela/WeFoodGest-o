const database = require("@wefood/database");
const { toNumber, percentageOf } = require("./numbers");

// Whitelist: the column name is interpolated into SQL, so it must never come
// from anywhere but this file.
const COUNTABLE_COLUMNS = ["discovery_source", "reason"];

async function countByColumn(column, { from, to }) {
  if (!COUNTABLE_COLUMNS.includes(column)) {
    throw new Error(`Coluna inválida: ${column}`);
  }

  const result = await database.query({
    text: `
      SELECT ${column} AS value, COUNT(*) AS visits
      FROM visits
      WHERE created_at >= $1 AND created_at <= $2
        AND ${column} IS NOT NULL
      GROUP BY ${column}
      ORDER BY COUNT(*) DESC, ${column};
    `,
    values: [from, to],
  });

  // As duas colunas aceitam nulo: motivo e origem dependem de a pessoa
  // responder, e quem passou em frente sem entrar não respondeu nada. O
  // IS NOT NULL acima tira essas visitas da conta, então o total abaixo é o de
  // quem respondeu — que é o denominador certo para o percentual. Contá-las
  // diluiria todas as fatias por gente que nunca foi perguntada.
  const total = result.rows.reduce((sum, row) => sum + toNumber(row.visits), 0);

  return result.rows.map((row) => ({
    value: row.value,
    visits: toNumber(row.visits),
    percentage: percentageOf(toNumber(row.visits), total),
  }));
}

async function byDiscoverySource(range) {
  return countByColumn("discovery_source", range);
}

async function byReason(range) {
  return countByColumn("reason", range);
}

module.exports = {
  byDiscoverySource,
  byReason,
};
