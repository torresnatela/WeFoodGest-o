import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import authentication from "@/models/authentication";

export default async function requireAuthenticatedUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_id")?.value;
  const authenticatedUser = await authentication.getUserFromSessionToken(token);

  if (!authenticatedUser) {
    redirect("/login");
  }

  return authenticatedUser;
}
