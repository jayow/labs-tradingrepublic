import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";
import { createDraft } from "./actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PREVIEW, previewPosts } from "@/lib/preview";

export const metadata = { title: "Your posts" };

export default async function DashboardPage() {
  const profile = await requireUser();
  let posts;
  if (PREVIEW) {
    posts = previewPosts;
  } else {
    const supabase = await createClient();
    const { data } = await supabase
      .from("posts")
      .select("id, title, slug, status, updated_at")
      .eq("author_id", profile.id)
      .order("updated_at", { ascending: false });
    posts = data;
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Your posts</h1>
        <form action={createDraft}>
          <Button type="submit">New post</Button>
        </form>
      </div>

      {!posts || posts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
          No posts yet. Create your first one.
        </p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
          {posts.map((p) => (
            <li key={p.id}>
              <Link
                href={`/dashboard/posts/${p.id}/edit`}
                className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-accent"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {p.title || "Untitled"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Updated {new Date(p.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge
                  variant={p.status === "published" ? "default" : "secondary"}
                  className="capitalize"
                >
                  {p.status}
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
