import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { jsonError, ApiError } from "@/lib/api-error";
import { formatAuthErrorMessage } from "@/lib/auth-errors";
import { ensureSupabaseConfigured } from "@/lib/configure-check";
import { getPublicEnv } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { createServiceClient } from "@/server/supabase/admin";

const bodySchema = z.object({
  email: z.string().trim().email(),
});

function devMagicLinkEnabled(): boolean {
  if (process.env.NODE_ENV !== "development") return false;
  return process.env.CODGUARD_DEV_MAGIC_LINK !== "false";
}

export async function POST(request: Request) {
  try {
    ensureSupabaseConfigured();
    const raw = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      throw new ApiError("VALIDATION_ERROR", "Enter a valid email address.", 400);
    }

    const email = parsed.data.email.toLowerCase();
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";

    if (!rateLimit(`auth:magic:burst:${ip}:${email}`, 1, 60_000)) {
      throw new ApiError(
        "RATE_LIMITED",
        "Please wait 60 seconds before requesting another magic link.",
        429,
      );
    }

    if (!rateLimit(`auth:magic:${ip}:${email}`, 5, 60 * 60_000)) {
      throw new ApiError(
        "RATE_LIMITED",
        "Too many sign-in requests for this email. Try again in about an hour.",
        429,
      );
    }

    const pub = getPublicEnv();
    const redirectTo = `${pub.NEXT_PUBLIC_APP_URL}/auth/callback?next=/dashboard`;

    if (devMagicLinkEnabled()) {
      const admin = createServiceClient();
      const { data, error } = await admin.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: { redirectTo },
      });
      if (error) {
        const status = error.code === "over_email_send_rate_limit" ? 429 : 502;
        throw new ApiError(
          status === 429 ? "RATE_LIMITED" : "INTERNAL_ERROR",
          formatAuthErrorMessage(error),
          status,
        );
      }
      const tokenHash = data.properties?.hashed_token;
      const verificationType = data.properties?.verification_type ?? "magiclink";
      if (!tokenHash) {
        throw new ApiError("INTERNAL_ERROR", "Could not create a sign-in link.", 502);
      }
      const link =
        `${pub.NEXT_PUBLIC_APP_URL}/auth/callback` +
        `?token_hash=${encodeURIComponent(tokenHash)}` +
        `&type=${encodeURIComponent(verificationType)}` +
        `&next=/dashboard`;
      return Response.json({
        mode: "dev" as const,
        message: "Development mode: open the link below to sign in (no email sent).",
        link,
      });
    }

    const anon = createClient(pub.NEXT_PUBLIC_SUPABASE_URL!, pub.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await anon.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) {
      const isRateLimited =
        error.code === "over_email_send_rate_limit" || error.code === "over_request_rate_limit";
      throw new ApiError(
        isRateLimited ? "RATE_LIMITED" : "VALIDATION_ERROR",
        formatAuthErrorMessage(error),
        isRateLimited ? 429 : 400,
      );
    }

    return Response.json({
      mode: "email" as const,
      message: "Check your email for the magic link.",
    });
  } catch (error) {
    return jsonError(error);
  }
}
