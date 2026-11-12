"use client";

import { useEffect, useState, FormEvent } from "react";
import { useParams } from "next/navigation";
import { RiskBadge } from "@/components/RiskBadge";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [overrideScore, setOverrideScore] = useState(50);
  const [overrideReason, setOverrideReason] = useState("");

  function load() {
    fetch(`/api/orders/${id}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error?.message ?? "Not found");
        return json.data;
      })
      .then(setOrder)
      .catch((e) => setError(e.message));
  }

  useEffect(() => {
    load();
  }, [id]);

  async function updateStatus(status: string) {
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function submitOverride(e: FormEvent) {
    e.preventDefault();
    await fetch(`/api/orders/${id}/override-risk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score: overrideScore, reason: overrideReason }),
    });
    setOverrideReason("");
    load();
  }

  if (error) return <p role="alert" className="text-red-700">{error}</p>;
  if (!order) return <p role="status">Loading order…</p>;

  const evaluations = (order.risk_evaluations as { score: number; factors: { label: string; contribution: number }[]; override_reason?: string }[]) ?? [];
  const latest = evaluations[0];

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">Order detail</h1>
      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-slate-500">Status</dt>
          <dd className="font-medium capitalize">{String(order.status)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">COD</dt>
          <dd className="font-medium">
            {String(order.currency)} {Number(order.cod_amount).toLocaleString()}
          </dd>
        </div>
      </dl>

      {latest && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="font-medium">Risk (deterministic)</h2>
          <div className="mt-2">
            <RiskBadge score={latest.score} />
          </div>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {latest.factors?.map((f, i) => (
              <li key={i}>
                {f.label} (+{f.contribution})
              </li>
            ))}
          </ul>
        </div>
      )}

      <OrderActions onAction={updateStatus} />

      <form onSubmit={submitOverride} className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h2 className="font-medium">Human override</h2>
        <label className="block text-sm" htmlFor="score">
          New score (0–100)
        </label>
        <input
          id="score"
          type="number"
          min={0}
          max={100}
          className="w-32 rounded border px-2 py-1"
          value={overrideScore}
          onChange={(e) => setOverrideScore(Number(e.target.value))}
        />
        <label className="block text-sm" htmlFor="reason">
          Reason
        </label>
        <textarea
          id="reason"
          required
          minLength={3}
          className="w-full rounded border px-2 py-1"
          value={overrideReason}
          onChange={(e) => setOverrideReason(e.target.value)}
        />
        <button type="submit" className="rounded bg-slate-800 px-3 py-1.5 text-sm text-white">
          Record override
        </button>
      </form>
    </section>
  );
}

function OrderActions({ onAction }: { onAction: (s: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {["verified", "rejected", "dispatched", "delivered", "rto", "cancelled"].map((s) => (
        <button
          key={s}
          type="button"
          className="rounded border border-slate-300 bg-white px-3 py-1 text-sm capitalize hover:bg-slate-50"
          onClick={() => onAction(s)}
        >
          Mark {s}
        </button>
      ))}
    </div>
  );
}
