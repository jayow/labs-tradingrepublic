import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";
import { PostEditor } from "@/components/editor/post-editor";

export const metadata = { title: "Edit post" };

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireUser();
  const { id } = await params;
  const supabase = await createClient();

  // RLS limits this to the author's own post (or any post for admins).
  const { data: post } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .single();
  if (!post) notFound();

  const { data: tagRows } = await supabase
    .from("post_tags")
    .select("tag_id")
    .eq("post_id", id);
  const tagIds = (tagRows ?? []).map((r) => r.tag_id);

  let tags: string[] = [];
  if (tagIds.length) {
    const { data: t } = await supabase
      .from("tags")
      .select("name")
      .in("id", tagIds);
    tags = (t ?? []).map((r) => r.name);
  }

  return <PostEditor post={post} authorId={profile.id} initialTags={tags} />;
}
