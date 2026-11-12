import { isValidPakistanPhone, normalizePakistanPhone } from "@/server/domain/phone";

export type CsvRowError = { row: number; field: string; message: string };

export type CsvOrderRow = {
  phone: string;
  full_name?: string;
  address_line?: string;
  city?: string;
  cod_amount: number;
  external_ref?: string;
};

export function parseCsv(text: string, maxRows = 5000): { rows: CsvOrderRow[]; errors: CsvRowError[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const errors: CsvRowError[] = [];
  const rows: CsvOrderRow[] = [];

  if (lines.length === 0) {
    errors.push({ row: 0, field: "file", message: "CSV is empty" });
    return { rows, errors };
  }

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const required = ["phone", "cod_amount"];
  for (const req of required) {
    if (!header.includes(req)) {
      errors.push({ row: 1, field: "header", message: `Missing required column: ${req}` });
    }
  }
  if (errors.length) return { rows, errors };

  const dataLines = lines.slice(1);
  if (dataLines.length > maxRows) {
    errors.push({ row: 0, field: "file", message: `Maximum ${maxRows} rows allowed` });
    return { rows, errors };
  }

  dataLines.forEach((line, idx) => {
    const rowNum = idx + 2;
    const cols = line.split(",").map((c) => c.trim());
    const record: Record<string, string> = {};
    header.forEach((h, i) => {
      record[h] = cols[i] ?? "";
    });

    if (!isValidPakistanPhone(record.phone ?? "")) {
      errors.push({ row: rowNum, field: "phone", message: "Invalid Pakistan mobile number" });
      return;
    }

    const amount = Number(record.cod_amount);
    if (!Number.isFinite(amount) || amount < 0) {
      errors.push({ row: rowNum, field: "cod_amount", message: "Invalid COD amount" });
      return;
    }

    rows.push({
      phone: normalizePakistanPhone(record.phone)!,
      full_name: record.full_name || record.name || undefined,
      address_line: record.address_line || record.address || undefined,
      city: record.city || undefined,
      cod_amount: amount,
      external_ref: record.external_ref || record.ref || undefined,
    });
  });

  return { rows, errors };
}

/** Escape CSV cell to prevent formula injection in exports. */
export function escapeCsvCell(value: string): string {
  const dangerous = /^[=+\-@\t\r]/;
  const safe = dangerous.test(value) ? `'${value}` : value;
  if (safe.includes(",") || safe.includes('"') || safe.includes("\n")) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}
