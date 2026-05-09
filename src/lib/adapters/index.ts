import { Adapter } from "./types";
import { teamtailorAdapter } from "./teamtailor";
import { workableAdapter } from "./workable";
import { bamboohrAdapter } from "./bamboohr";
import { jobylonAdapter } from "./jobylon";
import { greenhouseAdapter } from "./greenhouse";
import { leverAdapter } from "./lever";
import { manualAdapter } from "./manual";
import { scrapeCareersAdapter } from "./scrape-careers";
import { tallyAdapter } from "./tally";

export const adapters: Record<string, Adapter> = {
  teamtailor: teamtailorAdapter,
  workable: workableAdapter,
  bamboohr: bamboohrAdapter,
  jobylon: jobylonAdapter,
  greenhouse: greenhouseAdapter,
  lever: leverAdapter,
  manual: manualAdapter,
  "scrape-careers": scrapeCareersAdapter,
  tally: tallyAdapter,
};

export function getAdapter(type: string): Adapter | null {
  return adapters[type] ?? null;
}

export type { Adapter, AdapterContext, NormalizedJob } from "./types";
