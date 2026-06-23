import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { createPublicClient } from "@/utils/supabase/public";
import { Badge } from "@/components/ui/badge";
import { PREVIEW, previewPostBySlug, previewProfile } from "@/lib/preview";

export const revalidate = 60;

function formatDate(date: string | null) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

async function getPost(slug: string) {
  if (PREVIEW) return previewPostBySlug(slug);
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("posts")
    .select(
      "id, title, slug, excerpt, cover_image_url, content_html, published_at, author_id",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Not found" };

  const images = post.cover_image_url ? [post.cover_image_url] : undefined;
  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      type: "article",
      publishedTime: post.published_at ?? undefined,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt ?? undefined,
      images,
    },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  let author: { id: string; display_name: string | null } | null;
  let tags: { name: string; slug: string }[] | null;

  if (PREVIEW) {
    author = { id: previewProfile.id, display_name: previewProfile.display_name };
    tags = [];
  } else {
    const supabase = createPublicClient();
    const { data: authorRow } = await supabase
      .from("profiles")
      .select("id, display_name")
      .eq("id", post.author_id)
      .maybeSingle();
    author = authorRow;

    const { data: tagLinks } = await supabase
      .from("post_tags")
      .select("tag_id")
      .eq("post_id", post.id);
    const tagIds = (tagLinks ?? []).map((t) => t.tag_id);
    const { data: tagRows } = tagIds.length
      ? await supabase.from("tags").select("name, slug").in("id", tagIds)
      : { data: [] };
    tags = tagRows;
  }

  return (
    <article className="mx-auto w-full max-w-2xl px-4 py-12">
      <header className="mb-8">
        <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight">
          {post.title}
        </h1>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          {author?.display_name && (
            <>
              <Link
                href={`/authors/${author.id}`}
                className="font-medium text-foreground hover:text-primary"
              >
                {author.display_name}
              </Link>
              <span>·</span>
            </>
          )}
          <time>{formatDate(post.published_at)}</time>
        </div>
      </header>

      {post.cover_image_url && (
        <div className="mb-10 overflow-hidden rounded-xl border border-border">
          <Image
            src={post.cover_image_url}
            alt={post.title}
            width={1200}
            height={600}
            priority
            className="aspect-[2/1] w-full object-cover"
          />
        </div>
      )}

      <div
        className="prose-tr"
        dangerouslySetInnerHTML={{ __html: post.content_html ?? "" }}
      />

      {tags && tags.length > 0 && (
        <div className="mt-12 flex flex-wrap gap-2 border-t border-border pt-6">
          {tags.map((t) => (
            <Link key={t.slug} href={`/tags/${t.slug}`}>
              <Badge variant="secondary" className="hover:bg-accent">
                {t.name}
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}
