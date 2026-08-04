import { cookies } from "next/headers";

import authentication from "@/models/authentication";
import client from "@/models/client";
import { ValidationError } from "@/infra/errors";

async function requireAuthenticatedUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_id")?.value;

  const authenticatedUser = await authentication.getUserFromSessionToken(token);

  if (!authenticatedUser) {
    return {
      deniedResponse: Response.json(
        {
          message: "Usuário não autenticado.",
          action: "Faça login para continuar.",
        },
        { status: 401 },
      ),
    };
  }

  return { authenticatedUser };
}

export async function GET(request) {
  const { deniedResponse } = await requireAuthenticatedUser();
  if (deniedResponse) {
    return deniedResponse;
  }

  const searchParams = request.nextUrl.searchParams;
  const phone = searchParams.get("phone");

  if (phone) {
    const foundClient = await client.findByPhone(phone);
    return Response.json({ clients: foundClient ? [foundClient] : [] });
  }

  const clients = await client.search({ name: searchParams.get("search") });
  return Response.json({ clients });
}

export async function POST(request) {
  const { deniedResponse } = await requireAuthenticatedUser();
  if (deniedResponse) {
    return deniedResponse;
  }

  const { name, phone, birth_date: birthDate, neighborhood, city } = await request.json();

  if (!name || !phone) {
    return Response.json(
      {
        message: "Nome e telefone são obrigatórios.",
        action: "Preencha o nome e o telefone do cliente.",
      },
      { status: 400 },
    );
  }

  let createdClient;
  try {
    createdClient = await client.create({ name, phone, birthDate, neighborhood, city });
  } catch (error) {
    if (error instanceof ValidationError) {
      return Response.json({ message: error.message, action: error.action }, { status: 400 });
    }
    throw error;
  }

  return Response.json(createdClient, { status: 201 });
}
