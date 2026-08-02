import { cookies } from "next/headers";

import user from "@/models/user";
import session from "@/models/session";
import { NotFoundError, ValidationError } from "@/infra/errors";

const SESSION_COOKIE_NAME = "session_id";
const MIN_PASSWORD_LENGTH = 8;

export async function GET(request, { params }) {
  const { token } = await params;

  const invitedUser = await user.findByValidInviteToken(token);

  if (!invitedUser) {
    return Response.json(
      {
        message: "Convite inválido, expirado ou já utilizado.",
        action: "Solicite um novo link de convite a um administrador.",
      },
      { status: 404 },
    );
  }

  return Response.json({
    name: invitedUser.name,
    email: invitedUser.email,
    role: invitedUser.role,
  });
}

export async function POST(request, { params }) {
  const { token } = await params;
  const { password, password_confirmation: passwordConfirmation } = await request.json();

  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return Response.json(
      {
        message: `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`,
        action: "Informe uma senha mais longa.",
      },
      { status: 400 },
    );
  }

  if (password !== passwordConfirmation) {
    return Response.json(
      {
        message: "A confirmação de senha não confere com a senha informada.",
        action: "Digite a mesma senha nos dois campos.",
      },
      { status: 400 },
    );
  }

  let activatedUser;
  try {
    activatedUser = await user.activateByInviteToken(token, password);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return Response.json({ message: error.message, action: error.action }, { status: 404 });
    }
    if (error instanceof ValidationError) {
      return Response.json({ message: error.message, action: error.action }, { status: 400 });
    }
    throw error;
  }

  const newSession = await session.create(activatedUser.id);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, newSession.token, {
    path: "/",
    maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  return Response.json({
    id: newSession.id,
    expires_at: newSession.expires_at,
    created_at: newSession.created_at,
    updated_at: newSession.updated_at,
  });
}
