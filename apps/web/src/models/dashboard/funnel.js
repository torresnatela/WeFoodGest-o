const database = require("@wefood/database");
const { toNumber, percentageOf } = require("./numbers");

// Toda taxa aqui usa o total de visitas como denominador, e não a etapa
// anterior. É tentador medir "viu ÷ entrou", mas o funil não é estritamente
// sequencial: quem olha a vitrine da calçada viu sem entrar, então essa razão
// pode passar de 100% e o gráfico passa a mentir. Sobre o total, as quatro
// linhas são sempre comparáveis entre si e nenhuma pode estourar.
async function funnel({ from, to }) {
  const result = await database.query({
    text: `
      SELECT
        COUNT(*) AS visits,
        COUNT(*) FILTER (WHERE entered_store) AS entered,
        COUNT(*) FILTER (WHERE saw_products) AS saw_products,
        COUNT(*) FILTER (WHERE purchased) AS purchased
      FROM visits
      WHERE created_at >= $1 AND created_at <= $2;
    `,
    values: [from, to],
  });

  const row = result.rows[0];
  const visits = toNumber(row.visits);
  const entered = toNumber(row.entered);
  const sawProducts = toNumber(row.saw_products);
  const purchased = toNumber(row.purchased);

  return {
    visits,
    entered,
    sawProducts,
    purchased,
    // percentageOf() devolve 0 quando o total é zero, então um período sem
    // nenhuma visita mostra 0% em vez de quebrar a página.
    enteredRate: percentageOf(entered, visits),
    sawRate: percentageOf(sawProducts, visits),
    conversionRate: percentageOf(purchased, visits),
  };
}

module.exports = {
  funnel,
};
