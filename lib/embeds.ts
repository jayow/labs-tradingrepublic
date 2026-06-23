// Pure URL → iframe-embed resolver. Safe to import on client and server.
// Native iframes only (no third-party widget scripts).
export type EmbedProvider = "youtube" | "instagram" | "tiktok" | "facebook";

export type EmbedResult = { provider: EmbedProvider; src: string };

export function detectEmbed(rawUrl: string): EmbedResult | null {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const host = url.hostname.replace(/^www\./, "");

  // YouTube — routed to the dedicated Tiptap Youtube extension by the caller.
  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtu.be") {
    return { provider: "youtube", src: rawUrl };
  }

  // Instagram — /p/{code}/, /reel/{code}/, /tv/{code}/
  if (host.endsWith("instagram.com")) {
    const m = url.pathname.match(/^\/(p|reel|tv)\/([^/]+)/);
    if (!m) return null;
    return {
      provider: "instagram",
      src: `https://www.instagram.com/${m[1]}/${m[2]}/embed`,
    };
  }

  // TikTok — /@user/video/{id}
  if (host.endsWith("tiktok.com")) {
    const m = url.pathname.match(/\/video\/(\d+)/);
    if (!m) return null;
    return {
      provider: "tiktok",
      src: `https://www.tiktok.com/embed/v2/${m[1]}`,
    };
  }

  // Facebook — posts and videos via the official plugins iframe.
  if (host.endsWith("facebook.com") || host === "fb.watch") {
    const isVideo =
      host === "fb.watch" ||
      /\/(videos?|watch|reel)\//.test(url.pathname) ||
      url.searchParams.has("v");
    const plugin = isVideo ? "video.php" : "post.php";
    return {
      provider: "facebook",
      src: `https://www.facebook.com/plugins/${plugin}?href=${encodeURIComponent(
        rawUrl,
      )}&show_text=true`,
    };
  }

  return null;
}
