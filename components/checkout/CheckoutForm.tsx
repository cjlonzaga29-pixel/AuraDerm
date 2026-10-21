"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ChevronDown, FlaskConical, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCart } from "@/hooks/useCart";
import { formatMoney } from "@/lib/money";
import { getShopProduct } from "@/lib/catalog";
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

type FieldConfig = {
  name: CustomerField;
  label: string;
  autoComplete: string;
  type?: string;
  optional?: boolean;
  inputMode?: "tel" | "email" | "numeric" | "text";
  hint?: string;
  /** Short fields that sit beside their neighbour from sm up. */
  half?: boolean;
};

const CONTACT_FIELDS: FieldConfig[] = [
  { name: "fullName", label: "Full name", autoComplete: "name" },
  { name: "email", label: "Email", autoComplete: "email", type: "email", inputMode: "email", half: true },
  {
    name: "phone",
    label: "Mobile number",
    autoComplete: "tel",
    type: "tel",
    inputMode: "tel",
    hint: "Philippine mobile, e.g. 0917 123 4567",
    half: true,
  },
];

const ADDRESS_FIELDS: FieldConfig[] = [
  { name: "line1", label: "House no., street, building", autoComplete: "address-line1" },
  { name: "barangay", label: "Barangay", autoComplete: "address-line2", half: true },
  { name: "city", label: "City / municipality", autoComplete: "address-level2", half: true },
  { name: "province", label: "Province", autoComplete: "address-level1", half: true },
  {
    name: "postalCode",
    label: "Postal code",
    autoComplete: "postal-code",
    optional: true,
    inputMode: "numeric",
    hint: "4 digits",
    half: true,
  },
];

// Reading order, so the first invalid field is the first one a person meets.
const FIELD_ORDER: CustomerField[] = [...CONTACT_FIELDS, ...ADDRESS_FIELDS].map((f) => f.name).concat("notes");

const fieldId = (name: CustomerField) => `checkout-${name}`;

// Ivory-surface controls (tokens scoped under .checkout in globals.css): a
// visible border, a forest focus ring and short colour transitions only.
const controlClass =
  "border-(--co-field-border) bg-(--co-field) px-3.5 font-sans text-base text-(--co-ink) shadow-none transition-[border-color,box-shadow] duration-150 placeholder:text-(--co-ink-muted) hover:border-(--co-ink-muted) focus-visible:border-(--co-focus) focus-visible:ring-[3px] focus-visible:ring-(--co-focus)/25 aria-invalid:border-(--co-error) aria-invalid:ring-(--co-error)/15 disabled:opacity-60 motion-reduce:transition-none md:text-base";

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
  const { items, clearCart, openCart } = useCart();
  // The bag is restored from storage after hydration; until then it is unknown.
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const enabled = status.mode === "test";

  const lines = useMemo(
    () => (buyNow ? [buyNow] : items.map((item) => ({ handle: item.handle, quantity: item.quantity }))),
    [buyNow, items],
  );
  const linesKey = JSON.stringify(lines);

  const [quote, setQuote] = useState<QuoteState>({ kind: "idle" });
  // Held in memory only: nothing typed here is stored, so a preview while
  // checkout is off leaves no personal details behind.
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
  const [summaryOpen, setSummaryOpen] = useState(false);
  const attempt = useRef<{ signature: string; key: string } | null>(null);
  // Element to focus once the form is interactive again (the fieldset is
  // disabled while submitting, so focus waits for that to lift).
  const pendingFocus = useRef<string | null>(null);

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
    if (submitting || !pendingFocus.current) return;
    document.getElementById(pendingFocus.current)?.focus();
    pendingFocus.current = null;
  }, [submitting, errors, submitError]);

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

  const focusFirstError = (fieldErrors: FieldErrors) => {
    const first = FIELD_ORDER.find((name) => fieldErrors[name]);
    if (first) pendingFocus.current = fieldId(first);
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit || quote.kind !== "ready") return;
    setSubmitError(null);

    const check = validateCustomer(customerPayload());
    if (!check.ok) {
      focusFirstError(check.errors);
      setErrors(check.errors);
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
        const fieldErrors = body.error === "invalid_customer" && body.fieldErrors ? (body.fieldErrors as FieldErrors) : null;
        if (fieldErrors) {
          setErrors(fieldErrors);
          focusFirstError(fieldErrors);
        } else {
          pendingFocus.current = "checkout-error";
        }
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
      pendingFocus.current = "checkout-error";
      setSubmitError({ message: "We could not reach the store. Nothing was placed; please try again." });
      setSubmitting(false);
    }
  };

  if (!buyNow && !hydrated) {
    return (
      <div className="rounded-xl border border-(--co-line) bg-(--co-ivory) p-6 sm:p-8">
        <p role="status" className="flex items-center gap-2 font-sans text-base text-(--co-ink)">
          <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
          Loading your bag…
        </p>
      </div>
    );
  }

  if (!buyNow && items.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-xl border border-(--co-line) bg-(--co-ivory) p-6 sm:p-8">
        <p className="font-sans text-base text-(--co-ink)">Your bag is empty.</p>
        <Button variant="botanical" size="cta" href="/shop" className="text-sm">
          Browse the shop
        </Button>
      </div>
    );
  }

  const ready = quote.kind === "ready" ? quote.quote : null;
  const totalLabel = ready && ready.shippingMinor === null ? "Total (before delivery)" : "Total";
  const actionNote = !enabled
    ? "Orders can’t be submitted while checkout is off."
    : !acknowledged
      ? "Tick the test-order confirmation to continue."
      : null;

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <StatusBanner status={status} />

      <form
        onSubmit={onSubmit}
        noValidate
        aria-describedby="checkout-status"
        className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start lg:gap-10"
      >
        {/* One continuous ivory surface: groups are separated by space and
            hairlines, never nested cards. */}
        <div className="order-2 rounded-xl border border-(--co-line) bg-(--co-ivory) p-5 text-(--co-ink) shadow-(--co-shadow) sm:p-8 lg:order-none lg:p-10">
          <fieldset disabled={submitting} className="m-0 flex min-w-0 flex-col gap-8 border-0 p-0">
            <legend className="sr-only">Contact, delivery and payment details</legend>
            <p className="font-sans text-base text-(--co-ink-muted)">All fields are required unless marked optional.</p>

            <FormGroup id="contact" title="Contact">
              {CONTACT_FIELDS.map((field) => (
                <TextField key={field.name} field={field} value={values[field.name]} error={errors[field.name]} onChange={update} />
              ))}
            </FormGroup>

            <Separator className="bg-(--co-line)" />

            <FormGroup id="delivery" title="Delivery address">
              {ADDRESS_FIELDS.map((field) => (
                <TextField key={field.name} field={field} value={values[field.name]} error={errors[field.name]} onChange={update} />
              ))}
              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label htmlFor="checkout-notes" className="font-sans text-base font-normal text-(--co-ink-muted)">
                  Delivery notes <span className="text-(--co-ink-muted)">(optional)</span>
                </Label>
                <Textarea
                  id="checkout-notes"
                  name="notes"
                  rows={2}
                  autoComplete="off"
                  placeholder="Landmarks or gate instructions"
                  value={values.notes}
                  onChange={(e) => update("notes", e.target.value)}
                  aria-invalid={errors.notes ? true : undefined}
                  aria-describedby={errors.notes ? "checkout-notes-error" : undefined}
                  className={`min-h-20 py-2.5 ${controlClass}`}
                />
                <FieldError id="checkout-notes-error" message={errors.notes} />
              </div>
            </FormGroup>

            <Separator className="bg-(--co-line)" />

            <section aria-labelledby="payment-heading" className="flex flex-col gap-4">
              <h2 id="payment-heading" className="font-heading text-2xl font-medium text-(--co-ink)">
                Payment
              </h2>
              <RadioGroup
                value={enabled ? method : ""}
                onValueChange={(value) => setMethod(value as PaymentMethod)}
                aria-labelledby="payment-heading"
              >
                <PaymentOption
                  value="online"
                  title="Pay online (test)"
                  description={
                    status.onlineAvailable
                      ? "Card, e-wallet or QR Ph through PayMongo’s test checkout. You will be redirected to PayMongo."
                      : enabled
                        ? "Unavailable: online test payment is not set up right now."
                        : "Unavailable while checkout is off."
                  }
                  disabled={!status.onlineAvailable}
                />
                <PaymentOption
                  value="cod"
                  title="Cash on delivery (test)"
                  description={
                    status.codAvailable
                      ? "Recorded as unpaid and awaiting confirmation. Nothing will be delivered for a test order."
                      : "Unavailable while checkout is off."
                  }
                  disabled={!status.codAvailable}
                />
              </RadioGroup>

              {enabled ? (
                <div className="flex items-start gap-3 pt-2">
                  <Checkbox
                    id="checkout-ack"
                    checked={acknowledged}
                    onCheckedChange={(checked) => setAcknowledged(checked === true)}
                    className="mt-0.5 size-5 border-(--co-field-border) bg-(--co-field) transition-[background-color,border-color] duration-150 focus-visible:border-(--co-focus) focus-visible:ring-(--co-focus)/30 data-[state=checked]:border-(--co-focus) data-[state=checked]:bg-(--co-focus) data-[state=checked]:text-(--co-ivory) motion-reduce:transition-none"
                  />
                  <Label htmlFor="checkout-ack" className="block font-sans text-base leading-relaxed font-normal text-(--co-ink)">
                    I understand this is a test order with sample prices: it will not be fulfilled and no real payment
                    is taken.
                  </Label>
                </div>
              ) : null}
            </section>
          </fieldset>
        </div>

        {/* Summary and actions: one sticky column from lg; below it the wrapper
            dissolves (display: contents) so the summary sits above the form and
            the actions after it, without rendering anything twice. */}
        <div className="contents lg:flex lg:flex-col lg:gap-6 lg:rounded-xl lg:border lg:border-hairline lg:bg-forest-panel lg:p-7 lg:[@media(min-height:46rem)]:sticky lg:[@media(min-height:46rem)]:top-6">
          <section
            aria-labelledby="summary-heading"
            className="order-1 max-lg:rounded-xl max-lg:border max-lg:border-hairline max-lg:bg-forest-panel lg:order-none"
          >
            <Collapsible open={summaryOpen} onOpenChange={setSummaryOpen}>
              <h2 id="summary-heading" className="font-heading text-2xl font-medium text-cream">
                <CollapsibleTrigger className="group flex min-h-14 w-full items-center justify-between gap-4 rounded-xl px-5 py-3 text-left font-sans text-base font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden">
                  <span className="flex items-center gap-2">
                    Order summary
                    <ChevronDown
                      className="size-4 text-gold transition-transform duration-200 group-data-[state=open]:rotate-180 motion-reduce:transition-none"
                      aria-hidden="true"
                    />
                  </span>
                  <span className="font-medium tabular-nums">{ready ? formatMoney(ready.totalMinor) : "—"}</span>
                </CollapsibleTrigger>
                <span className="hidden lg:block">Order summary</span>
              </h2>
              {/* Always mounted; below lg the rows collapse to zero height (and
                  out of the accessibility tree), from lg the summary stays open
                  whatever the toggle state. The display override lifts the
                  hidden attribute Radix sets on closed content. */}
              <CollapsibleContent
                forceMount
                className="grid! grid-rows-[1fr] transition-[grid-template-rows,visibility] duration-200 data-[state=closed]:grid-rows-[0fr] data-[state=closed]:invisible motion-reduce:transition-none lg:grid-rows-[1fr]! lg:visible!"
              >
                <div className="min-h-0 overflow-hidden">
                  <div className="px-5 pt-1 pb-5 lg:px-0 lg:pt-5 lg:pb-0">
                    <OrderSummary state={quote} onRetry={loadQuote} />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </section>

          <div className="order-3 flex flex-col gap-4 max-lg:rounded-xl max-lg:border max-lg:border-hairline max-lg:bg-forest-panel max-lg:p-5 lg:order-none lg:border-t lg:border-hairline lg:pt-6">
            {ready ? (
              <p className="flex items-baseline justify-between gap-4 font-sans text-cream lg:hidden">
                <span className="text-base">{totalLabel}</span>
                <span className="text-xl font-medium tabular-nums">{formatMoney(ready.totalMinor)}</span>
              </p>
            ) : null}

            {submitError ? (
              <div
                id="checkout-error"
                tabIndex={-1}
                role="alert"
                className="flex gap-3 rounded-lg border border-gold/50 bg-glass-inset p-4 font-sans text-base text-cream outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

            <Button
              type="submit"
              variant="primary"
              size="cta"
              className="h-12 w-full justify-center gap-2 text-base duration-150 disabled:border disabled:border-glass-border disabled:bg-glass-inset disabled:text-sage-muted disabled:opacity-100 motion-reduce:transition-none"
              disabled={!canSubmit}
              aria-describedby={actionNote ? "checkout-action-note" : undefined}
              data-testid="place-test-order"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                  {method === "online" ? "Opening test payment…" : "Placing test order…"}
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
            {actionNote ? (
              <p id="checkout-action-note" className="font-sans text-base text-sage-muted">
                {actionNote}
              </p>
            ) : null}
            {buyNow ? (
              <Link
                href="/shop"
                className="self-start rounded-sm font-sans text-base text-cream underline decoration-gold/60 underline-offset-4 transition-colors duration-150 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Continue shopping
              </Link>
            ) : (
              <button
                type="button"
                onClick={openCart}
                className="self-start rounded-sm font-sans text-base text-cream underline decoration-gold/60 underline-offset-4 transition-colors duration-150 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Edit bag
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

// One banner for the server-derived state: off, test, and delivery pricing.
function StatusBanner({ status }: { status: PublicCheckoutStatus }) {
  const enabled = status.mode === "test";
  const Icon = enabled ? FlaskConical : Info;
  return (
    <section
      id="checkout-status"
      aria-labelledby="checkout-status-heading"
      className="flex gap-3 rounded-xl border border-gold/35 bg-forest-panel p-4 font-sans sm:p-5"
    >
      <Icon className="mt-0.5 size-5 shrink-0 text-gold" aria-hidden="true" />
      <div className="flex flex-col gap-1.5">
        <h2 id="checkout-status-heading" className="text-base font-medium text-cream">
          {enabled ? "Test checkout: sample prices, no real charge" : "Checkout is not open yet"}
        </h2>
        <p className="text-base leading-relaxed text-sage-muted">
          {enabled
            ? "Prices are sample prices for testing. No real money is charged and no order is fulfilled: online payment uses PayMongo’s test environment, and cash-on-delivery test orders are recorded for review only."
            : "Orders cannot be submitted on this site yet. You can review your items and the form, but nothing you enter is sent or saved."}
        </p>
        {enabled && !status.onlineAvailable ? (
          <p className="text-base leading-relaxed text-sage-muted">Online test payment is not available right now.</p>
        ) : null}
        {!status.shippingConfigured ? (
          <p className="text-base leading-relaxed text-sage-muted">
            Delivery pricing is not configured yet, so totals are shown before delivery.
          </p>
        ) : null}
      </div>
    </section>
  );
}

function FormGroup({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`${id}-heading`} className="flex flex-col gap-5">
      <h2 id={`${id}-heading`} className="font-heading text-2xl font-medium text-(--co-ink)">
        {title}
      </h2>
      <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function TextField({
  field,
  value,
  error,
  onChange,
}: {
  field: FieldConfig;
  value: string;
  error?: string;
  onChange: (field: CustomerField, value: string) => void;
}) {
  const id = fieldId(field.name);
  const describedBy = [field.hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ");
  return (
    <div className={`flex flex-col gap-2 ${field.half ? "" : "sm:col-span-2"}`}>
      <Label htmlFor={id} className="font-sans text-base font-medium text-(--co-ink)">
        {field.label}
        {field.optional ? <span className="font-normal text-(--co-ink-muted)">(optional)</span> : null}
      </Label>
      <Input
        id={id}
        name={field.name}
        type={field.type ?? "text"}
        inputMode={field.inputMode}
        autoComplete={field.autoComplete}
        value={value}
        onChange={(e) => onChange(field.name, e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        required={!field.optional}
        className={`h-12 ${controlClass}`}
      />
      {field.hint ? (
        <p id={`${id}-hint`} className="font-sans text-sm text-(--co-ink-muted)">
          {field.hint}
        </p>
      ) : null}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="flex items-start gap-1.5 font-sans text-base text-(--co-error)">
      <AlertCircle className="mt-1 size-4 shrink-0" aria-hidden="true" />
      {message}
    </p>
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
  // The whole card is the label, so it is one click target; the radio keeps
  // its own name (the title) and the reason is its description.
  return (
    <label
      htmlFor={id}
      className={`flex items-start gap-3 rounded-lg border p-4 transition-[border-color,background-color] duration-180 motion-reduce:transition-none ${
        disabled
          ? "cursor-not-allowed border-dashed border-(--co-field-border)/60 bg-transparent"
          : "cursor-pointer border-(--co-line) bg-(--co-field) hover:border-(--co-field-border) has-data-[state=checked]:border-(--co-focus) has-data-[state=checked]:bg-(--co-selected)"
      }`}
    >
      <RadioGroupItem
        id={id}
        value={value}
        disabled={disabled}
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-description`}
        className="mt-1 size-4.5 border-(--co-field-border) bg-(--co-field) text-(--co-focus) focus-visible:border-(--co-focus) focus-visible:ring-(--co-focus)/30 data-[state=checked]:border-(--co-focus)"
      />
      <span className="flex flex-col gap-1 font-sans">
        <span id={`${id}-title`} className={`text-base font-medium ${disabled ? "text-(--co-ink-muted)" : "text-(--co-ink)"}`}>
          {title}
        </span>
        <span id={`${id}-description`} className="text-base leading-relaxed text-(--co-ink-muted)">
          {description}
        </span>
      </span>
    </label>
  );
}

function OrderSummary({ state, onRetry }: { state: QuoteState; onRetry: () => void }) {
  if (state.kind === "loading" || state.kind === "idle") {
    return (
      <p role="status" className="flex items-center gap-2 font-sans text-base text-sage-muted">
        <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
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
    <div className="flex flex-col gap-5 font-sans" data-testid="order-summary">
      <ul className="flex flex-col gap-4">
        {quote.lines.map((line) => {
          const image = getShopProduct(line.handle)?.images[0];
          return (
            <li key={line.handle} className="flex items-center gap-4" data-testid="order-line">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-linen-line bg-linen">
                {image ? <Image src={image.src} alt="" fill sizes="64px" className="object-contain p-1" /> : null}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="text-base leading-snug text-cream">{line.name}</p>
                <p className="text-sm text-sage-muted">
                  Qty {line.quantity} · {formatMoney(line.unitPriceMinor)} each
                </p>
                {line.priceKind === "sample" ? <p className="text-sm text-gold">Sample price</p> : null}
              </div>
              <p className="shrink-0 self-start text-base text-cream tabular-nums">{formatMoney(line.lineTotalMinor)}</p>
            </li>
          );
        })}
      </ul>
      <dl className="flex flex-col gap-2.5 border-t border-hairline pt-4 text-base">
        <div className="flex justify-between gap-4">
          <dt className="text-sage-muted">Subtotal</dt>
          <dd className="text-cream tabular-nums" data-testid="checkout-subtotal">
            {formatMoney(quote.subtotalMinor)}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-sage-muted">Delivery</dt>
          <dd className="text-right text-sage-muted" data-testid="checkout-delivery">
            {quote.shippingMinor === null ? "Not yet available" : formatMoney(quote.shippingMinor)}
          </dd>
        </div>
        <div className="mt-1 flex items-baseline justify-between gap-4 border-t border-hairline pt-3">
          <dt className="text-cream">{quote.shippingMinor === null ? "Total (before delivery)" : "Total"}</dt>
          <dd className="text-xl font-medium text-cream tabular-nums" data-testid="checkout-total">
            {formatMoney(quote.totalMinor)}
          </dd>
        </div>
      </dl>
    </div>
  );
}
