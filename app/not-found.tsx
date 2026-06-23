import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <Image
        src="/tr-logo.png"
        alt="Trading Republic"
        width={48}
        height={48}
        className="mb-6 h-11 w-auto opacity-80"
      />
      <p className="font-display text-5xl font-extrabold">404</p>
      <p className="mt-3 max-w-sm text-muted-foreground">
        We couldn&apos;t find that page. It may have moved or never existed.
      </p>
      <Button asChild className="mt-6">
        <Link href="/">Back to Labs</Link>
      </Button>
    </main>
  );
}
