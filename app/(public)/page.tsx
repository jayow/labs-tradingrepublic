import Image from "next/image";
import { createPublicClient } from "@/utils/supabase/public";
import { PostCard } from "@/components/post-card";
import { PREVIEW, previewPosts, previewProfile } from "@/lib/preview";

export const revalidate = 60;

export default async function HomePage() {
  let posts;
  const authorName = new Map<string, string | null>();

  if (PREVIEW) {
    posts = previewPosts.filter((p) => p.status === "published");
    authorName.set(previewProfile.id, previewProfile.display_name);
  } else {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("posts")
      .select(
        "id, title, slug, excerpt, cover_image_url, published_at, author_id",
      )
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(30);
    posts = data;

    const authorIds = Array.from(
      new Set((posts ?? []).map((p) => p.author_id)),
    );
    const { data: authors } = authorIds.length
      ? await supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", authorIds)
      : { data: [] };
    (authors ?? []).forEach((a) => authorName.set(a.id, a.display_name));
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <header className="mb-12 flex flex-col items-center text-center">
        <Image
          src="/tr-logo.png"
          alt="Trading Republic"
          width={56}
          height={56}
          priority
          className="mb-5 h-14 w-auto"
        />
        <h1 className="font-display text-4xl font-extrabold tracking-tight">
          Trading Republic Labs
        </h1>
        <p className="mt-3 max-w-md text-muted-foreground">
          Insights, research, and ideas from the Trading Republic team.
        </p>
      </header>

      {!posts || posts.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">
          No posts yet. Check back soon.
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
