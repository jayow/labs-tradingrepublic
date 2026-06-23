import "server-only";
import { generateHTML } from "@tiptap/html";
import DOMPurify from "isomorphic-dompurify";
import { getExtensions } from "@/lib/tiptap/extensions";
import type { Json } from "@/lib/database.types";

const YOUTUBE_EMBED =
  /^https:\/\/(www\.)?youtube(-nocookie)?\.com\/embed\/[\w-]+/;

let hooksReady = false;

function ensureHooks() {
  if (hooksReady) return;

  // Drop any iframe that is not a YouTube embed — iframes are the main XSS
  // surface in user content.
  DOMPurify.addHook("uponSanitizeElement", (node, data) => {
    if (data.tagName === "iframe") {
      const el = node as Element;
      const src = el.getAttribute("src") ?? "";
      if (!YOUTUBE_EMBED.test(src)) {
        el.parentNode?.removeChild(el);
      }
    }
  });

  // Harden links.
  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node.nodeName === "A") {
      const el = node as Element;
      el.setAttribute("rel", "noopener noreferrer nofollow");
      el.setAttribute("target", "_blank");
    }
  });

  hooksReady = true;
}

// Render Tiptap JSON to sanitized HTML. Run at publish time and cache the
// result in posts.content_html so public reads are a single column fetch.
export function renderPostHtml(json: Json): string {
  ensureHooks();
  const raw = generateHTML(
    json as Parameters<typeof generateHTML>[0],
    getExtensions(),
  );
  return DOMPurify.sanitize(raw, {
    ADD_TAGS: ["iframe"],
    ADD_ATTR: [
      "allow",
      "allowfullscreen",
      "frameborder",
      "target",
      "width",
      "height",
    ],
  });
}
