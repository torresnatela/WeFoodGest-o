import { cookies } from "next/headers";

import authentication from "@/models/authentication";
import authorization from "@/models/authorization";
import role from "@/models/role";

const MANAGE_USERS_FEATURE = "usuarios.gerenciar";

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

  if (!authorization.userCan(authenticatedUser, MANAGE_USERS_FEATURE)) {
    return Response.json(
      {
        message: "Você não tem permissão para executar esta ação.",
        action: "Solicite acesso a um administrador.",
      },
      { status: 403 },
    );
  }

  const roles = await role.findAll();

  return Response.json({
    roles: roles.map((currentRole) => ({ key: currentRole.key, name: currentRole.name })),
  });
}
