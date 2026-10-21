import type { Metadata } from "next";
import { Nav } from "@/components/site/Nav";
import { Container } from "@/components/ui/Container";
import { OrderResult } from "@/components/checkout/OrderResult";

export const metadata: Metadata = {
  title: "Order status · AuraDerm Botanicals",
};

// Landing page after checkout or a PayMongo redirect. Arriving here proves
// nothing: the status shown is always read from the server.
export default async function CheckoutResultPage(props: PageProps<"/checkout/result">) {
  const searchParams = await props.searchParams;
  const ref = typeof searchParams.ref === "string" ? searchParams.ref : null;
  const token = typeof searchParams.token === "string" ? searchParams.token : null;
  const cancelled = searchParams.cancelled === "1";

  return (
    <>
      <Nav variant="page" />
      <main className="flex-1 pt-24 pb-24 lg:pt-32 lg:pb-32">
        <Container>
          <div className="mx-auto flex max-w-2xl flex-col gap-6">
            <h1 className="font-heading text-[2.5rem] leading-[1.05] font-medium tracking-[-0.02em] text-cream sm:text-[3rem]">
              Order status
            </h1>
            <OrderResult reference={ref} token={token} cancelled={cancelled} />
          </div>
        </Container>
      </main>
    </>
  );
}
