"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { formatMoney } from "@/lib/money";
import { PENDING_BAG_ORDER_KEY } from "@/components/checkout/CheckoutForm";

type Status = {
  reference: string;
  mode: "test" | "live";
  paymentMethod: "online" | "cod";
  paymentStatus: string;
  fulfillmentStatus: string;
  totalMinor: number;
  shippingMinor: number | null;
  storeNotified: boolean | null;
};

type State =
  | { kind: "loading" }
  | { kind: "missing" }
  | { kind: "error"; message: string }
  | { kind: "ready"; status: Status };

// Shows what the server says about one order. "Paid" appears only when the
// server recorded a verified payment; a redirect from PayMongo alone shows a
// pending state.
export function OrderResult({
  reference,
  token,
  cancelled,
}: {
  reference: string | null;
  token: string | null;
  cancelled: boolean;
}) {
  const { clearCart } = useCart();
  const [state, setState] = useState<State>(reference && token ? { kind: "loading" } : { kind: "missing" });

  const load = useCallback(async () => {
    if (!reference || !token) return;
    setState({ kind: "loading" });
    try {
      const response = await fetch(`/api/checkout/status?${new URLSearchParams({ ref: reference, token })}`, {
        cache: "no-store",
      });
      const body = await response.json();
      if (response.status === 404) return setState({ kind: "missing" });
      if (!response.ok || !body.ok) {
        return setState({ kind: "error", message: body.message ?? "Order status is unavailable right now." });
      }
      setState({ kind: "ready", status: body as Status });
    } catch {
      setState({ kind: "error", message: "Order status could not be loaded. Check your connection and try again." });
    }
  }, [reference, token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  // A bag-sourced online order empties the bag only once it is confirmed paid.
  const paid = state.kind === "ready" && state.status.paymentStatus === "paid";
  useEffect(() => {
    if (!paid || !reference) return;
    try {
      if (sessionStorage.getItem(PENDING_BAG_ORDER_KEY) === reference) {
        sessionStorage.removeItem(PENDING_BAG_ORDER_KEY);
        clearCart();
      }
    } catch {
      // Storage unavailable: the bag is kept.
    }
  }, [paid, reference, clearCart]);

  const panel = "flex flex-col gap-4 rounded-card border border-hairline bg-forest-panel p-6 font-sans text-base sm:p-8";

  if (state.kind === "loading") {
    return (
      <p role="status" className="flex items-center gap-2 font-sans text-base text-sage-muted">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Checking your order…
      </p>
    );
  }
  if (state.kind === "missing") {
    return (
      <div className={panel}>
        <p className="text-cream">We could not find that order.</p>
        <Button variant="primary" size="cta" href="/shop" className="self-start">
          Back to the shop
        </Button>
      </div>
    );
  }
  if (state.kind === "error") {
    return (
      <div className={panel} role="alert">
        <p className="text-cream">{state.message}</p>
        <Button variant="quiet" size="cta" onClick={() => void load()} className="self-start">
          Try again
        </Button>
      </div>
    );
  }

  const { status } = state;
  const test = status.mode === "test";
  let heading: string;
  let detail: string;
  if (status.paymentMethod === "cod") {
    heading = test ? "Test order recorded" : "Order recorded";
    detail =
      "Cash on delivery: unpaid and awaiting confirmation." +
      (status.storeNotified
        ? " The store has received your order details."
        : " Your order is saved, but the store’s order list has not been updated yet. You don’t need to order again.") +
      (test ? " This is a test order and will not be delivered." : "");
  } else if (status.paymentStatus === "paid") {
    heading = test ? "Test payment confirmed" : "Payment confirmed";
    detail = test ? "PayMongo confirmed the test payment. No real money was charged and nothing will be shipped." : "";
  } else if (status.paymentStatus === "session_failed") {
    heading = "Payment was not started";
    detail = "Nothing was charged. You can return to checkout and try again.";
  } else if (cancelled) {
    heading = "Payment cancelled";
    detail = "Nothing was charged and your bag is unchanged.";
  } else {
    heading = "Waiting for payment confirmation";
    detail =
      "We have not received confirmation from PayMongo yet. This page only shows a payment once it is verified.";
  }

  return (
    <div
      className={panel}
      data-testid="order-result"
      data-payment-status={status.paymentStatus}
      data-store-notified={status.storeNotified === null ? undefined : String(status.storeNotified)}
    >
      <h2 className="font-heading text-2xl font-medium text-cream" role="status">
        {heading}
      </h2>
      {detail ? <p className="leading-relaxed text-sage-muted">{detail}</p> : null}
      <dl className="flex flex-col gap-2">
        <div className="flex justify-between gap-4">
          <dt className="text-sage-muted">Reference</dt>
          <dd className="text-cream">{status.reference}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-sage-muted">{status.shippingMinor === null ? "Total (before delivery)" : "Total"}</dt>
          <dd className="text-cream">{formatMoney(status.totalMinor)}</dd>
        </div>
      </dl>
      <div className="flex flex-wrap gap-3">
        {(status.paymentMethod === "online" && status.paymentStatus === "awaiting_payment" && !cancelled) ||
        (status.paymentMethod === "cod" && !status.storeNotified) ? (
          <Button variant="quiet" size="cta" onClick={() => void load()}>
            Check again
          </Button>
        ) : null}
        {status.paymentMethod === "online" && status.paymentStatus !== "paid" ? (
          <Button variant="quiet" size="cta" href="/checkout">
            Back to checkout
          </Button>
        ) : null}
        <Button variant="primary" size="cta" href="/shop">
          Continue shopping
        </Button>
      </div>
    </div>
  );
}
