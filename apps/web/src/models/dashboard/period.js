const STORE_TIMEZONE = "America/Sao_Paulo";

const PERIODS = [
  { key: "hoje", label: "Hoje", days: 1, granularity: "hour" },
  { key: "7d", label: "7 dias", days: 7, granularity: "day" },
  { key: "30d", label: "30 dias", days: 30, granularity: "day" },
  { key: "90d", label: "90 dias", days: 90, granularity: "week" },
];

const DEFAULT_PERIOD_KEY = "30d";

// Reads the store's UTC offset out of the IANA database for this instant
// instead of hardcoding -03:00. Brazil has had no DST since 2019, but if it
// ever returns this keeps working.
function storeOffset(date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: STORE_TIMEZONE,
    timeZoneName: "longOffset",
  }).formatToParts(date);

  const timeZoneName = parts.find((part) => part.type === "timeZoneName")?.value ?? "";
  return timeZoneName.replace("GMT", "") || "+00:00";
}

// "2026-08-04" — the calendar date in the store's timezone, which is not
// necessarily the UTC date.
function storeDate(date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: STORE_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function resolveRange(periodKey, now = new Date()) {
  const period =
    PERIODS.find((candidate) => candidate.key === periodKey) ??
    PERIODS.find((candidate) => candidate.key === DEFAULT_PERIOD_KEY);

  const from = new Date(`${storeDate(now)}T00:00:00${storeOffset(now)}`);
  from.setUTCDate(from.getUTCDate() - (period.days - 1));

  return {
    key: period.key,
    label: period.label,
    from,
    to: now,
    granularity: period.granularity,
  };
}

function currentMonth(now = new Date()) {
  return Number(storeDate(now).slice(5, 7));
}

module.exports = {
  STORE_TIMEZONE,
  PERIODS,
  DEFAULT_PERIOD_KEY,
  resolveRange,
  currentMonth,
};
