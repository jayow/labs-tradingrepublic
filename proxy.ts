import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";
import { PREVIEW } from "@/lib/preview";

// Next 16 renamed `middleware` to `proxy` (runs on the Node.js runtime).
export async function proxy(request: NextRequest) {
  // Preview mode (dev only): skip auth gating and Supabase session work.
  if (PREVIEW) return NextResponse.next();
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Run on all routes except static assets and image files.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)",
  ],
};
