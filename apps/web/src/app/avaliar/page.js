import ReviewForm from "./review-form";

export const metadata = {
  title: "Avaliar a WeFood",
  description: "Conte pra gente o que você achou da loja",
};

// Página pública: sem checagem de sessão de propósito — é para onde o QR code
// da loja aponta, e o cliente nunca está logado.
export default function AvaliarPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="text-center">
          <p className="font-display text-3xl font-extrabold text-brand">WeFood</p>
          <h1 className="mt-2 text-xl font-extrabold text-ink">Como foi sua visita?</h1>
          <p className="text-sm text-muted">Leva menos de um minuto e é anônimo.</p>
        </div>
        <ReviewForm />
      </div>
    </div>
  );
}
