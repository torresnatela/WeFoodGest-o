import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

import authentication from "@/models/authentication";
import client from "@/models/client";

export default async function ClientesPage({ searchParams }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_id")?.value;
  const authenticatedUser = await authentication.getUserFromSessionToken(token);

  if (!authenticatedUser) {
    redirect("/login");
  }

  const { search } = await searchParams;
  const clients = await client.search({ name: search });

  return (
    <div className="flex flex-1 flex-col items-center gap-8 bg-zinc-50 px-4 py-16 dark:bg-black">
      <div className="flex w-full max-w-2xl flex-col gap-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">Clientes</h1>
          <Link
            href="/clientes/novo"
            className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            Novo cliente
          </Link>
        </div>

        <form className="flex gap-2">
          <input
            type="text"
            name="search"
            defaultValue={search ?? ""}
            placeholder="Buscar por nome"
            className="flex-1 rounded-md border border-black/[.08] px-3 py-2 text-black dark:border-white/[.145] dark:text-zinc-50"
          />
          <button
            type="submit"
            className="rounded-full border border-black/[.08] px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:text-zinc-50 dark:hover:bg-[#1a1a1a]"
          >
            Buscar
          </button>
        </form>

        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/[.08] text-zinc-600 dark:border-white/[.145] dark:text-zinc-400">
              <th className="py-2 font-medium">Nome</th>
              <th className="py-2 font-medium">Telefone</th>
              <th className="py-2 font-medium">Bairro</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((listedClient) => (
              <tr
                key={listedClient.id}
                className="border-b border-black/[.08] text-black dark:border-white/[.145] dark:text-zinc-50"
              >
                <td className="py-2">
                  <Link href={`/clientes/${listedClient.id}`} className="underline">
                    {listedClient.name}
                  </Link>
                </td>
                <td className="py-2">{listedClient.phone}</td>
                <td className="py-2">{listedClient.neighborhood ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
