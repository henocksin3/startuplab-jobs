import { Adapter, AdapterContext, AdapterError, NormalizedJob, stripUtm } from "./types";

interface TTConfig {
  subdomain: string;
}

interface TTJob {
  id: string;
  attributes: {
    title: string;
    "human-status": string;
    "career-page-url"?: string;
    "apply-button-text"?: string;
    "internal-name"?: string;
    pinned?: boolean;
    location?: string;
    "remote-status"?: string;
    department?: string;
    "created-at"?: string;
    "updated-at"?: string;
    body?: string;
    "pitch"?: string;
  };
  links?: { "careersite-job-url"?: string };
  relationships?: {
    location?: { data?: { id: string } | null };
    department?: { data?: { id: string } | null };
  };
}

interface TTResponse {
  data: TTJob[];
  included?: Array<{ id: string; type: string; attributes: { name?: string } }>;
  links?: { next?: string };
}

export const teamtailorAdapter: Adapter = {
  name: "teamtailor",
  async fetchJobs(ctx: AdapterContext): Promise<NormalizedJob[]> {
    const cfg = ctx.config as unknown as TTConfig;
    if (!cfg.subdomain) throw new AdapterError(`teamtailor: missing subdomain for ${ctx.companySlug}`);

    const jobs: NormalizedJob[] = [];
    let url: string | undefined = `https://${cfg.subdomain}.teamtailor.com/api/v1/jobs?include=location,department&page[size]=30`;

    while (url) {
      const res = await fetch(url, { headers: { Accept: "application/vnd.api+json" } });
      if (!res.ok) throw new AdapterError(`teamtailor ${cfg.subdomain}: HTTP ${res.status}`);
      const json = (await res.json()) as TTResponse;

      const included = new Map<string, string>();
      for (const inc of json.included ?? []) {
        if (inc.attributes?.name) included.set(`${inc.type}:${inc.id}`, inc.attributes.name);
      }

      for (const j of json.data) {
        const status = j.attributes["human-status"];
        if (status && status !== "open") continue;

        const locId = j.relationships?.location?.data?.id;
        const deptId = j.relationships?.department?.data?.id;
        const apply = j.links?.["careersite-job-url"];
        if (!apply) continue;

        jobs.push({
          externalId: j.id,
          title: j.attributes.title,
          location: locId ? included.get(`locations:${locId}`) ?? null : null,
          department: deptId ? included.get(`departments:${deptId}`) ?? null : null,
          remote: j.attributes["remote-status"] === "fully" || j.attributes["remote-status"] === "hybrid",
          description: j.attributes.body ?? j.attributes.pitch ?? null,
          applyUrl: stripUtm(apply),
          postedAt: j.attributes["created-at"] ? new Date(j.attributes["created-at"]) : null,
        });
      }

      url = json.links?.next;
    }
    return jobs;
  },
};
