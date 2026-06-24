// Pure — safe on client and server.
export type TiptapNode = {
  type?: string;
  attrs?: Record<string, unknown> | null;
  content?: TiptapNode[];
  [key: string]: unknown;
};

// Media nodes whose renderers break on a missing src (the Youtube extension
// calls src.match()) and which show as empty blocks in the editor.
const MEDIA_TYPES = new Set(["youtube", "embed", "image"]);

function keepNode(node: TiptapNode): boolean {
  if (!node.type || !MEDIA_TYPES.has(node.type)) return true;
  const src = node.attrs?.src;
  return typeof src === "string" && src.length > 0;
}

// Recursively drop media nodes that have no usable src. Used both when loading
// content into the editor (so stray empty blocks vanish) and before rendering
// to HTML (so one bad node can't crash a publish).
export function cleanTiptapDoc<T>(json: T): T {
  const node = json as TiptapNode;
  if (!Array.isArray(node.content)) return json;
  return {
    ...node,
    content: node.content.filter(keepNode).map((n) => cleanTiptapDoc(n)),
  } as T;
}
