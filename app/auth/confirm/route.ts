import { redirect } from "next/navigation";
import { type EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import { safeNext } from "@/lib/safe-redirect";

// Server-side email-link verification (invites, magic links). Uses a one-time
// token_hash validated by Supabase via verifyOtp — unlike the old implicit
// flow, no session tokens are ever exposed in the URL, so an attacker can't
// fixate a victim's session by feeding them tokens.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNext(searchParams.get("next"), "/accept-invite");

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) redirect(next);
  }

  redirect("/login?error=expired");
}
