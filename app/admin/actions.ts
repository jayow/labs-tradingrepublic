"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireAdmin } from "@/lib/auth";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export type InviteResult = { ok: boolean; message: string };

export async function inviteAuthor(email: string): Promise<InviteResult> {
  await requireAdmin();
  const clean = email.trim();
  if (!clean) return { ok: false, message: "Enter an email address." };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.inviteUserByEmail(clean, {
    redirectTo: `${siteUrl}/auth/callback?next=/accept-invite`,
  });

  if (error) {
    const m = error.message.toLowerCase();
    if (m.includes("already been registered") || m.includes("already registered")) {
      return { ok: false, message: "That email already has an account." };
    }
    if (m.includes("rate limit")) {
      return {
        ok: false,
        message:
          "Email rate limit reached — Supabase's built-in sender only allows a few per hour. Set up custom SMTP to lift it.",
      };
    }
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/authors");
  return { ok: true, message: `Invite sent to ${clean}.` };
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
