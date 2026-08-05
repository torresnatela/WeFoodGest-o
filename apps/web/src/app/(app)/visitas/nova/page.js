import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import authentication from "@/models/authentication";
import client from "@/models/client";
import RegisterVisitFlow from "./register-visit-flow";

export default async function NovaVisitaPage({ searchParams }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_id")?.value;
  const authenticatedUser = await authentication.getUserFromSessionToken(token);

  if (!authenticatedUser) {
    redirect("/login");
  }

  const { clientId } = await searchParams;
  const initialClient = clientId ? await client.findById(clientId) : null;

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-black">
      <RegisterVisitFlow initialClient={initialClient} />
    </div>
  );
}
