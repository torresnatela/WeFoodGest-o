"use client";

import { useState } from "react";
import Link from "next/link";

import Alert from "@/components/ui/alert";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Input from "@/components/ui/input";
import PhoneInput from "@/components/ui/phone-input";

export default function ClientForm({ onCreated, submitLabel = "Cadastrar", initialPhone = "" }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState(initialPhone);
  const [birthDate, setBirthDate] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  // `error` é do campo telefone — é o único erro que o servidor atribui a um
  // campo. `pageError` é tudo o que não é sobre um campo: queda de rede e
  // resposta ilegível não tornam o telefone inválido.
  const [error, setError] = useState(null);
  const [pageError, setPageError] = useState(null);
  const [duplicateId, setDuplicateId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setPageError(null);
    setDuplicateId(null);
    setIsSubmitting(true);

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
      setIsSubmitting(false);
      setPageError("Não foi possível falar com o servidor. Tente de novo.");
      return;
    }

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.message ?? "Não foi possível cadastrar o cliente.");
      setIsSubmitting(false);

      // A busca abaixo é um extra: serve só para oferecer um caminho de saída
      // quando o telefone já existe. Ela vem depois de destravar o botão e
      // dentro de um try, porque falhar aqui não pode piorar a situação — a
      // mensagem de erro principal já está na tela.
      try {
        const lookup = await fetch(`/api/v1/clients?phone=${encodeURIComponent(phone)}`);

        if (lookup.ok) {
          const lookupBody = await lookup.json().catch(() => ({}));
          setDuplicateId(lookupBody.clients?.[0]?.id ?? null);
        }
      } catch {
        // Sem link de saída, mas o erro continua visível e o botão, utilizável.
      }

      return;
    }

    setIsSubmitting(false);

    // Um 2xx com corpo ilegível não pode virar `onCreated(undefined)`: o fluxo
    // de visita seguiria sem cliente e quebraria na tela seguinte.
    const createdClient = await response.json().catch(() => ({}));

    if (!createdClient.id) {
      setPageError("Não foi possível cadastrar o cliente.");
      return;
    }

    onCreated(createdClient);
  }

  return (
    <Card as="form" onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
      <Input
        label="Nome"
        type="text"
        required
        value={name}
        onChange={(event) => setName(event.target.value)}
      />

      <PhoneInput required value={phone} onChange={setPhone} error={error} />

      {duplicateId && (
        <Link href={`/clientes/${duplicateId}`} className="text-sm font-semibold text-brand underline">
          Ver o cliente já cadastrado com esse telefone
        </Link>
      )}

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

      <Alert>{pageError}</Alert>

      <Button type="submit" size="lg" isLoading={isSubmitting} loadingLabel="Cadastrando...">
        {submitLabel}
      </Button>
    </Card>
  );
}
