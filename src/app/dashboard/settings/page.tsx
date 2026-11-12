"use client";

import { FormEvent, useEffect, useState } from "react";

type Integration = { provider: string; status: string };

export default function SettingsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [bizName, setBizName] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [msgIsError, setMsgIsError] = useState(false);

  useEffect(() => {
    fetch("/api/integrations")
      .then((r) => r.json())
      .then((j) => setIntegrations(j.data ?? []));
  }, []);

  async function createBusiness(e: FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/businesses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: bizName }),
    });
    const json = await res.json();
    if (res.ok) {
      setMsg("Business created.");
      setMsgIsError(false);
      setBizName("");
    } else {
      setMsg(json?.error?.message ?? "Failed to create business.");
      setMsgIsError(true);
    }
  }

  return (
    <section className="space-y-8">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <form onSubmit={createBusiness} className="max-w-md space-y-3">
        <h2 className="font-medium">Create business</h2>
        <label htmlFor="biz" className="block text-sm">
          Business name
        </label>
        <input
          id="biz"
          className="w-full rounded border px-3 py-2"
          value={bizName}
          onChange={(e) => setBizName(e.target.value)}
          required
        />
        <button type="submit" className="rounded bg-teal-600 px-3 py-2 text-sm text-white">
          Create
        </button>
        {msg && (
          <p className={`text-sm ${msgIsError ? "text-red-700" : "text-teal-800"}`} role="alert">
            {msg}
          </p>
        )}
      </form>

      <IntegrationsList list={integrations} />
    </section>
  );
}

function IntegrationsList({ list }: { list: Integration[] }) {
  return (
    <div>
      <h2 className="mb-3 font-medium">Integrations</h2>
      <ul className="space-y-2 text-sm">
        {list.map((i) => (
          <li key={i.provider} className="flex justify-between rounded border bg-white px-3 py-2">
            <span className="capitalize">{i.provider}</span>
            <span className="text-slate-600 capitalize">{i.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
