// Sold-count semantics, mirrored by the product_sold_units view in
// supabase/migrations. Nothing on the storefront displays sold counts yet;
// until real live orders exist the shop shows none.
//
// A unit counts as sold only when it belongs to a LIVE order (test orders
// never count) that was either paid online or, for cash on delivery, was
// collected or delivered — and the order was not cancelled, refunded or
// returned.

export type SoldCountOrder = {
  mode: "test" | "live";
  paymentMethod: "online" | "cod";
  paymentStatus: string;
  fulfillmentStatus: string;
};

export function countsTowardSold(order: SoldCountOrder): boolean {
  if (order.mode !== "live") return false;
  if (order.paymentStatus === "cancelled" || order.paymentStatus === "refunded") return false;
  if (order.fulfillmentStatus === "cancelled" || order.fulfillmentStatus === "returned") return false;
  if (order.paymentMethod === "online") return order.paymentStatus === "paid";
  return order.paymentStatus === "cod_collected" || order.fulfillmentStatus === "delivered";
}

export function soldUnits(
  orders: (SoldCountOrder & { items: { handle: string; quantity: number }[] })[],
): Map<string, number> {
  const totals = new Map<string, number>();
  for (const order of orders) {
    if (!countsTowardSold(order)) continue;
    for (const item of order.items) totals.set(item.handle, (totals.get(item.handle) ?? 0) + item.quantity);
  }
  return totals;
}
