import { Adapter, AdapterContext, AdapterError, NormalizedJob, stripUtm } from "./types";

interface ScrapeConfig {
  url: string;
  linkPattern: string;
  stripPrefix?: string;
  enrichJsonLd?: boolean;
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
    let s = seg.replace(/^\d+-/, "").replace(/[-_]+/g, " ").trim();
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

interface JsonLdJob {
  title?: string;
  description?: string;
  datePosted?: string;
  employmentType?: string | string[];
  jobLocation?: unknown;
  industry?: string;
  hiringOrganization?: { name?: string };
}

function flattenLocation(loc: unknown): string | null {
  if (!loc) return null;
  const list = Array.isArray(loc) ? loc : [loc];
  const parts: string[] = [];
  for (const item of list) {
    if (typeof item !== "object" || item === null) continue;
    const addr = (item as { address?: { addressLocality?: string; addressCountry?: string | { name?: string } } }).address;
    const city = addr?.addressLocality;
    const country = typeof addr?.addressCountry === "string" ? addr.addressCountry : addr?.addressCountry?.name;
    const loc = [city, country].filter(Boolean).join(", ");
    if (loc) parts.push(loc);
  }
  return parts.join(" / ") || null;
}

async function enrich(href: string, stripPrefix?: string): Promise<NormalizedJob | null> {
  try {
    const res = await fetch(href, {
      headers: { Accept: "text/html", "User-Agent": "Mozilla/5.0 (compatible; StartuplabJobsBot/1.0)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const m = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    if (!m) return null;
    let parsed: JsonLdJob | JsonLdJob[];
    try {
      parsed = JSON.parse(m[1]);
    } catch {
      return null;
    }
    const job = (Array.isArray(parsed) ? parsed[0] : parsed) as JsonLdJob;
    if (!job?.title) return null;
    const empType = Array.isArray(job.employmentType) ? job.employmentType[0] : job.employmentType;
    let title = job.title;
    if (stripPrefix && title.toLowerCase().startsWith(stripPrefix.toLowerCase())) {
      title = title.slice(stripPrefix.length).trim();
    }
    return {
      externalId: externalIdFromUrl(href),
      title,
      location: flattenLocation(job.jobLocation),
      department: null,
      employmentType: empType ?? null,
      description: job.description ?? null,
      applyUrl: stripUtm(href),
      postedAt: job.datePosted ? new Date(job.datePosted) : null,
    };
  } catch {
    return null;
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
    const list = [...hrefs];

    const skip = ctx.alreadyEnriched ?? new Set<string>();
    const enriched = cfg.enrichJsonLd === false
      ? list.map(() => null)
      : await Promise.all(
          list.map((href) =>
            skip.has(externalIdFromUrl(href)) ? Promise.resolve(null) : enrich(href, cfg.stripPrefix),
          ),
        );

    return list.map((href, i) => {
      const e = enriched[i];
      if (e) return e;
      return {
        externalId: externalIdFromUrl(href),
        title: titleFromUrl(href, cfg.stripPrefix),
        applyUrl: stripUtm(href),
      };
    });
  },
};
