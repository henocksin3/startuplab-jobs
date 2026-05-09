import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { runSync, upsertCompanies } from "../src/lib/sync";

async function main() {
  const file = resolve(process.cwd(), "data/companies.json");
  const seeds = JSON.parse(await readFile(file, "utf8"));
  console.log(`seeding ${seeds.length} companies...`);
  await upsertCompanies(seeds);
  console.log(`running sync...`);
  const summary = await runSync();
  console.log(JSON.stringify(summary, null, 2));
  process.exit(summary.ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
