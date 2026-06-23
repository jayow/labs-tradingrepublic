import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createPublicClient } from "@/utils/supabase/public";
import { PostCard } from "@/components/post-card";

export const revalidate = 60;

async function getTag(slug: string) {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("tags")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle();
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tag = await getTag(slug);
  if (!tag) return { title: "Tag not found" };
  return { title: `#${tag.name}` };
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tag = await getTag(slug);
  if (!tag) notFound();

  const supabase = createPublicClient();
  const { data: links } = await supabase
    .from("post_tags")
    .select("post_id")
    .eq("tag_id", tag.id);
  const postIds = (links ?? []).map((l) => l.post_id);

  const { data: posts } = postIds.length
    ? await supabase
        .from("posts")
        .select(
          "id, title, slug, excerpt, cover_image_url, published_at, author_id",
        )
        .in("id", postIds)
        .eq("status", "published")
        .order("published_at", { ascending: false })
    : { data: [] };

  const authorIds = Array.from(
    new Set((posts ?? []).map((p) => p.author_id)),
  );
  const { data: authors } = authorIds.length
    ? await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", authorIds)
    : { data: [] };
  const authorName = new Map(
    (authors ?? []).map((a) => [a.id, a.display_name]),
  );

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <header className="mb-12 border-b border-border pb-8">
        <p className="text-sm uppercase tracking-[0.2em] text-primary">Tag</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight">
          {tag.name}
        </h1>
      </header>

      {!posts || posts.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          No posts with this tag yet.
        </p>
      ) : (
        <div className="grid gap-12">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              authorName={authorName.get(post.author_id) ?? null}
            />
          ))}
        </div>
      )}
    </main>
  );
}
