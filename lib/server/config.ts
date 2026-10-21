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
export type SheetsConfig = {
  spreadsheetId: string;
  testTab: string;
  liveTab: string | null;
  clientEmail: string;
  privateKey: string;
};

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

export function readSheetsConfig(env: Env, issues: string[]): SheetsConfig | null {
  const spreadsheetId = env.GOOGLE_SHEETS_SPREADSHEET_ID?.trim();
  const clientEmail = env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const privateKey = env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();
  if (!spreadsheetId || !clientEmail || !privateKey) {
    issues.push(
      "The order sheet is not configured (GOOGLE_SHEETS_SPREADSHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY); cash-on-delivery orders are kept in the database until it is.",
    );
    return null;
  }
  return {
    spreadsheetId,
    clientEmail,
    privateKey,
    testTab: env.GOOGLE_SHEETS_TEST_TAB?.trim() || "Test orders",
    liveTab: env.GOOGLE_SHEETS_LIVE_TAB?.trim() || null,
  };
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
