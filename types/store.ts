export interface Product {
  id: string;
  handle: string;
  title: string;
  subtitle: string;
  description: string;
  priceMinor: number; // Integer minor units (e.g. 149900 = ₱1,499.00)
  compareAtPriceMinor?: number;
  volume: string; // e.g. "50 ml / 1.7 fl. oz."
  images: { src: string; alt: string }[];
  badges?: string[];
  inStock: boolean;
  ingredients: string[];
  usage: string;
}

export interface CartItem {
  productId: string;
  handle: string;
  title: string;
  priceMinor: number;
  quantity: number; // Integer >= 1
  volume: string;
  image: string;
}

export interface ShippingAddress {
  fullName: string;
  contactNumber: string; // PH mobile format (+63 / 09...)
  streetAddress: string;
  barangayCity: string;
  province: string;
  postalCode?: string;
  notes?: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  subtotalMinor: number;
  shippingFeeMinor: number;
  totalMinor: number;
  shippingAddress: ShippingAddress;
  paymentMethod: "COD";
  status: "pending" | "confirmed" | "dispatched" | "cancelled";
  createdAt: string;
}
