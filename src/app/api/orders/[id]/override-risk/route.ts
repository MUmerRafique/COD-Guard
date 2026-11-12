import { z } from "zod";
import { jsonError, ApiError } from "@/lib/api-error";
import { ensureSupabaseConfigured } from "@/lib/configure-check";
import { getActiveBusinessId, requireUser } from "@/server/auth/session";

const schema = z.object({
  score: z.number().int().min(0).max(100),
  reason: z.string().min(3).max(500),
});

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    ensureSupabaseConfigured();
    const { id: orderId } = await ctx.params;
    const { supabase, user } = await requireUser();
    const businessId = await getActiveBusinessId(supabase, user.id);
    if (!businessId) throw new ApiError("NOT_FOUND", "Order not found.", 404);

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ error: { code: "VALIDATION_ERROR", message: "Invalid override payload." } }, { status: 400 });
    }

    const { data: order } = await supabase
      .from("orders")
      .select("id")
      .eq("id", orderId)
      .eq("business_id", businessId)
      .single();
    if (!order) throw new ApiError("NOT_FOUND", "Order not found.", 404);

    const { data, error } = await supabase
      .from("risk_evaluations")
      .insert({
        order_id: orderId,
        business_id: businessId,
        score: parsed.data.score,
        rule_version: "override",
        factors: [{ id: "human_override", label: "Human review", weight: 0, contribution: 0 }],
        is_override: true,
        override_reason: parsed.data.reason,
      })
      .select()
      .single();
    if (error) throw error;

    return Response.json({ data });
  } catch (e) {
    return jsonError(e);
  }
}
