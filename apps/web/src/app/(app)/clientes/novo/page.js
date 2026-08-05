import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import authentication from "@/models/authentication";
import NewClientPageForm from "./new-client-page-form";

export default async function NovoClientePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_id")?.value;
  const authenticatedUser = await authentication.getUserFromSessionToken(token);

  if (!authenticatedUser) {
    redirect("/login");
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-black">
      <div className="flex w-full max-w-sm flex-col gap-4">
        <h1 className="text-xl font-semibold text-black dark:text-zinc-50">Novo cliente</h1>
        <NewClientPageForm />
      </div>
    </div>
  );
}
