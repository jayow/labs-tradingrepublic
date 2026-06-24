import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/lib/database.types";

export function DashboardHeader({ profile }: { profile: Profile }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image
            src="/tr-logo.png"
            alt="Trading Republic"
            width={28}
            height={28}
            className="h-7 w-auto"
          />
          <span className="font-display text-sm font-bold">Labs</span>
          <Badge variant="secondary" className="ml-1 capitalize">
            {profile.role}
          </Badge>
        </Link>
        <nav className="flex items-center gap-1">
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard">Posts</Link>
          </Button>
          {profile.role === "admin" && (
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin">Admin</Link>
            </Button>
          )}
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/account">Account</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/" target="_blank">
              View site
            </Link>
          </Button>
          <form action="/auth/signout" method="post">
            <Button variant="outline" size="sm" type="submit">
              Sign out
            </Button>
          </form>
        </nav>
      </div>
    </header>
  );
}
