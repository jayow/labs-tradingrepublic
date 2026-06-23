"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import { toast } from "sonner";
import { ExternalLink, Loader2, Trash2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { getExtensions } from "@/lib/tiptap/extensions";
import {
  savePost,
  setPostTags,
  publishPost,
  unpublishPost,
  deletePost,
} from "@/app/dashboard/actions";
import type { Post } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Toolbar } from "./toolbar";

type SaveState = "idle" | "saving" | "saved";

export function PostEditor({
  post,
  authorId,
  initialTags,
  preview = false,
}: {
  post: Post;
  authorId: string;
  initialTags: string[];
  preview?: boolean;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState(post.status);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Latest values, read inside the debounced save without stale closures.
  const initialTitle = post.title === "Untitled" ? "" : post.title;
  const initialExcerpt = post.excerpt ?? "";
  const title = useRef(initialTitle);
  const excerpt = useRef(initialExcerpt);
  const cover = useRef(post.cover_image_url ?? "");

  const [coverPreview, setCoverPreview] = useState(post.cover_image_url ?? "");
  const [tagsValue, setTagsValue] = useState(initialTags.join(", "));

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    extensions: getExtensions(),
    content: post.content_json as object,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "tiptap prose-tr min-h-[360px] px-4 py-4 focus:outline-none",
      },
    },
    onUpdate: () => scheduleSave(),
  });

  const doSave = useCallback(async () => {
    if (!editor) return;
    if (preview) {
      setSaveState("saved");
      return;
    }
    setSaveState("saving");
    try {
      await savePost(post.id, {
        title: title.current.trim() || "Untitled",
        excerpt: excerpt.current.trim() || null,
        cover_image_url: cover.current || null,
        content_json: editor.getJSON(),
      });
      setSaveState("saved");
    } catch {
      setSaveState("idle");
      toast.error("Couldn't save changes");
    }
  }, [editor, post.id, preview]);

  const scheduleSave = useCallback(() => {
    setSaveState("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(doSave, 1200);
  }, [doSave]);

  async function uploadFile(file: File): Promise<string> {
    if (preview) {
      throw new Error("preview");
    }
    const supabase = createClient();
    const ext = (file.name.split(".").pop() ?? "png").toLowerCase();
    const path = `${authorId}/${post.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("post-media")
      .upload(path, file, { cacheControl: "3600", upsert: false });
    if (error) throw error;
    return supabase.storage.from("post-media").getPublicUrl(path).data
      .publicUrl;
  }

  async function handleInlineImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !editor) return;
    if (preview) {
      toast.info("Uploads are disabled in preview mode.");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadFile(file);
      editor.chain().focus().setImage({ src: url, alt: file.name }).run();
    } catch {
      toast.error("Image upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (preview) {
      toast.info("Uploads are disabled in preview mode.");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadFile(file);
      cover.current = url;
      setCoverPreview(url);
      scheduleSave();
    } catch {
      toast.error("Cover upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function saveTags() {
    if (preview) return;
    const names = tagsValue
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    try {
      await setPostTags(post.id, names);
    } catch {
      toast.error("Couldn't save tags");
    }
  }

  async function handlePublish() {
    if (preview) {
      setStatus("published");
      toast.success("Published (preview — nothing is saved)");
      return;
    }
    setPublishing(true);
    try {
      await doSave();
      await saveTags();
      await publishPost(post.id);
      setStatus("published");
      toast.success("Published");
      router.refresh();
    } catch {
      toast.error("Couldn't publish");
    } finally {
      setPublishing(false);
    }
  }

  async function handleUnpublish() {
    if (preview) {
      setStatus("draft");
      toast.success("Moved back to draft (preview)");
      return;
    }
    setPublishing(true);
    try {
      await unpublishPost(post.id);
      setStatus("draft");
      toast.success("Moved back to draft");
      router.refresh();
    } catch {
      toast.error("Couldn't unpublish");
    } finally {
      setPublishing(false);
    }
  }

  async function handleDelete() {
    if (preview) {
      toast.info("Delete is disabled in preview mode.");
      return;
    }
    if (!window.confirm("Delete this post? This cannot be undone.")) return;
    try {
      await deletePost(post.id);
    } catch {
      toast.error("Couldn't delete");
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      {/* Top bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Badge variant={status === "published" ? "default" : "secondary"}>
            {status === "published" ? "Published" : "Draft"}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {saveState === "saving"
              ? "Saving…"
              : saveState === "saved"
                ? "Saved"
                : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {status === "published" && (
            <Button asChild variant="ghost" size="sm">
              <a href={`/posts/${post.slug}`} target="_blank" rel="noreferrer">
                View <ExternalLink className="ml-1 h-3.5 w-3.5" />
              </a>
            </Button>
          )}
          {status === "published" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleUnpublish}
              disabled={publishing}
            >
              Unpublish
            </Button>
          ) : (
            <Button size="sm" onClick={handlePublish} disabled={publishing}>
              {publishing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Publish"
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            title="Delete post"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      {/* Cover */}
      <div className="mb-4">
        {coverPreview ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverPreview}
              alt="Cover"
              className="aspect-[2/1] w-full rounded-xl object-cover"
            />
            <Button
              variant="secondary"
              size="sm"
              className="absolute right-3 top-3"
              onClick={() => {
                cover.current = "";
                setCoverPreview("");
                scheduleSave();
              }}
            >
              Remove cover
            </Button>
          </div>
        ) : (
          <label className="flex aspect-[3/1] w-full cursor-pointer items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:bg-accent">
            {uploading ? "Uploading…" : "Add a cover image"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCover}
            />
          </label>
        )}
      </div>

      {/* Title */}
      <textarea
        defaultValue={initialTitle}
        onChange={(e) => {
          title.current = e.target.value;
          scheduleSave();
        }}
        placeholder="Post title"
        rows={1}
        className="mb-3 w-full resize-none bg-transparent font-display text-3xl font-extrabold tracking-tight outline-none placeholder:text-muted-foreground/50"
      />

      {/* Editor */}
      <div className="rounded-xl border border-border bg-card">
        <Toolbar
          editor={editor}
          onPickImage={() => fileInputRef.current?.click()}
          uploading={uploading}
        />
        <EditorContent editor={editor} />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleInlineImage}
        />
      </div>

      {/* Meta */}
      <div className="mt-8 grid gap-5">
        <div className="grid gap-2">
          <Label htmlFor="excerpt">Excerpt</Label>
          <Textarea
            id="excerpt"
            defaultValue={initialExcerpt}
            onChange={(e) => {
              excerpt.current = e.target.value;
              scheduleSave();
            }}
            placeholder="A short summary shown on the home page and social cards."
            rows={2}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            value={tagsValue}
            onChange={(e) => setTagsValue(e.target.value)}
            onBlur={saveTags}
            placeholder="markets, research, macro"
          />
          <p className="text-xs text-muted-foreground">
            Comma-separated, up to 8.
          </p>
        </div>
      </div>
    </div>
  );
}
