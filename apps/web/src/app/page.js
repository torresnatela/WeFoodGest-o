import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import authentication from "@/models/authentication";
import LogoutButton from "./logout-button";

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
        Bem-vindo, <span className="font-medium">{authenticatedUser.email}</span>
      </p>
      <LogoutButton />
    </div>
  );
}
