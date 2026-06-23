"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { requireUser } from "@/lib/auth";
import { slugify } from "@/lib/slug";
import { renderPostHtml } from "@/lib/sanitize";
import { PREVIEW } from "@/lib/preview";
import type { Json } from "@/lib/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

type DB = SupabaseClient<Database>;

async function uniqueSlug(
  supabase: DB,
  base: string,
  excludeId?: string,
): Promise<string> {
  const root = slugify(base);
  for (let i = 0; ; i++) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    const { data } = await supabase
      .from("posts")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!data || data.id === excludeId) return candidate;
  }
}

export async function createDraft() {
  if (PREVIEW) {
    redirect("/dashboard/posts/new/edit");
  }
  const profile = await requireUser();
  const supabase = await createClient();
  const slug = await uniqueSlug(supabase, "untitled");

  const { data, error } = await supabase
    .from("posts")
    .insert({ author_id: profile.id, title: "Untitled", slug })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not create draft");
  }
  redirect(`/dashboard/posts/${data.id}/edit`);
}

export async function savePost(
  id: string,
  input: {
    title: string;
    excerpt: string | null;
    cover_image_url: string | null;
    content_json: Json;
  },
) {
  await requireUser();
  const supabase = await createClient();

  // Keep the slug in sync with the title while still a draft; freeze it once
  // published so shared links never break.
  const { data: current } = await supabase
    .from("posts")
    .select("status")
    .eq("id", id)
    .single();

  const slug =
    current?.status === "draft"
      ? await uniqueSlug(supabase, input.title || "untitled", id)
      : undefined;

  const { error } = await supabase
    .from("posts")
    .update({
      title: input.title,
      excerpt: input.excerpt,
      cover_image_url: input.cover_image_url,
      content_json: input.content_json,
      ...(slug ? { slug } : {}),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  return { slug };
}

export async function setPostTags(postId: string, tagNames: string[]) {
  await requireUser();
  const supabase = await createClient();

  const names = Array.from(
    new Set(tagNames.map((t) => t.trim()).filter(Boolean)),
  ).slice(0, 8);

  const tagIds: string[] = [];
  for (const name of names) {
    const slug = slugify(name);
    const { data: existing } = await supabase
      .from("tags")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (existing) {
      tagIds.push(existing.id);
      continue;
    }
    const { data: created } = await supabase
      .from("tags")
      .insert({ name, slug })
      .select("id")
      .single();
    if (created) tagIds.push(created.id);
  }

  await supabase.from("post_tags").delete().eq("post_id", postId);
  if (tagIds.length) {
    await supabase
      .from("post_tags")
      .insert(tagIds.map((tag_id) => ({ post_id: postId, tag_id })));
  }
}

export async function publishPost(id: string) {
  await requireUser();
  const supabase = await createClient();

  const { data: post, error: fetchErr } = await supabase
    .from("posts")
    .select("slug, content_json, published_at")
    .eq("id", id)
    .single();
  if (fetchErr || !post) throw new Error(fetchErr?.message ?? "Post not found");

  const html = renderPostHtml(post.content_json);

  const { error } = await supabase
    .from("posts")
    .update({
      status: "published",
      content_html: html,
      published_at: post.published_at ?? new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath(`/posts/${post.slug}`);
  revalidatePath("/dashboard");
}

export async function unpublishPost(id: string) {
  await requireUser();
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("posts")
    .select("slug")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("posts")
    .update({ status: "draft" })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  if (post) revalidatePath(`/posts/${post.slug}`);
  revalidatePath("/dashboard");
}

export async function deletePost(id: string) {
  await requireUser();
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("posts")
    .select("slug, status")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  if (post?.status === "published") revalidatePath(`/posts/${post.slug}`);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
