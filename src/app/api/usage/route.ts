import { jsonError } from "@/lib/api-error";
import { ensureSupabaseConfigured } from "@/lib/configure-check";
import { getActiveBusinessId, requireUser } from "@/server/auth/session";
import { getPlanAndUsage } from "@/server/services/orders";

export async function GET() {
  try {
    ensureSupabaseConfigured();
    const { supabase, user } = await requireUser();
    const businessId = await getActiveBusinessId(supabase, user.id);
    if (!businessId) {
      return Response.json({ data: { planId: "starter", usage: {}, limits: {} } });
    }

    const { planId, limits, usage } = await getPlanAndUsage(supabase, businessId);
    return Response.json({
      data: {
        planId,
        usage,
        limits: {
          ordersPerMonth: limits.ordersPerMonth,
          whatsappPerMonth: limits.whatsappPerMonth,
          aiPerMonth: limits.aiPerMonth,
        },
      },
    });
  } catch (e) {
    return jsonError(e);
  }
}
