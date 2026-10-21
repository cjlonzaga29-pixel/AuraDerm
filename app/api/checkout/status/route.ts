import { getOrderStatus } from "@/lib/server/checkout";
import { checkoutDeps } from "@/lib/server/deps";

// Status of one order for the browser that placed it (reference + access
// token). There is no listing endpoint.
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const result = await getOrderStatus({ reference: params.get("ref"), token: params.get("token") }, checkoutDeps());
  return Response.json(result.body, { status: result.status, headers: { "Cache-Control": "no-store" } });
}
