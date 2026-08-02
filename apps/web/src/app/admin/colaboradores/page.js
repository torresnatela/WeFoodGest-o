import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";

import authentication from "@/models/authentication";
import authorization from "@/models/authorization";
import user from "@/models/user";
import NewUserForm from "./new-user-form";

const MANAGE_USERS_FEATURE = "usuarios.gerenciar";

const STATUS_LABELS = {
  active: "Ativo",
  pending: "Pendente",
};

export default async function ColaboradoresPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_id")?.value;
  const authenticatedUser = await authentication.getUserFromSessionToken(token);

  if (!authenticatedUser) {
    redirect("/login");
  }

  if (!authorization.userCan(authenticatedUser, MANAGE_USERS_FEATURE)) {
    notFound();
  }

  const users = await user.findAll();

  return (
    <div className="flex flex-1 flex-col items-center gap-8 bg-zinc-50 px-4 py-16 dark:bg-black">
      <div className="flex w-full max-w-2xl flex-col gap-8">
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">Colaboradores</h1>

        <NewUserForm />

        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/[.08] text-zinc-600 dark:border-white/[.145] dark:text-zinc-400">
              <th className="py-2 font-medium">Nome</th>
              <th className="py-2 font-medium">Email</th>
              <th className="py-2 font-medium">Role</th>
              <th className="py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((listedUser) => (
              <tr
                key={listedUser.id}
                className="border-b border-black/[.08] text-black dark:border-white/[.145] dark:text-zinc-50"
              >
                <td className="py-2">{listedUser.name}</td>
                <td className="py-2">{listedUser.email}</td>
                <td className="py-2">{listedUser.role.name}</td>
                <td className="py-2">{STATUS_LABELS[listedUser.status] ?? listedUser.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
