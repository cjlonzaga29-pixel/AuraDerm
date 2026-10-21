import { handlePayMongoWebhook } from "@/lib/server/checkout";
import { checkoutDeps } from "@/lib/server/deps";

// PayMongo webhook (test mode). The raw body is read before any parsing so the
// signature is checked over the exact bytes PayMongo signed.
export async function POST(request: Request) {
  const rawBody = await request.text();
  if (rawBody.length > 262_144) return Response.json({ ok: false }, { status: 413 });
  const result = await handlePayMongoWebhook(rawBody, request.headers.get("paymongo-signature"), checkoutDeps());
  return Response.json(result.body, { status: result.status });
}
