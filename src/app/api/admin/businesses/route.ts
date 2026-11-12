import { jsonError } from "@/lib/api-error";
import { ensureSupabaseConfigured } from "@/lib/configure-check";
import { requireSuperAdmin, requireUser } from "@/server/auth/session";
import { createServiceClient } from "@/server/supabase/admin";

export async function GET() {
  try {
    ensureSupabaseConfigured();
    const { user } = await requireUser();
    requireSuperAdmin(user.id);

    const admin = createServiceClient();
    const { data, error } = await admin.from("businesses").select("id, name, currency, timezone, created_at").limit(200);
    if (error) throw error;

    await admin.from("admin_audit_logs").insert({
      actor_user_id: user.id,
      action: "admin.list_businesses",
      target_type: "business",
      metadata: { count: data?.length ?? 0 },
    });

    return Response.json({ data });
  } catch (e) {
    return jsonError(e);
  }
}
