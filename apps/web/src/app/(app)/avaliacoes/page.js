import requireAuthenticatedUser from "../../require-auth";
import review from "@/models/review";
import Badge from "@/components/ui/badge";
import Card from "@/components/ui/card";
import EmptyState from "@/components/ui/empty-state";
import { formatRelativeDate } from "@/lib/format";

// `role="img"` porque um <span> é `role="generic"`, e ARIA proíbe nome
// acessível em genérico: o leitor de tela cairia nos glifos crus. A nota vai
// no rótulo sem arredondar — os glifos é que arredondam.
function Stars({ rating }) {
  const filledCount = Math.round(rating);
  const label = Number(rating).toLocaleString("pt-BR", { maximumFractionDigits: 1 });

  return (
    <span role="img" aria-label={`Nota ${label} de 5`} className="text-lg leading-none">
      <span aria-hidden="true" className="text-accent">
        {"★".repeat(filledCount)}
      </span>
      <span aria-hidden="true" className="text-line">
        {"☆".repeat(5 - filledCount)}
      </span>
    </span>
  );
}

export default async function AvaliacoesPage() {
  await requireAuthenticatedUser();

  const summary = await review.getSummary();
  const reviews = await review.findAll();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Avaliações</h1>
        <p className="text-sm text-muted">
          Link público do QR code da loja: <span className="font-mono">/avaliar</span>
        </p>
      </div>

      {summary.total === 0 ? (
        <EmptyState
          icon="⭐"
          title="Nenhuma avaliação ainda"
          description="Deixe o QR code da loja apontando para /avaliar e as notas dos clientes aparecem aqui."
        />
      ) : (
        <>
          <Card className="flex items-center gap-4 p-6">
            <p className="font-display text-4xl font-extrabold text-ink">
              {summary.average.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
            </p>
            <div>
              <Stars rating={summary.average} />
              <p className="text-sm text-muted">
                {summary.total === 1 ? "1 avaliação" : `${summary.total} avaliações`}
              </p>
            </div>
          </Card>

          <ul className="flex flex-col gap-3">
            {reviews.map((listedReview) => (
              <Card as="li" key={listedReview.id} className="flex flex-col gap-2 p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <Stars rating={listedReview.rating} />
                  <Badge tone="neutral">{formatRelativeDate(listedReview.created_at)}</Badge>
                </div>
                {listedReview.comment && (
                  <p className="text-sm text-ink">{listedReview.comment}</p>
                )}
              </Card>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
