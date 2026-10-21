import { after } from "next/server";
import { createOrder, processSheetOutbox } from "@/lib/server/checkout";
import { checkoutDeps, clientIp, readJson } from "@/lib/server/deps";

// Creates a test order. The order is written durably first; a COD order's
// sheet row is synced after the response from the durable outbox (failures
// stay queued for the retry endpoint).
export async function POST(request: Request) {
  const body = await readJson(request);
  if (body === null) {
    return Response.json({ ok: false, error: "invalid_request", message: "The order could not be read." }, { status: 400 });
  }
  const deps = checkoutDeps();
  const result = await createOrder(body, { clientIp: clientIp(request), origin: new URL(request.url).origin }, deps);
  if (result.syncSheets) {
    after(async () => {
      try {
        await processSheetOutbox(deps, 5);
      } catch (error) {
        deps.log?.(`sheets: background sync failed: ${(error as Error).message}`);
      }
    });
  }
  return Response.json(result.body, { status: result.status, headers: { "Cache-Control": "no-store" } });
}
