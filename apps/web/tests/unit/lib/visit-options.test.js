const {
  CATEGORY_OPTIONS,
  REASON_OPTIONS,
  DISCOVERY_OPTIONS,
  CATEGORY_LABELS,
  REASON_LABELS,
  DISCOVERY_LABELS,
  CATEGORY_CHIP_CLASSES,
} = require("@/lib/visit-options");

// These lists mirror the CHECK constraints in
// packages/database/migrations/1785801391247_create-clients-and-visits-tables.js
// If a constraint changes, this test is the thing that should fail first.
const CATEGORY_VALUES = ["sorvete", "milkshake", "lanche", "bebida", "sobremesa", "outro"];
const REASON_VALUES = [
  "vontade_comer_beber",
  "programa_familia_amigos",
  "comemoracao",
  "passando_em_frente",
  "outro",
];
const DISCOVERY_VALUES = [
  "instagram",
  "indicacao",
  "google_internet",
  "passou_em_frente",
  "cliente_antigo",
  "outro",
];

describe("lib/visit-options", () => {
  test("covers exactly the values allowed by the database CHECK constraints", () => {
    expect(CATEGORY_OPTIONS.map((option) => option.value)).toEqual(CATEGORY_VALUES);
    expect(REASON_OPTIONS.map((option) => option.value)).toEqual(REASON_VALUES);
    expect(DISCOVERY_OPTIONS.map((option) => option.value)).toEqual(DISCOVERY_VALUES);
  });

  test("gives every value a non-empty Portuguese label", () => {
    for (const option of [...CATEGORY_OPTIONS, ...REASON_OPTIONS, ...DISCOVERY_OPTIONS]) {
      expect(typeof option.label).toBe("string");
      expect(option.label.length).toBeGreaterThan(0);
    }
  });

  test("exposes label maps keyed by value", () => {
    expect(CATEGORY_LABELS.sorvete).toBe("Sorvete");
    expect(REASON_LABELS.comemoracao).toBe("Comemoração (aniversário etc)");
    expect(DISCOVERY_LABELS.instagram).toBe("Instagram/Redes sociais");
  });

  test("gives every category value a non-empty chip class string", () => {
    for (const option of CATEGORY_OPTIONS) {
      expect(typeof CATEGORY_CHIP_CLASSES[option.value]).toBe("string");
      expect(CATEGORY_CHIP_CLASSES[option.value].length).toBeGreaterThan(0);
    }
  });
});
