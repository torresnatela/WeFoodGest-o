"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Chip from "@/components/ui/chip";
import CurrencyInput from "@/components/ui/currency-input";
import Input from "@/components/ui/input";
import PhoneInput from "@/components/ui/phone-input";
import ClientForm from "@/components/client-form";
import { useToast } from "@/components/ui/toast";
import { formatPhone, formatRelativeDate } from "@/lib/format";
import {
  CATEGORY_OPTIONS,
  DISCOVERY_LABELS,
  DISCOVERY_OPTIONS,
  REASON_OPTIONS,
} from "@/lib/visit-options";

export default function RegisterVisitFlow({ initialClient }) {
  const router = useRouter();
  const toast = useToast();

  const [step, setStep] = useState(initialClient ? "visit-form" : "search");
  const [foundClient, setFoundClient] = useState(initialClient);
  const [history, setHistory] = useState(null);
  const [phone, setPhone] = useState("");
  const [searchError, setSearchError] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const [categories, setCategories] = useState([]);
  const [orderDetails, setOrderDetails] = useState("");
  const [amountSpent, setAmountSpent] = useState(0);
  const [reason, setReason] = useState(REASON_OPTIONS[0].value);
  const [reasonDetails, setReasonDetails] = useState("");
  const [discoverySource, setDiscoverySource] = useState(DISCOVERY_OPTIONS[0].value);
  const [discoveryDetails, setDiscoveryDetails] = useState("");
  const [isEditingDiscovery, setIsEditingDiscovery] = useState(false);
  const [visitError, setVisitError] = useState(null);
  const [isSubmittingVisit, setIsSubmittingVisit] = useState(false);

  const loadHistory = useCallback(async (clientId) => {
    try {
      const response = await fetch(`/api/v1/clients/${clientId}`);
      const body = response.ok ? await response.json().catch(() => ({})) : {};

      // Todo caminho precisa acabar com `history` preenchido. Deixar em `null`
      // travaria o formulário no estado de carregando para sempre.
      if (!body.visits) {
        setHistory([]);
        return;
      }

      setHistory(body.visits);

      const firstVisit = body.visits[body.visits.length - 1];
      if (firstVisit) {
        setDiscoverySource(firstVisit.discovery_source);
        setDiscoveryDetails(firstVisit.discovery_details ?? "");
      }
    } catch {
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    if (foundClient) {
      // `loadHistory` começa com um await, então nada chama setState de forma
      // síncrona aqui — a regra do lint não enxerga através da função async.
      // Carregar dados quando o cliente escolhido muda é o caso legítimo de
      // efeito, não o que a regra existe para impedir.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadHistory(foundClient.id);
    }
  }, [foundClient, loadHistory]);

  async function handleSearch(event) {
    event.preventDefault();
    setSearchError(null);
    setIsSearching(true);

    let response;
    try {
      response = await fetch(`/api/v1/clients?phone=${encodeURIComponent(phone)}`);
    } catch {
      setIsSearching(false);
      setSearchError("Não foi possível falar com o servidor. Tente de novo.");
      return;
    }

    setIsSearching(false);
    const body = await response.json().catch(() => ({}));

    if (!response.ok || !body.clients) {
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
    setHistory([]);
    setStep("visit-form");
  }

  function toggleCategory(value) {
    setCategories((current) =>
      current.includes(value)
        ? current.filter((category) => category !== value)
        : [...current, value],
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

    let response;
    try {
      response = await fetch(`/api/v1/clients/${foundClient.id}/visits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount_spent: amountSpent,
          order_categories: categories,
          order_details: orderDetails,
          reason,
          reason_details: reasonDetails,
          discovery_source: discoverySource,
          discovery_details: discoveryDetails,
        }),
      });
    } catch {
      setIsSubmittingVisit(false);
      setVisitError("Não foi possível falar com o servidor. Tente de novo.");
      return;
    }

    setIsSubmittingVisit(false);

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setVisitError(body.message ?? "Não foi possível registrar a visita.");
      return;
    }

    toast.success(`Visita de ${foundClient.name} registrada.`);
    router.push(`/clientes/${foundClient.id}`);
    router.refresh();
  }

  if (step === "search") {
    return (
      <Card as="form" onSubmit={handleSearch} className="flex flex-col gap-4 p-6">
        <h1 className="text-xl font-extrabold text-ink">Registrar visita</h1>
        <PhoneInput
          label="Telefone do cliente"
          required
          value={phone}
          onChange={setPhone}
          error={searchError}
        />
        <Button type="submit" size="lg" isLoading={isSearching} loadingLabel="Buscando...">
          Buscar
        </Button>
      </Card>
    );
  }

  if (step === "quick-create") {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-ink">Cliente novo</h1>
          <p className="text-sm text-muted">
            Ninguém cadastrado com {formatPhone(phone)}. Cadastre antes de continuar.
          </p>
        </div>
        <ClientForm
          onCreated={handleClientCreated}
          submitLabel="Cadastrar e continuar"
          initialPhone={phone}
        />
      </div>
    );
  }

  const isHistoryLoaded = history !== null;
  const isReturning = isHistoryLoaded && history.length > 0;
  const showDiscoveryChips = !isReturning || isEditingDiscovery;

  return (
    <form onSubmit={handleSubmitVisit} className="flex flex-col gap-5 pb-24">
      <div>
        <h1 className="text-xl font-extrabold text-ink">{foundClient.name}</h1>
        <p className="text-sm text-muted">
          {!isHistoryLoaded
            ? "Carregando histórico..."
            : isReturning
              ? `${history.length + 1}ª visita · última ${formatRelativeDate(history[0].created_at)}`
              : "Primeira visita"}
        </p>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-xs font-bold uppercase tracking-wide text-muted">
          O que pediu
        </legend>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              role="checkbox"
              selected={categories.includes(option.value)}
              onToggle={() => toggleCategory(option.value)}
            >
              {option.label}
            </Chip>
          ))}
        </div>
        {categories.length > 0 && (
          <Input
            label="Detalhe do pedido"
            hint="Opcional"
            type="text"
            value={orderDetails}
            onChange={(event) => setOrderDetails(event.target.value)}
          />
        )}
      </fieldset>

      <CurrencyInput required value={amountSpent} onChange={setAmountSpent} />

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-xs font-bold uppercase tracking-wide text-muted">
          Motivo da visita
        </legend>
        <div className="flex flex-wrap gap-2">
          {REASON_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              role="radio"
              selected={reason === option.value}
              onToggle={() => setReason(option.value)}
            >
              {option.label}
            </Chip>
          ))}
        </div>
        <Input
          label="Detalhe do motivo"
          hint="Opcional"
          type="text"
          value={reasonDetails}
          onChange={(event) => setReasonDetails(event.target.value)}
        />
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-xs font-bold uppercase tracking-wide text-muted">
          De onde conheceu a loja
        </legend>

        {!isHistoryLoaded ? (
          <p className="text-sm text-muted">Carregando...</p>
        ) : showDiscoveryChips ? (
          <>
            <div className="flex flex-wrap gap-2">
              {DISCOVERY_OPTIONS.map((option) => (
                <Chip
                  key={option.value}
                  role="radio"
                  selected={discoverySource === option.value}
                  onToggle={() => setDiscoverySource(option.value)}
                >
                  {option.label}
                </Chip>
              ))}
            </div>
            <Input
              label="Detalhe da origem"
              hint="Opcional"
              type="text"
              value={discoveryDetails}
              onChange={(event) => setDiscoveryDetails(event.target.value)}
            />
          </>
        ) : (
          <div className="flex items-center justify-between gap-3 rounded-md border border-dashed border-line px-4 py-3">
            <p className="text-sm text-ink">{DISCOVERY_LABELS[discoverySource]}</p>
            <button
              type="button"
              onClick={() => setIsEditingDiscovery(true)}
              className="min-h-11 text-sm font-bold text-brand"
            >
              Alterar
            </button>
          </div>
        )}
      </fieldset>

      {visitError && (
        <p role="alert" className="text-sm text-danger">
          {visitError}
        </p>
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg px-4 py-3 shadow-raised lg:static lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
        <div className="mx-auto max-w-md pb-[env(safe-area-inset-bottom)]">
          <Button
            type="submit"
            size="lg"
            className="w-full"
            isLoading={isSubmittingVisit}
            loadingLabel="Registrando..."
          >
            Registrar visita
          </Button>
        </div>
      </div>
    </form>
  );
}
