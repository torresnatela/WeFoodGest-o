const database = require("@wefood/database");
const orchestrator = require("../../../orchestrator");
const client = require("@/models/client");
const visit = require("@/models/visit");

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe("visit.summaryForToday()", () => {
  test("devolve zeros quando não há visitas", async () => {
    const summary = await visit.summaryForToday();

    expect(summary).toEqual({ count: 0, entered: 0, total: 0 });
  });

  test("soma as visitas de hoje", async () => {
    const createdClient = await client.create({ name: "Cliente Hoje", phone: "11944441001" });

    await orchestrator.createVisit({
      clientId: createdClient.id,
      registeredBy: null,
      amountSpent: 10.5,
      orderCategories: ["sorvete"],
      reason: "outro",
      discoverySource: "outro",
    });
    await orchestrator.createVisit({
      clientId: createdClient.id,
      registeredBy: null,
      amountSpent: 4.5,
      orderCategories: ["bebida"],
      reason: "outro",
      discoverySource: "outro",
    });

    const summary = await visit.summaryForToday();

    expect(summary.count).toBe(2);
    expect(summary.total).toBe(15);
  });

  test("ignora visita de ontem", async () => {
    const createdClient = await client.create({ name: "Cliente Ontem", phone: "11944441002" });

    const createdVisit = await orchestrator.createVisit({
      clientId: createdClient.id,
      registeredBy: null,
      amountSpent: 99,
      orderCategories: ["lanche"],
      reason: "outro",
      discoverySource: "outro",
    });

    await database.query({
      text: "UPDATE visits SET created_at = now() - interval '2 days' WHERE id = $1;",
      values: [createdVisit.id],
    });

    const summary = await visit.summaryForToday();

    expect(summary.count).toBe(2);
    expect(summary.total).toBe(15);
  });

  test("exclui uma visita de um segundo antes da meia-noite em São Paulo", async () => {
    const createdClient = await client.create({ name: "Cliente Fronteira", phone: "11944441003" });

    const createdVisit = await orchestrator.createVisit({
      clientId: createdClient.id,
      registeredBy: null,
      amountSpent: 77,
      orderCategories: ["sorvete"],
      reason: "outro",
      discoverySource: "outro",
    });

    await database.query({
      text: `
        UPDATE visits
        SET created_at =
          date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo')
            AT TIME ZONE 'America/Sao_Paulo'
          - interval '1 second'
        WHERE id = $1;
      `,
      values: [createdVisit.id],
    });

    const summary = await visit.summaryForToday();

    expect(summary.count).toBe(2);
    expect(summary.total).toBe(15);
  });

  test("inclui uma visita exatamente na meia-noite em São Paulo", async () => {
    const createdClient = await client.create({ name: "Cliente Meia-noite", phone: "11944441004" });

    const createdVisit = await orchestrator.createVisit({
      clientId: createdClient.id,
      registeredBy: null,
      amountSpent: 33,
      orderCategories: ["sorvete"],
      reason: "outro",
      discoverySource: "outro",
    });

    await database.query({
      text: `
        UPDATE visits
        SET created_at =
          date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo')
            AT TIME ZONE 'America/Sao_Paulo'
        WHERE id = $1;
      `,
      values: [createdVisit.id],
    });

    const summary = await visit.summaryForToday();

    expect(summary.count).toBe(3);
    expect(summary.total).toBe(48);
  });

  test("conta quem passou e não entrou no total, mas não em `entered`", async () => {
    await orchestrator.createVisit({
      registeredBy: null,
      enteredStore: false,
      sawProducts: false,
      purchased: false,
    });

    const summary = await visit.summaryForToday();

    expect(summary.count).toBe(4);
    expect(summary.entered).toBe(3);
    expect(summary.total).toBe(48);
  });
});
