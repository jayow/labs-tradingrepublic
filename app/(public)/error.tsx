"use client";

import { Button } from "@/components/ui/button";

export default function PublicError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <p className="font-display text-3xl font-bold">Something went wrong</p>
      <p className="mt-3 max-w-sm text-muted-foreground">
        We hit an error loading this page. Please try again.
      </p>
      <Button onClick={reset} className="mt-6">
        Try again
      </Button>
    </main>
  );
}
