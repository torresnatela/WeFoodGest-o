const TONES = {
  brand: "bg-brand-tint text-brand",
  neutral: "bg-surface-2 text-muted",
  success: "bg-surface-2 text-success",
};

export default function Badge({ tone = "neutral", className = "", children }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
