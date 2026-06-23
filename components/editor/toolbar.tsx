"use client";

import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  ImageUp,
  ImagePlus,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { detectEmbed } from "@/lib/embeds";

function Btn({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40",
        active && "bg-accent text-primary",
      )}
    >
      {children}
    </button>
  );
}

export function Toolbar({
  editor,
  onPickImage,
  uploading,
}: {
  editor: Editor | null;
  onPickImage: () => void;
  uploading: boolean;
}) {
  const [, setTick] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editor) return;
    const rerender = () => setTick((t) => t + 1);
    editor.on("transaction", rerender);
    editor.on("selectionUpdate", rerender);
    return () => {
      editor.off("transaction", rerender);
      editor.off("selectionUpdate", rerender);
    };
  }, [editor]);

  if (!editor) return null;

  function setLink() {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url })
      .run();
  }

  function addEmbed() {
    if (!editor) return;
    const url = window.prompt(
      "Paste a link to embed (YouTube, Instagram, TikTok, Facebook)",
    );
    if (!url) return;
    const result = detectEmbed(url);
    if (!result) {
      window.alert(
        "That link isn't supported. Try a YouTube, Instagram, TikTok, or Facebook URL.",
      );
      return;
    }
    if (result.provider === "youtube") {
      editor.commands.setYoutubeVideo({ src: url });
      return;
    }
    editor
      .chain()
      .focus()
      .insertContent({
        type: "embed",
        attrs: { src: result.src, provider: result.provider, url },
      })
      .run();
  }

  function addImageByUrl() {
    if (!editor) return;
    const url = window.prompt("Image URL", "https://");
    if (!url || url === "https://") return;
    editor.chain().focus().setImage({ src: url }).run();
  }

  return (
    <div
      ref={ref}
      className="sticky top-14 z-10 flex flex-wrap items-center gap-0.5 rounded-t-xl border-b border-border bg-card p-1.5"
    >
      <Btn title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold className="h-4 w-4" />
      </Btn>
      <Btn title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic className="h-4 w-4" />
      </Btn>
      <Btn title="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <Underline className="h-4 w-4" />
      </Btn>
      <Btn title="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <Strikethrough className="h-4 w-4" />
      </Btn>

      <span className="mx-1 h-5 w-px bg-border" />

      <Btn title="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        <Heading2 className="h-4 w-4" />
      </Btn>
      <Btn title="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        <Heading3 className="h-4 w-4" />
      </Btn>
      <Btn title="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List className="h-4 w-4" />
      </Btn>
      <Btn title="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered className="h-4 w-4" />
      </Btn>
      <Btn title="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quote className="h-4 w-4" />
      </Btn>
      <Btn title="Code block" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
        <Code className="h-4 w-4" />
      </Btn>

      <span className="mx-1 h-5 w-px bg-border" />

      <Btn title="Link" active={editor.isActive("link")} onClick={setLink}>
        <LinkIcon className="h-4 w-4" />
      </Btn>
      <Btn title="Image from URL" onClick={addImageByUrl}>
        <ImagePlus className="h-4 w-4" />
      </Btn>
      <Btn title="Upload image" disabled={uploading} onClick={onPickImage}>
        <ImageUp className="h-4 w-4" />
      </Btn>
      <Btn title="Embed (YouTube, Instagram, TikTok, Facebook)" onClick={addEmbed}>
        <Video className="h-4 w-4" />
      </Btn>
    </div>
  );
}
