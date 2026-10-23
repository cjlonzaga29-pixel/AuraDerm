import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/site/LegalPage";
import { resolveCheckoutConfig } from "@/lib/server/config";

export const metadata: Metadata = {
  title: "Privacy Policy · AuraDerm Botanicals",
};

// Every statement here describes the code as built: the bag in localStorage
// (context/CartContext), the test checkout (lib/server, docs/checkout-setup.md)
// and its server-only configuration. The checkout status line comes from the
// same configuration the checkout page uses, so it cannot drift from it.
export default function PrivacyPage() {
  const config = resolveCheckoutConfig();
  const checkoutOn = config.mode === "test";
  const onlineOn = checkoutOn && config.paymongo !== null;

  return (
    <LegalPage
      title="Privacy Policy"
      draftNotice={
        <>
          <strong className="font-medium text-gold">Preview policy.</strong> This website is a design
          preview of the AuraDerm Botanicals store. This policy describes how the site works today. It
          will be completed with the business&rsquo;s registered details and a privacy contact, and
          reviewed, before the store accepts real orders.
        </>
      }
      intro={
        <p>
          This policy explains what information this website handles, where it goes and why. In short:
          browsing the site does not require you to share any personal information, and your bag is
          kept in your own browser.
        </p>
      }
    >
      <LegalSection id="current-status" title="Checkout status on this website">
        {checkoutOn ? (
          <p>
            A <strong>test checkout</strong> is switched on. It records test orders only: prices are
            sample prices, no real-money payment is taken and test orders are not sales. Please do not
            enter details you do not want stored while the store is in testing.
          </p>
        ) : (
          <p>
            <strong>Checkout is switched off on this website.</strong> No order, contact or delivery
            details can be submitted, so none are collected. The sections below on checkout describe
            how information would be handled once checkout is switched on.
          </p>
        )}
      </LegalSection>

      <LegalSection id="information-you-provide" title="Information you provide">
        <p>
          You can browse the website, read product information and use the bag without giving us any
          personal information. There are no accounts, sign-up forms or newsletter forms.
        </p>
        <p>When checkout is switched on, placing an order asks for:</p>
        <ul>
          <li>the recipient&rsquo;s full name, a Philippine mobile number and an email address;</li>
          <li>
            a delivery address (house number and street, barangay, city or municipality, province and,
            optionally, postal code) and any delivery notes you add;
          </li>
          <li>the products and quantities you are ordering, and whether you choose online payment or cash on delivery.</li>
        </ul>
      </LegalSection>

      <LegalSection id="bag-and-browser-storage" title="Your bag and browser storage">
        <p>
          The contents of your bag (product, quantity and the price shown) are saved in your
          browser&rsquo;s local storage so they are still there when you return. They are not sent to us
          while you browse. You can remove them by emptying the bag or clearing this site&rsquo;s data
          in your browser.
        </p>
        <p>
          During an online test payment, the order reference is held briefly in your browser&rsquo;s
          session storage so the bag can be emptied once payment is confirmed. It is removed when the
          order page confirms payment, and your browser clears it when you close the tab.
        </p>
      </LegalSection>

      <LegalSection id="cookies-and-analytics" title="Cookies and analytics">
        <p>
          This website does not set its own cookies and does not use analytics, advertising or
          social-media tracking tools. Fonts are served from this website rather than loaded from a
          third party.
        </p>
      </LegalSection>

      <LegalSection id="how-information-is-used" title="How information is used">
        <p>Order information, when checkout is on, is used to:</p>
        <ul>
          <li>record the order and calculate its price on our server from the current catalog;</li>
          <li>take online payment through our payment provider, or record a cash-on-delivery order;</li>
          <li>show you the status of your order on its confirmation page;</li>
          <li>prepare and arrange delivery of the order.</li>
        </ul>
        <p>
          To protect the checkout from repeated automated submissions, the server keeps a one-way coded
          form of the connecting IP address with each order and uses it only to limit how often orders
          can be placed. The IP address itself is not stored with the order.
        </p>
        <p>Your information is not sold and is not used for advertising.</p>
      </LegalSection>

      <LegalSection id="service-providers" title="Hosting and service providers">
        <p>
          <strong>Vercel</strong> hosts this website. Like any web host, it processes technical
          information needed to deliver and protect the site, such as your IP address, browser type
          and the pages requested.
        </p>
        <p>
          The following services are used only by the checkout. Their status on this website at the
          time of this update is shown with each.
        </p>
        <ul>
          <li>
            <strong>Supabase</strong> (order database) stores orders, including the details listed
            above, and records of payment confirmations.{" "}
            {checkoutOn ? "In use for test orders." : "Not in use while checkout is switched off."}
          </li>
          <li>
            <strong>PayMongo</strong> (online payments) runs the payment page for online orders. We send
            it the order reference, the products, quantities and amounts; you enter payment details on
            PayMongo&rsquo;s own page, under its own privacy policy, and we do not receive or store your
            card or e-wallet details. Only PayMongo&rsquo;s test mode is supported, so no real-money
            payment can be taken.{" "}
            {onlineOn ? "Test mode is in use." : "Not in use on this website at present."}
          </li>
          <li>
            <strong>Google Sheets</strong> (cash-on-delivery orders) receives a copy of each
            cash-on-delivery order — reference, date, name, mobile number, email, delivery address and
            notes, items, totals and status — through a Google Apps Script run by the store owner, in a
            private spreadsheet the owner controls, so the order can be confirmed and delivered.{" "}
            {checkoutOn && config.sheets
              ? "In use for test orders."
              : "Not in use on this website at present; any cash-on-delivery order stays in the order database."}
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="security" title="Security">
        <ul>
          <li>Connections to this website are encrypted (HTTPS).</li>
          <li>
            Keys for the database, payment provider and spreadsheet are kept on the server and are never
            sent to your browser.
          </li>
          <li>
            The order database is not publicly accessible; only the website&rsquo;s server can read or
            write orders.
          </li>
          <li>
            An order&rsquo;s status can be viewed only with the private link given when the order is
            placed.
          </li>
          <li>Customer details are kept out of the website&rsquo;s logs.</li>
        </ul>
        <p>No system is perfectly secure, but these measures limit who can reach your information.</p>
      </LegalSection>

      <LegalSection id="retention" title="How long information is kept">
        <p>
          Your bag stays in your browser until you empty it or clear the site&rsquo;s data. Order records
          are kept for as long as they are needed to complete, deliver and account for the order. A
          specific retention period has not been set yet; it will be stated here before the store accepts
          real orders. Order records are not deleted automatically at present.
        </p>
      </LegalSection>

      <LegalSection id="your-requests" title="Requests about your information">
        <p>
          You may ask to know what information is held about you, to have it corrected, or to have it
          deleted where it is no longer needed. A contact for these requests has not been published yet
          and will be added to this page before the store accepts real orders. While checkout is switched
          off, this website holds no personal information about visitors.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="Changes to this policy">
        <p>
          This policy will be updated as the store develops — in particular before live checkout opens.
          The date at the top of this page shows when it last changed. See also our{" "}
          <Link href="/terms">Terms &amp; Conditions</Link>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
