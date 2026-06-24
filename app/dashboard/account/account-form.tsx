"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { updateProfile } from "./actions";
import type { Profile } from "@/lib/database.types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function AccountForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [twitter, setTwitter] = useState(profile.twitter ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = (file.name.split(".").pop() ?? "png").toLowerCase();
      const path = `${profile.id}/avatar-${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("post-media")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) throw error;
      setAvatarUrl(
        supabase.storage.from("post-media").getPublicUrl(path).data.publicUrl,
      );
    } catch {
      toast.error("Avatar upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await updateProfile({
      display_name: displayName,
      bio: bio || null,
      twitter: twitter || null,
      avatar_url: avatarUrl || null,
    });
    setSaving(false);
    if (res.ok) {
      toast.success(res.message);
      router.refresh();
    } else {
      toast.error(res.message);
    }
  }

  const initials = (displayName || profile.role || "?").slice(0, 2).toUpperCase();

  return (
    <form onSubmit={handleSave} className="grid gap-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <label className="cursor-pointer text-sm font-medium text-primary hover:underline">
          {uploading ? "Uploading…" : "Change photo"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatar}
          />
        </label>
        {avatarUrl && (
          <button
            type="button"
            onClick={() => setAvatarUrl("")}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Remove
          </button>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="name">Display name</Label>
        <Input
          id="name"
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="A short bio shown on your author page."
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="twitter">Twitter / X handle</Label>
        <Input
          id="twitter"
          value={twitter}
          onChange={(e) => setTwitter(e.target.value)}
          placeholder="@username"
        />
      </div>

      <div>
        <Button type="submit" disabled={saving || uploading}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
