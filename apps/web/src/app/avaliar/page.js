import ReviewForm from "./review-form";

export const metadata = {
  title: "Avaliar a WeFood",
  description: "Conte pra gente o que você achou da loja",
};

// Public page: no session check on purpose — this is what the in-store QR code
// points to, and the customer is never logged in.
export default function AvaliarPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-black">
      <div className="flex w-full max-w-sm flex-col gap-4">
        <div className="flex flex-col gap-1 text-center">
          <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
            Como foi sua visita?
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Leva menos de um minuto e é anônimo.
          </p>
        </div>
        <ReviewForm />
      </div>
    </div>
  );
}
