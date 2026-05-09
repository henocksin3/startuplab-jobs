import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { runSync } from "@/lib/sync";
import { atsConfigs } from "@/lib/ats-configs";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const env = getCloudflareContext().env as { SYNC_SECRET?: string };
  const secret = env.SYNC_SECRET ?? process.env.SYNC_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const summary = await runSync(atsConfigs);
    return NextResponse.json(summary, { status: summary.ok ? 200 : 500 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export const GET = POST;
