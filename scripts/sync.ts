import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { runSync, type AtsConfigMap } from "../src/lib/sync";

async function main() {
  const file = resolve(process.cwd(), "data/ats-configs.json");
  const raw = JSON.parse(await readFile(file, "utf8")) as Record<string, unknown>;
  const atsConfigs: AtsConfigMap = {};
  for (const [k, v] of Object.entries(raw)) {
    if (!k.startsWith("_")) atsConfigs[k] = v as AtsConfigMap[string];
  }
  console.log(`running sync with ${Object.keys(atsConfigs).length} ATS configs...`);
  const summary = await runSync(atsConfigs);
  console.log(JSON.stringify(summary, null, 2));
  process.exit(summary.ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
