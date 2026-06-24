import type { Metadata } from "next";
import { createPublicClient } from "@/utils/supabase/public";
import { PostCard } from "@/components/post-card";
import { SearchBar } from "@/components/search-bar";
import { PREVIEW, previewPosts, previewProfile } from "@/lib/preview";

export const metadata: Metadata = { title: "Search" };

type Result = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  published_at: string | null;
  author_id: string;
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  // Strip PostgREST filter metacharacters so the value can't break/inject the
  // .or() filter string (worst case is still only published posts via RLS).
  const safe = query.replace(/[,()%*\\:]/g, " ").trim().slice(0, 80);

  let posts: Result[] = [];
  const authorName = new Map<string, string | null>();

  if (query && safe) {
    if (PREVIEW) {
      const ql = query.toLowerCase();
      posts = previewPosts.filter(
        (p) =>
          p.status === "published" &&
          ((p.title ?? "").toLowerCase().includes(ql) ||
            (p.excerpt ?? "").toLowerCase().includes(ql)),
      );
      authorName.set(previewProfile.id, previewProfile.display_name);
    } else {
      const supabase = createPublicClient();
      const { data } = await supabase
        .from("posts")
        .select(
          "id, title, slug, excerpt, cover_image_url, published_at, author_id",
        )
        .eq("status", "published")
        .or(`title.ilike.%${safe}%,excerpt.ilike.%${safe}%`)
        .order("published_at", { ascending: false })
        .limit(30);
      posts = data ?? [];

      const ids = Array.from(new Set(posts.map((p) => p.author_id)));
      const { data: authors } = ids.length
        ? await supabase.from("profiles").select("id, display_name").in("id", ids)
        : { data: [] };
      (authors ?? []).forEach((a) => authorName.set(a.id, a.display_name));
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <div className="mb-10 flex flex-col items-center gap-5 text-center">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          Search
        </h1>
        <SearchBar defaultValue={query} />
      </div>

      {!query ? (
        <p className="py-12 text-center text-muted-foreground">
          Type a search above to find posts.
        </p>
      ) : posts.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          No posts found for &ldquo;{query}&rdquo;.
        </p>
      ) : (
        <>
          <p className="mb-8 text-sm text-muted-foreground">
            {posts.length} result{posts.length === 1 ? "" : "s"} for &ldquo;
            {query}&rdquo;
          </p>
          <div className="grid gap-12">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                authorName={authorName.get(post.author_id) ?? null}
              />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
