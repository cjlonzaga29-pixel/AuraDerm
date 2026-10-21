import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CheckoutForm, type PublicCheckoutStatus } from "@/components/checkout/CheckoutForm";
import { CartProvider } from "@/context/CartContext";

// Static rendering has no App Router mounted.
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const OFF: PublicCheckoutStatus = {
  mode: "disabled",
  onlineAvailable: false,
  codAvailable: false,
  shippingConfigured: false,
  issues: [],
};
const TEST: PublicCheckoutStatus = { ...OFF, mode: "test", onlineAvailable: true, codAvailable: true };

// Buy now renders the form on the server (the bag is not needed for it).
const render = (status: PublicCheckoutStatus) =>
  renderToStaticMarkup(
    <CartProvider>
      <CheckoutForm status={status} buyNow={{ handle: "hair-fall-defense-shampoo", quantity: 1 }} />
    </CartProvider>,
  );

describe("CheckoutForm states", () => {
  it("checkout off: one banner before the form, fields previewable, submission and payment disabled", () => {
    const html = render(OFF);
    expect(html.indexOf("Checkout is not open yet")).toBeLessThan(html.indexOf("<form"));
    expect(html).toContain("Orders cannot be submitted on this site yet.");
    expect(html).toContain("Delivery pricing is not configured yet");
    expect(html).not.toContain("Test checkout: sample prices");
    // Fields are live for preview: the fieldset is only disabled while submitting.
    expect(html).not.toMatch(/<fieldset[^>]*disabled/);
    expect(html).toMatch(/id="checkout-fullName"[^>]*autoComplete="name"|autoComplete="name"[^>]*id="checkout-fullName"/);
    expect(html.match(/Unavailable while checkout is off\./g)).toHaveLength(2);
    expect(html).toContain("Checkout unavailable");
    expect(html).toMatch(/<button[^>]*disabled[^>]*data-testid="place-test-order"/);
    // No acknowledgement is asked for when nothing can be submitted.
    expect(html).not.toContain('id="checkout-ack"');
    expect(html).not.toMatch(/\bFree\b/);
  });

  it("test mode: states sample prices, no charge and no fulfilment, and requires the acknowledgement", () => {
    const html = render(TEST);
    expect(html).toContain("Test checkout: sample prices, no real charge");
    expect(html).toContain("No real money is charged and no order is fulfilled");
    expect(html).not.toContain("Checkout is not open yet");
    expect(html).toContain('id="checkout-ack"');
    expect(html).toContain("Tick the test-order confirmation to continue.");
    expect(html).toContain("Continue to test payment");
    expect(html).not.toContain("Unavailable");
    // Loading state carries explicit text with the spinner.
    expect(html).toContain("Calculating your total…");
  });

  it("test mode without online payment keeps the method visible with its reason", () => {
    const html = render({ ...TEST, onlineAvailable: false });
    expect(html).toContain("Online test payment is not available right now.");
    expect(html).toContain("Unavailable: online test payment is not set up right now.");
    expect(html).toContain("Place test order");
  });

  it("delivery configured: no before-delivery note", () => {
    const html = render({ ...TEST, shippingConfigured: true });
    expect(html).not.toContain("Delivery pricing is not configured");
  });
});
