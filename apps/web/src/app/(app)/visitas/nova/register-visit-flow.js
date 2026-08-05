"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import ClientForm from "@/components/client-form";

const CATEGORY_OPTIONS = [
  { value: "sorvete", label: "Sorvete" },
  { value: "milkshake", label: "Milkshake" },
  { value: "lanche", label: "Lanche" },
  { value: "bebida", label: "Bebida" },
  { value: "sobremesa", label: "Sobremesa" },
  { value: "outro", label: "Outro" },
];

const REASON_OPTIONS = [
  { value: "vontade_comer_beber", label: "Vontade de comer/beber algo" },
  { value: "programa_familia_amigos", label: "Programa com família/amigos" },
  { value: "comemoracao", label: "Comemoração (aniversário etc)" },
  { value: "passando_em_frente", label: "Passando em frente por acaso" },
  { value: "outro", label: "Outro" },
];

const DISCOVERY_OPTIONS = [
  { value: "instagram", label: "Instagram/Redes sociais" },
  { value: "indicacao", label: "Indicação de amigo/família" },
  { value: "google_internet", label: "Google/Internet" },
  { value: "passou_em_frente", label: "Passou em frente e viu a loja" },
  { value: "cliente_antigo", label: "Já é cliente antigo" },
  { value: "outro", label: "Outro" },
];

export default function RegisterVisitFlow({ initialClient }) {
  const router = useRouter();
  const [step, setStep] = useState(initialClient ? "visit-form" : "search");
  const [foundClient, setFoundClient] = useState(initialClient);
  const [phone, setPhone] = useState("");
  const [searchError, setSearchError] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const [categories, setCategories] = useState([]);
  const [orderDetails, setOrderDetails] = useState("");
  const [amountSpent, setAmountSpent] = useState("0");
  const [reason, setReason] = useState(REASON_OPTIONS[0].value);
  const [reasonDetails, setReasonDetails] = useState("");
  const [discoverySource, setDiscoverySource] = useState(DISCOVERY_OPTIONS[0].value);
  const [discoveryDetails, setDiscoveryDetails] = useState("");
  const [visitError, setVisitError] = useState(null);
  const [isSubmittingVisit, setIsSubmittingVisit] = useState(false);

  async function handleSearch(event) {
    event.preventDefault();
    setSearchError(null);
    setIsSearching(true);

    const response = await fetch(`/api/v1/clients?phone=${encodeURIComponent(phone)}`);

    setIsSearching(false);

    const body = await response.json();

    if (!response.ok) {
      setSearchError(body.message ?? "Não foi possível buscar o cliente.");
      return;
    }

    if (body.clients.length === 0) {
      setStep("quick-create");
      return;
    }

    setFoundClient(body.clients[0]);
    setStep("visit-form");
  }

  function handleClientCreated(createdClient) {
    setFoundClient(createdClient);
    setStep("visit-form");
  }

  function toggleCategory(value) {
    setCategories((current) =>
      current.includes(value) ? current.filter((category) => category !== value) : [...current, value],
    );
  }

  async function handleSubmitVisit(event) {
    event.preventDefault();
    setVisitError(null);

    if (categories.length === 0) {
      setVisitError("Selecione ao menos uma categoria do pedido.");
      return;
    }

    setIsSubmittingVisit(true);

    const response = await fetch(`/api/v1/clients/${foundClient.id}/visits`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount_spent: Number(amountSpent),
        order_categories: categories,
        order_details: orderDetails,
        reason,
        reason_details: reasonDetails,
        discovery_source: discoverySource,
        discovery_details: discoveryDetails,
      }),
    });

    setIsSubmittingVisit(false);

    if (!response.ok) {
      const body = await response.json();
      setVisitError(body.message ?? "Não foi possível registrar a visita.");
      return;
    }

    router.push(`/clientes/${foundClient.id}`);
    router.refresh();
  }

  if (step === "search") {
    return (
      <form
        onSubmit={handleSearch}
        className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-black/[.08] bg-white p-8 dark:border-white/[.145] dark:bg-zinc-950"
      >
        <h1 className="text-xl font-semibold text-black dark:text-zinc-50">Registrar visita</h1>

        <label className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
          Telefone do cliente
          <input
            type="tel"
            required
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="rounded-md border border-black/[.08] px-3 py-2 text-black dark:border-white/[.145] dark:text-zinc-50"
          />
        </label>

        {searchError && <p className="text-sm text-red-600 dark:text-red-400">{searchError}</p>}

        <button
          type="submit"
          disabled={isSearching}
          className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
        >
          {isSearching ? "Buscando..." : "Buscar"}
        </button>
      </form>
    );
  }

  if (step === "quick-create") {
    return (
      <div className="flex w-full max-w-sm flex-col gap-4">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Nenhum cliente encontrado com esse telefone. Cadastre rapidamente antes de continuar.
        </p>
        <ClientForm onCreated={handleClientCreated} submitLabel="Cadastrar e continuar" initialPhone={phone} />
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmitVisit}
      className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-black/[.08] bg-white p-8 dark:border-white/[.145] dark:bg-zinc-950"
    >
      <h1 className="text-xl font-semibold text-black dark:text-zinc-50">
        Registrar visita de {foundClient.name}
      </h1>

      <fieldset className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
        <legend className="mb-1">O que pediu</legend>
        {CATEGORY_OPTIONS.map((option) => (
          <label key={option.value} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={categories.includes(option.value)}
              onChange={() => toggleCategory(option.value)}
            />
            {option.label}
          </label>
        ))}
        <input
          type="text"
          placeholder="Detalhe o que foi pedido (opcional)"
          value={orderDetails}
          onChange={(event) => setOrderDetails(event.target.value)}
          className="mt-2 rounded-md border border-black/[.08] px-3 py-2 text-black dark:border-white/[.145] dark:text-zinc-50"
        />
      </fieldset>

      <label className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
        Valor gasto (R$)
        <input
          type="number"
          required
          min="0"
          step="0.01"
          value={amountSpent}
          onChange={(event) => setAmountSpent(event.target.value)}
          className="rounded-md border border-black/[.08] px-3 py-2 text-black dark:border-white/[.145] dark:text-zinc-50"
        />
      </label>

      <fieldset className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
        <legend className="mb-1">Motivo de estar na loja</legend>
        {REASON_OPTIONS.map((option) => (
          <label key={option.value} className="flex items-center gap-2">
            <input
              type="radio"
              name="reason"
              value={option.value}
              checked={reason === option.value}
              onChange={() => setReason(option.value)}
            />
            {option.label}
          </label>
        ))}
        <input
          type="text"
          placeholder="Detalhe o motivo (opcional)"
          value={reasonDetails}
          onChange={(event) => setReasonDetails(event.target.value)}
          className="mt-2 rounded-md border border-black/[.08] px-3 py-2 text-black dark:border-white/[.145] dark:text-zinc-50"
        />
      </fieldset>

      <fieldset className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
        <legend className="mb-1">De onde conheceu a loja</legend>
        {DISCOVERY_OPTIONS.map((option) => (
          <label key={option.value} className="flex items-center gap-2">
            <input
              type="radio"
              name="discoverySource"
              value={option.value}
              checked={discoverySource === option.value}
              onChange={() => setDiscoverySource(option.value)}
            />
            {option.label}
          </label>
        ))}
        <input
          type="text"
          placeholder="Detalhe a origem (opcional)"
          value={discoveryDetails}
          onChange={(event) => setDiscoveryDetails(event.target.value)}
          className="mt-2 rounded-md border border-black/[.08] px-3 py-2 text-black dark:border-white/[.145] dark:text-zinc-50"
        />
      </fieldset>

      {visitError && <p className="text-sm text-red-600 dark:text-red-400">{visitError}</p>}

      <button
        type="submit"
        disabled={isSubmittingVisit}
        className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
      >
        {isSubmittingVisit ? "Registrando..." : "Registrar visita"}
      </button>
    </form>
  );
}
