import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/utils/supabase/admin";
import { inviteAuthor, setUserRole } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PREVIEW, previewAuthors } from "@/lib/preview";

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
        <form
          action={inviteAuthor}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <label htmlFor="email" className="mb-2 block text-sm font-medium">
              Invite an author
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="writer@tradingrepublic.io"
            />
          </div>
          <Button type="submit">Send invite</Button>
        </form>
        <p className="mt-2 text-xs text-muted-foreground">
          They receive an email to set a password. New users join as authors;
          promote to admin below.
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
              {row.id !== me.id && (
                <form action={setUserRole}>
                  <input type="hidden" name="userId" value={row.id} />
                  <input
                    type="hidden"
                    name="role"
                    value={row.role === "admin" ? "author" : "admin"}
                  />
                  <Button type="submit" variant="outline" size="sm">
                    {row.role === "admin" ? "Make author" : "Make admin"}
                  </Button>
                </form>
              )}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
