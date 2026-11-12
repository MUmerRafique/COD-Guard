import { jsonError, ApiError } from "@/lib/api-error";
import { getServerEnv } from "@/lib/env";
import { shopifyWebhookValid } from "@/server/integrations/webhooks";
import { createServiceClient } from "@/server/supabase/admin";

export async function POST(request: Request) {
  try {
    const raw = await request.text();
    const hmac = request.headers.get("x-shopify-hmac-sha256");
    const secret = getServerEnv().SHOPIFY_WEBHOOK_SECRET ?? "";
    if (!shopifyWebhookValid(raw, secret, hmac)) {
      throw new ApiError("UNAUTHORIZED", "Invalid webhook signature.", 401);
    }

    const payload = JSON.parse(raw) as Record<string, unknown>;
    const externalId = String(payload.id ?? request.headers.get("x-shopify-webhook-id") ?? crypto.randomUUID());

    const admin = createServiceClient();
    const { error } = await admin.from("webhook_events").insert({
      business_id: null,
      provider: "shopify",
      external_id: externalId,
      payload,
    });
    if (error?.code === "23505") {
      return Response.json({ ok: true, duplicate: true });
    }
    if (error) throw error;

    return Response.json({ ok: true });
  } catch (e) {
    return jsonError(e);
  }
}
