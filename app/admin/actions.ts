"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireAdmin } from "@/lib/auth";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export type ActionResult = { ok: boolean; message: string };

export async function inviteAuthor(email: string): Promise<ActionResult> {
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

export async function setUserRole(
  userId: string,
  role: "admin" | "author",
): Promise<ActionResult> {
  const me = await requireAdmin();
  if (role !== "admin" && role !== "author") {
    return { ok: false, message: "Invalid role." };
  }
  // Don't let an admin demote themselves and risk locking the team out.
  if (userId === me.id && role !== "admin") {
    return { ok: false, message: "You can't remove your own admin role." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ role })
    .eq("id", userId);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/authors");
  return {
    ok: true,
    message: role === "admin" ? "Promoted to admin." : "Set to author.",
  };
}

export async function deleteUser(userId: string): Promise<ActionResult> {
  const me = await requireAdmin();
  if (userId === me.id) {
    return { ok: false, message: "You can't delete your own account." };
  }

  const admin = createAdminClient();

  // Posts FK is ON DELETE RESTRICT, so a user with posts can't be removed until
  // their posts are dealt with. Check first for a clear message.
  const { count } = await admin
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("author_id", userId);
  if (count && count > 0) {
    return {
      ok: false,
      message: `This person has ${count} post${count === 1 ? "" : "s"}. Delete or reassign them first.`,
    };
  }

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/authors");
  return { ok: true, message: "Account deleted." };
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
