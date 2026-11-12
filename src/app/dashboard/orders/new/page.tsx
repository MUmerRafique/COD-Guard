"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function NewOrderPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const payload = {
      phone: String(form.get("phone") ?? ""),
      fullName: String(form.get("fullName") ?? "") || undefined,
      addressLine: String(form.get("addressLine") ?? "") || undefined,
      city: String(form.get("city") ?? "") || undefined,
      codAmount: Number(form.get("codAmount")),
      externalRef: String(form.get("externalRef") ?? "") || undefined,
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Create failed");
      router.push(`/dashboard/orders/${json.data.order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold">New COD order</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Phone (PK)" name="phone" required placeholder="03xx xxxxxxx" />
        <Field label="Customer name" name="fullName" />
        <Field label="Address" name="addressLine" />
        <Field label="City" name="city" />
        <Field label="COD amount (PKR)" name="codAmount" type="number" required min={0} step="0.01" />
        <Field label="External reference" name="externalRef" />
        <button type="submit" disabled={loading} className="rounded-lg bg-teal-600 px-4 py-2 text-white disabled:opacity-60">
          {loading ? "Saving…" : "Create & score"}
        </button>
      </form>
      {error && (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

function Field(props: React.ComponentProps<"input"> & { label: string }) {
  const { label, ...inputProps } = props;
  const id = inputProps.name ?? inputProps.id;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <input id={id} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" {...inputProps} />
    </div>
  );
}
