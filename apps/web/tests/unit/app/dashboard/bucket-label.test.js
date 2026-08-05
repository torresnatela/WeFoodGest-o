const bucketLabel = require("@/app/(app)/dashboard/bucket-label");

describe("bucketLabel()", () => {
  test("formats an hourly bucket", () => {
    expect(bucketLabel("2026-07-10T14:00:00", "hour")).toBe("14h");
  });

  test("formats a daily bucket as day/month", () => {
    expect(bucketLabel("2026-07-10T00:00:00", "day")).toBe("10/07");
  });

  // O bucket semanal é rotulado só pelo início: o Postgres trunca para a
  // segunda-feira, mas o período começa e termina no meio da semana, então a
  // primeira e a última barra não guardam sete dias.
  test("formats a weekly bucket by the week's start", () => {
    expect(bucketLabel("2026-07-06T00:00:00", "week")).toBe("semana de 06/07");
  });

  test("labels a week that spills into the next month by its start", () => {
    expect(bucketLabel("2026-07-27T00:00:00", "week")).toBe("semana de 27/07");
  });

  test("labels a week that crosses the year boundary by its start", () => {
    expect(bucketLabel("2025-12-27T00:00:00", "week")).toBe("semana de 27/12");
  });
});
