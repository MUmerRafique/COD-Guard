import { jsonError } from "@/lib/api-error";
import { ensureSupabaseConfigured } from "@/lib/configure-check";
import { getActiveBusinessId, requireUser } from "@/server/auth/session";
import { parseCsv } from "@/server/domain/csv/import";
import { createOrder } from "@/server/services/orders";

export async function POST(request: Request) {
  try {
    ensureSupabaseConfigured();
    const { supabase, user } = await requireUser();
    const businessId = await getActiveBusinessId(supabase, user.id);
    if (!businessId) {
      return Response.json({ error: { code: "VALIDATION_ERROR", message: "Create a business first." } }, { status: 400 });
    }

    const form = await request.formData();
    const file = form.get("file");
    const dryRun = form.get("dryRun") === "true";
    if (!(file instanceof File)) {
      return Response.json({ error: { code: "VALIDATION_ERROR", message: "CSV file required." } }, { status: 400 });
    }
    if (file.size > 2 * 1024 * 1024) {
      return Response.json({ error: { code: "VALIDATION_ERROR", message: "File exceeds 2MB limit." } }, { status: 400 });
    }

    const text = await file.text();
    const { rows, errors } = parseCsv(text);
    if (errors.length) {
      return Response.json({ preview: true, errors, imported: 0 }, { status: 400 });
    }

    if (dryRun) {
      return Response.json({ preview: true, rowCount: rows.length, errors: [] });
    }

    const results: { row: number; orderId?: string; error?: string }[] = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const { order } = await createOrder(supabase, {
          businessId,
          phone: row.phone,
          fullName: row.full_name,
          addressLine: row.address_line,
          city: row.city,
          codAmount: row.cod_amount,
          externalRef: row.external_ref,
          source: "csv",
          idempotencyKey: `csv:${businessId}:${i}:${row.phone}:${row.cod_amount}`,
        });
        results.push({ row: i + 2, orderId: order.id as string });
      } catch (e) {
        results.push({ row: i + 2, error: e instanceof Error ? e.message : "Import failed" });
      }
    }

    const failed = results.filter((r) => r.error);
    return Response.json({
      imported: results.length - failed.length,
      failed: failed.length,
      results,
    });
  } catch (e) {
    return jsonError(e);
  }
}
