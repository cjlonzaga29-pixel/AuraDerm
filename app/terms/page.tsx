import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/site/LegalPage";
import { resolveCheckoutConfig } from "@/lib/server/config";

export const metadata: Metadata = {
  title: "Terms & Conditions · AuraDerm Botanicals",
};

// Terms for the preview store as built: sample prices, illustrative packaging
// and a checkout that is off or test-only (lib/server/config). No shipping,
// refund, governing-law or liability terms are stated until the owner
// confirms them.
export default function TermsPage() {
  const checkoutOn = resolveCheckoutConfig().mode === "test";

  return (
    <LegalPage
      title="Terms & Conditions"
      draftNotice={
        <>
          <strong className="font-medium text-gold">Preview terms.</strong> These terms cover the
          website as a design preview. Terms of sale — including delivery, returns and refunds — will be
          added and reviewed before the store accepts real orders.
        </>
      }
      intro={
        <p>
          These terms apply when you use the AuraDerm Botanicals website. Please read them together with
          our <Link href="/privacy">Privacy Policy</Link>. By using the website you agree to use it as
          described here.
        </p>
      }
    >
      <LegalSection id="the-website" title="About this website">
        <p>
          This website presents the AuraDerm Botanicals hair and scalp care range. It is currently a
          design preview of the store: you can browse products, read product information and try the bag,
          but the store is not yet selling products.
        </p>
      </LegalSection>

      <LegalSection id="product-information" title="Product information">
        <p>
          We aim to describe each product accurately, including its ingredients, directions and
          cautions. Always read the label on the product you use, and follow its directions and cautions.
          Product information on this website is general and is not medical advice; if you have a scalp
          condition or concern, speak to a qualified health professional.
        </p>
        <p>
          Net contents are not shown yet because they have not been confirmed, and product details may be
          updated before the store opens.
        </p>
      </LegalSection>

      <LegalSection id="packaging-and-prices" title="Illustrative packaging and sample prices">
        <ul>
          <li>
            Product images show <strong>illustrative packaging</strong>. They are design visuals, not
            photographs of the final products, and the final packaging may differ.
          </li>
          <li>
            Prices shown in the shop are <strong>sample prices</strong>, labelled as such, used only to
            test the bag. They are not retail prices or offers to sell at that price.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="bag-and-checkout" title="Bag and checkout">
        <p>
          The bag lets you see how an order would come together. Adding products to it does not reserve
          stock or create an order.
        </p>
        {checkoutOn ? (
          <p>
            A <strong>test checkout</strong> is switched on for testing the ordering process. Online
            payments run in the payment provider&rsquo;s test mode, so no real money is taken, and test
            orders — online or cash on delivery — are not purchases. A test order does not create a sale
            and will not be charged.
          </p>
        ) : (
          <p>
            <strong>Checkout is switched off</strong>, so orders cannot be placed and no payment can be
            made on this website.
          </p>
        )}
        <p>
          Delivery pricing has not been set, and no delivery, return or refund terms apply yet because no
          sales are being made.
        </p>
      </LegalSection>

      <LegalSection id="future-orders" title="Future orders">
        <p>
          When the store opens, orders will be subject to the confirmed retail prices, delivery charges
          and store policies shown at that time. Those terms of sale will be published on this website
          before any real order can be placed, and will not take away any rights you have under consumer
          law.
        </p>
      </LegalSection>

      <LegalSection id="intellectual-property" title="Intellectual property">
        <p>
          The AuraDerm Botanicals name, logo, product names, images, text and website design belong to
          AuraDerm Botanicals or are used with permission. You may view and share pages of this website
          for personal, non-commercial purposes, but please do not copy, modify or reuse its content or
          branding without permission.
        </p>
      </LegalSection>

      <LegalSection id="acceptable-use" title="Acceptable use">
        <p>When using this website, please do not:</p>
        <ul>
          <li>attempt to interfere with its operation, security or checkout;</li>
          <li>submit false orders or other people&rsquo;s details;</li>
          <li>use automated tools to place orders or collect its content in bulk;</li>
          <li>use it in any unlawful way.</li>
        </ul>
      </LegalSection>

      <LegalSection id="changes" title="Changes to these terms">
        <p>
          These terms will be updated as the store develops — in particular before live checkout opens.
          The date at the top of this page shows when they last changed. Changes apply from the date they
          are published here.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
