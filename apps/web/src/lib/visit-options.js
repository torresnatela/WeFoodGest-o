export const CATEGORY_OPTIONS = [
  { value: "sorvete", label: "Sorvete" },
  { value: "milkshake", label: "Milkshake" },
  { value: "lanche", label: "Lanche" },
  { value: "bebida", label: "Bebida" },
  { value: "sobremesa", label: "Sobremesa" },
  { value: "outro", label: "Outro" },
];

export const REASON_OPTIONS = [
  { value: "vontade_comer_beber", label: "Vontade de comer/beber algo" },
  { value: "programa_familia_amigos", label: "Programa com família/amigos" },
  { value: "comemoracao", label: "Comemoração (aniversário etc)" },
  { value: "passando_em_frente", label: "Passando em frente por acaso" },
  { value: "outro", label: "Outro" },
];

export const DISCOVERY_OPTIONS = [
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

export const CATEGORY_LABELS = toLabelMap(CATEGORY_OPTIONS);
export const REASON_LABELS = toLabelMap(REASON_OPTIONS);
export const DISCOVERY_LABELS = toLabelMap(DISCOVERY_OPTIONS);

// Strings literais: o Tailwind precisa encontrar cada classe no código-fonte.
export const CATEGORY_CHIP_CLASSES = {
  sorvete: "bg-cat-sorvete-bg text-cat-sorvete-fg",
  milkshake: "bg-cat-milkshake-bg text-cat-milkshake-fg",
  lanche: "bg-cat-lanche-bg text-cat-lanche-fg",
  bebida: "bg-cat-bebida-bg text-cat-bebida-fg",
  sobremesa: "bg-cat-sobremesa-bg text-cat-sobremesa-fg",
  outro: "bg-cat-outro-bg text-cat-outro-fg",
};
