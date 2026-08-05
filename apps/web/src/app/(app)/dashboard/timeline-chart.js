import bucketLabel from "./bucket-label";
import { formatCurrency } from "@/lib/format";

export default function TimelineChart({ points, granularity }) {
  const tallest = Math.max(...points.map((point) => point.visits), 0);

  return (
    <ul className="flex items-end gap-1 overflow-x-auto pb-2">
      {points.map((point) => (
        <li key={point.bucket} className="flex min-w-6 flex-1 flex-col items-center gap-1">
          <span className="text-xs text-muted">{point.visits}</span>
          <div
            className="w-full rounded-sm bg-brand-vivid"
            style={{ height: `${tallest === 0 ? 2 : Math.max((point.visits / tallest) * 96, 2)}px` }}
          />
          <span className="text-xs whitespace-nowrap text-muted">
            {bucketLabel(point.bucket, granularity)}
          </span>
          <span className="sr-only">{formatCurrency(point.revenue)}</span>
        </li>
      ))}
    </ul>
  );
}
