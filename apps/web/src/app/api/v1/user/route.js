import { cookies } from "next/headers";

import authentication from "@/models/authentication";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_id")?.value;

  const authenticatedUser = await authentication.getUserFromSessionToken(token);

  if (!authenticatedUser) {
    return Response.json(
      {
        message: "Usuário não autenticado.",
        action: "Faça login para continuar.",
      },
      { status: 401 },
    );
  }

  return Response.json({
    id: authenticatedUser.id,
    email: authenticatedUser.email,
    created_at: authenticatedUser.created_at,
    updated_at: authenticatedUser.updated_at,
  });
}
