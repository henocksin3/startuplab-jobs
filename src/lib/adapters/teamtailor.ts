import { Adapter, AdapterContext, AdapterError, NormalizedJob, stripUtm } from "./types";

interface TTConfig {
  subdomain: string;
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function getCdataOrText(xml: string, tag: string): string | null {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = xml.match(re);
  if (!m) return null;
  let v = m[1].trim();
  if (v.startsWith("<![CDATA[") && v.endsWith("]]>")) v = v.slice(9, -3);
  return decodeXmlEntities(v);
}

function getAllItems(xml: string): string[] {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);
}

function getLocations(xml: string): string {
  const block = xml.match(/<tt:locations>([\s\S]*?)<\/tt:locations>/);
  if (!block) return "";
  const cities = [...block[1].matchAll(/<tt:city>([^<]*)<\/tt:city>/g)].map((m) => m[1].trim()).filter(Boolean);
  const countries = [...block[1].matchAll(/<tt:country>([^<]*)<\/tt:country>/g)].map((m) => m[1].trim()).filter(Boolean);
  if (cities.length === 0 && countries.length === 0) {
    const names = [...block[1].matchAll(/<tt:name>([^<]*)<\/tt:name>/g)].map((m) => m[1].trim()).filter(Boolean);
    return names.join(", ");
  }
  const parts: string[] = [];
  for (let i = 0; i < Math.max(cities.length, countries.length); i++) {
    const a = cities[i];
    const b = countries[i];
    if (a && b) parts.push(`${a}, ${b}`);
    else if (a) parts.push(a);
    else if (b) parts.push(b);
  }
  return parts.join(" / ");
}

export const teamtailorAdapter: Adapter = {
  name: "teamtailor",
  async fetchJobs(ctx: AdapterContext): Promise<NormalizedJob[]> {
    const cfg = ctx.config as unknown as TTConfig;
    if (!cfg.subdomain) throw new AdapterError(`teamtailor: missing subdomain for ${ctx.companySlug}`);
    return fetchTeamtailorBySubdomain(cfg.subdomain);
  },
};

export async function fetchTeamtailorBySubdomain(subdomain: string): Promise<NormalizedJob[]> {
  const url = `https://${subdomain}.teamtailor.com/jobs.rss`;
  const res = await fetch(url, { headers: { Accept: "application/rss+xml,application/xml" } });
  if (!res.ok) throw new AdapterError(`teamtailor ${subdomain}: HTTP ${res.status}`);
  const xml = await res.text();
  if (!xml.includes("<rss")) throw new AdapterError(`teamtailor ${subdomain}: invalid RSS`);

  const out: NormalizedJob[] = [];
  for (const item of getAllItems(xml)) {
    const title = getCdataOrText(item, "title");
    const link = getCdataOrText(item, "link");
    const guid = getCdataOrText(item, "guid");
    const description = getCdataOrText(item, "description");
    const pubDate = getCdataOrText(item, "pubDate");
    const remoteStatus = getCdataOrText(item, "remoteStatus");
    const department = getCdataOrText(item, "tt:department");
    const role = getCdataOrText(item, "tt:role");
    if (!title || !link) continue;

    const externalId = guid || (link.match(/\/jobs\/(\d+)/)?.[1] ?? link);
    const location = getLocations(item) || null;

    out.push({
      externalId,
      title,
      location,
      department: department || role || null,
      remote: remoteStatus === "fully" || remoteStatus === "hybrid",
      description,
      applyUrl: stripUtm(link),
      postedAt: pubDate ? new Date(pubDate) : null,
    });
  }
  return out;
}
