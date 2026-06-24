"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireAdmin } from "@/lib/auth";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export type ActionResult = { ok: boolean; message: string };

// Invites are issued as a copy-able link built on Supabase's server-verified
// token_hash flow (/auth/confirm). We don't send the invite via Supabase's
// email because the free-tier default sender can't use a custom (secure)
// template and is rate-limited; email invites can be re-added once custom SMTP
// is configured (see supabase/email-templates/).
export async function createInviteLink(
  email: string,
): Promise<ActionResult & { link?: string }> {
  await requireAdmin();
  const clean = email.trim();
  if (!clean) return { ok: false, message: "Enter an email address." };

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({
    type: "invite",
    email: clean,
  });

  if (error) {
    const m = error.message.toLowerCase();
    if (m.includes("already been registered") || m.includes("already registered")) {
      return { ok: false, message: "That email already has an account." };
    }
    return { ok: false, message: error.message };
  }

  // Build our own token_hash link (server-verified via /auth/confirm) rather
  // than handing out the implicit-flow action_link with tokens in the URL.
  const tokenHash = data.properties?.hashed_token;
  if (!tokenHash) {
    return { ok: false, message: "Could not generate invite link." };
  }

  revalidatePath("/admin/authors");
  return {
    ok: true,
    message: "Invite link created.",
    link: `${siteUrl}/auth/confirm?token_hash=${tokenHash}&type=invite&next=/accept-invite`,
  };
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
