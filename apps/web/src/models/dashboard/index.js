const period = require("./period");
const movement = require("./movement");
const marketing = require("./marketing");
const product = require("./product");
const clients = require("./clients");

async function getOverview({ from, to, granularity }) {
  const range = { from, to };

  const [
    summary,
    timeline,
    discoverySources,
    reasons,
    categories,
    newVsReturningClients,
    topClients,
    neighborhoods,
    collaborators,
    birthdays,
  ] = await Promise.all([
    movement.summary(range),
    movement.timeline({ from, to, granularity }),
    marketing.byDiscoverySource(range),
    marketing.byReason(range),
    product.byCategory(range),
    clients.newVsReturningClients(range),
    clients.topClients(range),
    clients.byNeighborhood(range),
    clients.byCollaborator(range),
    clients.birthdaysOfMonth(period.currentMonth()),
  ]);

  return {
    summary,
    timeline,
    discoverySources,
    reasons,
    categories,
    newVsReturningClients,
    topClients,
    neighborhoods,
    collaborators,
    birthdays,
  };
}

module.exports = {
  ...period,
  ...movement,
  ...marketing,
  ...product,
  ...clients,
  getOverview,
};
