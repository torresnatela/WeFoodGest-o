const VARIANTS = {
  primary: "bg-brand text-on-brand hover:bg-brand-hover shadow-card",
  secondary: "bg-surface text-ink border border-line hover:bg-surface-2",
  ghost: "text-ink hover:bg-surface-2",
};

const SIZES = {
  md: "min-h-11 px-5 text-sm",
  lg: "min-h-13 px-6 text-base",
};

export default function Button({
  as: Tag = "button",
  variant = "primary",
  size = "md",
  type = "button",
  isLoading = false,
  loadingLabel = "Aguarde...",
  className = "",
  children,
  disabled,
  ...props
}) {
  // `type` e `disabled` só existem em <button>. Emiti-los num <a> renderizado
  // por `as={Link}` produziria atributos inválidos no HTML.
  const buttonOnlyProps = Tag === "button" ? { type, disabled: disabled || isLoading } : {};

  return (
    <Tag
      {...props}
      {...buttonOnlyProps}
      aria-busy={isLoading || undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    >
      {isLoading ? loadingLabel : children}
    </Tag>
  );
}
