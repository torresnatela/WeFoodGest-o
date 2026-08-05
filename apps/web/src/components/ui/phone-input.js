"use client";

import Input from "./input";
import { formatPhone, onlyDigits } from "@/lib/format";

export default function PhoneInput({ label = "Telefone", value, onChange, ...props }) {
  function handleChange(event) {
    onChange(onlyDigits(event.target.value).slice(0, 11));
  }

  return (
    <Input
      {...props}
      label={label}
      type="tel"
      inputMode="numeric"
      autoComplete="tel"
      placeholder="(15) 99123-4001"
      value={formatPhone(value)}
      onChange={handleChange}
    />
  );
}
