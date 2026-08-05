"use client";

export default function Chip({
  selected = false,
  onToggle,
  role = "checkbox",
  className = "",
  children,
}) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={selected}
      onClick={onToggle}
      className={`min-h-12 rounded-full px-4 text-sm font-semibold transition-colors ${
        selected
          ? "bg-brand text-on-brand"
          : "border border-line bg-surface text-muted hover:bg-surface-2"
      } ${className}`}
    >
      {children}
    </button>
  );
}
