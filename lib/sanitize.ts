import "server-only";
import { generateHTML } from "@tiptap/html";
import sanitizeHtml from "sanitize-html";
import { getExtensions } from "@/lib/tiptap/extensions";
import { cleanTiptapDoc } from "@/lib/tiptap/clean";
import type { Json } from "@/lib/database.types";

// Only iframes whose src matches one of these embed endpoints survive — the
// single most important XSS control for user content.
const ALLOWED_IFRAME =
  /^https:\/\/(www\.)?(youtube(-nocookie)?\.com\/embed\/[\w-]+|instagram\.com\/(p|reel|tv)\/[^/?#]+\/embed|tiktok\.com\/embed\/v2\/\d+|facebook\.com\/plugins\/(post|video)\.php)([/?#][^\s"'<>]*)?$/;

// Render Tiptap JSON to sanitized HTML. Run at publish time and cache the
// result in posts.content_html so public reads are a single column fetch.
// Uses sanitize-html (htmlparser2-based, no jsdom) so it loads on serverless.
export function renderPostHtml(json: Json): string {
  const clean = cleanTiptapDoc(json);
  const raw = generateHTML(
    clean as Parameters<typeof generateHTML>[0],
    getExtensions(),
  );
  return sanitizeHtml(raw, {
    allowedTags: [
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "p",
      "br",
      "hr",
      "ul",
      "ol",
      "li",
      "blockquote",
      "pre",
      "code",
      "strong",
      "em",
      "u",
      "s",
      "a",
      "img",
      "figure",
      "figcaption",
      "div",
      "span",
      "iframe",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "title", "width", "height", "class"],
      iframe: [
        "src",
        "width",
        "height",
        "allow",
        "allowfullscreen",
        "frameborder",
        "scrolling",
        "loading",
      ],
      div: ["class", "data-embed", "data-youtube-video"],
      "*": ["class"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowProtocolRelative: false,
    // Force safe link attributes.
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        rel: "noopener noreferrer nofollow",
        target: "_blank",
      }),
    },
    // Drop any iframe that is not an allowlisted embed.
    exclusiveFilter: (frame) =>
      frame.tag === "iframe" && !ALLOWED_IFRAME.test(frame.attribs.src ?? ""),
  });
}
