"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Usage = {
  planId: string;
  usage: { orders: number };
  limits: { ordersPerMonth: number };
};

export default function DashboardPage() {
  const [usage, setUsage] = useState<Usage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/usage", { credentials: "same-origin" })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          const code = body?.error?.code as string | undefined;
          if (res.status === 401) {
            throw new Error("SESSION_REQUIRED");
          }
          if (code === "CONFIGURATION_ERROR") {
            throw new Error("CONFIGURATION_ERROR");
          }
          throw new Error(body?.error?.message ?? `HTTP ${res.status}`);
        }
        return body;
      })
      .then((json) => setUsage(json.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p role="status" className="text-slate-600">Loading dashboard…</p>;
  }

  if (error) {
    const sessionRequired = error === "SESSION_REQUIRED";
    const configError = error === "CONFIGURATION_ERROR";
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm" role="alert">
        <p className="font-medium text-amber-900">Could not load dashboard</p>
        {sessionRequired ? (
          <p className="mt-1 text-amber-800">
            You are not signed in yet. Complete email verification, or sign in again.
          </p>
        ) : configError ? (
          <p className="mt-1 text-amber-800">
            Set <code className="rounded bg-white px-1">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code className="rounded bg-white px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in{" "}
            <code className="rounded bg-white px-1">.env.local</code>.
          </p>
        ) : (
          <>
            <p className="mt-1 text-amber-800">{error}</p>
            <p className="mt-2 text-amber-800">
              If you just connected Supabase, run the SQL migration in{" "}
              <code className="rounded bg-white px-1">supabase/migrations/</code> from the Supabase SQL editor.
            </p>
          </>
        )}
        <Link href="/login" className="mt-3 inline-block text-teal-700 underline">
          Sign in
        </Link>
        {sessionRequired && (
          <p className="mt-2 text-xs text-amber-800">
            In Supabase → Authentication → URL configuration, add redirect URL:{" "}
            <code className="rounded bg-white px-1">http://localhost:3000/auth/callback</code>
          </p>
        )}
      </div>
    );
  }

  const ordersUsed = usage?.usage?.orders ?? 0;
  const ordersLimit = usage?.limits?.ordersPerMonth ?? 500;

  return (
    <section aria-labelledby="dash-title" className="space-y-6">
      <h1 id="dash-title" className="text-2xl font-semibold">
        Overview
      </h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Plan</p>
          <p className="text-xl font-medium capitalize">{usage?.planId ?? "starter"}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Orders this month</p>
          <p className="text-xl font-medium">
            {ordersUsed} / {ordersLimit}
          </p>
        </div>
      </div>
      <p className="text-sm text-slate-600">
        High-risk queues and integration health are available under Orders and Settings.
      </p>
    </section>
  );
}
