import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/utils/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PREVIEW, previewAuthors } from "@/lib/preview";
import { InviteForm } from "./invite-form";
import { AuthorActions } from "./author-actions";

export const metadata = { title: "Authors" };

export default async function AuthorsPage() {
  const me = await requireAdmin();

  let rows: {
    id: string;
    email: string;
    role: "admin" | "author";
    displayName: string | null;
    lastSignIn: string | null | undefined;
  }[];

  if (PREVIEW) {
    rows = previewAuthors;
  } else {
    const admin = createAdminClient();
    const {
      data: { users },
    } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, role, display_name");
    const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

    rows = users
      .map((u) => ({
        id: u.id,
        email: u.email ?? "—",
        role: profileById.get(u.id)?.role ?? ("author" as const),
        displayName: profileById.get(u.id)?.display_name ?? null,
        lastSignIn: u.last_sign_in_at,
      }))
      .sort((a, b) => a.email.localeCompare(b.email));
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="mb-6 font-display text-2xl font-bold">
        Authors &amp; admins
      </h1>

      <Card className="mb-8 p-5">
        <InviteForm />
        <p className="mt-2 text-xs text-muted-foreground">
          Generates a secure invite link and copies it to your clipboard, share
          it with the author however you like. They set a password and join as
          an author; promote to admin below.
        </p>
      </Card>

      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
        {rows.map((row) => (
          <li
            key={row.id}
            className="flex items-center justify-between gap-4 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">
                {row.displayName ?? row.email}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {row.email}
                {!row.lastSignIn && " · invite pending"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant={row.role === "admin" ? "default" : "secondary"}
                className="capitalize"
              >
                {row.role}
              </Badge>
              <AuthorActions
                userId={row.id}
                role={row.role}
                isSelf={row.id === me.id}
              />
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
