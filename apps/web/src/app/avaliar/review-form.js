"use client";

import { useState } from "react";

import Button from "@/components/ui/button";
import Card from "@/components/ui/card";

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
      const body = await response.json().catch(() => ({}));
      setError(body.message ?? "Não foi possível enviar sua avaliação.");
      return;
    }

    setIsSent(true);
  }

  if (isSent) {
    return (
      <Card className="flex flex-col items-center gap-2 p-8 text-center">
        <p className="text-4xl leading-none" aria-hidden="true">
          🍦
        </p>
        <h2 className="text-xl font-extrabold text-ink">Obrigado pela sua avaliação!</h2>
        <p className="text-sm text-muted">Sua opinião ajuda a WeFood a melhorar a cada dia.</p>
      </Card>
    );
  }

  return (
    <Card as="form" onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium text-muted">
          Que nota você dá para a loja?
        </legend>
        <div className="flex justify-center gap-1">
          {RATING_OPTIONS.map((value) => (
            <label key={value} className="flex min-h-12 min-w-12 cursor-pointer items-center justify-center">
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
                  value <= rating ? "text-accent" : "text-line"
                }`}
              >
                ★
              </span>
              <span className="sr-only">{value === 1 ? "1 estrela" : `${value} estrelas`}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="review-comment" className="text-sm font-medium text-muted">
          Comentário (opcional)
        </label>
        <textarea
          id="review-comment"
          rows={4}
          maxLength={MAX_COMMENT_LENGTH}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Quer contar mais alguma coisa pra gente?"
          className="rounded-md border border-line bg-surface px-3 py-2 text-ink placeholder:text-muted"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" isLoading={isSubmitting} loadingLabel="Enviando...">
        Enviar avaliação
      </Button>
    </Card>
  );
}
