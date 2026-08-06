import Link from "next/link";
import { notFound } from "next/navigation";

import requireAuthenticatedUser from "../../../require-auth";
import client from "@/models/client";
import visit from "@/models/visit";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import EmptyState from "@/components/ui/empty-state";
import { formatCurrency, formatPhone, formatRelativeDate } from "@/lib/format";
import {
  CATEGORY_CHIP_CLASSES,
  CATEGORY_LABELS,
  DISCOVERY_LABELS,
  REASON_LABELS,
} from "@/lib/visit-options";

// Uma visita com compra é a que o card já sabia mostrar (categorias e valor).
// As outras precisam dizer em que ponto do funil pararam, senão aparecem como
// uma visita normal de R$ 0,00 sem nenhum pedido.
function funnelLabel(currentVisit) {
  if (!currentVisit.entered_store) {
    return "Não entrou";
  }
  if (!currentVisit.saw_products) {
    return "Entrou, não viu os produtos";
  }
  if (!currentVisit.purchased) {
    return "Não comprou";
  }
  return null;
}

export default async function ClienteDetailPage({ params }) {
  await requireAuthenticatedUser();

  const { id } = await params;
  const foundClient = await client.findById(id);

  if (!foundClient) {
    notFound();
  }

  const visits = await visit.findByClientId(id);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">{foundClient.name}</h1>
          <p className="text-sm text-muted">
            {formatPhone(foundClient.phone)}
            {foundClient.neighborhood ? ` · ${foundClient.neighborhood}` : ""}
            {foundClient.city ? `, ${foundClient.city}` : ""}
          </p>
          <div className="mt-2 flex gap-2">
            <Badge tone="brand">
              {visits.length} {visits.length === 1 ? "visita" : "visitas"}
            </Badge>
            {visits.length > 0 && (
              <Badge tone="neutral">Última {formatRelativeDate(visits[0].created_at)}</Badge>
            )}
          </div>
        </div>
        <Button as={Link} href={`/visitas/nova?clientId=${foundClient.id}`}>
          Registrar visita
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-bold text-ink">Histórico de visitas</h2>

        {visits.length === 0 ? (
          <EmptyState
            title="Nenhuma visita registrada"
            description="Quando este cliente vier à loja, registre a visita para começar o histórico."
          />
        ) : (
          visits.map((currentVisit) => (
            <Card key={currentVisit.id} className="flex flex-col gap-3 p-4">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-ink">
                  {formatRelativeDate(currentVisit.created_at)}
                  <span className="ml-2 font-normal text-muted">
                    {new Date(currentVisit.created_at).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "America/Sao_Paulo",
                    })}
                  </span>
                </p>
                {currentVisit.purchased ? (
                  <p className="text-lg font-extrabold text-ink">
                    {formatCurrency(currentVisit.amount_spent)}
                  </p>
                ) : (
                  <Badge tone="neutral">{funnelLabel(currentVisit)}</Badge>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {currentVisit.order_categories.map((category) => (
                  <span
                    key={category}
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${CATEGORY_CHIP_CLASSES[category]}`}
                  >
                    {CATEGORY_LABELS[category]}
                  </span>
                ))}
              </div>

              {currentVisit.order_details && (
                <p className="text-sm text-muted">{currentVisit.order_details}</p>
              )}

              <dl className="grid grid-cols-1 gap-1 border-t border-line pt-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted">Motivo</dt>
                  <dd className="text-ink">
                    {REASON_LABELS[currentVisit.reason] ?? "Não informado"}
                    {currentVisit.reason_details ? ` — ${currentVisit.reason_details}` : ""}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted">Origem</dt>
                  <dd className="text-ink">
                    {DISCOVERY_LABELS[currentVisit.discovery_source] ?? "Não informado"}
                    {currentVisit.discovery_details ? ` — ${currentVisit.discovery_details}` : ""}
                  </dd>
                </div>
              </dl>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
