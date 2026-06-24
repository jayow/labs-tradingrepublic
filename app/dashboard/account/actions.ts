"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { requireUser } from "@/lib/auth";

export type ProfileResult = { ok: boolean; message: string };

export async function updateProfile(input: {
  display_name: string;
  bio: string | null;
  twitter: string | null;
  avatar_url: string | null;
}): Promise<ProfileResult> {
  const profile = await requireUser();
  const name = input.display_name.trim();
  if (!name) return { ok: false, message: "Display name can't be empty." };

  const supabase = await createClient();
  // RLS allows a user to update their own profile (role changes are blocked by
  // a trigger), so this only ever touches the caller's row.
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: name,
      bio: input.bio?.trim() || null,
      twitter: input.twitter?.trim().replace(/^@/, "") || null,
      avatar_url: input.avatar_url || null,
    })
    .eq("id", profile.id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/dashboard/account");
  revalidatePath(`/authors/${profile.id}`);
  return { ok: true, message: "Profile saved." };
}
