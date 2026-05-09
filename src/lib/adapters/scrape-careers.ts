import { Adapter, AdapterContext, AdapterError, NormalizedJob, stripUtm } from "./types";

interface ScrapeConfig {
  url: string;
  linkPattern: string;
  stripPrefix?: string;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function titleFromUrl(href: string, stripPrefix?: string): string {
  try {
    const u = new URL(href);
    const seg = u.pathname.split("/").filter(Boolean).pop() ?? "";
    let s = seg
      .replace(/^\d+-/, "")
      .replace(/[-_]+/g, " ")
      .trim();
    if (stripPrefix && s.toLowerCase().startsWith(stripPrefix.toLowerCase())) {
      s = s.slice(stripPrefix.length).trim();
    }
    return s
      .split(" ")
      .filter(Boolean)
      .map((w) => (w.length <= 2 && w !== w.toUpperCase() ? w : w.charAt(0).toUpperCase() + w.slice(1)))
      .join(" ");
  } catch {
    return href;
  }
}

function externalIdFromUrl(href: string): string {
  try {
    const u = new URL(href);
    const seg = u.pathname.split("/").filter(Boolean).pop() ?? "";
    const m = seg.match(/^(\d+)/);
    return m ? m[1] : seg;
  } catch {
    return href;
  }
}

export const scrapeCareersAdapter: Adapter = {
  name: "scrape-careers",
  async fetchJobs(ctx: AdapterContext): Promise<NormalizedJob[]> {
    const cfg = ctx.config as unknown as ScrapeConfig;
    if (!cfg.url || !cfg.linkPattern) throw new AdapterError(`scrape-careers: missing url/linkPattern for ${ctx.companySlug}`);

    const res = await fetch(cfg.url, {
      headers: { Accept: "text/html", "User-Agent": "Mozilla/5.0 (compatible; StartuplabJobsBot/1.0)" },
    });
    if (!res.ok) throw new AdapterError(`scrape-careers ${ctx.companySlug}: HTTP ${res.status} for ${cfg.url}`);
    const html = await res.text();

    const re = new RegExp(`href="(${cfg.linkPattern}[^"#?]*)"`, "gi");
    const hrefs = new Set<string>();
    for (const m of html.matchAll(re)) {
      hrefs.add(decodeEntities(m[1]).replace(/\/$/, ""));
    }

    return [...hrefs].map((href) => ({
      externalId: externalIdFromUrl(href),
      title: titleFromUrl(href, cfg.stripPrefix),
      applyUrl: stripUtm(href),
    }));
  },
};
