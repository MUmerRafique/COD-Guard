import { createClient } from "@supabase/supabase-js";
import { getPublicEnv, getServerEnv } from "@/lib/env";

export function createServiceClient() {
  const pub = getPublicEnv();
  const srv = getServerEnv();
  if (!pub.NEXT_PUBLIC_SUPABASE_URL || !srv.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase service role is not configured");
  }
  return createClient(pub.NEXT_PUBLIC_SUPABASE_URL, srv.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
