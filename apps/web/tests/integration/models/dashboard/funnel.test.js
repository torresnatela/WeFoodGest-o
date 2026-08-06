const orchestrator = require("../../../orchestrator");
const funnel = require("@/models/dashboard/funnel");

const FROM = new Date("2026-07-01T03:00:00Z");
const TO = new Date("2026-08-01T02:59:59Z");

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();

  // Dez visitas: 6 entraram, 5 viram (4 de quem entrou + 1 da vitrine), 2
  // compraram. Os números são escolhidos para que cada taxa dê um valor
  // diferente e um erro de denominador apareça.
  const shape = [
    { enteredStore: false, sawProducts: false, purchased: false },
    { enteredStore: false, sawProducts: false, purchased: false },
    { enteredStore: false, sawProducts: false, purchased: false },
    { enteredStore: false, sawProducts: true, purchased: false },
    { enteredStore: true, sawProducts: false, purchased: false },
    { enteredStore: true, sawProducts: false, purchased: false },
    { enteredStore: true, sawProducts: true, purchased: false },
    { enteredStore: true, sawProducts: true, purchased: false },
    { enteredStore: true, sawProducts: true, purchased: true },
    { enteredStore: true, sawProducts: true, purchased: true },
  ];

  for (const [index, answers] of shape.entries()) {
    await orchestrator.createVisitAt({
      registeredBy: null,
      ...answers,
      amountSpent: answers.purchased ? 25 : 0,
      orderCategories: answers.purchased ? ["sorvete"] : [],
      createdAt: new Date(`2026-07-1${index}T15:00:00Z`),
    });
  }
});

describe("dashboard.funnel()", () => {
  test("conta cada etapa do funil no período", async () => {
    const result = await funnel.funnel({ from: FROM, to: TO });

    expect(result.visits).toBe(10);
    expect(result.entered).toBe(6);
    expect(result.sawProducts).toBe(5);
    expect(result.purchased).toBe(2);
  });

  test("mede toda taxa sobre o total de visitas", async () => {
    const result = await funnel.funnel({ from: FROM, to: TO });

    expect(result.enteredRate).toBe(60);
    expect(result.sawRate).toBe(50);
    expect(result.conversionRate).toBe(20);
  });

  test("devolve números, não as strings que o pg entrega para bigint", async () => {
    const result = await funnel.funnel({ from: FROM, to: TO });

    expect(typeof result.visits).toBe("number");
    expect(typeof result.entered).toBe("number");
    expect(typeof result.sawProducts).toBe("number");
    expect(typeof result.purchased).toBe("number");
  });

  test("devolve zeros num período sem visitas, sem dividir por zero", async () => {
    const result = await funnel.funnel({
      from: new Date("2020-01-01T00:00:00Z"),
      to: new Date("2020-01-31T00:00:00Z"),
    });

    expect(result).toEqual({
      visits: 0,
      entered: 0,
      sawProducts: 0,
      purchased: 0,
      enteredRate: 0,
      sawRate: 0,
      conversionRate: 0,
    });
  });
});
