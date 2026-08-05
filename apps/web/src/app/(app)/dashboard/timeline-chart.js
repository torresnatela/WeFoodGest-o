import bucketLabel from "./bucket-label";
import { formatCurrency } from "@/lib/format";

const PLOT_HEIGHT = 96;

// Uma barra vazia ainda desenha 2px para o período aparecer no gráfico em vez
// de sumir.
function barHeight(value, largest) {
  if (largest === 0) {
    return 2;
  }

  return Math.max((value / largest) * PLOT_HEIGHT, 2);
}

export default function TimelineChart({ points, granularity }) {
  const mostVisits = Math.max(...points.map((point) => point.visits), 0);
  const mostRevenue = Math.max(...points.map((point) => point.revenue), 0);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted">
        Cada período traz duas barras: visitas à esquerda, faturamento à direita. As duas séries têm
        escalas próprias, então compare cada barra com as da mesma série — não a de visitas com a de
        faturamento ao lado.
      </p>
      {/*
        A lista rola sozinha na horizontal: com 30 períodos e o valor em reais
        escrito por extenso embaixo de cada um, a largura mínima passa muito da
        tela. Quem contém isso na página é o [contain:inline-size] da <section>.

        Cada <li> vai sem min-width de propósito. Um min-w-* substituiria o
        min-width:auto do item flex — e é justamente esse auto (= largura
        min-content) que impede a coluna de encolher abaixo do próprio texto e
        deixar "semana de 04/05" invadir a coluna vizinha.
      */}
      <ul className="flex items-end gap-2 overflow-x-auto pb-2">
        {points.map((point) => (
          <li key={point.bucket} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-24 w-full items-end justify-center gap-1">
              <div
                className="w-2.5 shrink-0 rounded-sm bg-brand-vivid"
                style={{ height: `${barHeight(point.visits, mostVisits)}px` }}
              />
              <div
                className="w-2.5 shrink-0 rounded-sm bg-ink"
                style={{ height: `${barHeight(point.revenue, mostRevenue)}px` }}
              />
            </div>
            <span className="text-xs whitespace-nowrap text-muted">
              {bucketLabel(point.bucket, granularity)}
            </span>
            <span className="text-xs whitespace-nowrap text-ink">
              {point.visits} {point.visits === 1 ? "visita" : "visitas"}
            </span>
            <span className="text-xs whitespace-nowrap text-ink">
              {formatCurrency(point.revenue)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
