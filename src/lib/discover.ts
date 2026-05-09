import { fetchTeamtailorBySubdomain } from "./adapters/teamtailor";
import type { NormalizedJob } from "./adapters/types";

export interface DiscoveryResult {
  source: "teamtailor";
  identifier: string;
  jobs: NormalizedJob[];
}

function candidateSubdomains(slug: string, name: string): string[] {
  const cands = new Set<string>();
  cands.add(slug.replace(/-/g, ""));
  cands.add(slug);
  const compact = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (compact) cands.add(compact);
  cands.delete("");
  return [...cands];
}

export async function discoverPublicFeeds(slug: string, name: string): Promise<DiscoveryResult | null> {
  for (const sub of candidateSubdomains(slug, name)) {
    try {
      const probe = await fetch(`https://${sub}.teamtailor.com/jobs.rss`, {
        method: "GET",
        headers: { Accept: "application/rss+xml,application/xml" },
        signal: AbortSignal.timeout(8000),
      });
      if (!probe.ok) continue;
      const text = await probe.text();
      if (!text.includes("<rss")) continue;
      const jobs = await fetchTeamtailorBySubdomain(sub);
      if (jobs.length === 0) continue;
      return { source: "teamtailor", identifier: sub, jobs };
    } catch {
      continue;
    }
  }
  return null;
}
