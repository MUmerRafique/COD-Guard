import { z } from "zod";
import { jsonError } from "@/lib/api-error";
import { ensureSupabaseConfigured } from "@/lib/configure-check";
import { getActiveBusinessId, requireUser } from "@/server/auth/session";
import { createOrder } from "@/server/services/orders";

const createSchema = z.object({
  phone: z.string().min(1),
  fullName: z.string().optional(),
  addressLine: z.string().optional(),
  city: z.string().optional(),
  codAmount: z.number().nonnegative(),
  externalRef: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    ensureSupabaseConfigured();
    const { supabase, user } = await requireUser();
    const businessId = await getActiveBusinessId(supabase, user.id);
    if (!businessId) {
      return Response.json({ data: [], meta: { page: 1, limit: 20, total: 0 } });
    }

    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? "20")));
    const status = url.searchParams.get("status");
    const from = (page - 1) * limit;

    let query = supabase
      .from("orders")
      .select(
        "id, status, cod_amount, currency, source, created_at, customers(full_name, phone_normalized), risk_evaluations(score, rule_version, factors, created_at)",
        { count: "exact" },
      )
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .range(from, from + limit - 1);

    if (status) query = query.eq("status", status);

    const { data, error, count } = await query;
    if (error) throw error;

    return Response.json({
      data: data ?? [],
      meta: { page, limit, total: count ?? 0 },
    });
  } catch (e) {
    return jsonError(e);
  }
}

export async function POST(request: Request) {
  try {
    ensureSupabaseConfigured();
    const { supabase, user } = await requireUser();
    const businessId = await getActiveBusinessId(supabase, user.id);
    if (!businessId) {
      return Response.json(
        { error: { code: "VALIDATION_ERROR", message: "Create a business first." } },
        { status: 400 },
      );
    }

    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json(
        { error: { code: "VALIDATION_ERROR", message: "Invalid order payload.", details: parsed.error.flatten() } },
        { status: 400 },
      );
    }

    const idempotencyKey = request.headers.get("Idempotency-Key") ?? undefined;
    const result = await createOrder(supabase, {
      businessId,
      ...parsed.data,
      source: "manual",
      idempotencyKey,
    });

    return Response.json({ data: result }, { status: 201 });
  } catch (e) {
    return jsonError(e);
  }
}
