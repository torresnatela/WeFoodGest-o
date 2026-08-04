import { cookies } from "next/headers";

import authentication from "@/models/authentication";
import client from "@/models/client";
import visit from "@/models/visit";

export async function GET(request, { params }) {
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

  const { id } = await params;
  const foundClient = await client.findById(id);

  if (!foundClient) {
    return Response.json(
      {
        message: "Cliente não encontrado.",
        action: "Verifique se o cliente informado existe.",
      },
      { status: 404 },
    );
  }

  const visits = await visit.findByClientId(id);

  return Response.json({ client: foundClient, visits });
}
