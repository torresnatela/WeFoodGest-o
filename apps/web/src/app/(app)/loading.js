export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-8">
      <div className="h-8 w-48 animate-pulse rounded-md bg-surface-2" />
      <div className="h-20 animate-pulse rounded-lg bg-surface-2" />
      <div className="h-16 animate-pulse rounded-lg bg-surface-2" />
      <div className="h-16 animate-pulse rounded-lg bg-surface-2" />
      <span className="sr-only">Carregando…</span>
    </div>
  );
}
