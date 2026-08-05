"use client";

import { useState } from "react";

export default function ClientForm({ onCreated, submitLabel = "Cadastrar", initialPhone = "" }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState(initialPhone);
  const [birthDate, setBirthDate] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const response = await fetch("/api/v1/clients", {
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

    setIsSubmitting(false);

    if (!response.ok) {
      const body = await response.json();
      setError(body.message ?? "Não foi possível cadastrar o cliente.");
      return;
    }

    const createdClient = await response.json();
    onCreated(createdClient);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border border-black/[.08] bg-white p-8 dark:border-white/[.145] dark:bg-zinc-950"
    >
      <label className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
        Nome
        <input
          type="text"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="rounded-md border border-black/[.08] px-3 py-2 text-black dark:border-white/[.145] dark:text-zinc-50"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
        Telefone
        <input
          type="tel"
          required
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className="rounded-md border border-black/[.08] px-3 py-2 text-black dark:border-white/[.145] dark:text-zinc-50"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
        Data de nascimento
        <input
          type="date"
          value={birthDate}
          onChange={(event) => setBirthDate(event.target.value)}
          className="rounded-md border border-black/[.08] px-3 py-2 text-black dark:border-white/[.145] dark:text-zinc-50"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
        Bairro
        <input
          type="text"
          value={neighborhood}
          onChange={(event) => setNeighborhood(event.target.value)}
          className="rounded-md border border-black/[.08] px-3 py-2 text-black dark:border-white/[.145] dark:text-zinc-50"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
        Cidade
        <input
          type="text"
          value={city}
          onChange={(event) => setCity(event.target.value)}
          className="rounded-md border border-black/[.08] px-3 py-2 text-black dark:border-white/[.145] dark:text-zinc-50"
        />
      </label>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
      >
        {isSubmitting ? "Cadastrando..." : submitLabel}
      </button>
    </form>
  );
}
