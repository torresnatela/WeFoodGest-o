export default function EmptyState({ icon = "🍦", title, description, action }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-line px-6 py-12 text-center">
      <span aria-hidden="true" className="text-3xl">
        {icon}
      </span>
      <p className="font-semibold text-ink">{title}</p>
      {description && <p className="max-w-xs text-sm text-muted">{description}</p>}
      {/* Sem contexto flex, `min-h-11` não vale para um link inline e o alvo
          de toque encolhe para a altura da linha. */}
      {action && <div className="mt-2 flex justify-center">{action}</div>}
    </div>
  );
}
