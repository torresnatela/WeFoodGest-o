const { execFileSync } = require("node:child_process");
const { join } = require("node:path");

const migrationsDir = join(__dirname, "..", "migrations");

// node-pg-migrate v9 is ESM-only, which Jest's CommonJS module system can't
// load (even via dynamic import()) since Jest intercepts that too. Shelling
// out to the same CLI used by `npm run migrations:up` sidesteps the whole
// problem — it runs in its own Node process, untouched by Jest.
function runMigrateCli(extraArgs) {
  return execFileSync("npx", ["node-pg-migrate", "-j", "js", "-m", migrationsDir, ...extraArgs], {
    env: process.env,
    encoding: "utf8",
  });
}

async function listPendingMigrations() {
  return runMigrateCli(["up", "--dry-run"]);
}

async function runPendingMigrations() {
  return runMigrateCli(["up"]);
}

module.exports = {
  listPendingMigrations,
  runPendingMigrations,
};
