import { Adapter, AdapterContext, AdapterError, NormalizedJob, stripUtm } from "./types";

interface GCfg {
  board: string;
}

interface GJob {
  id: number;
  title: string;
  absolute_url: string;
  location?: { name?: string };
  departments?: Array<{ name?: string }>;
  metadata?: Array<{ name?: string; value?: unknown }>;
  updated_at?: string;
  content?: string;
}

export const greenhouseAdapter: Adapter = {
  name: "greenhouse",
  async fetchJobs(ctx: AdapterContext): Promise<NormalizedJob[]> {
    const cfg = ctx.config as unknown as GCfg;
    if (!cfg.board) throw new AdapterError(`greenhouse: missing board for ${ctx.companySlug}`);

    const url = `https://boards-api.greenhouse.io/v1/boards/${cfg.board}/jobs?content=true`;
    const res = await fetch(url);
    if (!res.ok) throw new AdapterError(`greenhouse ${cfg.board}: HTTP ${res.status}`);
    const json = (await res.json()) as { jobs: GJob[] };

    return (json.jobs ?? []).map((j) => ({
      externalId: String(j.id),
      title: j.title,
      location: j.location?.name ?? null,
      department: j.departments?.[0]?.name ?? null,
      description: j.content ?? null,
      applyUrl: stripUtm(j.absolute_url),
      postedAt: j.updated_at ? new Date(j.updated_at) : null,
    }));
  },
};
