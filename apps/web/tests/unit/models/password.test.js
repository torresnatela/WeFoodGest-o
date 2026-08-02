const password = require("@/models/password");

describe("models/password", () => {
  test("hash() returns a bcrypt hash different from the plain text", async () => {
    const hash = await password.hash("WeFood123456");

    expect(hash).not.toBe("WeFood123456");
    expect(hash).toMatch(/^\$2[aby]\$/);
  });

  test("compare() returns true for the matching plain text and hash", async () => {
    const hash = await password.hash("WeFood123456");

    expect(await password.compare("WeFood123456", hash)).toBe(true);
  });

  test("compare() returns false for a non-matching plain text", async () => {
    const hash = await password.hash("WeFood123456");

    expect(await password.compare("wrong-password", hash)).toBe(false);
  });
});
