import { isSupabaseConfigured } from "@/lib/env";
import { ApiError } from "@/lib/api-error";

export function ensureSupabaseConfigured() {
  if (!isSupabaseConfigured()) {
    throw new ApiError(
      "CONFIGURATION_ERROR",
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      503,
    );
  }
}
