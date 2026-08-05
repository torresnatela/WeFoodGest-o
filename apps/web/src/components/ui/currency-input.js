"use client";

import Input from "./input";
import { onlyDigits } from "@/lib/format";

export default function CurrencyInput({ label = "Valor gasto", value, onChange, ...props }) {
  function handleChange(event) {
    const digits = onlyDigits(event.target.value).slice(0, 9);
    onChange(digits === "" ? 0 : Number(digits) / 100);
  }

  const display = Number(value ?? 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <Input
      {...props}
      label={label}
      type="text"
      inputMode="decimal"
      value={`R$ ${display}`}
      onChange={handleChange}
      className="text-2xl font-bold tracking-tight"
    />
  );
}
