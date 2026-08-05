import { notFound } from "next/navigation";

import requireAuthenticatedUser from "@/app/require-auth";
import authorization from "@/models/authorization";
import dashboard from "@/models/dashboard";
import { formatCurrency, formatPhone } from "@/lib/format";
import {
  CATEGORY_LABELS,
  REASON_LABELS,
  DISCOVERY_LABELS,
  CATEGORY_BAR_CLASSES,
} from "@/lib/visit-options";
import EmptyState from "@/components/ui/empty-state";
import StatCard from "./stat-card";
import BarList from "./bar-list";
import TimelineChart from "./timeline-chart";
import PeriodFilter from "./period-filter";

const VIEW_DASHBOARD_FEATURE = "dashboard.visualizar";

const MONTH_NAMES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

function labelledItems(rows, labels) {
  return rows.map((row) => ({
    key: row.value,
    label: labels[row.value] ?? row.value,
    value: row.visits,
    percentage: row.percentage,
  }));
}

export default async function DashboardPage({ searchParams }) {
  const authenticatedUser = await requireAuthenticatedUser();

  if (!authorization.userCan(authenticatedUser, VIEW_DASHBOARD_FEATURE)) {
    notFound();
  }

  const { periodo } = await searchParams;
  const range = dashboard.resolveRange(periodo);
  const overview = await dashboard.getOverview(range);

  return (
    <div className="flex w-full flex-col gap-8 px-4 py-8">
      <div className="flex flex-col gap-4">
        <h1 className="font-display text-2xl font-bold text-ink">Dashboard</h1>
        <PeriodFilter activeKey={range.key} />
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Visitas" value={overview.summary.visits} />
        <StatCard label="Faturamento" value={formatCurrency(overview.summary.revenue)} />
        <StatCard label="Ticket médio" value={formatCurrency(overview.summary.averageTicket)} />
        <StatCard label="Clientes atendidos" value={overview.summary.clientsServed} />
      </section>

      {/*
        [contain:inline-size] keeps this section's width self-contained. Without
        it, the timeline's non-wrapping row of date labels (one per bucket, up to
        90 of them) reports its full min-content width to the shared AppShell's
        <main>, which has no min-width guard — that widens <main> past the
        viewport and the whole page gains a horizontal scrollbar. Containment
        makes this section (and only this section) shrink like the rest of the
        page; the timeline itself still scrolls horizontally on its own via the
        overflow-x-auto on its list.
      */}
      <section className="flex flex-col gap-3 [contain:inline-size]">
        <h2 className="font-display text-lg font-bold text-ink">Movimento no período</h2>
        <TimelineChart points={overview.timeline} granularity={range.granularity} />
      </section>

      <section className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <div className="flex flex-1 flex-col gap-3">
          <h2 className="font-display text-lg font-bold text-ink">De onde conheceram a loja</h2>
          <BarList items={labelledItems(overview.discoverySources, DISCOVERY_LABELS)} />
        </div>
        <div className="flex flex-1 flex-col gap-3">
          <h2 className="font-display text-lg font-bold text-ink">Por que vieram</h2>
          <BarList items={labelledItems(overview.reasons, REASON_LABELS)} />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-bold text-ink">O que pediram</h2>
        <p className="text-sm text-muted">
          Uma visita pode ter mais de uma categoria, então as porcentagens somam mais de 100%. Pelo
          mesmo motivo o ticket mostrado é o da visita inteira que levou a categoria, e não o preço
          da categoria: não sabemos quanto de cada conta foi para cada item.
        </p>
        <BarList
          items={overview.categories.map((row) => ({
            key: row.value,
            label: CATEGORY_LABELS[row.value] ?? row.value,
            value: row.visits,
            percentage: row.percentage,
            note: `ticket da visita ${formatCurrency(row.averageTicket)}`,
            className: CATEGORY_BAR_CLASSES[row.value],
          }))}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-bold text-ink">Clientes</h2>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Clientes novos" value={overview.newVsReturningClients.newClients} />
          <StatCard
            label="Clientes recorrentes"
            value={overview.newVsReturningClients.returningClients}
          />
        </div>

        <h3 className="mt-4 font-display text-base font-bold text-ink">Quem mais gastou</h3>
        {/*
          A lista vem ordenada por total gasto, então a barra tem de medir
          dinheiro. Medindo visitas, o primeiro colocado ganhava a barra mais
          curta da lista.
        */}
        <BarList
          items={overview.topClients.map((row) => ({
            key: row.id,
            href: `/clientes/${row.id}`,
            label: row.name,
            value: row.revenue,
            valueLabel: formatCurrency(row.revenue),
            note: `${row.visits} ${row.visits === 1 ? "visita" : "visitas"}`,
          }))}
        />

        <h3 className="mt-4 font-display text-base font-bold text-ink">De onde vêm</h3>
        <BarList
          items={overview.neighborhoods.map((row) => ({
            key: `${row.neighborhood ?? "sem-bairro"}-${row.city ?? "sem-cidade"}`,
            // Sem bairro mas com cidade a linha ainda diz algo; cair direto em
            // "Não informado" fundia cidades diferentes na mesma linha.
            label: row.neighborhood
              ? `${row.neighborhood}${row.city ? ` — ${row.city}` : ""}`
              : (row.city ?? "Não informado"),
            value: row.visits,
          }))}
        />

        <h3 className="mt-4 font-display text-base font-bold text-ink">Visitas por colaborador</h3>
        <BarList
          items={overview.collaborators.map((row) => ({
            key: row.userId ?? "sem-colaborador",
            label: row.name ?? "Não informado",
            value: row.visits,
            note: formatCurrency(row.revenue),
          }))}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-bold text-ink">
          Aniversariantes de {MONTH_NAMES[overview.month - 1]}
        </h2>
        <p className="text-sm text-muted">Esta seção não muda com o filtro de período.</p>
        {overview.birthdays.length === 0 ? (
          <EmptyState title="Nenhum aniversariante este mês" icon="🎂" />
        ) : (
          <ul className="flex flex-col gap-2">
            {overview.birthdays.map((birthday) => (
              <li key={birthday.id} className="flex justify-between gap-4 text-sm text-ink">
                <span>{birthday.name}</span>
                <span className="text-muted">
                  dia {birthday.day} · {formatPhone(birthday.phone)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
