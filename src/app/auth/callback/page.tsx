"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/server/supabase/browser";

function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }
  return next;
}

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Signing you in…");

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    const next = safeNextPath(searchParams.get("next"));

    async function finish() {
      const code = searchParams.get("code");
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          router.replace("/login?error=auth_callback");
          return;
        }
        router.replace(next);
        return;
      }

      if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as EmailOtpType,
        });
        if (error) {
          router.replace("/login?error=auth_callback");
          return;
        }
        router.replace(next);
        return;
      }

      const hash = typeof window !== "undefined" ? window.location.hash : "";
      if (hash.includes("access_token=")) {
        setMessage("Completing sign-in…");
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) {
          router.replace("/login?error=auth_callback");
          return;
        }
        if (session) {
          router.replace(next);
          return;
        }

        await new Promise<void>((resolve, reject) => {
          const {
            data: { subscription },
          } = supabase.auth.onAuthStateChange((event, nextSession) => {
            if (event === "SIGNED_IN" && nextSession) {
              window.clearTimeout(timeout);
              subscription.unsubscribe();
              resolve();
            }
          });

          const timeout = window.setTimeout(() => {
            subscription.unsubscribe();
            reject(new Error("timeout"));
          }, 10_000);
        })
          .then(() => router.replace(next))
          .catch(() => router.replace("/login?error=auth_callback"));
        return;
      }

      router.replace("/login?error=missing_code");
    }

    void finish();
  }, [router, searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <p className="text-slate-600" role="status">
        {message}
      </p>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center px-6">
          <p className="text-slate-600" role="status">
            Signing you in…
          </p>
        </main>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  );
}
