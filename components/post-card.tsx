import Link from "next/link";
import Image from "next/image";

export type PostCardData = {
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  published_at: string | null;
};

function formatDate(date: string | null) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function PostCard({
  post,
  authorName,
}: {
  post: PostCardData;
  authorName: string | null;
}) {
  return (
    <article className="group">
      <Link href={`/posts/${post.slug}`} className="block">
        {post.cover_image_url && (
          <div className="mb-4 overflow-hidden rounded-xl border border-border">
            <Image
              src={post.cover_image_url}
              alt={post.title}
              width={800}
              height={400}
              className="aspect-[2/1] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          </div>
        )}
        <h2 className="font-display text-xl font-bold tracking-tight transition-colors group-hover:text-primary">
          {post.title}
        </h2>
        {post.excerpt && (
          <p className="mt-2 line-clamp-2 text-muted-foreground">
            {post.excerpt}
          </p>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          {authorName ? <span>{authorName} · </span> : null}
          {formatDate(post.published_at)}
        </p>
      </Link>
    </article>
  );
}
