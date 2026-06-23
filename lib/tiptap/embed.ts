import { Node, mergeAttributes } from "@tiptap/core";

// Generic native-iframe embed node (Instagram, TikTok, Facebook). YouTube uses
// the dedicated @tiptap/extension-youtube. React-free so the same node renders
// in the editor and in server-side generateHTML.
export const Embed = Node.create({
  name: "embed",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      provider: { default: null },
      url: { default: null },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-embed]",
        getAttrs: (node) => {
          const el = node as HTMLElement;
          const iframe = el.querySelector("iframe");
          return {
            provider: el.getAttribute("data-embed") || null,
            src: iframe?.getAttribute("src") || null,
          };
        },
      },
    ];
  },

  renderHTML({ node }) {
    const provider = (node.attrs.provider as string) || "";
    const src = (node.attrs.src as string) || "";
    return [
      "div",
      mergeAttributes({
        "data-embed": provider,
        class: `embed embed-${provider}`,
      }),
      [
        "iframe",
        {
          src,
          loading: "lazy",
          frameborder: "0",
          scrolling: "no",
          allowfullscreen: "true",
          allow: "encrypted-media; picture-in-picture; web-share",
        },
      ],
    ];
  },
});
