import Link from "next/link";

import { PERIODS } from "@/models/dashboard";

export default function PeriodFilter({ activeKey }) {
  return (
    <nav className="flex flex-wrap gap-2" aria-label="Período">
      {PERIODS.map((period) => {
        const isActive = period.key === activeKey;

        return (
          <Link
            key={period.key}
            href={`/dashboard?periodo=${period.key}`}
            aria-current={isActive ? "page" : undefined}
            className={
              isActive
                ? "rounded-full bg-brand px-4 py-2 text-sm font-medium text-on-brand"
                : "rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-ink"
            }
          >
            {period.label}
          </Link>
        );
      })}
    </nav>
  );
}
