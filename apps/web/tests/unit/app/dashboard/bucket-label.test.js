const bucketLabel = require("@/app/dashboard/bucket-label");

describe("bucketLabel()", () => {
  test("formats an hourly bucket", () => {
    expect(bucketLabel("2026-07-10T14:00:00", "hour")).toBe("14h");
  });

  test("formats a daily bucket as day/month", () => {
    expect(bucketLabel("2026-07-10T00:00:00", "day")).toBe("10/07");
  });

  test("formats a weekly bucket as the week's range", () => {
    expect(bucketLabel("2026-07-06T00:00:00", "week")).toBe("06/07 – 12/07");
  });

  test("crosses the month boundary correctly on a weekly bucket", () => {
    expect(bucketLabel("2026-07-27T00:00:00", "week")).toBe("27/07 – 02/08");
  });
});
