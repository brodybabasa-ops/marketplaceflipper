"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/account";
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") || ""),
      email: String(form.get("email") || ""),
      password: String(form.get("password") || ""),
    };
    const response = await fetch(mode === "login" ? "/api/auth/login" : "/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error || "Unable to continue");
      setPending(false);
      return;
    }
    window.location.href = next;
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-[family-name:var(--font-instrument)] text-4xl">
        {mode === "login" ? "Sign in" : "Create account"}
      </h1>
      <p className="mt-2 text-sm text-muted">
        Save searches, favorite listings, and get new-match alerts.
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-2xl border border-border bg-surface p-5">
        {mode === "register" ? (
          <label className="block">
            <span className="mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-muted">Name</span>
            <input name="name" required className="select" />
          </label>
        ) : null}
        <label className="block">
          <span className="mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-muted">Email</span>
          <input name="email" type="email" required className="select" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-muted">Password</span>
          <input name="password" type="password" minLength={8} required className="select" />
        </label>
        {error ? <p className="text-sm text-copper">{error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="h-12 w-full rounded-xl bg-accent text-sm font-semibold text-accent-fg"
        >
          {pending ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
        </button>
      </form>
      <p className="mt-4 text-sm text-muted">
        {mode === "login" ? (
          <>
            No account? <Link href="/register" className="text-foreground">Create one</Link>
          </>
        ) : (
          <>
            Already registered? <Link href="/login" className="text-foreground">Sign in</Link>
          </>
        )}
      </p>
      {mode === "login" ? (
        <p className="mt-3 text-xs text-muted">
          Demo: demo@lotline.local / LotlineDemo!2026
        </p>
      ) : null}
    </div>
  );
}
