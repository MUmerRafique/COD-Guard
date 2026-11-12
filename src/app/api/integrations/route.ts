import { jsonError } from "@/lib/api-error";
import { ensureSupabaseConfigured } from "@/lib/configure-check";
import { getActiveBusinessId, requireUser } from "@/server/auth/session";

const DEFAULT_CONNECTIONS = [
  { provider: "shopify", status: "disconnected" },
  { provider: "woocommerce", status: "disconnected" },
  { provider: "whatsapp", status: process.env.WHATSAPP_API_TOKEN ? "misconfigured" : "disconnected" },
  { provider: "courier", status: "disconnected" },
];

export async function GET() {
  try {
    ensureSupabaseConfigured();
    const { supabase, user } = await requireUser();
    const businessId = await getActiveBusinessId(supabase, user.id);
    if (!businessId) {
      return Response.json({ data: DEFAULT_CONNECTIONS });
    }

    const { data, error } = await supabase
      .from("integration_connections")
      .select("provider, status, updated_at")
      .eq("business_id", businessId);
    if (error) throw error;

    const map = new Map((data ?? []).map((r) => [r.provider, r]));
    const merged = DEFAULT_CONNECTIONS.map((d) => ({
      provider: d.provider,
      status: (map.get(d.provider)?.status as string) ?? d.status,
      updatedAt: map.get(d.provider)?.updated_at ?? null,
    }));

    return Response.json({ data: merged });
  } catch (e) {
    return jsonError(e);
  }
}
