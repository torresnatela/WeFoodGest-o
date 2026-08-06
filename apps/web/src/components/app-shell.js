import Link from "next/link";

import Button from "./ui/button";
import Logo from "./ui/logo";
import LogoutButton from "./logout-button";
import NavLink from "./nav-link";

// Estes três são a nav inferior do celular — o esqueleto escolhido fixou três itens.
const PRIMARY_NAV = [
  { href: "/", label: "Início", icon: "🏠" },
  { href: "/clientes", label: "Clientes", icon: "👥" },
  { href: "/avaliacoes", label: "Avaliações", icon: "⭐" },
];

export default function AppShell({
  user,
  canManageUsers = false,
  canViewDashboard = false,
  children,
}) {
  const sidebarItems = [
    PRIMARY_NAV[0],
    ...(canViewDashboard ? [{ href: "/dashboard", label: "Dashboard", icon: "📊" }] : []),
    ...PRIMARY_NAV.slice(1),
    ...(canManageUsers
      ? [{ href: "/admin/colaboradores", label: "Colaboradores", icon: "🧑‍🍳" }]
      : []),
  ];

  return (
    <div className="flex min-h-full flex-1 flex-col lg:flex-row">
      {/* Primeiro elemento focável da página: sem ele, chegar ao conteúdo pelo
          teclado custa a marca, o CTA, quatro links e o botão de sair. */}
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:inline-flex focus:min-h-11 focus:items-center focus:rounded-full focus:bg-brand focus:px-5 focus:text-sm focus:font-bold focus:text-on-brand"
      >
        Pular para o conteúdo
      </a>

      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-surface p-4 lg:flex">
        <Logo className="mb-6 w-32" />
        <Button as={Link} href="/visitas/nova" className="mb-6 w-full text-center">
          Registrar visita
        </Button>
        <nav aria-label="Navegação lateral" className="flex flex-col gap-1">
          {sidebarItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              className="flex min-h-11 items-center rounded-md px-3 text-sm hover:bg-surface-2"
              activeClassName="bg-brand-tint font-bold text-brand"
              inactiveClassName="font-medium text-muted hover:text-ink"
            >
              <span aria-hidden="true" className="mr-2">
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-1 border-t border-line pt-4">
          <p className="text-sm font-semibold text-ink">{user.name}</p>
          <LogoutButton className="text-left" />
        </div>
      </aside>

      <header className="flex items-center justify-between border-b border-line bg-surface px-4 py-3 lg:hidden">
        <Logo className="w-28" />
        <LogoutButton />
      </header>

      <main id="conteudo" className="flex min-w-0 flex-1 flex-col pb-24 lg:pb-0">
        {children}
      </main>

      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        {PRIMARY_NAV.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            className="flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs"
            activeClassName="font-bold text-brand"
            inactiveClassName="font-medium text-muted"
          >
            <span aria-hidden="true" className="text-lg">
              {item.icon}
            </span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
