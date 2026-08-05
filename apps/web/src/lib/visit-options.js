const CATEGORY_OPTIONS = [
  { value: "sorvete", label: "Sorvete" },
  { value: "milkshake", label: "Milkshake" },
  { value: "lanche", label: "Lanche" },
  { value: "bebida", label: "Bebida" },
  { value: "sobremesa", label: "Sobremesa" },
  { value: "outro", label: "Outro" },
];

const REASON_OPTIONS = [
  { value: "vontade_comer_beber", label: "Vontade de comer/beber algo" },
  { value: "programa_familia_amigos", label: "Programa com família/amigos" },
  { value: "comemoracao", label: "Comemoração (aniversário etc)" },
  { value: "passando_em_frente", label: "Passando em frente por acaso" },
  { value: "outro", label: "Outro" },
];

const DISCOVERY_OPTIONS = [
  { value: "instagram", label: "Instagram/Redes sociais" },
  { value: "indicacao", label: "Indicação de amigo/família" },
  { value: "google_internet", label: "Google/Internet" },
  { value: "passou_em_frente", label: "Passou em frente e viu a loja" },
  { value: "cliente_antigo", label: "Já é cliente antigo" },
  { value: "outro", label: "Outro" },
];

function toLabelMap(options) {
  return Object.fromEntries(options.map((option) => [option.value, option.label]));
}

const CATEGORY_LABELS = toLabelMap(CATEGORY_OPTIONS);
const REASON_LABELS = toLabelMap(REASON_OPTIONS);
const DISCOVERY_LABELS = toLabelMap(DISCOVERY_OPTIONS);

module.exports = {
  CATEGORY_OPTIONS,
  REASON_OPTIONS,
  DISCOVERY_OPTIONS,
  CATEGORY_LABELS,
  REASON_LABELS,
  DISCOVERY_LABELS,
};
