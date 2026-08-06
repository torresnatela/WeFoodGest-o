const database = require("@wefood/database");
const { toNumber, percentageOf } = require("./numbers");

async function byCategory({ from, to }) {
  const result = await database.query({
    text: `
      -- Só visitas com compra entram na CTE. O JOIN abaixo não muda com isso
      -- (visita sem compra não tem item), mas o denominador dos percentuais
      -- sim: contando todas, cada categoria teria a fatia diluída por gente que
      -- nunca poderia ter pedido nada, e a nota de rodapé da tela sobre as
      -- porcentagens somarem mais de 100% deixaria de fazer sentido.
      WITH period_visits AS (
        SELECT id, amount_spent
        FROM visits
        WHERE created_at >= $1 AND created_at <= $2
          AND purchased
      )
      SELECT
        voi.category AS value,
        COUNT(DISTINCT v.id) AS visits,
        COALESCE(AVG(v.amount_spent), 0) AS average_ticket,
        (SELECT COUNT(*) FROM period_visits) AS total_visits
      FROM period_visits v
      JOIN visit_order_items voi ON voi.visit_id = v.id
      GROUP BY voi.category
      ORDER BY COUNT(DISTINCT v.id) DESC, voi.category;
    `,
    values: [from, to],
  });

  return result.rows.map((row) => ({
    value: row.value,
    visits: toNumber(row.visits),
    percentage: percentageOf(toNumber(row.visits), toNumber(row.total_visits)),
    averageTicket: toNumber(row.average_ticket),
  }));
}

module.exports = {
  byCategory,
};
