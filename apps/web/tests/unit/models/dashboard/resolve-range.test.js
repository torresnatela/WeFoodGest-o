const { resolveRange, PERIODS } = require("@/models/dashboard/period");

// 2026-08-04 15:00 UTC is 12:00 in São Paulo on the same day.
const MIDDAY = new Date("2026-08-04T15:00:00Z");

describe("dashboard.resolveRange()", () => {
  test("'hoje' starts at midnight in São Paulo, not in UTC", () => {
    const range = resolveRange("hoje", MIDDAY);

    expect(range.from.toISOString()).toBe("2026-08-04T03:00:00.000Z");
    expect(range.to).toBe(MIDDAY);
    expect(range.granularity).toBe("hour");
  });

  test("resolves the day boundary by São Paulo's calendar, not UTC's", () => {
    // 00:30 UTC on the 5th is still 21:30 on the 4th in São Paulo, so "hoje"
    // must be the 4th. Getting this wrong shifts every evening visit by a day.
    const lateNight = new Date("2026-08-05T00:30:00Z");

    const range = resolveRange("hoje", lateNight);

    expect(range.from.toISOString()).toBe("2026-08-04T03:00:00.000Z");
  });

  test("'7d' covers today plus the six previous calendar days", () => {
    const range = resolveRange("7d", MIDDAY);

    expect(range.from.toISOString()).toBe("2026-07-29T03:00:00.000Z");
    expect(range.granularity).toBe("day");
  });

  test("'30d' covers today plus the twenty-nine previous days", () => {
    const range = resolveRange("30d", MIDDAY);

    expect(range.from.toISOString()).toBe("2026-07-06T03:00:00.000Z");
    expect(range.granularity).toBe("day");
  });

  test("'90d' groups by week", () => {
    const range = resolveRange("90d", MIDDAY);

    expect(range.from.toISOString()).toBe("2026-05-07T03:00:00.000Z");
    expect(range.granularity).toBe("week");
  });

  test("falls back to 30 days for an unknown or missing key", () => {
    const fromUnknown = resolveRange("mes-passado", MIDDAY);
    const fromMissing = resolveRange(undefined, MIDDAY);

    expect(fromUnknown.key).toBe("30d");
    expect(fromMissing.key).toBe("30d");
  });

  test("exposes the four periods in display order", () => {
    expect(PERIODS.map((period) => period.key)).toEqual(["hoje", "7d", "30d", "90d"]);
  });
});
