// Shared by the storefront controls and the server's order validation.
export const MAX_LINE_QUANTITY = 10;
export const MAX_ORDER_LINES = 10;
export const CHECKOUT_CURRENCY = "PHP" as const;

// Per-client submission limit enforced in the database (orders per window).
export const ORDER_RATE_LIMIT = 5;
export const ORDER_RATE_WINDOW_SECONDS = 600;
