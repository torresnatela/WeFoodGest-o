const authorization = require("@/models/authorization");

describe("models/authorization", () => {
  test("userCan() returns true for a super role, regardless of the feature key", () => {
    const superUser = { role: { is_super: true }, features: [] };

    expect(authorization.userCan(superUser, "usuarios.gerenciar")).toBe(true);
    expect(authorization.userCan(superUser, "qualquer-feature-inventada")).toBe(true);
  });

  test("userCan() returns true when the feature key is in the user's feature list", () => {
    const user = { role: { is_super: false }, features: ["usuarios.gerenciar"] };

    expect(authorization.userCan(user, "usuarios.gerenciar")).toBe(true);
  });

  test("userCan() returns false when the feature key is not in the user's feature list", () => {
    const user = { role: { is_super: false }, features: [] };

    expect(authorization.userCan(user, "usuarios.gerenciar")).toBe(false);
  });

  test("userCan() returns false for a null or undefined user", () => {
    expect(authorization.userCan(null, "usuarios.gerenciar")).toBe(false);
    expect(authorization.userCan(undefined, "usuarios.gerenciar")).toBe(false);
  });
});
