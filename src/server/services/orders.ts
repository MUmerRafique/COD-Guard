import type { SupabaseClient } from "@supabase/supabase-js";
import { computeRiskScore } from "@/server/domain/risk/score";
import { normalizePakistanPhone, isValidPakistanPhone } from "@/server/domain/phone";
import { ApiError } from "@/lib/api-error";
import { canConsume, PLAN_LIMITS } from "@/server/domain/usage/limits";
import { generateVerificationToken } from "@/server/domain/tokens";

export type CreateOrderInput = {
  businessId: string;
  phone: string;
  fullName?: string;
  addressLine?: string;
  city?: string;
  codAmount: number;
  externalRef?: string;
  source: "manual" | "csv" | "shopify" | "woocommerce";
  idempotencyKey?: string;
};

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending: ["verified", "rejected", "cancelled"],
  verified: ["dispatched", "cancelled"],
  rejected: [],
  cancelled: [],
  dispatched: ["delivered", "rto"],
  delivered: [],
  rto: [],
};

export async function getPlanAndUsage(supabase: SupabaseClient, businessId: string) {
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan_id")
    .eq("business_id", businessId)
    .maybeSingle();
  const planId = (sub?.plan_id as string) ?? "starter";
  const limits = PLAN_LIMITS[planId] ?? PLAN_LIMITS.starter;

  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("usage_events")
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("event_type", "order_created")
    .gte("created_at", startOfMonth.toISOString());

  return {
    planId,
    limits,
    usage: { orders: count ?? 0, whatsapp: 0, ai: 0 },
  };
}

export async function createOrder(supabase: SupabaseClient, input: CreateOrderInput) {
  if (!isValidPakistanPhone(input.phone)) {
    throw new ApiError("VALIDATION_ERROR", "Invalid Pakistan phone number.", 400);
  }
  const phone = normalizePakistanPhone(input.phone)!;

  const planUsage = await getPlanAndUsage(supabase, input.businessId);
  if (!canConsume(planUsage.limits, planUsage.usage, "order")) {
    throw new ApiError("FORBIDDEN", "Monthly order limit reached for your plan.", 403);
  }

  const { data: customer, error: custErr } = await supabase
    .from("customers")
    .upsert(
      {
        business_id: input.businessId,
        phone_normalized: phone,
        full_name: input.fullName ?? null,
      },
      { onConflict: "business_id,phone_normalized" },
    )
    .select()
    .single();

  if (custErr || !customer) {
    throw new ApiError("INTERNAL_ERROR", "Could not upsert customer.", 500);
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: dupes } = await supabase
    .from("orders")
    .select("id")
    .eq("business_id", input.businessId)
    .eq("customer_id", customer.id)
    .eq("cod_amount", input.codAmount)
    .gte("created_at", since);

  const { count: rtoCount } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("business_id", input.businessId)
    .eq("customer_id", customer.id)
    .eq("status", "rto");

  const risk = computeRiskScore({
    phoneValid: true,
    codAmount: input.codAmount,
    duplicateRecent: (dupes?.length ?? 0) > 0,
    priorRtoCount: rtoCount ?? 0,
    addressMissing: !input.addressLine?.trim(),
  });

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      business_id: input.businessId,
      customer_id: customer.id,
      external_ref: input.externalRef ?? null,
      address_line: input.addressLine ?? null,
      city: input.city ?? null,
      cod_amount: input.codAmount,
      currency: "PKR",
      status: "pending",
      source: input.source,
    })
    .select("*, customers(full_name, phone_normalized)")
    .single();

  if (orderErr || !order) {
    throw new ApiError("INTERNAL_ERROR", "Could not create order.", 500);
  }

  await supabase.from("risk_evaluations").insert({
    order_id: order.id,
    business_id: input.businessId,
    score: risk.score,
    rule_version: risk.ruleVersion,
    factors: risk.factors,
  });

  const idem = input.idempotencyKey ?? `order:${order.id}`;
  await supabase.from("usage_events").insert({
    business_id: input.businessId,
    event_type: "order_created",
    idempotency_key: idem,
    quantity: 1,
  });

  const { token, tokenHash } = generateVerificationToken();
  const expires = new Date(Date.now() + 48 * 60 * 60 * 1000);
  await supabase.from("verification_tokens").insert({
    order_id: order.id,
    business_id: input.businessId,
    token_hash: tokenHash,
    action: "verify",
    expires_at: expires.toISOString(),
  });

  return { order, risk, verificationToken: token };
}

export async function transitionOrderStatus(
  supabase: SupabaseClient,
  businessId: string,
  orderId: string,
  nextStatus: string,
) {
  const { data: order, error } = await supabase
    .from("orders")
    .select("status, business_id")
    .eq("id", orderId)
    .eq("business_id", businessId)
    .single();

  if (error || !order) {
    throw new ApiError("NOT_FOUND", "Order not found.", 404);
  }

  const allowed = ALLOWED_TRANSITIONS[order.status as string] ?? [];
  if (!allowed.includes(nextStatus)) {
    throw new ApiError("VALIDATION_ERROR", `Cannot transition from ${order.status} to ${nextStatus}.`, 400);
  }

  const { data: updated, error: updErr } = await supabase
    .from("orders")
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq("id", orderId)
    .select()
    .single();

  if (updErr || !updated) {
    throw new ApiError("INTERNAL_ERROR", "Could not update order.", 500);
  }
  return updated;
}
