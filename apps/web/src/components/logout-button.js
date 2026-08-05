"use client";

export default function LogoutButton({ className = "" }) {
  async function handleLogout() {
    await fetch("/api/v1/sessions", { method: "DELETE" });
    window.location.href = "/login";
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={`inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-ink ${className}`}
    >
      Sair
    </button>
  );
}
