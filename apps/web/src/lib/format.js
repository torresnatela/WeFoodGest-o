const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

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
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfDate = new Date(date);
  startOfDate.setHours(0, 0, 0, 0);

  const days = Math.round((startOfToday - startOfDate) / 86400000);

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