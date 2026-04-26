"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin() {
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });

      if (!response.ok) {
        setError("Bledne haslo.");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Nie udalo sie zalogowac.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-50 to-white p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-brand-100">
        <h1 className="text-2xl font-semibold text-brand-900">Logowanie właściciela</h1>
        <p className="mt-1 text-sm text-slate-500">Dostep do panelu /admin</p>

        <div className="mt-5 space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Haslo admina"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleLogin}
            disabled={isSubmitting}
            className="w-full rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-70"
          >
            {isSubmitting ? "Logowanie..." : "Zaloguj"}
          </button>
          {error && <p className="text-sm text-rose-600">{error}</p>}
        </div>
      </div>
    </main>
  );
}
