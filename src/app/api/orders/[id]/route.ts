import { z } from "zod";
import { jsonError } from "@/lib/api-error";
import { ensureSupabaseConfigured } from "@/lib/configure-check";
import { getActiveBusinessId, requireUser } from "@/server/auth/session";
import { transitionOrderStatus } from "@/server/services/orders";

const patchSchema = z.object({
  status: z.enum(["verified", "rejected", "cancelled", "dispatched", "delivered", "rto"]),
});

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    ensureSupabaseConfigured();
    const { id } = await ctx.params;
    const { supabase, user } = await requireUser();
    const businessId = await getActiveBusinessId(supabase, user.id);
    if (!businessId) {
      return Response.json({ error: { code: "NOT_FOUND", message: "Order not found" } }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("orders")
      .select(
        "*, customers(full_name, phone_normalized), risk_evaluations(score, rule_version, factors, is_override, override_reason, created_at)",
      )
      .eq("id", id)
      .eq("business_id", businessId)
      .single();

    if (error || !data) {
      return Response.json({ error: { code: "NOT_FOUND", message: "Order not found" } }, { status: 404 });
    }
    return Response.json({ data });
  } catch (e) {
    return jsonError(e);
  }
}

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    ensureSupabaseConfigured();
    const { id } = await ctx.params;
    const { supabase, user } = await requireUser();
    const businessId = await getActiveBusinessId(supabase, user.id);
    if (!businessId) {
      return Response.json({ error: { code: "NOT_FOUND", message: "Order not found" } }, { status: 404 });
    }

    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ error: { code: "VALIDATION_ERROR", message: "Invalid status." } }, { status: 400 });
    }

    const updated = await transitionOrderStatus(supabase, businessId, id, parsed.data.status);
    return Response.json({ data: updated });
  } catch (e) {
    return jsonError(e);
  }
}
