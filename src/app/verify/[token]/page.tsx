"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function VerifyPage() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/public/verify/${token}`)
      .then(async (res) => {
        if (!res.ok) {
          const j = await res.json();
          throw new Error(j?.error?.message ?? "Invalid link");
        }
      })
      .catch((e) => setError(e.message));
  }, [token]);

  async function decide(decision: "confirm" | "cancel") {
    setStatus(null);
    const res = await fetch(`/api/public/verify/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json?.error?.message ?? "Request failed");
      return;
    }
    setStatus(json.data.status);
  }

  if (error) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <p role="alert" className="text-red-700">{error}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md space-y-6 px-4 py-16 text-center">
      <h1 className="text-xl font-semibold">Confirm your order</h1>
      <p className="text-sm text-slate-600">Your shop uses CODGuard for delivery confirmation only.</p>
      {status ? (
        <p className="text-green-800" role="status">
          Thank you. Status: {status}
        </p>
      ) : (
        <div className="flex justify-center gap-3">
          <button
            type="button"
            className="rounded-lg bg-teal-600 px-4 py-2 text-white"
            onClick={() => decide("confirm")}
          >
            Confirm delivery
          </button>
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-4 py-2"
            onClick={() => decide("cancel")}
          >
            Cancel order
          </button>
        </div>
      )}
    </main>
  );
}
