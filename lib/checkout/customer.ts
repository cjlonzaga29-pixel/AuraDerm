// Customer and delivery details for checkout. Shared by the form (inline
// errors) and the server (authoritative validation); the server never trusts
// the form's result.

export type PaymentMethod = "online" | "cod";

export type DeliveryAddress = {
  line1: string;
  barangay: string;
  city: string;
  province: string;
  postalCode: string;
  notes: string;
};

export type CustomerDetails = {
  fullName: string;
  phone: string;
  email: string;
  address: DeliveryAddress;
};

export type CustomerField =
  | "fullName"
  | "phone"
  | "email"
  | "line1"
  | "barangay"
  | "city"
  | "province"
  | "postalCode"
  | "notes";

export type FieldErrors = Partial<Record<CustomerField, string>>;

const LIMITS: Record<CustomerField, number> = {
  fullName: 100,
  phone: 20,
  email: 254,
  line1: 200,
  barangay: 100,
  city: 100,
  province: 100,
  postalCode: 4,
  notes: 300,
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Strips characters that have no place in a name or address and could only
// confuse downstream tools (control characters, angle brackets).
const UNSAFE = /[\u0000-\u001f\u007f<>]/g;

const clean = (value: unknown) => (typeof value === "string" ? value.replace(UNSAFE, " ").replace(/\s+/g, " ").trim() : "");

/**
 * Philippine mobile numbers: 09XXXXXXXXX, 639XXXXXXXXX or +639XXXXXXXXX,
 * spaces and dashes allowed. Returns the +63 form, or null.
 */
export function normalizePhilippineMobile(value: string): string | null {
  const digits = value.replace(/[\s-]/g, "");
  const match = digits.match(/^(?:\+?63|0)(9\d{9})$/);
  return match ? `+63${match[1]}` : null;
}

export function validateCustomer(
  input: unknown,
): { ok: true; customer: CustomerDetails } | { ok: false; errors: FieldErrors } {
  const raw = (typeof input === "object" && input !== null ? input : {}) as Record<string, unknown>;
  const address = (typeof raw.address === "object" && raw.address !== null ? raw.address : {}) as Record<
    string,
    unknown
  >;
  const values: Record<CustomerField, string> = {
    fullName: clean(raw.fullName),
    phone: clean(raw.phone),
    email: clean(raw.email).toLowerCase(),
    line1: clean(address.line1),
    barangay: clean(address.barangay),
    city: clean(address.city),
    province: clean(address.province),
    postalCode: clean(address.postalCode),
    notes: clean(address.notes),
  };

  const errors: FieldErrors = {};
  const required: [CustomerField, string][] = [
    ["fullName", "Enter the recipient's full name."],
    ["phone", "Enter a mobile number."],
    ["email", "Enter an email address."],
    ["line1", "Enter the house number, street and building."],
    ["barangay", "Enter the barangay."],
    ["city", "Enter the city or municipality."],
    ["province", "Enter the province."],
  ];
  for (const [field, message] of required) {
    if (!values[field]) errors[field] = message;
  }
  for (const field of Object.keys(LIMITS) as CustomerField[]) {
    if (!errors[field] && values[field].length > LIMITS[field]) {
      errors[field] = `Keep this under ${LIMITS[field] + 1} characters.`;
    }
  }

  const phone = values.phone ? normalizePhilippineMobile(values.phone) : null;
  if (values.phone && !phone) errors.phone = "Enter a Philippine mobile number, e.g. 0917 123 4567.";
  if (values.email && !errors.email && !EMAIL.test(values.email)) errors.email = "Enter a valid email address.";
  if (values.postalCode && !/^\d{4}$/.test(values.postalCode)) errors.postalCode = "Postal codes have 4 digits.";

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    customer: {
      fullName: values.fullName,
      phone: phone!,
      email: values.email,
      address: {
        line1: values.line1,
        barangay: values.barangay,
        city: values.city,
        province: values.province,
        postalCode: values.postalCode,
        notes: values.notes,
      },
    },
  };
}

export function formatAddress(address: DeliveryAddress): string {
  return [address.line1, `Brgy. ${address.barangay}`, address.city, address.province, address.postalCode]
    .filter(Boolean)
    .join(", ");
}

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return value === "online" || value === "cod";
}
