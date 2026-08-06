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

// O rodapé é fixo no celular e estático no desktop. Ele vive fora do <form> de
// cada passo: o botão de registrar precisa existir em todos eles, inclusive nos
// que já têm um submit próprio ("Buscar", "Cadastrar e continuar").
function StickyFooter({ children }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg px-4 py-3 shadow-raised lg:static lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
      <div className="mx-auto flex max-w-md flex-col gap-2 pb-[env(safe-area-inset-bottom)]">
        {children}
      </div>
    </div>
  );
}

function FunnelQuestion({ label, value, onAnswer }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <div role="radiogroup" aria-label={label} className="flex gap-2">
        <Chip role="radio" selected={value === true} onToggle={() => onAnswer(true)}>
          Sim
        </Chip>
        <Chip role="radio" selected={value === false} onToggle={() => onAnswer(false)}>
          Não
        </Chip>
      </div>
    </div>
  );
}

function FunnelSummary({ enteredStore, sawProducts, purchased }) {
  const parts = [
    enteredStore ? "Entrou" : "Não entrou",
    sawProducts ? "Viu os produtos" : "Não viu",
    purchased ? "Comprou" : "Não comprou",
  ];

  return (
    <p className="text-xs font-semibold uppercase tracking-wide text-muted">{parts.join(" · ")}</p>
  );
}

export default function RegisterVisitFlow({ initialClient }) {
  const router = useRouter();
  const toast = useToast();

  // Começa sempre no funil, mesmo vindo da ficha de um cliente: as três
  // perguntas continuam tendo de ser respondidas. O que o `?clientId=` pula é
  // o passo de identificar quem é.
  const [step, setStep] = useState("funnel");
  const [foundClient, setFoundClient] = useState(initialClient);
  const [history, setHistory] = useState(null);
  const [phone, setPhone] = useState("");
  const [searchError, setSearchError] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const [enteredStore, setEnteredStore] = useState(null);
  const [sawProducts, setSawProducts] = useState(null);
  const [purchased, setPurchased] = useState(null);

  const [categories, setCategories] = useState([]);
  const [orderDetails, setOrderDetails] = useState("");
  const [amountSpent, setAmountSpent] = useState(0);
  const [reason, setReason] = useState(null);
  const [reasonDetails, setReasonDetails] = useState("");
  const [discoverySource, setDiscoverySource] = useState(null);
  const [discoveryDetails, setDiscoveryDetails] = useState("");
  const [isEditingDiscovery, setIsEditingDiscovery] = useState(false);
  const [visitError, setVisitError] = useState(null);
  const [isSubmittingVisit, setIsSubmittingVisit] = useState(false);

  const isFunnelAnswered = [enteredStore, sawProducts, purchased].every(
    (answer) => typeof answer === "boolean",
  );

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
      if (firstVisit?.discovery_source) {
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

  // A cascata é o que faz o caso mais comum caber num toque: "não entrou"
  // responde o funil inteiro. Ela dá um padrão, não uma trava — quem olhou a
  // vitrine da calçada ainda pode marcar "viu" depois de dizer que não entrou.
  function answerEntered(value) {
    setEnteredStore(value);

    if (!value) {
      setSawProducts(false);
      setPurchased(false);
    }
  }

  function answerSaw(value) {
    setSawProducts(value);

    if (!value) {
      setPurchased(false);
    }
  }

  function answerPurchased(value) {
    setPurchased(value);

    // Exigido pelo banco (visits_purchase_implies_seen_check): quem comprou
    // necessariamente viu o que estava comprando.
    if (value) {
      setSawProducts(true);
    }
  }

  function goBack() {
    setVisitError(null);

    if (step === "quick-create") {
      setStep("client");
      return;
    }

    if (step === "details") {
      setStep(initialClient ? "funnel" : "client");
      return;
    }

    setStep("funnel");
  }

  function goToDetails() {
    setVisitError(null);
    setStep(foundClient ? "details" : "client");
  }

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
    setStep("details");
  }

  function handleClientCreated(createdClient) {
    setFoundClient(createdClient);
    setHistory([]);
    setStep("details");
  }

  function toggleCategory(value) {
    setCategories((current) =>
      current.includes(value)
        ? current.filter((category) => category !== value)
        : [...current, value],
    );
  }

  async function submitVisit() {
    setVisitError(null);

    if (!isFunnelAnswered) {
      setVisitError("Responda se o cliente entrou, viu os produtos e comprou.");
      setStep("funnel");
      return;
    }

    setIsSubmittingVisit(true);

    let response;
    try {
      response = await fetch("/api/v1/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: foundClient?.id ?? null,
          entered_store: enteredStore,
          saw_products: sawProducts,
          purchased,
          // As três linhas abaixo protegem contra estado antigo: dá para
          // preencher o pedido e voltar ao funil para desmarcar a compra. A
          // tela esconde os campos, mas quem apaga o valor é isto.
          amount_spent: purchased ? amountSpent : 0,
          order_categories: purchased ? categories : [],
          order_details: purchased ? orderDetails : null,
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

    toast.success(foundClient ? `Visita de ${foundClient.name} registrada.` : "Visita registrada.");
    router.push(foundClient ? `/clientes/${foundClient.id}` : "/");
    router.refresh();
  }

  const registerButton = (
    <Button
      size="lg"
      className="w-full"
      onClick={submitVisit}
      disabled={!isFunnelAnswered}
      isLoading={isSubmittingVisit}
      loadingLabel="Registrando..."
    >
      Registrar visita
    </Button>
  );

  const errorMessage = visitError && (
    <p role="alert" className="text-sm text-danger">
      {visitError}
    </p>
  );

  if (step === "funnel") {
    return (
      <div className="flex flex-col gap-5 pb-32">
        <div>
          <h1 className="text-xl font-extrabold text-ink">Registrar visita</h1>
          <p className="text-sm text-muted">
            {foundClient ? foundClient.name : "Responda as três perguntas. O resto é opcional."}
          </p>
        </div>

        <Card className="flex flex-col gap-4 p-6">
          <FunnelQuestion label="Entrou na loja?" value={enteredStore} onAnswer={answerEntered} />
          <FunnelQuestion label="Viu os produtos?" value={sawProducts} onAnswer={answerSaw} />
          <FunnelQuestion label="Comprou?" value={purchased} onAnswer={answerPurchased} />
        </Card>

        <StickyFooter>
          {errorMessage}
          {registerButton}
          <Button
            variant="ghost"
            className="w-full"
            disabled={!isFunnelAnswered}
            onClick={goToDetails}
          >
            {foundClient ? "Adicionar detalhes" : "Adicionar cliente e detalhes"}
          </Button>
        </StickyFooter>
      </div>
    );
  }

  if (step === "client") {
    return (
      <div className="flex flex-col gap-4 pb-32">
        <div>
          <h1 className="text-xl font-extrabold text-ink">Quem foi?</h1>
          <FunnelSummary
            enteredStore={enteredStore}
            sawProducts={sawProducts}
            purchased={purchased}
          />
        </div>

        <Card as="form" onSubmit={handleSearch} className="flex flex-col gap-4 p-6">
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

        <Button variant="ghost" onClick={() => setStep("details")}>
          Continuar sem cliente
        </Button>
        <Button variant="ghost" onClick={goBack}>
          Voltar
        </Button>

        <StickyFooter>
          {errorMessage}
          {registerButton}
        </StickyFooter>
      </div>
    );
  }

  if (step === "quick-create") {
    return (
      <div className="flex flex-col gap-4 pb-32">
        <div>
          <h1 className="text-xl font-extrabold text-ink">Cliente novo</h1>
          <p className="text-sm text-muted">
            Ninguém cadastrado com {formatPhone(phone)}. Cadastre ou siga sem contato.
          </p>
        </div>

        <ClientForm
          onCreated={handleClientCreated}
          submitLabel="Cadastrar e continuar"
          initialPhone={phone}
        />

        <Button variant="ghost" onClick={() => setStep("details")}>
          Continuar sem cadastrar
        </Button>
        <Button variant="ghost" onClick={goBack}>
          Voltar
        </Button>

        <StickyFooter>
          {errorMessage}
          {registerButton}
        </StickyFooter>
      </div>
    );
  }

  const isHistoryLoaded = !foundClient || history !== null;
  const isReturning = Boolean(foundClient) && history !== null && history.length > 0;
  // Só vale colapsar a origem num rótulo quando existe rótulo: cliente
  // recorrente cujas visitas antigas não registraram origem cai nos chips.
  const showDiscoveryChips = !isReturning || !discoverySource || isEditingDiscovery;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submitVisit();
      }}
      className="flex flex-col gap-5 pb-32"
    >
      <div>
        <h1 className="text-xl font-extrabold text-ink">
          {foundClient ? foundClient.name : "Visita sem contato"}
        </h1>
        {foundClient && (
          <p className="text-sm text-muted">
            {!isHistoryLoaded
              ? "Carregando histórico..."
              : isReturning
                ? `${history.length + 1}ª visita · última ${formatRelativeDate(history[0].created_at)}`
                : "Primeira visita"}
          </p>
        )}
        <FunnelSummary
          enteredStore={enteredStore}
          sawProducts={sawProducts}
          purchased={purchased}
        />
      </div>

      {purchased && (
        <>
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

          <CurrencyInput value={amountSpent} onChange={setAmountSpent} />
        </>
      )}

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-xs font-bold uppercase tracking-wide text-muted">
          Motivo da visita · opcional
        </legend>
        <div className="flex flex-wrap gap-2">
          {REASON_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              role="radio"
              selected={reason === option.value}
              onToggle={() => setReason(reason === option.value ? null : option.value)}
            >
              {option.label}
            </Chip>
          ))}
        </div>
        {reason && (
          <Input
            label="Detalhe do motivo"
            hint="Opcional"
            type="text"
            value={reasonDetails}
            onChange={(event) => setReasonDetails(event.target.value)}
          />
        )}
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-xs font-bold uppercase tracking-wide text-muted">
          De onde conheceu a loja · opcional
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
                  onToggle={() =>
                    setDiscoverySource(discoverySource === option.value ? null : option.value)
                  }
                >
                  {option.label}
                </Chip>
              ))}
            </div>
            {discoverySource && (
              <Input
                label="Detalhe da origem"
                hint="Opcional"
                type="text"
                value={discoveryDetails}
                onChange={(event) => setDiscoveryDetails(event.target.value)}
              />
            )}
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

      <Button variant="ghost" onClick={goBack}>
        Voltar
      </Button>

      <StickyFooter>
        {errorMessage}
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={!isFunnelAnswered}
          isLoading={isSubmittingVisit}
          loadingLabel="Registrando..."
        >
          Registrar visita
        </Button>
      </StickyFooter>
    </form>
  );
}
