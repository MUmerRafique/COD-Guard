export type PlanLimits = {
  planId: string;
  ordersPerMonth: number;
  whatsappPerMonth: number;
  aiPerMonth: number;
};

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  starter: { planId: "starter", ordersPerMonth: 500, whatsappPerMonth: 0, aiPerMonth: 0 },
  growth: { planId: "growth", ordersPerMonth: 5000, whatsappPerMonth: 1000, aiPerMonth: 100 },
  pro: { planId: "pro", ordersPerMonth: 50000, whatsappPerMonth: 10000, aiPerMonth: 1000 },
};

export function canConsume(
  limits: PlanLimits,
  usage: { orders: number; whatsapp: number; ai: number },
  event: "order" | "whatsapp" | "ai",
): boolean {
  switch (event) {
    case "order":
      return usage.orders < limits.ordersPerMonth;
    case "whatsapp":
      return usage.whatsapp < limits.whatsappPerMonth;
    case "ai":
      return usage.ai < limits.aiPerMonth;
    default:
      return false;
  }
}
