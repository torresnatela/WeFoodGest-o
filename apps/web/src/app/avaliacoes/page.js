import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import authentication from "@/models/authentication";
import review from "@/models/review";

function formatStars(rating) {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

export default async function AvaliacoesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_id")?.value;
  const authenticatedUser = await authentication.getUserFromSessionToken(token);

  if (!authenticatedUser) {
    redirect("/login");
  }

  const summary = await review.getSummary();
  const reviews = await review.findAll();

  return (
    <div className="flex flex-1 flex-col items-center gap-8 bg-zinc-50 px-4 py-16 dark:bg-black">
      <div className="flex w-full max-w-2xl flex-col gap-8">
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">Avaliações</h1>

        <div className="rounded-lg border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
          {summary.total === 0 ? (
            <p className="text-zinc-600 dark:text-zinc-400">Nenhuma avaliação ainda.</p>
          ) : (
            <p className="text-black dark:text-zinc-50">
              <span className="text-2xl font-semibold">
                {summary.average.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} de 5
              </span>
              <span className="ml-2 text-sm text-zinc-600 dark:text-zinc-400">
                {summary.total === 1 ? "1 avaliação" : `${summary.total} avaliações`}
              </span>
            </p>
          )}
        </div>

        <ul className="flex flex-col gap-3">
          {reviews.map((listedReview) => (
            <li
              key={listedReview.id}
              className="flex flex-col gap-2 rounded-lg border border-black/[.08] bg-white p-4 dark:border-white/[.145] dark:bg-zinc-950"
            >
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-amber-400" aria-label={`Nota ${listedReview.rating} de 5`}>
                  {formatStars(listedReview.rating)}
                </span>
                <span className="text-xs text-zinc-600 dark:text-zinc-400">
                  {new Date(listedReview.created_at).toLocaleString("pt-BR")}
                </span>
              </div>
              {listedReview.comment && (
                <p className="text-sm text-black dark:text-zinc-50">{listedReview.comment}</p>
              )}
            </li>
          ))}
        </ul>

        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          Link público para o QR code da loja: <span className="font-mono">/avaliar</span>
        </p>
      </div>
    </div>
  );
}
