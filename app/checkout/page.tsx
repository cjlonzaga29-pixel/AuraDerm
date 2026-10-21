import type { Metadata } from "next";
import { Nav } from "@/components/site/Nav";
import { Container } from "@/components/ui/Container";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { publicCheckoutStatus, resolveCheckoutConfig } from "@/lib/server/config";
import { MAX_LINE_QUANTITY } from "@/lib/checkout/limits";

export const metadata: Metadata = {
  title: "Checkout · AuraDerm Botanicals",
};

// Test checkout. Availability is resolved on the server from configuration;
// the browser receives only plain availability flags, never keys. "Buy now"
// arrives as ?buy=<handle>&qty=<n> and checks out that item alone, leaving
// the bag untouched.
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
      <Nav variant="page" />
      <main className="flex-1 pt-24 pb-24 lg:pt-32 lg:pb-32">
        <Container>
          <div className="mx-auto flex max-w-270 flex-col gap-8">
            <header className="flex flex-col gap-3">
              <p className="font-sans text-xs uppercase tracking-[0.2em] text-gold">
                {buyNow ? "Buy now" : "Your bag"}
              </p>
              <h1 className="font-heading text-[2.5rem] leading-[1.05] font-medium tracking-[-0.02em] text-cream sm:text-[3rem]">
                Checkout
              </h1>
            </header>
            <CheckoutForm status={status} buyNow={buyNow} />
          </div>
        </Container>
      </main>
    </>
  );
}
