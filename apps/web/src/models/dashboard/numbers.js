// pg returns numeric and bigint (COUNT) as strings. Everything the dashboard
// model hands out is converted here, so no consumer has to know that.
function toNumber(value) {
  return value === null || value === undefined ? null : Number(value);
}

function percentageOf(count, total) {
  if (!total) {
    return 0;
  }

  return Math.round((count / total) * 1000) / 10;
}

module.exports = {
  toNumber,
  percentageOf,
};
