"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, FlaskConical, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCart } from "@/hooks/useCart";
import { formatMoney } from "@/lib/money";
import { validateCustomer, type CustomerField, type FieldErrors, type PaymentMethod } from "@/lib/checkout/customer";
import type { PricedLine } from "@/lib/checkout/pricing";

export type PublicCheckoutStatus = {
  mode: "test" | "disabled";
  onlineAvailable: boolean;
  codAvailable: boolean;
  shippingConfigured: boolean;
  issues: string[];
};

type Quote = {
  lines: PricedLine[];
  subtotalMinor: number;
  shippingMinor: number | null;
  totalMinor: number;
  usesSamplePrices: boolean;
};

type QuoteState = { kind: "idle" } | { kind: "loading" } | { kind: "error"; message: string } | { kind: "ready"; quote: Quote };

type SubmitError = { message: string; reference?: string };

// Stored while a bag-sourced online payment is in progress, so the result page
// clears the bag only once that order is confirmed paid.
export const PENDING_BAG_ORDER_KEY = "auraderm_pending_bag_order";

const FIELDS: { name: CustomerField; label: string; autoComplete: string; type?: string; optional?: boolean; inputMode?: "tel" | "email" | "numeric" }[] = [
  { name: "fullName", label: "Full name", autoComplete: "name" },
  { name: "phone", label: "Mobile number", autoComplete: "tel", type: "tel", inputMode: "tel" },
  { name: "email", label: "Email", autoComplete: "email", type: "email", inputMode: "email" },
  { name: "line1", label: "House no., street, building", autoComplete: "address-line1" },
  { name: "barangay", label: "Barangay", autoComplete: "address-line2" },
  { name: "city", label: "City / municipality", autoComplete: "address-level2" },
  { name: "province", label: "Province", autoComplete: "address-level1" },
  { name: "postalCode", label: "Postal code", autoComplete: "postal-code", optional: true, inputMode: "numeric" },
];

const inputClass =
  "h-11 border-glass-border bg-glass-inset text-base text-cream placeholder:text-sage-muted/60 md:text-base";

const noopSubscribe = () => () => {};

const newKey = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;

export function CheckoutForm({
  status,
  buyNow,
}: {
  status: PublicCheckoutStatus;
  buyNow: { handle: string; quantity: number } | null;
}) {
  const router = useRouter();
  const { items, clearCart } = useCart();
  // The bag is restored from storage after hydration; until then it is unknown.
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const enabled = status.mode === "test";

  const lines = useMemo(
    () => (buyNow ? [buyNow] : items.map((item) => ({ handle: item.handle, quantity: item.quantity }))),
    [buyNow, items],
  );
  const linesKey = JSON.stringify(lines);

  const [quote, setQuote] = useState<QuoteState>({ kind: "idle" });
  const [values, setValues] = useState<Record<CustomerField, string>>({
    fullName: "",
    phone: "",
    email: "",
    line1: "",
    barangay: "",
    city: "",
    province: "",
    postalCode: "",
    notes: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [method, setMethod] = useState<PaymentMethod>(status.onlineAvailable ? "online" : "cod");
  const [acknowledged, setAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<SubmitError | null>(null);
  const attempt = useRef<{ signature: string; key: string } | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  const loadQuote = useCallback(async () => {
    const parsed = JSON.parse(linesKey) as { handle: string; quantity: number }[];
    if (parsed.length === 0) {
      setQuote({ kind: "idle" });
      return;
    }
    setQuote({ kind: "loading" });
    try {
      const response = await fetch("/api/checkout/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines: parsed }),
      });
      const body = await response.json();
      if (!response.ok || !body.ok) {
        setQuote({ kind: "error", message: body.message ?? "Your order summary could not be calculated." });
        return;
      }
      setQuote({ kind: "ready", quote: body as Quote });
    } catch {
      setQuote({ kind: "error", message: "Your order summary could not be loaded. Check your connection and try again." });
    }
  }, [linesKey]);

  useEffect(() => {
    // Fetching the server quote is the external sync this effect exists for.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadQuote();
  }, [loadQuote]);

  useEffect(() => {
    if (submitError) errorRef.current?.focus();
  }, [submitError]);

  const update = (field: CustomerField, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const customerPayload = () => ({
    fullName: values.fullName,
    phone: values.phone,
    email: values.email,
    address: {
      line1: values.line1,
      barangay: values.barangay,
      city: values.city,
      province: values.province,
      postalCode: values.postalCode,
      notes: values.notes,
    },
  });

  const canSubmit = enabled && quote.kind === "ready" && acknowledged && !submitting && (method === "cod" || status.onlineAvailable);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit || quote.kind !== "ready") return;
    setSubmitError(null);

    const check = validateCustomer(customerPayload());
    if (!check.ok) {
      setErrors(check.errors);
      const first = FIELDS.find((f) => check.errors[f.name])?.name ?? "notes";
      document.getElementById(`checkout-${first}`)?.focus();
      return;
    }

    // The same attempt (same items, details and method) reuses its key, so a
    // retry after a lost response cannot create a second order.
    const customer = customerPayload();
    const signature = JSON.stringify([linesKey, customer, method]);
    if (attempt.current?.signature !== signature) attempt.current = { signature, key: newKey() };

    setSubmitting(true);
    try {
      const response = await fetch("/api/checkout/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: attempt.current.key,
          acknowledgeTestMode: true,
          paymentMethod: method,
          lines,
          expectedSubtotalMinor: quote.quote.subtotalMinor,
          customer,
        }),
      });
      let body: Record<string, unknown> = {};
      try {
        body = await response.json();
      } catch {
        // Fall through to the generic message.
      }

      if (!response.ok || body.ok !== true) {
        if (body.error === "invalid_customer" && body.fieldErrors) setErrors(body.fieldErrors as FieldErrors);
        if (body.error === "price_changed") void loadQuote();
        setSubmitError({
          message: typeof body.message === "string" ? body.message : "Your order could not be placed. Please try again.",
          reference: typeof body.reference === "string" ? body.reference : undefined,
        });
        setSubmitting(false);
        return;
      }

      const reference = String(body.reference);
      const token = String(body.token);
      const resultUrl = `/checkout/result?${new URLSearchParams({ ref: reference, token })}`;

      if (body.next === "redirect" && typeof body.checkoutUrl === "string") {
        // Bag stays as it is until payment is confirmed on the result page.
        if (!buyNow) {
          try {
            sessionStorage.setItem(PENDING_BAG_ORDER_KEY, reference);
          } catch {
            // Without storage the bag is simply kept.
          }
        }
        window.location.assign(body.checkoutUrl);
        return;
      }

      // A COD order is durably recorded at this point: the bag it came from
      // can be emptied. Buy now never touches the bag.
      if (!buyNow && method === "cod") clearCart();
      router.push(resultUrl);
    } catch {
      setSubmitError({ message: "We could not reach the store. Nothing was placed; please try again." });
      setSubmitting(false);
    }
  };

  if (!buyNow && !hydrated) {
    return (
      <p role="status" className="flex items-center gap-2 font-sans text-base text-sage-muted">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading your bag…
      </p>
    );
  }

  if (!buyNow && items.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-card border border-hairline bg-forest-panel p-6 sm:p-8">
        <p className="font-sans text-base text-cream">Your bag is empty.</p>
        <Button variant="primary" size="cta" href="/shop">
          Browse the shop
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[3fr_2fr] lg:gap-8"
      aria-describedby="test-mode-notice"
    >
      <div className="flex flex-col gap-6 lg:order-1">
        <section
          id="test-mode-notice"
          className="flex gap-3 rounded-card border border-gold/40 bg-glass-inset p-5 font-sans"
          aria-labelledby="test-mode-heading"
        >
          <FlaskConical className="mt-0.5 size-5 shrink-0 text-gold" aria-hidden="true" />
          <div className="flex flex-col gap-1.5">
            <h2 id="test-mode-heading" className="text-base font-medium text-cream">
              Test mode
            </h2>
            <p className="text-base leading-relaxed text-sage-muted">
              This checkout is for testing with sample prices. No order will be fulfilled and no real money is
              charged: online payments use PayMongo&rsquo;s test environment, and cash-on-delivery test orders are
              recorded for review only.
            </p>
          </div>
        </section>

        {status.issues.length > 0 ? (
          <div role="status" className="flex flex-col gap-1.5 rounded-card border border-hairline bg-forest-panel p-5 font-sans text-base text-sage-muted">
            {status.issues.map((issue) => (
              <p key={issue}>{issue}</p>
            ))}
          </div>
        ) : null}

        <fieldset disabled={!enabled || submitting} className="flex flex-col gap-5 rounded-card border border-hairline bg-forest-panel p-6 sm:p-8">
          <legend className="sr-only">Contact and delivery details</legend>
          <h2 className="font-heading text-2xl font-medium text-cream">Contact &amp; delivery</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {FIELDS.map((field) => {
              const id = `checkout-${field.name}`;
              const error = errors[field.name];
              const wide = field.name === "fullName" || field.name === "line1";
              return (
                <div key={field.name} className={`flex flex-col gap-2 ${wide ? "sm:col-span-2" : ""}`}>
                  <Label htmlFor={id} className="font-sans text-sm text-cream">
                    {field.label}
                    {field.optional ? <span className="font-normal text-sage-muted">(optional)</span> : null}
                  </Label>
                  <Input
                    id={id}
                    name={field.name}
                    type={field.type ?? "text"}
                    inputMode={field.inputMode}
                    autoComplete={field.autoComplete}
                    value={values[field.name]}
                    onChange={(e) => update(field.name, e.target.value)}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? `${id}-error` : undefined}
                    required={!field.optional}
                    className={inputClass}
                  />
                  {error ? (
                    <p id={`${id}-error`} className="font-sans text-sm text-gold">
                      {error}
                    </p>
                  ) : null}
                </div>
              );
            })}
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="checkout-notes" className="font-sans text-sm text-cream">
                Delivery notes <span className="font-normal text-sage-muted">(optional)</span>
              </Label>
              <Textarea
                id="checkout-notes"
                name="notes"
                rows={3}
                value={values.notes}
                onChange={(e) => update("notes", e.target.value)}
                aria-invalid={errors.notes ? true : undefined}
                aria-describedby={errors.notes ? "checkout-notes-error" : undefined}
                className="border-glass-border bg-glass-inset text-base text-cream placeholder:text-sage-muted/60 md:text-base"
              />
              {errors.notes ? (
                <p id="checkout-notes-error" className="font-sans text-sm text-gold">
                  {errors.notes}
                </p>
              ) : null}
            </div>
          </div>

          <Separator className="bg-hairline" />

          <div className="flex flex-col gap-3">
            <h2 id="payment-heading" className="font-heading text-2xl font-medium text-cream">
              Payment
            </h2>
            <RadioGroup
              value={method}
              onValueChange={(value) => setMethod(value as PaymentMethod)}
              aria-labelledby="payment-heading"
            >
              <PaymentOption
                value="online"
                title="Pay online (test)"
                description={
                  status.onlineAvailable
                    ? "Card, e-wallet or QR Ph through PayMongo's test checkout. You will be redirected to PayMongo."
                    : "Not available right now."
                }
                disabled={!status.onlineAvailable}
              />
              <PaymentOption
                value="cod"
                title="Cash on delivery (test)"
                description="Recorded as unpaid and awaiting confirmation. Nothing will be delivered for a test order."
                disabled={!status.codAvailable}
              />
            </RadioGroup>
          </div>

          <Separator className="bg-hairline" />

          <div className="flex items-start gap-3">
            <input
              id="checkout-ack"
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-1 size-4 shrink-0 accent-[var(--gold)]"
            />
            <Label htmlFor="checkout-ack" className="font-sans text-base leading-relaxed font-normal text-sage-muted">
              I understand this is a test order with sample prices: it will not be fulfilled and no real payment is
              taken.
            </Label>
          </div>
        </fieldset>
      </div>

      <aside className="flex flex-col gap-5 rounded-card border border-hairline bg-forest-panel p-6 sm:p-8 lg:sticky lg:top-28 lg:order-2" aria-labelledby="summary-heading">
        <h2 id="summary-heading" className="font-heading text-2xl font-medium text-cream">
          Order summary
        </h2>
        <OrderSummary state={quote} onRetry={loadQuote} />

        {submitError ? (
          <div
            ref={errorRef}
            tabIndex={-1}
            role="alert"
            className="flex gap-3 rounded-card border border-gold/50 bg-glass-inset p-4 font-sans text-base text-cream outline-none"
          >
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-gold" aria-hidden="true" />
            <div className="flex flex-col gap-1">
              <p>{submitError.message}</p>
              {submitError.reference ? (
                <p className="text-sm text-sage-muted">Order reference: {submitError.reference}</p>
              ) : null}
            </div>
          </div>
        ) : null}

        <Button type="submit" variant="primary" size="cta" className="w-full justify-center" disabled={!canSubmit} data-testid="place-test-order">
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Placing test order…
            </>
          ) : !enabled ? (
            "Checkout unavailable"
          ) : submitError ? (
            "Try again"
          ) : method === "online" ? (
            "Continue to test payment"
          ) : (
            "Place test order"
          )}
        </Button>
        {enabled && !acknowledged ? (
          <p className="font-sans text-sm text-sage-muted">Confirm the test-order note to continue.</p>
        ) : null}
        <Link href="/shop" className="font-sans text-sm text-cream underline decoration-gold/60 underline-offset-4 hover:text-gold">
          Continue shopping
        </Link>
      </aside>
    </form>
  );
}

function PaymentOption({
  value,
  title,
  description,
  disabled,
}: {
  value: PaymentMethod;
  title: string;
  description: string;
  disabled: boolean;
}) {
  const id = `payment-${value}`;
  return (
    <div className={`flex items-start gap-3 rounded-card border border-glass-border p-4 ${disabled ? "opacity-60" : ""}`}>
      <RadioGroupItem id={id} value={value} disabled={disabled} aria-describedby={`${id}-description`} className="mt-1 border-glass-border text-gold" />
      <div className="flex flex-col gap-1 font-sans">
        <Label htmlFor={id} className="text-base text-cream">
          {title}
        </Label>
        <p id={`${id}-description`} className="text-sm leading-relaxed text-sage-muted">
          {description}
        </p>
      </div>
    </div>
  );
}

function OrderSummary({ state, onRetry }: { state: QuoteState; onRetry: () => void }) {
  if (state.kind === "loading" || state.kind === "idle") {
    return (
      <p role="status" className="flex items-center gap-2 font-sans text-base text-sage-muted">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Calculating your total…
      </p>
    );
  }
  if (state.kind === "error") {
    return (
      <div role="alert" className="flex flex-col items-start gap-3 font-sans text-base text-cream">
        <p>{state.message}</p>
        <Button type="button" variant="quiet" size="cta" onClick={onRetry}>
          Retry
        </Button>
      </div>
    );
  }
  const { quote } = state;
  return (
    <div className="flex flex-col gap-4 font-sans" data-testid="order-summary">
      <ul className="flex flex-col gap-3">
        {quote.lines.map((line) => (
          <li key={line.handle} className="flex justify-between gap-4 text-base">
            <span className="text-cream">
              {line.name}
              <span className="block text-sm text-sage-muted">
                {line.quantity} × {formatMoney(line.unitPriceMinor)}
                {line.priceKind === "sample" ? " · Sample price" : ""}
              </span>
            </span>
            <span className="shrink-0 text-cream">{formatMoney(line.lineTotalMinor)}</span>
          </li>
        ))}
      </ul>
      <Separator className="bg-hairline" />
      <dl className="flex flex-col gap-2 text-base">
        <div className="flex justify-between gap-4">
          <dt className="text-sage-muted">Subtotal</dt>
          <dd className="text-cream" data-testid="checkout-subtotal">
            {formatMoney(quote.subtotalMinor)}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-sage-muted">Delivery</dt>
          <dd className="text-right text-cream">
            {quote.shippingMinor === null ? "Not configured" : formatMoney(quote.shippingMinor)}
          </dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-hairline pt-2">
          <dt className="text-cream">{quote.shippingMinor === null ? "Total (before delivery)" : "Total"}</dt>
          <dd className="font-medium text-cream" data-testid="checkout-total">
            {formatMoney(quote.totalMinor)}
          </dd>
        </div>
      </dl>
      {quote.shippingMinor === null ? (
        <p className="text-sm leading-relaxed text-sage-muted">
          Delivery pricing is not configured yet, so real orders cannot be placed. Test orders are recorded without a
          delivery charge.
        </p>
      ) : null}
    </div>
  );
}
