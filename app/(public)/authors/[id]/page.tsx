import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createPublicClient } from "@/utils/supabase/public";
import { PostCard } from "@/components/post-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PREVIEW, previewPosts, previewProfile } from "@/lib/preview";

export const revalidate = 60;

async function getAuthor(id: string) {
  if (PREVIEW) {
    return id === previewProfile.id
      ? {
          id: previewProfile.id,
          display_name: previewProfile.display_name,
          bio: previewProfile.bio,
          avatar_url: previewProfile.avatar_url,
        }
      : null;
  }
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, bio, avatar_url")
    .eq("id", id)
    .maybeSingle();
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const author = await getAuthor(id);
  if (!author) return { title: "Author not found" };
  return {
    title: author.display_name ?? "Author",
    description: author.bio ?? undefined,
  };
}

export default async function AuthorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const author = await getAuthor(id);
  if (!author) notFound();

  let posts;
  if (PREVIEW) {
    posts = previewPosts.filter(
      (p) => p.author_id === id && p.status === "published",
    );
  } else {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("posts")
      .select("id, title, slug, excerpt, cover_image_url, published_at")
      .eq("author_id", id)
      .eq("status", "published")
      .order("published_at", { ascending: false });
    posts = data;
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <header className="mb-12 border-b border-border pb-8">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14">
            {author.avatar_url ? (
              <AvatarImage src={author.avatar_url} alt="" />
            ) : null}
            <AvatarFallback>
              {(author.display_name ?? "?").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">
            {author.display_name ?? "Author"}
          </h1>
        </div>
        {author.bio && (
          <p className="mt-4 max-w-xl text-muted-foreground">{author.bio}</p>
        )}
      </header>

      {!posts || posts.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          No published posts yet.
        </p>
      ) : (
        <div className="grid gap-12">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              authorName={author.display_name}
            />
          ))}
        </div>
      )}
    </main>
  );
}
