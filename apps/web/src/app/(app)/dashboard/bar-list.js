import EmptyState from "@/components/ui/empty-state";

export default function BarList({ items }) {
  if (items.length === 0) {
    return <EmptyState title="Sem dados no período" />;
  }

  // Bars are scaled against the largest row, not the total, so the comparison
  // stays readable when even the top row is only a small share of visits.
  const largest = Math.max(...items.map((item) => item.value));

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.key} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-4 text-sm">
            <span className="text-ink">{item.label}</span>
            <span className="text-muted">
              {item.value}
              {item.percentage === undefined ? "" : ` · ${item.percentage}%`}
              {item.note ? ` · ${item.note}` : ""}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-pill bg-surface-2">
            <div
              className={`h-full rounded-pill ${item.className ?? "bg-brand-vivid"}`}
              style={{ width: `${largest === 0 ? 0 : (item.value / largest) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
