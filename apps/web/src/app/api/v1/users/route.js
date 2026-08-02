import { cookies } from "next/headers";

import authentication from "@/models/authentication";
import authorization from "@/models/authorization";
import user from "@/models/user";
import { ValidationError, NotFoundError } from "@/infra/errors";

const MANAGE_USERS_FEATURE = "usuarios.gerenciar";

async function requireUserManager() {
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

  if (!authorization.userCan(authenticatedUser, MANAGE_USERS_FEATURE)) {
    return {
      deniedResponse: Response.json(
        {
          message: "Você não tem permissão para executar esta ação.",
          action: "Solicite acesso a um administrador.",
        },
        { status: 403 },
      ),
    };
  }

  return { authenticatedUser };
}

export async function POST(request) {
  const { deniedResponse, authenticatedUser } = await requireUserManager();
  if (deniedResponse) {
    return deniedResponse;
  }

  const { name, email, role } = await request.json();

  let createdUser;
  let inviteToken;
  try {
    ({ user: createdUser, inviteToken } = await user.createInvite({
      name,
      email,
      roleKey: role,
      invitedBy: authenticatedUser.id,
    }));
  } catch (error) {
    if (error instanceof ValidationError) {
      return Response.json({ message: error.message, action: error.action }, { status: 400 });
    }
    if (error instanceof NotFoundError) {
      return Response.json({ message: error.message, action: error.action }, { status: 404 });
    }
    throw error;
  }

  const inviteUrl = new URL(`/cadastro/${inviteToken}`, request.nextUrl.origin).toString();

  return Response.json(
    {
      user: {
        id: createdUser.id,
        name: createdUser.name,
        email: createdUser.email,
        status: createdUser.status,
      },
      invite: {
        url: inviteUrl,
        expires_at: createdUser.invite_token_expires_at,
      },
    },
    { status: 201 },
  );
}

export async function GET() {
  const { deniedResponse } = await requireUserManager();
  if (deniedResponse) {
    return deniedResponse;
  }

  const users = await user.findAll();

  return Response.json({ users });
}
