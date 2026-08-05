"use client";

import { useState } from "react";
import Link from "next/link";

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
  const [error, setError] = useState(null);
  const [duplicateId, setDuplicateId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
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
      setError("Não foi possível falar com o servidor. Tente de novo.");
      return;
    }

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.message ?? "Não foi possível cadastrar o cliente.");

      const lookup = await fetch(`/api/v1/clients?phone=${encodeURIComponent(phone)}`);
      if (lookup.ok) {
        const lookupBody = await lookup.json();
        setDuplicateId(lookupBody.clients[0]?.id ?? null);
      }

      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    onCreated(await response.json());
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

      <Button type="submit" size="lg" isLoading={isSubmitting} loadingLabel="Cadastrando...">
        {submitLabel}
      </Button>
    </Card>
  );
}
