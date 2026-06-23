"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireAdmin } from "@/lib/auth";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function inviteAuthor(formData: FormData) {
  await requireAdmin();
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return;

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/accept-invite`,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/authors");
}

export async function setUserRole(formData: FormData) {
  const me = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "");
  if (role !== "admin" && role !== "author") return;
  // Don't let an admin demote themselves and lock the team out by accident.
  if (userId === me.id && role !== "admin") return;

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ role })
    .eq("id", userId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/authors");
}

export async function adminUnpublishPost(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const admin = createAdminClient();
  const { data: post } = await admin
    .from("posts")
    .select("slug")
    .eq("id", id)
    .single();

  const { error } = await admin
    .from("posts")
    .update({ status: "draft" })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  if (post) revalidatePath(`/posts/${post.slug}`);
  revalidatePath("/admin/posts");
}
