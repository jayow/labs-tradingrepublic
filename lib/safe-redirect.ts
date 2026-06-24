// Only allow same-origin relative paths as post-auth redirect targets, so a
// crafted ?next=https://evil.com (or //evil.com, /\evil.com) can't bounce a
// signed-in user off-site.
export function safeNext(
  next: string | null | undefined,
  fallback = "/dashboard",
): string {
  if (!next) return fallback;
  if (
    !next.startsWith("/") ||
    next.startsWith("//") ||
    next.startsWith("/\\")
  ) {
    return fallback;
  }
  return next;
}
