import Link from "next/link";

import requireAuthenticatedUser from "../../require-auth";
import client from "@/models/client";
import Badge from "@/components/ui/badge";
import Card from "@/components/ui/card";
import EmptyState from "@/components/ui/empty-state";
import { formatPhone, formatRelativeDate } from "@/lib/format";
import ClientsSearch from "./clients-search";

export default async function ClientesPage({ searchParams }) {
  await requireAuthenticatedUser();

  const { search } = await searchParams;
  const clients = await client.search({ name: search });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Clientes</h1>
          <p className="text-sm text-muted">
            {clients.length} {clients.length === 1 ? "cliente" : "clientes"}
          </p>
        </div>
        <Link
          href="/clientes/novo"
          className="min-h-11 rounded-full bg-brand px-5 py-3 text-sm font-bold text-on-brand hover:bg-brand-hover"
        >
          Novo cliente
        </Link>
      </div>

      <ClientsSearch defaultValue={search ?? ""} />

      {clients.length === 0 ? (
        <EmptyState
          icon={search ? "🔎" : "🍦"}
          title={search ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
          description={
            search
              ? `Nada corresponde a "${search}". Confira a grafia ou cadastre um novo cliente.`
              : "Cadastre o primeiro cliente para começar a registrar visitas."
          }
          action={
            <Link
              href="/clientes/novo"
              className="min-h-11 rounded-full bg-brand px-5 py-3 text-sm font-bold text-on-brand hover:bg-brand-hover"
            >
              Novo cliente
            </Link>
          }
        />
      ) : (
        <>
          <div className="flex flex-col gap-2 sm:hidden">
            {clients.map((listedClient) => (
              <Card key={listedClient.id} className="flex items-center gap-3 p-4">
                <Link href={`/clientes/${listedClient.id}`} className="flex-1">
                  <p className="font-semibold text-ink">{listedClient.name}</p>
                  <p className="text-sm text-muted">
                    {formatPhone(listedClient.phone)}
                    {listedClient.neighborhood ? ` · ${listedClient.neighborhood}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Última visita: {formatRelativeDate(listedClient.last_visit_at)}
                  </p>
                </Link>
                <Badge tone="brand">{listedClient.visit_count}</Badge>
                <Link
                  href={`/visitas/nova?clientId=${listedClient.id}`}
                  aria-label={`Registrar visita de ${listedClient.name}`}
                  className="flex min-h-11 min-w-11 items-center justify-center rounded-full bg-brand-tint text-lg font-bold text-brand"
                >
                  +
                </Link>
              </Card>
            ))}
          </div>

          <Card className="hidden overflow-hidden sm:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-2 text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 font-bold">Nome</th>
                  <th scope="col" className="px-4 py-3 font-bold">Telefone</th>
                  <th scope="col" className="px-4 py-3 font-bold">Bairro</th>
                  <th scope="col" className="px-4 py-3 font-bold">Visitas</th>
                  <th scope="col" className="px-4 py-3 font-bold">Última visita</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((listedClient) => (
                  <tr key={listedClient.id} className="border-t border-line">
                    <td className="px-4 py-3">
                      <Link href={`/clientes/${listedClient.id}`} className="font-semibold text-ink hover:text-brand">
                        {listedClient.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted">{formatPhone(listedClient.phone)}</td>
                    <td className="px-4 py-3 text-muted">{listedClient.neighborhood ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge tone="brand">{listedClient.visit_count}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {formatRelativeDate(listedClient.last_visit_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
}
