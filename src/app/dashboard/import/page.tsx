"use client";

import { useState } from "react";

export default function ImportPage() {
  const [result, setResult] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ row: number; message: string }[]>([]);
  const [loading, setLoading] = useState(false);

  async function upload(file: File, dryRun: boolean) {
    setLoading(true);
    setResult(null);
    setErrors([]);
    const form = new FormData();
    form.append("file", file);
    if (dryRun) form.append("dryRun", "true");
    const res = await fetch("/api/imports/csv", { method: "POST", body: form });
    const json = await res.json();
    setLoading(false);
    if (json.errors?.length) {
      setErrors(
        json.errors.map((e: { row: number; field?: string; message?: string }) => ({
          row: e.row,
          message: e.message ?? e.field ?? "Error",
        })),
      );
      return;
    }
    if (json.preview) {
      setResult(`Preview OK: ${json.rowCount} rows`);
      return;
    }
    setResult(`Imported ${json.imported}, failed ${json.failed}`);
  }

  return (
    <section className="max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold">CSV import</h1>
      <p className="text-sm text-slate-600">
        Required columns: <code>phone</code>, <code>cod_amount</code>. Optional: <code>full_name</code>,{" "}
        <code>address_line</code>, <code>city</code>, <code>external_ref</code>.
      </p>
      <input
        type="file"
        accept=".csv,text/csv"
        aria-label="CSV file"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f, true);
        }}
        className="block w-full text-sm"
      />
      <button
        type="button"
        disabled={loading}
        className="rounded-lg bg-teal-600 px-4 py-2 text-sm text-white disabled:opacity-60"
        onClick={() => {
          const input = document.querySelector<HTMLInputElement>('input[type="file"]');
          const f = input?.files?.[0];
          if (f) upload(f, false);
        }}
      >
        {loading ? "Importing…" : "Import after preview"}
      </button>
      {result && <p role="status" className="text-sm text-green-800">{result}</p>}
      {errors.length > 0 && (
        <ul className="list-disc pl-5 text-sm text-red-700" role="alert">
          {errors.map((e, i) => (
            <li key={i}>
              Row {e.row}: {e.message}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
