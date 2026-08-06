const retry = require("async-retry");

const database = require("@wefood/database");
const migrator = require("@wefood/database/migrator");
const webserver = require("@/infra/webserver");
const visit = require("@/models/visit");

if (process.env.NODE_ENV !== "test") {
  throw new Error("orchestrator.js should only be used in tests");
}

async function waitForAllServices() {
  await waitForWebServer();
  await waitForDatabase();

  async function waitForWebServer() {
    await retry(async () => await fetch(`${webserver.host}/api/v1/status`), {
      retries: 50,
      minTimeout: 10,
      maxTimeout: 1000,
      factor: 1.1,
    });
  }

  async function waitForDatabase() {
    await retry(
      async () => {
        const client = await database.getNewClient();
        await client.end();
      },
      {
        retries: 50,
        minTimeout: 10,
        maxTimeout: 1000,
        factor: 1.1,
      },
    );
  }
}

async function dropAllTables() {
  const client = await database.getNewClient();

  try {
    await client.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
  } finally {
    await client.end();
  }
}

async function runPendingMigrations() {
  await migrator.runPendingMigrations();
}

// visit.create() demands the three funnel answers and gives them no default —
// a visit that forgets one has to fail loudly instead of silently claiming the
// person entered, looked and bought. Most tests are about something else
// entirely, so the "ordinary customer" default lives here, in the test helper,
// and not in the model.
async function createVisit({
  enteredStore = true,
  sawProducts = true,
  purchased = true,
  ...visitInput
}) {
  return await visit.create({ enteredStore, sawProducts, purchased, ...visitInput });
}

// visits.created_at defaults to now() and visit.create() takes no date, but
// the dashboard is only meaningful with visits spread over time. This creates
// the visit through the real model and then backdates it, so the insert path
// under test stays real.
async function createVisitAt({ createdAt, ...visitInput }) {
  const createdVisit = await createVisit(visitInput);

  await database.query({
    text: "UPDATE visits SET created_at = $1 WHERE id = $2;",
    values: [createdAt, createdVisit.id],
  });

  return { ...createdVisit, created_at: createdAt };
}

module.exports = {
  waitForAllServices,
  dropAllTables,
  runPendingMigrations,
  createVisit,
  createVisitAt,
  webserverUrl: webserver.host,
};
