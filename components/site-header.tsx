import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/tr-logo.png"
            alt="Trading Republic"
            width={32}
            height={32}
            className="h-8 w-auto"
          />
          <span className="font-display text-base font-bold tracking-tight">
            Labs
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="text-muted-foreground"
          >
            <Link href="/search" aria-label="Search posts">
              <Search className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
