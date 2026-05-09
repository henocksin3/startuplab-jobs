interface Env {
  TARGET_URL: string;
  SYNC_SECRET: string;
}

async function runSync(env: Env, ctx?: ExecutionContext): Promise<Response> {
  const res = await fetch(env.TARGET_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.SYNC_SECRET}` },
  });
  const body = await res.text();
  console.log(`sync ${res.status}: ${body.slice(0, 500)}`);
  void ctx;
  return new Response(body, { status: res.status, headers: { "content-type": "application/json" } });
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(runSync(env, ctx).then(() => undefined));
  },
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.headers.get("authorization") !== `Bearer ${env.SYNC_SECRET}`) {
      return new Response("unauthorized", { status: 401 });
    }
    return runSync(env);
  },
};
