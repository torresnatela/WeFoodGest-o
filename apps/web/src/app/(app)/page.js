import Link from "next/link";

import requireAuthenticatedUser from "../require-auth";
import authorization from "@/models/authorization";
import visit from "@/models/visit";
import Card from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

const MANAGE_USERS_FEATURE = "usuarios.gerenciar";
const VIEW_DASHBOARD_FEATURE = "dashboard.visualizar";

export default async function Home() {
  const authenticatedUser = await requireAuthenticatedUser();
  const summary = await visit.summaryForToday();

  const shortcuts = [
    { href: "/clientes", label: "Clientes", icon: "👥" },
    { href: "/clientes/novo", label: "Novo cliente", icon: "➕" },
    { href: "/avaliacoes", label: "Avaliações", icon: "⭐" },
  ];

  // A nav inferior do celular é fixa em três itens, então sem este atalho o
  // dashboard fica inalcançável no celular — na lateral ele só existe no desktop.
  if (authorization.userCan(authenticatedUser, VIEW_DASHBOARD_FEATURE)) {
    shortcuts.unshift({ href: "/dashboard", label: "Dashboard", icon: "📊" });
  }

  if (authorization.userCan(authenticatedUser, MANAGE_USERS_FEATURE)) {
    shortcuts.push({ href: "/admin/colaboradores", label: "Colaboradores", icon: "🧑‍🍳" });
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <div>
        <p className="text-sm text-muted">Bem-vindo,</p>
        <h1 className="text-2xl font-extrabold text-ink">{authenticatedUser.name}</h1>
      </div>

      <Card className="flex divide-x divide-line">
        <div className="flex-1 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Visitas hoje</p>
          <p className="text-2xl font-extrabold text-ink">{summary.count}</p>
        </div>
        <div className="flex-1 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Faturamento</p>
          <p className="text-2xl font-extrabold text-ink">{formatCurrency(summary.total)}</p>
        </div>
      </Card>

      <Link
        href="/visitas/nova"
        className="flex flex-col gap-1 rounded-lg bg-brand p-6 text-on-brand shadow-card transition-colors hover:bg-brand-hover"
      >
        <span aria-hidden="true" className="text-3xl">
          ➕
        </span>
        <span className="text-lg font-extrabold">Registrar visita</span>
        <span className="text-sm opacity-90">Buscar o cliente pelo telefone</span>
      </Link>

      <div className="grid grid-cols-2 gap-3">
        {shortcuts.map((shortcut) => (
          <Card
            key={shortcut.href}
            as={Link}
            href={shortcut.href}
            className="flex flex-col gap-1 p-4 transition-colors hover:bg-surface-2"
          >
            <span aria-hidden="true" className="text-xl">
              {shortcut.icon}
            </span>
            <span className="text-sm font-semibold text-ink">{shortcut.label}</span>
          </Card>
        ))}
      </div>
    </div>
  );
}
