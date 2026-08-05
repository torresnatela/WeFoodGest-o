import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

import authentication from "@/models/authentication";
import client from "@/models/client";
import visit from "@/models/visit";

const REASON_LABELS = {
  vontade_comer_beber: "Vontade de comer/beber algo",
  programa_familia_amigos: "Programa com família/amigos",
  comemoracao: "Comemoração (aniversário etc)",
  passando_em_frente: "Passando em frente por acaso",
  outro: "Outro",
};

const DISCOVERY_LABELS = {
  instagram: "Instagram/Redes sociais",
  indicacao: "Indicação de amigo/família",
  google_internet: "Google/Internet",
  passou_em_frente: "Passou em frente e viu a loja",
  cliente_antigo: "Já é cliente antigo",
  outro: "Outro",
};

const CATEGORY_LABELS = {
  sorvete: "Sorvete",
  milkshake: "Milkshake",
  lanche: "Lanche",
  bebida: "Bebida",
  sobremesa: "Sobremesa",
  outro: "Outro",
};

export default async function ClienteDetailPage({ params }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_id")?.value;
  const authenticatedUser = await authentication.getUserFromSessionToken(token);

  if (!authenticatedUser) {
    redirect("/login");
  }

  const { id } = await params;
  const foundClient = await client.findById(id);

  if (!foundClient) {
    notFound();
  }

  const visits = await visit.findByClientId(id);

  return (
    <div className="flex flex-1 flex-col items-center gap-8 bg-zinc-50 px-4 py-16 dark:bg-black">
      <div className="flex w-full max-w-2xl flex-col gap-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">{foundClient.name}</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {foundClient.phone}
              {foundClient.neighborhood ? ` · ${foundClient.neighborhood}` : ""}
              {foundClient.city ? `, ${foundClient.city}` : ""}
            </p>
          </div>
          <Link
            href={`/visitas/nova?clientId=${foundClient.id}`}
            className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            Registrar visita
          </Link>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-black dark:text-zinc-50">Histórico de visitas</h2>

          {visits.length === 0 && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Nenhuma visita registrada ainda.</p>
          )}

          {visits.map((currentVisit) => (
            <div
              key={currentVisit.id}
              className="flex flex-col gap-1 rounded-lg border border-black/[.08] bg-white p-4 text-sm dark:border-white/[.145] dark:bg-zinc-950"
            >
              <p className="text-black dark:text-zinc-50">
                {new Date(currentVisit.created_at).toLocaleString("pt-BR")} · R${" "}
                {Number(currentVisit.amount_spent).toFixed(2)}
              </p>
              <p className="text-zinc-600 dark:text-zinc-400">
                Pedido: {currentVisit.order_categories.map((category) => CATEGORY_LABELS[category]).join(", ")}
                {currentVisit.order_details ? ` — ${currentVisit.order_details}` : ""}
              </p>
              <p className="text-zinc-600 dark:text-zinc-400">
                Motivo: {REASON_LABELS[currentVisit.reason]}
                {currentVisit.reason_details ? ` — ${currentVisit.reason_details}` : ""}
              </p>
              <p className="text-zinc-600 dark:text-zinc-400">
                Origem: {DISCOVERY_LABELS[currentVisit.discovery_source]}
                {currentVisit.discovery_details ? ` — ${currentVisit.discovery_details}` : ""}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
