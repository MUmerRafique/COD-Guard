import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const authCode = request.nextUrl.searchParams.get("code");
  if (authCode && request.nextUrl.pathname !== "/auth/callback") {
    const callbackUrl = new URL("/auth/callback", request.url);
    callbackUrl.searchParams.set("code", authCode);
    callbackUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(callbackUrl);
  }

  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*", "/api/:path*", "/auth/callback"],
};
