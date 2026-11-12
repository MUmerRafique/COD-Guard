"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RiskBadge } from "@/components/RiskBadge";

type OrderRow = {
  id: string;
  status: string;
  cod_amount: number;
  currency: string;
  created_at: string;
  customers?: { full_name: string | null; phone_normalized: string } | null;
  risk_evaluations?: { score: number }[] | null;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders?limit=50")
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error?.message ?? "Failed to load orders");
        return json;
      })
      .then((json) => setOrders(json.data ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="space-y-4" aria-labelledby="orders-title">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 id="orders-title" className="text-2xl font-semibold">
          Orders
        </h1>
        <Link href="/dashboard/orders/new" className="rounded-lg bg-teal-600 px-4 py-2 text-sm text-white">
          New order
        </Link>
      </div>

      {loading && <p role="status">Loading orders…</p>}
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      {!loading && !error && orders.length === 0 && (
        <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-600">
          No orders yet.{" "}
          <Link href="/dashboard/orders/new" className="text-teal-700 underline">
            Create your first COD order
          </Link>
        </p>
      )}

      {orders.length > 0 && (
        <OrdersTable orders={orders} />
      )}
    </section>
  );
}

function OrdersTable({ orders }: { orders: OrderRow[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b bg-slate-50 text-slate-600">
          <tr>
            <th className="px-4 py-3 font-medium" scope="col">
              Customer
            </th>
            <th className="px-4 py-3 font-medium" scope="col">
              COD
            </th>
            <th className="px-4 py-3 font-medium" scope="col">
              Risk
            </th>
            <th className="px-4 py-3 font-medium" scope="col">
              Status
            </th>
            <th className="px-4 py-3 font-medium" scope="col">
              Created
            </th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => {
            const latestRisk = o.risk_evaluations?.[0]?.score ?? 0;
            return (
              <tr key={o.id} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <Link href={`/dashboard/orders/${o.id}`} className="font-medium text-teal-800 hover:underline">
                    {o.customers?.full_name ?? "Customer"}
                  </Link>
                  <div className="text-xs text-slate-500">···{String(o.customers?.phone_normalized ?? "").slice(-4)}</div>
                </td>
                <td className="px-4 py-3">
                  {o.currency} {Number(o.cod_amount).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <RiskBadge score={latestRisk} />
                </td>
                <td className="px-4 py-3 capitalize">{o.status}</td>
                <td className="px-4 py-3 text-slate-500">{new Date(o.created_at).toLocaleString()}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
