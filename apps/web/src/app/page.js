import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

import authentication from "@/models/authentication";
import authorization from "@/models/authorization";
import LogoutButton from "./logout-button";

const MANAGE_USERS_FEATURE = "usuarios.gerenciar";

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_id")?.value;
  const authenticatedUser = await authentication.getUserFromSessionToken(token);

  if (!authenticatedUser) {
    redirect("/login");
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-zinc-50 dark:bg-black">
      <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">WeFood Gestão</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Bem-vindo, <span className="font-medium">{authenticatedUser.name}</span>
      </p>
      <Link
        href="/clientes"
        className="text-sm font-medium text-black underline dark:text-zinc-50"
      >
        Clientes
      </Link>
      <Link
        href="/visitas/nova"
        className="text-sm font-medium text-black underline dark:text-zinc-50"
      >
        Registrar visita
      </Link>
      <Link
        href="/avaliacoes"
        className="text-sm font-medium text-black underline dark:text-zinc-50"
      >
        Avaliações
      </Link>
      {authorization.userCan(authenticatedUser, MANAGE_USERS_FEATURE) && (
        <Link
          href="/admin/colaboradores"
          className="text-sm font-medium text-black underline dark:text-zinc-50"
        >
          Cadastrar colaborador
        </Link>
      )}
      <LogoutButton />
    </div>
  );
}
