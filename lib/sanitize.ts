import "server-only";
import { generateHTML } from "@tiptap/html";
import DOMPurify from "isomorphic-dompurify";
import { getExtensions } from "@/lib/tiptap/extensions";
import { cleanTiptapDoc } from "@/lib/tiptap/clean";
import type { Json } from "@/lib/database.types";

// Only iframes whose src matches one of these embed endpoints survive
// sanitization — the single most important XSS control for user content.
const ALLOWED_IFRAME =
  /^https:\/\/(www\.)?(youtube(-nocookie)?\.com\/embed\/[\w-]+|instagram\.com\/(p|reel|tv)\/[^/]+\/embed|tiktok\.com\/embed\/v2\/\d+|facebook\.com\/plugins\/(post|video)\.php)/;

let hooksReady = false;

function ensureHooks() {
  if (hooksReady) return;

  // Drop any iframe that is not an allowlisted embed.
  DOMPurify.addHook("uponSanitizeElement", (node, data) => {
    if (data.tagName === "iframe") {
      const el = node as Element;
      const src = el.getAttribute("src") ?? "";
      if (!ALLOWED_IFRAME.test(src)) {
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
  const clean = cleanTiptapDoc(json);
  const raw = generateHTML(
    clean as Parameters<typeof generateHTML>[0],
    getExtensions(),
  );
  return DOMPurify.sanitize(raw, {
    ADD_TAGS: ["iframe"],
    ADD_ATTR: [
      "allow",
      "allowfullscreen",
      "frameborder",
      "scrolling",
      "loading",
      "target",
      "width",
      "height",
    ],
  });
}
