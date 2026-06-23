import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import type { Extensions } from "@tiptap/core";

// React-free so the SAME list powers both the client editor (useEditor) and the
// server renderer (generateHTML). If these ever diverge, nodes like YouTube
// embeds silently disappear from rendered posts.
const lowlight = createLowlight(common);

export function getExtensions(placeholder = "Write your story…"): Extensions {
  return [
    StarterKit.configure({
      // Replaced by CodeBlockLowlight below.
      codeBlock: false,
      // Link + Underline ship inside StarterKit v3.
      link: {
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          rel: "noopener noreferrer nofollow",
          target: "_blank",
        },
      },
    }),
    Image.configure({
      HTMLAttributes: { class: "rounded-lg" },
    }),
    Youtube.configure({
      nocookie: true,
      controls: true,
      HTMLAttributes: { class: "rounded-lg overflow-hidden" },
    }),
    CodeBlockLowlight.configure({ lowlight }),
    Placeholder.configure({ placeholder }),
  ];
}
