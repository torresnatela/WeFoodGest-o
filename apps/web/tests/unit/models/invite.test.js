const invite = require("@/models/invite");

describe("models/invite", () => {
  test("generateToken() returns distinct hex tokens on each call", () => {
    const first = invite.generateToken();
    const second = invite.generateToken();

    expect(first).not.toBe(second);
    expect(first).toMatch(/^[0-9a-f]{64}$/);
  });

  test("hashToken() is deterministic and different from the raw token", () => {
    const rawToken = invite.generateToken();

    const firstHash = invite.hashToken(rawToken);
    const secondHash = invite.hashToken(rawToken);

    expect(firstHash).toBe(secondHash);
    expect(firstHash).not.toBe(rawToken);
    expect(firstHash).toMatch(/^[0-9a-f]{64}$/);
  });

  test("getExpiresAt() returns a date about 7 days from now", () => {
    const expiresAt = invite.getExpiresAt();
    const diffInMilliseconds = expiresAt.getTime() - Date.now();

    expect(diffInMilliseconds).toBeGreaterThan(6.9 * 24 * 60 * 60 * 1000);
    expect(diffInMilliseconds).toBeLessThanOrEqual(7 * 24 * 60 * 60 * 1000);
  });
});
