import "server-only";

// Server-side checkout configuration, read from environment variables only.
// Nothing here is exposed to the browser: none of these names use the
// NEXT_PUBLIC_ prefix, and callers only ever pass the derived *status* (never
// a key) to client components.
//
// Checkout is off unless CHECKOUT_MODE=test. Live mode is not implemented in
// this build: CHECKOUT_MODE=live is reported as unavailable, PayMongo keys must
// be sk_test_ keys, and there is no fallback to any other key.

export const AURADERM_SUPABASE_REF = "brrydhnpwkfejehksdkn";
const AURADERM_SUPABASE_HOST = `${AURADERM_SUPABASE_REF}.supabase.co`;

export type Env = Record<string, string | undefined>;

export type SupabaseConfig = { url: string; serviceRoleKey: string };
export type PayMongoConfig = { secretKey: string; webhookSecret: string | null; paymentMethodTypes: string[] };
/** COD order log: the owner's Apps Script web app (its /exec URL) and the shared signing secret. */
export type SheetsConfig = { endpoint: string; signingSecret: string };

export type CheckoutConfig = {
  /** "test" only when explicitly enabled and the order store is reachable. */
  mode: "test" | "disabled";
  /** Human-readable reasons checkout (or a payment method) is unavailable. */
  issues: string[];
  supabase: SupabaseConfig | null;
  paymongo: PayMongoConfig | null;
  sheets: SheetsConfig | null;
  /** Delivery pricing rule; none is configured yet, so this is always null. */
  shippingMinor: number | null;
  siteUrl: string | null;
  cronSecret: string | null;
};

export const DEFAULT_PAYMENT_METHOD_TYPES = ["qrph", "card", "gcash", "paymaya"];

export function readSupabaseConfig(env: Env, issues: string[]): SupabaseConfig | null {
  const url = env.SUPABASE_URL?.trim();
  const key = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    issues.push("The order database is not configured (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).");
    return null;
  }
  let host: string;
  try {
    host = new URL(url).host;
  } catch {
    issues.push("SUPABASE_URL is not a valid URL.");
    return null;
  }
  // Only the AuraDerm project may receive orders.
  if (host !== AURADERM_SUPABASE_HOST) {
    issues.push(`SUPABASE_URL must point at the AuraDerm project (${AURADERM_SUPABASE_HOST}).`);
    return null;
  }
  return { url: `https://${AURADERM_SUPABASE_HOST}`, serviceRoleKey: key };
}

export function readPayMongoConfig(env: Env, issues: string[]): PayMongoConfig | null {
  const secretKey = env.PAYMONGO_SECRET_KEY?.trim();
  if (!secretKey) {
    issues.push("Online payment is not configured (PAYMONGO_SECRET_KEY).");
    return null;
  }
  if (!secretKey.startsWith("sk_test_")) {
    // Never use a live (or unknown) key, and never fall back to one.
    issues.push("Online payment is disabled: only a PayMongo test secret key (sk_test_…) is accepted.");
    return null;
  }
  const webhookSecret = env.PAYMONGO_WEBHOOK_SECRET?.trim() || null;
  if (!webhookSecret) {
    issues.push("Payment confirmation is not configured (PAYMONGO_WEBHOOK_SECRET).");
    return null;
  }
  const types = (env.PAYMONGO_PAYMENT_METHOD_TYPES ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  return {
    secretKey,
    webhookSecret,
    paymentMethodTypes: types.length > 0 ? types : DEFAULT_PAYMENT_METHOD_TYPES,
  };
}

export const MIN_SIGNING_SECRET_LENGTH = 32;

// Deployed web apps only: https://script.google.com/macros/s/<id>/exec, or the
// Workspace form /a/macros/<domain>/s/<id>/exec. The /dev URL only works for
// the script's editors when signed in, so it is refused.
const APPS_SCRIPT_EXEC = /^\/(?:a\/macros\/[A-Za-z0-9.-]+|macros)\/s\/[A-Za-z0-9_-]{20,}\/exec$/;

export function readSheetsConfig(env: Env, issues: string[]): SheetsConfig | null {
  const url = env.COD_SHEET_APPS_SCRIPT_URL?.trim();
  const signingSecret = env.COD_SHEET_SIGNING_SECRET?.trim();
  if (!url || !signingSecret) {
    issues.push(
      "The order sheet is not configured (COD_SHEET_APPS_SCRIPT_URL, COD_SHEET_SIGNING_SECRET); cash-on-delivery orders are kept in the database until it is.",
    );
    return null;
  }
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    issues.push("COD_SHEET_APPS_SCRIPT_URL is not a valid URL.");
    return null;
  }
  if (parsed.protocol !== "https:" || parsed.host !== "script.google.com" || parsed.search || parsed.hash) {
    issues.push("COD_SHEET_APPS_SCRIPT_URL must be a https://script.google.com web app URL with no query string.");
    return null;
  }
  if (!APPS_SCRIPT_EXEC.test(parsed.pathname)) {
    issues.push("COD_SHEET_APPS_SCRIPT_URL must be the deployed web app URL ending in /exec (not /dev).");
    return null;
  }
  if (signingSecret.length < MIN_SIGNING_SECRET_LENGTH) {
    issues.push(`COD_SHEET_SIGNING_SECRET must be at least ${MIN_SIGNING_SECRET_LENGTH} characters.`);
    return null;
  }
  return { endpoint: parsed.toString(), signingSecret };
}

export function resolveCheckoutConfig(env: Env = process.env): CheckoutConfig {
  const issues: string[] = [];
  const requested = env.CHECKOUT_MODE?.trim().toLowerCase();

  const supabase = readSupabaseConfig(env, issues);
  const paymongo = readPayMongoConfig(env, issues);
  const sheets = readSheetsConfig(env, issues);

  let mode: CheckoutConfig["mode"] = "disabled";
  if (requested === "test") {
    if (supabase) mode = "test";
  } else if (requested === "live") {
    issues.unshift("Live checkout is not enabled: retail prices, delivery pricing and store policies are not confirmed.");
  } else {
    issues.unshift("Test checkout is not enabled (CHECKOUT_MODE).");
  }

  const siteUrl = env.SITE_URL?.trim().replace(/\/+$/, "") || null;

  return {
    mode,
    issues,
    supabase,
    paymongo,
    sheets,
    shippingMinor: null,
    siteUrl,
    cronSecret: env.CRON_SECRET?.trim() || null,
  };
}

/** What the checkout page may show the browser: availability, never keys. */
export type PublicCheckoutStatus = {
  mode: "test" | "disabled";
  onlineAvailable: boolean;
  codAvailable: boolean;
  shippingConfigured: boolean;
  issues: string[];
};

// Configuration details (variable names, hosts) stay in server logs and the
// setup guide; the browser only gets plain statements.
export function publicCheckoutStatus(config: CheckoutConfig): PublicCheckoutStatus {
  const enabled = config.mode === "test";
  const onlineAvailable = enabled && config.paymongo !== null;
  const issues: string[] = [];
  if (!enabled) issues.push("Checkout is not enabled on this site yet, so orders cannot be placed.");
  else if (!onlineAvailable) issues.push("Online payment is not available in test mode right now.");
  if (config.shippingMinor === null) {
    issues.push("Delivery pricing is not configured, so real orders cannot be placed.");
  }
  return {
    mode: config.mode,
    onlineAvailable,
    codAvailable: enabled,
    shippingConfigured: config.shippingMinor !== null,
    issues,
  };
}
