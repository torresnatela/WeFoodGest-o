const crypto = require("node:crypto");

const TOKEN_EXPIRATION_IN_MILLISECONDS = 7 * 24 * 60 * 60 * 1000; // 7 days

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hashToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

function getExpiresAt() {
  return new Date(Date.now() + TOKEN_EXPIRATION_IN_MILLISECONDS);
}

module.exports = {
  generateToken,
  hashToken,
  getExpiresAt,
  TOKEN_EXPIRATION_IN_MILLISECONDS,
};
