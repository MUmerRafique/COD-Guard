import { PLAN_LIMITS } from "@/server/domain/usage/limits";

export async function GET() {
  const plans = Object.values(PLAN_LIMITS).map((p) => ({
    id: p.planId,
    ordersPerMonth: p.ordersPerMonth,
    whatsappMessagesPerMonth: p.whatsappPerMonth,
    aiInsightsPerMonth: p.aiPerMonth,
  }));
  return Response.json({ data: plans });
}
