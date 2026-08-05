// The bucket arrives as wall-clock time in the store's timezone. It is sliced
// as text rather than parsed into a Date, because building a Date would
// re-read it in the process timezone and shift every label.
function bucketLabel(bucket, granularity) {
  const [date, time] = bucket.split("T");
  const [, month, day] = date.split("-");

  if (granularity === "hour") {
    return `${time.slice(0, 2)}h`;
  }

  // Só o início da semana. O Postgres trunca o bucket para a segunda-feira,
  // mas o período começa e termina no meio da semana — a primeira e a última
  // barra guardam um ou dois dias, não sete. Escrever "03/08 – 09/08" nelas
  // anunciava uma semana inteira e fazia a última barra parecer uma queda no
  // movimento toda vez. "semana de 03/08" é verdade nos dois casos.
  if (granularity === "week") {
    return `semana de ${day}/${month}`;
  }

  return `${day}/${month}`;
}

module.exports = bucketLabel;
