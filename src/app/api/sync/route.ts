import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { runSync, type AtsConfigMap } from "@/lib/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function loadAtsConfigs(): Promise<AtsConfigMap> {
  const file = resolve(process.cwd(), "data/ats-configs.json");
  const raw = JSON.parse(await readFile(file, "utf8")) as Record<string, unknown>;
  const out: AtsConfigMap = {};
  for (const [k, v] of Object.entries(raw)) {
    if (k.startsWith("_")) continue;
    out[k] = v as AtsConfigMap[string];
  }
  return out;
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const expected = `Bearer ${process.env.SYNC_SECRET}`;
  if (!process.env.SYNC_SECRET || auth !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const atsConfigs = await loadAtsConfigs();
    const summary = await runSync(atsConfigs);
    return NextResponse.json(summary, { status: summary.ok ? 200 : 500 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export const GET = POST;
