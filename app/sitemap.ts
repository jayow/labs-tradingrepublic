import type { MetadataRoute } from "next";
import { createPublicClient } from "@/utils/supabase/public";

export const revalidate = 3600;

const base =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://labs.tradingrepublic.io";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createPublicClient();
  const { data: posts } = await supabase
    .from("posts")
    .select("slug, updated_at, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const postUrls: MetadataRoute.Sitemap = (posts ?? []).map((p) => ({
    url: `${base}/posts/${p.slug}`,
    lastModified: p.updated_at ?? p.published_at ?? undefined,
  }));

  return [{ url: base, lastModified: new Date() }, ...postUrls];
}
