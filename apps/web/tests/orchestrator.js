const retry = require("async-retry");

const database = require("@wefood/database");
const migrator = require("@wefood/database/migrator");
const webserver = require("@/infra/webserver");

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

module.exports = {
  waitForAllServices,
  dropAllTables,
  runPendingMigrations,
  webserverUrl: webserver.host,
};
