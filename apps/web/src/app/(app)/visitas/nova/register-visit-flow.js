"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Chip from "@/components/ui/chip";
import CurrencyInput from "@/components/ui/currency-input";
import Input from "@/components/ui/input";
import PhoneInput from "@/components/ui/phone-input";
import { useToast } from "@/components/ui/toast";
import { formatRelativeDate, onlyDigits } from "@/lib/format";
import {
  CATEGORY_OPTIONS,
  DISCOVERY_LABELS,
  DISCOVERY_OPTIONS,
  REASON_OPTIONS,
} from "@/lib/visit-options";

// Um telefone brasileiro completo tem 10 (fixo) ou 11 (celular) dígitos. Abaixo
// disso não vale consultar: seria uma busca por prefixo que nunca casa, já que
// o model compara o número inteiro.
const COMPLETE_PHONE_LENGTH = 10;

// O rodapé é fixo no celular e estático no desktop.
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

  // Três passos, sempre nesta ordem: funil → cliente → detalhes. Vindo da ficha
  // de um cliente (`?clientId=`) o passo do cliente continua aparecendo, já
  // preenchido — o que ele pula é ter de digitar o telefone de novo.
  const [step, setStep] = useState("funnel");
  const [foundClient, setFoundClient] = useState(null);
  const [history, setHistory] = useState(null);

  const [enteredStore, setEnteredStore] = useState(null);
  const [sawProducts, setSawProducts] = useState(null);
  const [purchased, setPurchased] = useState(null);

  const [phone, setPhone] = useState(initialClient?.phone ?? "");
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  // Cliente que já existe com o telefone digitado. Enquanto ele existe, o
  // formulário vira só uma confirmação: os campos de cadastro somem e "Próximo"
  // não grava nada.
  const [recognizedClient, setRecognizedClient] = useState(initialClient ?? null);
  const [clientError, setClientError] = useState(null);
  const [isSavingClient, setIsSavingClient] = useState(false);

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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadHistory(foundClient.id);
    }
  }, [foundClient, loadHistory]);

  // Reconhecer o telefone enquanto se digita é o que colapsa a antiga dupla
  // "buscar" + "cadastrar" num formulário só: quem já existe aparece sozinho, e
  // quem não existe simplesmente segue preenchendo os campos abaixo. Sem isso o
  // "Próximo" de um cliente recorrente esbarraria no UNIQUE do telefone.
  useEffect(() => {
    const digits = onlyDigits(phone);

    const timer = setTimeout(async () => {
      if (digits.length < COMPLETE_PHONE_LENGTH) {
        setRecognizedClient(null);
        return;
      }

      try {
        const response = await fetch(`/api/v1/clients?phone=${encodeURIComponent(digits)}`);
        const body = response.ok ? await response.json().catch(() => ({})) : {};
        setRecognizedClient(body.clients?.[0] ?? null);
      } catch {
        // Sem rede não dá para reconhecer ninguém. Seguir como cliente novo é o
        // caminho certo: o POST abaixo ainda vai barrar um telefone repetido.
        setRecognizedClient(null);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [phone]);

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

  async function handleClientNext(event) {
    event.preventDefault();
    setClientError(null);

    if (recognizedClient) {
      setFoundClient(recognizedClient);
      setStep("details");
      return;
    }

    setIsSavingClient(true);

    let response;
    try {
      response = await fetch("/api/v1/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          birth_date: birthDate || null,
          neighborhood: neighborhood || null,
          city: city || null,
        }),
      });
    } catch {
      setIsSavingClient(false);
      setClientError("Não foi possível falar com o servidor. Tente de novo.");
      return;
    }

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setClientError(body.message ?? "Não foi possível cadastrar o cliente.");
      setIsSavingClient(false);

      // Telefone repetido só chega aqui se o reconhecimento não tiver terminado
      // a tempo. Buscar de novo transforma o erro num caminho: o cliente
      // aparece reconhecido e o próximo "Próximo" segue em frente.
      try {
        const lookup = await fetch(`/api/v1/clients?phone=${encodeURIComponent(phone)}`);
        if (lookup.ok) {
          const lookupBody = await lookup.json().catch(() => ({}));
          setRecognizedClient(lookupBody.clients?.[0] ?? null);
        }
      } catch {
        // Sem caminho de saída, mas o erro continua na tela e o botão, usável.
      }

      return;
    }

    setIsSavingClient(false);

    // Um 2xx com corpo ilegível não pode virar `foundClient` indefinido: a
    // visita seguiria sem cliente sem ninguém perceber.
    const createdClient = await response.json().catch(() => ({}));

    if (!createdClient.id) {
      setClientError("Não foi possível cadastrar o cliente.");
      return;
    }

    setFoundClient(createdClient);
    setHistory([]);
    setStep("details");
  }

  function skipClient() {
    setClientError(null);
    setFoundClient(null);
    setHistory(null);
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

  const errorMessage = visitError && (
    <p role="alert" className="text-sm text-danger">
      {visitError}
    </p>
  );

  if (step === "funnel") {
    return (
      <div className="flex flex-col gap-5 pb-40">
        <div>
          <h1 className="text-xl font-extrabold text-ink">Registrar visita</h1>
          <p className="text-sm text-muted">Passo 1 de 3</p>
        </div>

        <Card className="flex flex-col gap-4 p-6">
          <FunnelQuestion label="Entrou na loja?" value={enteredStore} onAnswer={answerEntered} />
          <FunnelQuestion label="Viu os produtos?" value={sawProducts} onAnswer={answerSaw} />
          <FunnelQuestion label="Comprou?" value={purchased} onAnswer={answerPurchased} />
        </Card>

        <StickyFooter>
          {errorMessage}
          <Button
            size="lg"
            className="w-full"
            disabled={!isFunnelAnswered}
            onClick={() => setStep("client")}
          >
            Próximo
          </Button>
          {/*
            O atalho existe para o caso que motivou medir o funil: quem passa e
            não entra não tem cliente nem intenção a registrar, e obrigá-lo a
            atravessar os outros dois passos faria ninguém registrar.
          */}
          <Button
            variant="ghost"
            className="w-full"
            disabled={!isFunnelAnswered}
            isLoading={isSubmittingVisit}
            loadingLabel="Registrando..."
            onClick={submitVisit}
          >
            Registrar agora
          </Button>
        </StickyFooter>
      </div>
    );
  }

  if (step === "client") {
    return (
      <div className="flex flex-col gap-4 pb-8">
        <div>
          <h1 className="text-xl font-extrabold text-ink">Cliente</h1>
          <p className="text-sm text-muted">Passo 2 de 3</p>
          <FunnelSummary
            enteredStore={enteredStore}
            sawProducts={sawProducts}
            purchased={purchased}
          />
        </div>

        <Card as="form" onSubmit={handleClientNext} className="flex flex-col gap-4 p-6">
          <PhoneInput label="Telefone" required value={phone} onChange={setPhone} />

          {recognizedClient ? (
            <div className="rounded-md border border-dashed border-line px-4 py-3">
              <p className="text-sm font-bold text-ink">{recognizedClient.name}</p>
              <p className="text-xs text-muted">
                Já cadastrado com este telefone. A visita entra na ficha dele.
              </p>
            </div>
          ) : (
            <>
              <Input
                label="Nome"
                type="text"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              <Input
                label="Data de nascimento"
                type="date"
                hint="Opcional"
                value={birthDate}
                onChange={(event) => setBirthDate(event.target.value)}
              />
              <Input
                label="Bairro"
                type="text"
                hint="Opcional"
                value={neighborhood}
                onChange={(event) => setNeighborhood(event.target.value)}
              />
              <Input
                label="Cidade"
                type="text"
                hint="Opcional"
                value={city}
                onChange={(event) => setCity(event.target.value)}
              />
            </>
          )}

          {clientError && (
            <p role="alert" className="text-sm text-danger">
              {clientError}
            </p>
          )}

          <Button type="submit" size="lg" isLoading={isSavingClient} loadingLabel="Salvando...">
            Próximo
          </Button>
        </Card>

        <Button variant="ghost" onClick={skipClient}>
          Pular cadastro
        </Button>
        <Button variant="ghost" onClick={() => setStep("funnel")}>
          Voltar
        </Button>
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
        <p className="text-sm text-muted">
          Passo 3 de 3
          {foundClient
            ? !isHistoryLoaded
              ? " · carregando histórico..."
              : isReturning
                ? ` · ${history.length + 1}ª visita · última ${formatRelativeDate(history[0].created_at)}`
                : " · primeira visita"
            : ""}
        </p>
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

      <Button variant="ghost" onClick={() => setStep("client")}>
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
