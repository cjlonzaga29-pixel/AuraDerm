import { timingSafeEqual } from "node:crypto";
import { processSheetOutbox } from "@/lib/server/checkout";
import { checkoutDeps } from "@/lib/server/deps";

// Retries queued Google Sheets syncs. Requires `Authorization: Bearer
// <CRON_SECRET>` (the header Vercel Cron sends); unavailable without it.
async function run(request: Request) {
  const deps = checkoutDeps();
  const secret = deps.config.cronSecret;
  const given = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  if (
    !secret ||
    given.length !== expected.length ||
    !timingSafeEqual(Buffer.from(given), Buffer.from(expected))
  ) {
    return Response.json({ ok: false }, { status: 401 });
  }
  try {
    const summary = await processSheetOutbox(deps, 25);
    return Response.json({ ok: true, ...summary });
  } catch (error) {
    deps.log?.(`sheets: retry run failed: ${(error as Error).message}`);
    return Response.json({ ok: false, error: "sync_failed" }, { status: 503 });
  }
}

export const GET = run;
export const POST = run;
