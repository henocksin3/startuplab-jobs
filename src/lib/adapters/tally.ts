import { Adapter, AdapterContext, AdapterError, NormalizedJob, stripUtm } from "./types";

interface TCfg {
  formId: string;
  title?: string;
  location?: string;
  externalId?: string;
}

type SchemaNode = string | unknown[];

function escape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function renderInline(node: SchemaNode): string {
  if (typeof node === "string") return escape(node);
  if (!Array.isArray(node)) return "";

  // [content, [["tag","span"], ["font-weight","bold"], ...]]
  if (node.length >= 1 && (typeof node[0] === "string" || Array.isArray(node[0]))) {
    const content = node[0] as SchemaNode;
    const attrs = (node[1] as unknown[]) ?? [];
    const inner = Array.isArray(content)
      ? content.every((c) => typeof c === "string" || Array.isArray(c))
        ? content.map((c) => renderInline(c as SchemaNode)).join("")
        : renderInline(content as SchemaNode)
      : escape(content as string);

    let bold = false;
    let italic = false;
    let href: string | null = null;
    if (Array.isArray(attrs)) {
      for (const attr of attrs) {
        if (!Array.isArray(attr) || attr.length < 2) continue;
        const [k, v] = attr as [string, string];
        if (k === "font-weight" && v === "bold") bold = true;
        if (k === "font-style" && v === "italic") italic = true;
        if (k === "href") href = String(v);
      }
    }
    let html = inner;
    if (bold) html = `<strong>${html}</strong>`;
    if (italic) html = `<em>${html}</em>`;
    if (href) html = `<a href="${escape(href)}">${html}</a>`;
    return html;
  }
  return "";
}

function renderBlocks(blocks: Array<{ type: string; payload?: { safeHTMLSchema?: SchemaNode[] } }>): string {
  const parts: string[] = [];
  for (const b of blocks) {
    const schema = b.payload?.safeHTMLSchema;
    if (!schema || !Array.isArray(schema)) continue;
    const inner = schema.map((node) => renderInline(node as SchemaNode)).join("");
    if (!inner.trim()) continue;
    switch (b.type) {
      case "HEADING_1":
      case "FORM_TITLE":
        parts.push(`<h1>${inner}</h1>`);
        break;
      case "HEADING_2":
        parts.push(`<h2>${inner}</h2>`);
        break;
      case "HEADING_3":
        parts.push(`<h3>${inner}</h3>`);
        break;
      case "TITLE":
        // TITLE blocks belong to form questions, skip
        break;
      case "TEXT":
        parts.push(`<p>${inner}</p>`);
        break;
      default:
        break;
    }
  }
  return parts.join("\n");
}

function findBlocks(obj: unknown): Array<{ type: string; payload?: { safeHTMLSchema?: SchemaNode[] } }> | null {
  if (Array.isArray(obj)) {
    for (const it of obj) {
      const r = findBlocks(it);
      if (r) return r;
    }
    return null;
  }
  if (obj && typeof obj === "object") {
    const o = obj as Record<string, unknown>;
    if ("blocks" in o && Array.isArray(o.blocks)) {
      const arr = o.blocks as Array<{ type?: string }>;
      if (arr.length > 0 && typeof arr[0]?.type === "string") {
        return arr as Array<{ type: string; payload?: { safeHTMLSchema?: SchemaNode[] } }>;
      }
    }
    for (const v of Object.values(o)) {
      const r = findBlocks(v);
      if (r) return r;
    }
  }
  return null;
}

function getFormTitle(blocks: Array<{ type: string; payload?: { safeHTMLSchema?: SchemaNode[] } }>): string | null {
  const titleBlock = blocks.find((b) => b.type === "FORM_TITLE");
  if (!titleBlock?.payload?.safeHTMLSchema) return null;
  const text = titleBlock.payload.safeHTMLSchema
    .map((n) => renderInline(n as SchemaNode))
    .join("")
    .replace(/<[^>]*>/g, "")
    .trim();
  return text || null;
}

export const tallyAdapter: Adapter = {
  name: "tally",
  async fetchJobs(ctx: AdapterContext): Promise<NormalizedJob[]> {
    const cfg = ctx.config as unknown as TCfg;
    if (!cfg.formId) throw new AdapterError(`tally: missing formId for ${ctx.companySlug}`);

    const url = `https://tally.so/r/${cfg.formId}`;
    const res = await fetch(url, {
      headers: { Accept: "text/html", "User-Agent": "Mozilla/5.0 (compatible; StartuplabJobsBot/1.0)" },
    });
    if (!res.ok) throw new AdapterError(`tally ${cfg.formId}: HTTP ${res.status}`);
    const html = await res.text();

    const m = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if (!m) throw new AdapterError(`tally ${cfg.formId}: no embedded data`);
    let parsed: unknown;
    try {
      parsed = JSON.parse(m[1]);
    } catch (e) {
      throw new AdapterError(`tally ${cfg.formId}: bad JSON`, e);
    }
    const blocks = findBlocks(parsed) ?? [];
    if (blocks.length === 0) throw new AdapterError(`tally ${cfg.formId}: no blocks`);

    const title = cfg.title ?? getFormTitle(blocks) ?? "Untitled";
    const description = renderBlocks(blocks);

    return [
      {
        externalId: cfg.externalId ?? cfg.formId,
        title,
        location: cfg.location ?? null,
        description,
        applyUrl: stripUtm(url),
        postedAt: null,
      },
    ];
  },
};
