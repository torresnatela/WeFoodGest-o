const orchestrator = require("../../../orchestrator");
const client = require("@/models/client");

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe("client.create()", () => {
  test("creates a client with only name and phone", async () => {
    const createdClient = await client.create({
      name: "Cliente de teste",
      phone: "11999990001",
    });

    expect(createdClient.id).toBeDefined();
    expect(createdClient.name).toBe("Cliente de teste");
    expect(createdClient.phone).toBe("11999990001");
    expect(createdClient.birth_date).toBeNull();
  });

  test("creates a client with all fields", async () => {
    const createdClient = await client.create({
      name: "Cliente Completo",
      phone: "11999990002",
      birthDate: "1990-05-10",
      neighborhood: "Centro",
      city: "São Paulo",
    });

    expect(createdClient.neighborhood).toBe("Centro");
    expect(createdClient.city).toBe("São Paulo");
  });

  test("stores only the digits of a formatted phone", async () => {
    const createdClient = await client.create({
      name: "Cliente Formatado",
      phone: "(15) 99123-4001",
    });

    expect(createdClient.phone).toBe("15991234001");
  });

  test("rejects a duplicate phone", async () => {
    await client.create({ name: "Primeiro Cliente", phone: "11999990003" });

    await expect(
      client.create({ name: "Segundo Cliente", phone: "11999990003" }),
    ).rejects.toThrow("O telefone informado já está cadastrado.");
  });
});
