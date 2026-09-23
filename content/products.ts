import { Product } from "@/types/store";

export const PRODUCTS: Product[] = [
  {
    id: "prod_radiance_barrier_serum",
    handle: "radiance-barrier-serum",
    title: "Radiance Barrier Serum",
    subtitle: "Hydration & Botanical Barrier Support",
    description:
      "A concentrated botanical infusion designed to replenish essential moisture, enhance natural radiance, and support the skin's protective barrier with gentle, nutrient-rich plant extracts.",
    priceMinor: 149900, // ₱1,499.00
    compareAtPriceMinor: 179900,
    volume: "30 ml / 1.0 fl. oz.",
    images: [
      { src: "/stage/poster.webp", alt: "Radiance Barrier Serum glass bottle" },
    ],
    badges: ["Best Seller", "Cold-Pressed"],
    inStock: true,
    ingredients: [
      "Jojoba Seed Oil",
      "Squalane",
      "Rosehip Seed Extract",
      "Centella Asiatica Extract",
      "Camellia Sinensis Leaf Extract",
    ],
    usage:
      "Dispense 3 to 4 drops onto cleansed skin morning and evening. Gently press into face and neck until absorbed.",
  },
  {
    id: "prod_night_renewal_nectar",
    handle: "night-renewal-nectar",
    title: "Night Renewal Nectar",
    subtitle: "Overnight Nourishing Botanical Elixir",
    description:
      "A restorative evening elixir formulated with antioxidant-dense botanicals to deeply nourish, soften skin texture, and restore vitality while you rest.",
    priceMinor: 179900, // ₱1,799.00
    compareAtPriceMinor: 219900,
    volume: "50 ml / 1.7 fl. oz.",
    images: [
      { src: "/stage/poster-blur.webp", alt: "Night Renewal Nectar amber dropper bottle" },
    ],
    badges: ["Overnight Care", "Antioxidant Rich"],
    inStock: true,
    ingredients: [
      "Bakuchiol",
      "Marula Kernel Oil",
      "Evening Primrose Oil",
      "Blue Tansy Flower Oil",
      "Tocopherol",
    ],
    usage:
      "Warm 4 to 5 drops between palms and gently massage over clean face and décolletage as the final step in your evening routine.",
  },
  {
    id: "prod_botanical_cleansing_elixir",
    handle: "botanical-cleansing-elixir",
    title: "Botanical Cleansing Elixir",
    subtitle: "Gentle Oil-to-Milk Facial Cleanser",
    description:
      "A delicate, non-stripping cleanser that effortlessly melts away impurities, sunscreen, and daily buildup while maintaining the skin's delicate moisture balance.",
    priceMinor: 99900, // ₱999.00
    volume: "120 ml / 4.0 fl. oz.",
    images: [
      { src: "/stage/poster.webp", alt: "Botanical Cleansing Elixir dispenser bottle" },
    ],
    badges: ["Gentle Cleanse", "Sulfate-Free"],
    inStock: true,
    ingredients: [
      "Sunflower Seed Oil",
      "Polyglyceryl-4 Oleate",
      "Sweet Almond Oil",
      "Chamomile Flower Extract",
      "Calendula Officinalis Extract",
    ],
    usage:
      "Apply 2 to 3 pumps onto dry skin and massage gently. Add lukewarm water to emulsify into a silky milk, then rinse thoroughly.",
  },
];

export function getProductByHandle(handle: string): Product | undefined {
  return PRODUCTS.find((p) => p.handle === handle);
}
