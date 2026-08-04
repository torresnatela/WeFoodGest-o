import { cookies } from "next/headers";

import authentication from "@/models/authentication";
import visit from "@/models/visit";
import { ValidationError, NotFoundError } from "@/infra/errors";

export async function POST(request, { params }) {
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

  const {
    amount_spent: amountSpent,
    order_categories: orderCategories,
    order_details: orderDetails,
    reason,
    reason_details: reasonDetails,
    discovery_source: discoverySource,
    discovery_details: discoveryDetails,
  } = await request.json();

  if (amountSpent === undefined || amountSpent === null || !reason || !discoverySource) {
    return Response.json(
      {
        message: "Valor gasto, motivo e origem são obrigatórios.",
        action: "Preencha o valor gasto, o motivo e a origem da visita.",
      },
      { status: 400 },
    );
  }

  let createdVisit;
  try {
    createdVisit = await visit.create({
      clientId: id,
      registeredBy: authenticatedUser.id,
      amountSpent,
      orderCategories,
      orderDetails,
      reason,
      reasonDetails,
      discoverySource,
      discoveryDetails,
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return Response.json({ message: error.message, action: error.action }, { status: 400 });
    }
    if (error instanceof NotFoundError) {
      return Response.json({ message: error.message, action: error.action }, { status: 404 });
    }
    throw error;
  }

  return Response.json(createdVisit, { status: 201 });
}
