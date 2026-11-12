import { jsonError, ApiError } from "@/lib/api-error";
import { getServerEnv } from "@/lib/env";
import { verifyHmacSha256 } from "@/server/integrations/webhooks";
import { createServiceClient } from "@/server/supabase/admin";

export async function POST(request: Request) {
  try {
    const raw = await request.text();
    const sig = request.headers.get("x-wc-webhook-signature");
    const secret = getServerEnv().WOOCOMMERCE_WEBHOOK_SECRET ?? "";
    if (!verifyHmacSha256(raw, secret, sig)) {
      throw new ApiError("UNAUTHORIZED", "Invalid webhook signature.", 401);
    }

    const payload = JSON.parse(raw) as Record<string, unknown>;
    const externalId = String(payload.id ?? crypto.randomUUID());

    const admin = createServiceClient();
    const { error } = await admin.from("webhook_events").insert({
      business_id: null,
      provider: "woocommerce",
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
