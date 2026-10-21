import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { CheckoutFooter, CheckoutHeader } from "@/components/checkout/CheckoutChrome";
import { publicCheckoutStatus, resolveCheckoutConfig } from "@/lib/server/config";
import { MAX_LINE_QUANTITY } from "@/lib/checkout/limits";

export const metadata: Metadata = {
  title: "Checkout · AuraDerm Botanicals",
};

// Test checkout. Availability is resolved on the server from configuration;
// the browser receives only plain availability flags, never keys. "Buy now"
// arrives as ?buy=<handle>&qty=<n> and checks out that item alone, leaving
// the bag untouched. The page carries its own header and compact footer; the
// site footer is gated off this route (components/site/FooterGate).
export default async function CheckoutPage(props: PageProps<"/checkout">) {
  const searchParams = await props.searchParams;
  const buy = typeof searchParams.buy === "string" ? searchParams.buy.slice(0, 100) : null;
  const qty = typeof searchParams.qty === "string" ? Number.parseInt(searchParams.qty, 10) : 1;
  const buyNow =
    buy !== null
      ? { handle: buy, quantity: Number.isInteger(qty) ? Math.min(Math.max(qty, 1), MAX_LINE_QUANTITY) : 1 }
      : null;
  const status = publicCheckoutStatus(resolveCheckoutConfig());

  return (
    <>
      <CheckoutHeader />
      <main className="checkout flex-1 pt-8 pb-16 lg:pt-12 lg:pb-24">
        <div className="mx-auto flex max-w-290 flex-col gap-6 px-4 sm:px-6 lg:gap-8">
          <div className="flex flex-col gap-2">
            <p className="font-sans text-sm uppercase tracking-[0.18em] text-gold">
              {buyNow ? "Buy now" : "Your bag"}
            </p>
            <h1 className="font-heading text-[2.25rem] leading-[1.05] font-medium tracking-[-0.02em] text-cream sm:text-[2.75rem]">
              Checkout
            </h1>
          </div>
          <CheckoutForm status={status} buyNow={buyNow} />
        </div>
      </main>
      <CheckoutFooter />
    </>
  );
}
