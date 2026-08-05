const { formatPhone, formatCurrency, formatRelativeDate, onlyDigits } = require("@/lib/format");

describe("onlyDigits()", () => {
  test("remove tudo que não for dígito", () => {
    expect(onlyDigits("(15) 99123-4001")).toBe("15991234001");
  });

  test("devolve string vazia para entrada vazia", () => {
    expect(onlyDigits("")).toBe("");
  });
});

describe("formatPhone()", () => {
  test("formata celular de 11 dígitos", () => {
    expect(formatPhone("15991234001")).toBe("(15) 99123-4001");
  });

  test("formata fixo de 10 dígitos", () => {
    expect(formatPhone("1531234001")).toBe("(15) 3123-4001");
  });

  test("formata parcialmente enquanto o usuário digita", () => {
    expect(formatPhone("15")).toBe("(15");
    expect(formatPhone("159912")).toBe("(15) 9912");
  });

  test("devolve string vazia para entrada vazia ou nula", () => {
    expect(formatPhone("")).toBe("");
    expect(formatPhone(null)).toBe("");
  });
});

describe("formatCurrency()", () => {
  test("formata número como real", () => {
    expect(formatCurrency(32.5)).toBe("R$ 32,50");
  });

  test("formata string numérica vinda do Postgres", () => {
    expect(formatCurrency("32.50")).toBe("R$ 32,50");
  });

  test("formata zero", () => {
    expect(formatCurrency(0)).toBe("R$ 0,00");
  });
});

describe("formatRelativeDate()", () => {
  function daysAgo(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
  }

  test("hoje", () => {
    expect(formatRelativeDate(new Date())).toBe("hoje");
  });

  test("ontem", () => {
    expect(formatRelativeDate(daysAgo(1))).toBe("ontem");
  });

  test("poucos dias", () => {
    expect(formatRelativeDate(daysAgo(3))).toBe("há 3 dias");
  });

  test("semanas", () => {
    expect(formatRelativeDate(daysAgo(14))).toBe("há 2 semanas");
  });

  test("acima de 60 dias vira data absoluta", () => {
    const old = new Date("2020-03-15T12:00:00Z");
    expect(formatRelativeDate(old)).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  test("devolve traço para nulo", () => {
    expect(formatRelativeDate(null)).toBe("—");
  });
});
