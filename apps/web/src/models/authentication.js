const { UnauthorizedError } = require("@/infra/errors");
const password = require("./password");
const session = require("./session");
const user = require("./user");

async function getUserFromSessionToken(token) {
  if (!token) {
    return null;
  }

  const currentSession = await session.findOneValidByToken(token);

  if (!currentSession) {
    return null;
  }

  return await user.findById(currentSession.user_id);
}

async function getAuthenticatedUser(email, plainTextPassword) {
  const storedUser = await user.findByEmail(email);

  if (!storedUser) {
    throw newUnauthorizedError();
  }

  const isPasswordValid = await password.compare(plainTextPassword, storedUser.password);

  if (!isPasswordValid) {
    throw newUnauthorizedError();
  }

  return storedUser;
}

function newUnauthorizedError() {
  return new UnauthorizedError({
    message: "Dados de autenticação não conferem.",
    action: "Verifique se os dados enviados estão corretos.",
  });
}

module.exports = {
  getAuthenticatedUser,
  getUserFromSessionToken,
};
