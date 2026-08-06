// A arte da marca chegou como bitmap de 154x46, então os PNGs são essa arte em
// 4x: dá conta de tela retina desde que nenhuma tela mostre a logo com mais de
// 154px de largura. Daí as larguras curtas nas chamadas.
export default function Logo({ className = "w-32" }) {
  return (
    <picture className={`block ${className}`}>
      {/* No tema escuro o sorriso preto some no fundo e o magenta fica ilegível.
          A variante troca essas duas tintas — por isso são duas artes, e não
          uma imagem só com filtro. */}
      <source srcSet="/logo-wefood-dark.png" media="(prefers-color-scheme: dark)" />
      <img src="/logo-wefood.png" alt="WeFood" width={616} height={184} className="h-auto w-full" />
    </picture>
  );
}
