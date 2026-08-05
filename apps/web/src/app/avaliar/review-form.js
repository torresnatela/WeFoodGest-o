"use client";

import { useState } from "react";

const RATING_OPTIONS = [1, 2, 3, 4, 5];
const MAX_COMMENT_LENGTH = 1000;

export default function ReviewForm() {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);

    if (rating === 0) {
      setError("Escolha uma nota de 1 a 5 estrelas.");
      return;
    }

    setIsSubmitting(true);

    let response;
    try {
      response = await fetch("/api/v1/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });
    } catch {
      setIsSubmitting(false);
      setError("Não foi possível enviar sua avaliação. Verifique sua conexão e tente de novo.");
      return;
    }

    setIsSubmitting(false);

    if (!response.ok) {
      const body = await response.json();
      setError(body.message ?? "Não foi possível enviar sua avaliação.");
      return;
    }

    setIsSent(true);
  }

  if (isSent) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-black/[.08] bg-white p-8 text-center dark:border-white/[.145] dark:bg-zinc-950">
        <p className="text-4xl leading-none" aria-hidden="true">
          🍦
        </p>
        <h2 className="text-xl font-semibold text-black dark:text-zinc-50">
          Obrigado pela sua avaliação!
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Sua opinião ajuda a WeFood a melhorar a cada dia.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border border-black/[.08] bg-white p-8 dark:border-white/[.145] dark:bg-zinc-950"
    >
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">
          Que nota você dá para a loja?
        </legend>
        <div className="flex justify-center gap-1">
          {RATING_OPTIONS.map((value) => (
            <label key={value} className="cursor-pointer p-1">
              <input
                type="radio"
                name="rating"
                value={value}
                checked={rating === value}
                onChange={() => setRating(value)}
                className="peer sr-only"
              />
              <span
                aria-hidden="true"
                className={`block text-4xl leading-none transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-current ${
                  value <= rating ? "text-amber-400" : "text-zinc-300 dark:text-zinc-700"
                }`}
              >
                ★
              </span>
              <span className="sr-only">{value === 1 ? "1 estrela" : `${value} estrelas`}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
        Comentário (opcional)
        <textarea
          rows={4}
          maxLength={MAX_COMMENT_LENGTH}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Quer contar mais alguma coisa pra gente?"
          className="rounded-md border border-black/[.08] px-3 py-2 text-black dark:border-white/[.145] dark:text-zinc-50"
        />
      </label>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
      >
        {isSubmitting ? "Enviando..." : "Enviar avaliação"}
      </button>
    </form>
  );
}
