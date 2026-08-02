import { cookies } from "next/headers";

import authentication from "@/models/authentication";
import session from "@/models/session";
import { UnauthorizedError } from "@/infra/errors";

const SESSION_COOKIE_NAME = "session_id";

export async function POST(request) {
  const { email, password } = await request.json();

  let authenticatedUser;
  try {
    authenticatedUser = await authentication.getAuthenticatedUser(email, password);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return Response.json({ message: error.message, action: error.action }, { status: 401 });
    }
    throw error;
  }

  const newSession = await session.create(authenticatedUser.id);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, newSession.token, {
    path: "/",
    maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  return Response.json(
    {
      id: newSession.id,
      expires_at: newSession.expires_at,
      created_at: newSession.created_at,
      updated_at: newSession.updated_at,
    },
    { status: 201 },
  );
}

export async function DELETE() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  const currentSession = token ? await session.findOneValidByToken(token) : null;

  if (!currentSession) {
    return Response.json(
      {
        message: "Nenhuma sessão ativa foi encontrada.",
        action: "Faça login novamente.",
      },
      { status: 401 },
    );
  }

  const expiredSession = await session.expireById(currentSession.id);

  cookieStore.set(SESSION_COOKIE_NAME, "", {
    path: "/",
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  return Response.json({
    id: expiredSession.id,
    expires_at: expiredSession.expires_at,
    updated_at: expiredSession.updated_at,
  });
}
