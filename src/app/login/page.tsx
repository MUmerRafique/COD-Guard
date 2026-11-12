"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="p-12 text-center text-slate-600">Loading…</p>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setDevLink(null);
    if (!isSupabaseConfigured()) {
      setError("Supabase is not configured. Add keys to .env.local (see .env.example).");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const body = (await res.json().catch(() => null)) as {
        message?: string;
        link?: string;
        mode?: string;
        error?: { message?: string };
      } | null;

      if (!res.ok) {
        setError(body?.error?.message ?? "Sign-in failed");
        return;
      }

      setMessage(body?.message ?? "Check your email for the magic link.");
      if (body?.mode === "dev" && body.link) {
        setDevLink(body.link);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <h1 className="mb-2 text-2xl font-semibold">Sign in to CODGuard</h1>
      <p className="mb-6 text-sm text-slate-600">Passwordless email link via Supabase Auth.</p>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <label className="block text-sm font-medium" htmlFor="email">
          Work email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-md border border-slate-300 px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-teal-600 py-2 text-white disabled:opacity-60"
        >
          {loading ? "Sending…" : "Send magic link"}
        </button>
      </form>
      {message && <p className="mt-4 text-sm text-green-700" role="status">{message}</p>}
      {devLink && (
        <p className="mt-2 break-all text-sm">
          <a href={devLink} className="font-medium text-teal-700 underline">
            Open sign-in link
          </a>
        </p>
      )}
      {(urlError === "auth_callback" || urlError === "missing_code") && (
        <p className="mt-4 text-sm text-red-700" role="alert">
          Sign-in link expired or invalid. Request a new magic link.
        </p>
      )}
      {error && <p className="mt-4 text-sm text-red-700" role="alert">{error}</p>}
      <Link href="/" className="mt-8 text-sm text-teal-700 hover:underline">
        ← Back home
      </Link>
    </main>
  );
}

