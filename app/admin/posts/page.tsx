import Link from "next/link";
import { createAdminClient } from "@/utils/supabase/admin";
import { adminUnpublishPost } from "../actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PREVIEW, previewPosts, previewProfile } from "@/lib/preview";

export const metadata = { title: "All posts" };

export default async function AdminPostsPage() {
  let posts;
  const nameById = new Map<string, string | null>();

  if (PREVIEW) {
    posts = previewPosts;
    nameById.set(previewProfile.id, previewProfile.display_name);
  } else {
    const admin = createAdminClient();
    const { data } = await admin
      .from("posts")
      .select("id, title, slug, status, updated_at, author_id")
      .order("updated_at", { ascending: false });
    posts = data;

    const authorIds = Array.from(
      new Set((posts ?? []).map((p) => p.author_id)),
    );
    const { data: authors } = authorIds.length
      ? await admin
          .from("profiles")
          .select("id, display_name")
          .in("id", authorIds)
      : { data: [] };
    (authors ?? []).forEach((a) => nameById.set(a.id, a.display_name));
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <h1 className="mb-6 font-display text-2xl font-bold">All posts</h1>

      {!posts || posts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
          No posts yet.
        </p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
          {posts.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{p.title || "Untitled"}</p>
                <p className="text-xs text-muted-foreground">
                  {nameById.get(p.author_id) ?? "Unknown"} ·{" "}
                  {new Date(p.updated_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant={p.status === "published" ? "default" : "secondary"}
                  className="capitalize"
                >
                  {p.status}
                </Badge>
                {p.status === "published" && (
                  <form action={adminUnpublishPost}>
                    <input type="hidden" name="id" value={p.id} />
                    <Button type="submit" variant="outline" size="sm">
                      Unpublish
                    </Button>
                  </form>
                )}
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/dashboard/posts/${p.id}/edit`}>Edit</Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
