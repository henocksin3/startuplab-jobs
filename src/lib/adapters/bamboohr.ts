import { Adapter, AdapterContext, AdapterError, NormalizedJob, stripUtm } from "./types";

interface BCfg {
  subdomain: string;
}

interface BJob {
  id: number;
  jobOpeningName: string;
  departmentLabel?: string;
  employmentStatusLabel?: string;
  location?: { city?: string; state?: string; country?: string };
  locationCity?: string;
  locationState?: string;
  locationCountry?: string;
  jobOpeningStatus?: string;
  datePosted?: string;
  description?: string;
}

interface BResponse {
  result: BJob[];
}

export const bamboohrAdapter: Adapter = {
  name: "bamboohr",
  async fetchJobs(ctx: AdapterContext): Promise<NormalizedJob[]> {
    const cfg = ctx.config as unknown as BCfg;
    if (!cfg.subdomain) throw new AdapterError(`bamboohr: missing subdomain for ${ctx.companySlug}`);

    const url = `https://${cfg.subdomain}.bamboohr.com/careers/list`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new AdapterError(`bamboohr ${cfg.subdomain}: HTTP ${res.status}`);
    const json = (await res.json()) as BResponse;

    return (json.result ?? [])
      .filter((j) => !j.jobOpeningStatus || j.jobOpeningStatus === "Open")
      .map((j) => {
        const city = j.location?.city ?? j.locationCity;
        const state = j.location?.state ?? j.locationState;
        const country = j.location?.country ?? j.locationCountry;
        const loc = [city, state, country].filter(Boolean).join(", ");
        return {
          externalId: String(j.id),
          title: j.jobOpeningName,
          location: loc || null,
          department: j.departmentLabel ?? null,
          employmentType: j.employmentStatusLabel ?? null,
          description: j.description ?? null,
          applyUrl: stripUtm(`https://${cfg.subdomain}.bamboohr.com/careers/${j.id}`),
          postedAt: j.datePosted ? new Date(j.datePosted) : null,
        };
      });
  },
};
