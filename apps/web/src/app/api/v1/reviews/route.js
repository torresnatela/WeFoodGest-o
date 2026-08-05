import review from "@/models/review";
import { ValidationError } from "@/infra/errors";

// Public on purpose: this is the endpoint behind the /avaliar QR code, so it
// deliberately does not read the session cookie.
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      {
        message: "Não foi possível ler os dados enviados.",
        action: "Envie a avaliação novamente pelo formulário.",
      },
      { status: 400 },
    );
  }

  const { rating, comment } = body ?? {};

  let createdReview;
  try {
    createdReview = await review.create({ rating, comment });
  } catch (error) {
    if (error instanceof ValidationError) {
      return Response.json({ message: error.message, action: error.action }, { status: 400 });
    }
    throw error;
  }

  return Response.json(createdReview, { status: 201 });
}
