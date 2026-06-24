"use client";

// This client-only callback parses the auth result from the URL (query or hash)
// and then redirects or shows an error — setting state inside the effect is the
// intended behavior here.
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";

// Invite / magic-link / OAuth callback. Supabase returns its result either in
// the query string (?code=, PKCE) or the URL hash (#access_token / #error for
// the invite "verify" flow). The hash never reaches the server, so this must
// run on the client.
export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const url = new URL(window.location.href);
    const next = url.searchParams.get("next") || "/dashboard";
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));

    const hashError = hash.get("error_description") || hash.get("error");
    if (hashError) {
      setError(decodeURIComponent(hashError.replace(/\+/g, " ")));
      return;
    }

    const accessToken = hash.get("access_token");
    const refreshToken = hash.get("refresh_token");
    const code = url.searchParams.get("code");

    (async () => {
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) return setError(error.message);
        router.replace(next);
        router.refresh();
        return;
      }
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) return setError(error.message);
        router.replace(next);
        router.refresh();
        return;
      }
      setError(
        "This link is missing its sign-in token, or has already been used. Ask an admin for a fresh invite.",
      );
    })();
  }, [router]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      {error ? (
        <>
          <p className="font-display text-2xl font-bold">Link didn&apos;t work</p>
          <p className="mt-3 max-w-sm text-muted-foreground">{error}</p>
          <Button asChild className="mt-6">
            <Link href="/login">Back to sign in</Link>
          </Button>
        </>
      ) : (
        <p className="text-muted-foreground">Signing you in…</p>
      )}
    </main>
  );
}
