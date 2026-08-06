import { cookies } from "next/headers";

import authentication from "@/models/authentication";
import visit from "@/models/visit";
import { ValidationError, NotFoundError } from "@/infra/errors";

// Duas rotas criam visita: esta pasta (canônica, cliente opcional no corpo) e
// /api/v1/clients/[id]/visits (a ficha do cliente já sabe quem é). Só existe
// um corpo de handler para elas não divergirem — quando a validação mudar de
// um lado, muda dos dois.
//
// `clientId` ausente significa "leia do corpo"; presente, o caminho da URL
// manda e o client_id do corpo é ignorado.
export default async function createVisit(request, { clientId } = {}) {
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

  const {
    client_id: bodyClientId,
    entered_store: enteredStore,
    saw_products: sawProducts,
    purchased,
    amount_spent: amountSpent,
    order_categories: orderCategories,
    order_details: orderDetails,
    reason,
    reason_details: reasonDetails,
    discovery_source: discoverySource,
    discovery_details: discoveryDetails,
  } = await request.json();

  try {
    const createdVisit = await visit.create({
      clientId: clientId !== undefined ? clientId : (bodyClientId ?? null),
      registeredBy: authenticatedUser.id,
      enteredStore,
      sawProducts,
      purchased,
      // O model tem default para o que virou opcional, mas um corpo JSON pode
      // mandar `null` explícito, e `null` não dispara default de parâmetro.
      amountSpent: amountSpent ?? 0,
      orderCategories: orderCategories ?? [],
      orderDetails,
      reason: reason ?? null,
      reasonDetails,
      discoverySource: discoverySource ?? null,
      discoveryDetails,
    });

    return Response.json(createdVisit, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError) {
      return Response.json({ message: error.message, action: error.action }, { status: 400 });
    }
    if (error instanceof NotFoundError) {
      return Response.json({ message: error.message, action: error.action }, { status: 404 });
    }
    throw error;
  }
}
