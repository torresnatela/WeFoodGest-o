const bcryptjs = require("bcryptjs");

const SALT_ROUNDS = 10;

async function hash(plainTextPassword) {
  return await bcryptjs.hash(plainTextPassword, SALT_ROUNDS);
}

async function compare(plainTextPassword, storedHash) {
  return await bcryptjs.compare(plainTextPassword, storedHash);
}

module.exports = {
  hash,
  compare,
};
