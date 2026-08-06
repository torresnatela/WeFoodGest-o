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

  test("devolve a entrada crua acima de 11 dígitos", () => {
    expect(formatPhone("5515991234001")).toBe("5515991234001");
    expect(formatPhone("+55 (15) 99123-4001")).toBe("+55 (15) 99123-4001");
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

  test("usa o dia de São Paulo, não o do servidor", () => {
    // 01:00Z do dia 5 é 22:00 do dia 4 em São Paulo; 14:00Z do dia 5 é 11:00
    // do dia 5. Em UTC as duas datas caem no mesmo dia e o resultado seria
    // "hoje" — em São Paulo são dias diferentes.
    jest.useFakeTimers({ now: new Date("2026-08-05T14:00:00Z") });

    try {
      expect(formatRelativeDate(new Date("2026-08-05T01:00:00Z"))).toBe("ontem");
    } finally {
      jest.useRealTimers();
    }
  });
});
