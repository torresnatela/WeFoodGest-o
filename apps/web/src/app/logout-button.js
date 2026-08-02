"use client";

export default function LogoutButton() {
  async function handleLogout() {
    await fetch("/api/v1/sessions", { method: "DELETE" });
    window.location.href = "/login";
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
    >
      Sair
    </button>
  );
}
