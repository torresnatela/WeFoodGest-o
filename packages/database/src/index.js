const { Client } = require("pg");

async function query(queryObject) {
  let client;

  try {
    client = await getNewClient();
    return await client.query(queryObject);
  } finally {
    await client?.end();
  }
}

async function getNewClient() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: getSSLConfig(),
  });

  await client.connect();
  return client;
}

function getSSLConfig() {
  return process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : false;
}

module.exports = {
  query,
  getNewClient,
};
