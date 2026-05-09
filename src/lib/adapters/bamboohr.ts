import { Adapter, AdapterContext, AdapterError, NormalizedJob, stripUtm } from "./types";

interface BCfg {
  subdomain: string;
}

interface BJobListItem {
  id: number | string;
  jobOpeningName: string;
  departmentLabel?: string;
  employmentStatusLabel?: string;
  location?: { city?: string; state?: string; country?: string };
  isRemote?: boolean | null;
  jobOpeningStatus?: string;
}

interface BJobDetail {
  result?: {
    jobOpening?: {
      jobOpeningName: string;
      jobOpeningShareUrl?: string;
      departmentLabel?: string;
      employmentStatusLabel?: string;
      location?: { city?: string; state?: string; addressCountry?: string };
      atsLocation?: { country?: string | null; state?: string | null; city?: string | null };
      description?: string;
      datePosted?: string;
      isRemote?: boolean;
      minimumExperience?: string;
    };
  };
}

function detectSeniorityFromExperience(exp: string | undefined): string | null {
  if (!exp) return null;
  const e = exp.toLowerCase();
  if (e.includes("intern")) return "intern";
  if (e.includes("entry")) return "entry";
  if (e.includes("associate") || e.includes("junior")) return "associate";
  if (e.includes("mid")) return "mid";
  if (e.includes("senior")) return "senior";
  return null;
}

async function fetchDetail(subdomain: string, id: string | number): Promise<BJobDetail | null> {
  try {
    const res = await fetch(`https://${subdomain}.bamboohr.com/careers/${id}/detail`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return (await res.json()) as BJobDetail;
  } catch {
    return null;
  }
}

export const bamboohrAdapter: Adapter = {
  name: "bamboohr",
  async fetchJobs(ctx: AdapterContext): Promise<NormalizedJob[]> {
    const cfg = ctx.config as unknown as BCfg;
    if (!cfg.subdomain) throw new AdapterError(`bamboohr: missing subdomain for ${ctx.companySlug}`);

    const url = `https://${cfg.subdomain}.bamboohr.com/careers/list`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new AdapterError(`bamboohr ${cfg.subdomain}: HTTP ${res.status}`);
    const json = (await res.json()) as { result?: BJobListItem[] };
    const list = (json.result ?? []).filter((j) => !j.jobOpeningStatus || j.jobOpeningStatus === "Open");

    // Fetch details only for new jobs (those not yet enriched in DB) — saves subrequests.
    const skip = ctx.alreadyEnriched ?? new Set<string>();
    const details = await Promise.all(
      list.map((j) => (skip.has(String(j.id)) ? Promise.resolve(null) : fetchDetail(cfg.subdomain, j.id))),
    );

    return list.map((j, i) => {
      const detail = details[i]?.result?.jobOpening;
      const loc = detail?.location ?? j.location ?? {};
      const country = (loc as { addressCountry?: string }).addressCountry ?? detail?.atsLocation?.country ?? undefined;
      const locParts = [loc.city, loc.state, country].filter(Boolean);

      void detectSeniorityFromExperience;

      return {
        externalId: String(j.id),
        title: j.jobOpeningName,
        location: locParts.join(", ") || null,
        department: detail?.departmentLabel ?? j.departmentLabel ?? null,
        employmentType: detail?.employmentStatusLabel ?? j.employmentStatusLabel ?? null,
        remote: !!(detail?.isRemote ?? j.isRemote),
        description: detail?.description ?? null,
        applyUrl: stripUtm(`https://${cfg.subdomain}.bamboohr.com/careers/${j.id}`),
        postedAt: detail?.datePosted ? new Date(detail.datePosted) : null,
      };
    });
  },
};
