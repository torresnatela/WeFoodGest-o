// Estas telas rodam em Server Components, então sem fuso explícito elas usariam
// o `TZ` do host — UTC na maioria das hospedagens. Toda visita depois das 21h
// de São Paulo cairia no dia seguinte, contradizendo o painel do início, que já
// calcula o dia em `America/Sao_Paulo`.
const TIME_ZONE = "America/Sao_Paulo";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: TIME_ZONE,
});

// `en-CA` devolve `YYYY-MM-DD`, que dá a data do calendário de São Paulo já
// pronta para virar número de dia.
const isoDateFormatter = new Intl.DateTimeFormat("en-CA", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: TIME_ZONE,
});

function startOfSaoPauloDay(value) {
  const [year, month, day] = isoDateFormatter.format(value).split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function onlyDigits(text) {
  return String(text ?? "").replace(/\D/g, "");
}

function formatPhone(value) {
  const digits = onlyDigits(value);

  if (digits.length === 0) {
    return "";
  }

  if (digits.length <= 2) {
    return `(${digits}`;
  }

  const areaCode = digits.slice(0, 2);
  const rest = digits.slice(2, 11);

  if (rest.length <= 4) {
    return `(${areaCode}) ${rest}`;
  }

  const splitAt = rest.length > 8 ? 5 : 4;
  return `(${areaCode}) ${rest.slice(0, splitAt)}-${rest.slice(splitAt)}`;
}

function formatCurrency(value) {
  return currencyFormatter.format(Number(value ?? 0)).replace(" ", " ");
}

function formatRelativeDate(value) {
  if (!value) {
    return "—";
  }

  const date = value instanceof Date ? value : new Date(value);

  // A diferença sai da comparação entre duas datas de calendário, não de um
  // delta em milissegundos: dias inteiros em São Paulo, independentes da hora.
  const days = (startOfSaoPauloDay(new Date()) - startOfSaoPauloDay(date)) / 86400000;

  if (days <= 0) {
    return "hoje";
  }
  if (days === 1) {
    return "ontem";
  }
  if (days < 7) {
    return `há ${days} dias`;
  }
  if (days <= 60) {
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? "há 1 semana" : `há ${weeks} semanas`;
  }

  return dateFormatter.format(date);
}

module.exports = { onlyDigits, formatPhone, formatCurrency, formatRelativeDate };
