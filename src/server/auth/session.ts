import { createClient } from "@/server/supabase/server";
import { ApiError } from "@/lib/api-error";
import { getServerEnv } from "@/lib/env";

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    throw new ApiError("UNAUTHORIZED", "Sign in required.", 401);
  }
  return { supabase, user };
}

export async function requireBusinessAccess(businessId: string, roles?: string[]) {
  const { supabase, user } = await requireUser();
  const { data: membership, error } = await supabase
    .from("business_memberships")
    .select("role, business_id")
    .eq("business_id", businessId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !membership) {
    throw new ApiError("FORBIDDEN", "You do not have access to this business.", 403);
  }
  if (roles && !roles.includes(membership.role)) {
    throw new ApiError("FORBIDDEN", "Insufficient role for this action.", 403);
  }
  return { supabase, user, membership };
}

export async function getActiveBusinessId(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data, error } = await supabase
    .from("business_memberships")
    .select("business_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return data.business_id as string;
}

export function requireSuperAdmin(userId: string) {
  const ids = (getServerEnv().SUPER_ADMIN_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!ids.includes(userId)) {
    throw new ApiError("FORBIDDEN", "Super admin access required.", 403);
  }
}
