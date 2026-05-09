import { drizzle } from "drizzle-orm/d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import * as schema from "./schema";

type DB = ReturnType<typeof drizzle<typeof schema>>;

export function getDb(): DB {
  const env = getCloudflareContext().env as { DB?: D1Database };
  if (!env.DB) throw new Error("D1 binding 'DB' not configured");
  return drizzle(env.DB, { schema });
}

export const db = new Proxy({} as DB, {
  get(_t, prop) {
    return Reflect.get(getDb() as object, prop);
  },
});

export { schema };
