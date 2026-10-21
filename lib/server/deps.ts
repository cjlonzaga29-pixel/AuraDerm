import "server-only";
import { resolveCheckoutConfig } from "@/lib/server/config";
import { SupabaseOrderRepository } from "@/lib/server/repository";
import { HttpPayMongoClient } from "@/lib/server/paymongo";
import { GoogleSheetsClient } from "@/lib/server/sheets";
import type { CheckoutDeps } from "@/lib/server/checkout";

// Builds real adapters from environment configuration. Anything not
// configured stays null and the services report it as unavailable.
export function checkoutDeps(): CheckoutDeps {
  const config = resolveCheckoutConfig();
  return {
    config,
    repo: config.supabase ? new SupabaseOrderRepository(config.supabase) : null,
    paymongo: config.paymongo ? new HttpPayMongoClient(config.paymongo) : null,
    sheets: config.sheets ? new GoogleSheetsClient(config.sheets) : null,
    log: (message) => console.warn(message),
  };
}

export function clientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || null;
}

const MAX_BODY_BYTES = 16_384;

/** Reads a JSON body with a size cap; null when missing, too large or invalid. */
export async function readJson(request: Request): Promise<unknown | null> {
  const text = await request.text();
  if (text.length === 0 || text.length > MAX_BODY_BYTES) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
