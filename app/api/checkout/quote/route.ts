import { quoteOrder } from "@/lib/server/checkout";
import { resolveCheckoutConfig } from "@/lib/server/config";
import { readJson } from "@/lib/server/deps";

// Server-calculated totals for the checkout summary. Accepts only product
// handles and quantities; prices always come from the catalog.
export async function POST(request: Request) {
  const body = await readJson(request);
  if (body === null) return Response.json({ ok: false, error: "invalid_request" }, { status: 400 });
  const result = quoteOrder(body, { config: resolveCheckoutConfig() });
  return Response.json(result.body, { status: result.status, headers: { "Cache-Control": "no-store" } });
}
