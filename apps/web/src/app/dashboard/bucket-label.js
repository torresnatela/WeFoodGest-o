// The bucket arrives as wall-clock time in the store's timezone. It is sliced
// as text rather than parsed into a Date, because building a Date would
// re-read it in the process timezone and shift every label.
function bucketLabel(bucket, granularity) {
  const [date, time] = bucket.split("T");
  const [year, month, day] = date.split("-");

  if (granularity === "hour") {
    return `${time.slice(0, 2)}h`;
  }

  if (granularity === "week") {
    const end = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day) + 6));
    const endDay = String(end.getUTCDate()).padStart(2, "0");
    const endMonth = String(end.getUTCMonth() + 1).padStart(2, "0");

    return `${day}/${month} – ${endDay}/${endMonth}`;
  }

  return `${day}/${month}`;
}

module.exports = bucketLabel;
