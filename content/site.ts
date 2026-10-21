export type Product = {
  slug: string;
  name: string;
  /** Net content; null until the owner confirms it. */
  size: string | null;
  priceMinor: number | null;
  currency: "PHP" | "USD" | null;
  shopifyHandle: string | null;
  shortDescription: string;
};

export type Ingredient = {
  order: number;
  word: string;
  name: string;
  benefit: string;
  image: string | null;
  /** Slugs of the products whose label lists this ingredient. */
  foundIn: string[];
};

export type Benefit = {
  title: string;
  body: string;
};

/** Routine copy; a `{ slug }` segment renders as a link to that product. */
export type RoutineSegment = string | { slug: string; label: string };

export type RoutineStep = {
  title: string;
  body: RoutineSegment[];
};

export type SustainabilityItem = {
  title: string;
  body: string;
};

export type SocialLink = {
  label: string;
  href: string;
};

export type Site = {
  brand: string;
  commerce: boolean;
  hero: {
    headline: string;
    accentWord: string;
    subcopy: string;
    primaryCta: { label: string; href: string };
    secondaryCta: { label: string; href: string };
  };
  statement: {
    headline: string;
    accentWord: string;
    subcopy: string;
  };
  collectionIntro: {
    headline: string;
    body: string;
    label: string;
  };
  ingredientsIntro: {
    headline: string;
    body: string;
  };
  products: Product[];
  ingredients: Ingredient[];
  benefits: Benefit[];
  routine: RoutineStep[];
  routineIntro: {
    headline: string;
    body: string;
  };
  sustainability: SustainabilityItem[] | null;
  givesBackHeadline: string;
  closing: {
    headline: string;
    subcopy: string;
    cta: { label: string; href: string };
  };
  previewNotice: string;
  social: SocialLink[];
};

export const site: Site = {
  brand: "AuraDerm Botanicals",
  commerce: false,
  hero: {
    headline: "Rooted in nature. Made for your hair.",
    accentWord: "hair.",
    subcopy:
      "Explore daily cleansing, conditioning and scalp care for softer, stronger, fuller-looking hair.",
    primaryCta: {
      label: "Shop now",
      href: "/shop",
    },
    secondaryCta: {
      label: "Explore the routine",
      href: "#routine",
    },
  },
  statement: {
    headline: "Care from scalp to strand.",
    accentWord: "strand.",
    subcopy: "A thoughtful routine of cleansing, conditioning and leave-on scalp care.",
  },
  collectionIntro: {
    headline: "The collection",
    body: "Four hair and scalp formulas — two daily shampoos, a conditioner and a leave-on scalp serum.",
    label: "Price coming soon",
  },
  ingredientsIntro: {
    headline: "Key ingredients",
    body: "Highlights from across the range. Ingredients vary by product — each one shows where it is found.",
  },
  // Real Aura Derm hair-care range (label guide, COSMOS version). Prices and
  // net content are unconfirmed — the guide says 300 mL / 60 mL while newer
  // packaging references say 250 mL / 50 mL — so both stay null for now.
  products: [
    {
      slug: "hair-fall-defense-shampoo",
      name: "Aura Derm Hair Fall Defense Shampoo",
      size: null,
      priceMinor: null,
      currency: null,
      shopifyHandle: null,
      shortDescription: "Sulfate-free daily shampoo for stronger, fuller-looking hair.",
    },
    {
      slug: "hair-fall-defense-conditioner",
      name: "Aura Derm Hair Fall Defense Conditioner",
      size: null,
      priceMinor: null,
      currency: null,
      shopifyHandle: null,
      shortDescription: "Silicone-free conditioner that detangles, softens and strengthens.",
    },
    {
      slug: "hair-fall-defense-scalp-vitamin-serum",
      name: "Aura Derm Hair Fall Defense Scalp Vitamin Serum",
      size: null,
      priceMinor: null,
      currency: null,
      shopifyHandle: null,
      shortDescription: "Lightweight leave-on scalp serum with a light peppermint cooling feel.",
    },
    {
      slug: "scalp-balance-daily-shampoo",
      name: "Aura Derm Scalp Balance Daily Shampoo",
      size: null,
      priceMinor: null,
      currency: null,
      shopifyHandle: null,
      shortDescription: "Sulfate-free daily shampoo for oily or flaky scalps.",
    },
  ],
  // Highlights drawn from the key ingredients in content/products.ts; foundIn
  // must match those label lists so no product is implied to contain them all.
  ingredients: [
    {
      order: 1,
      word: "ALOE VERA",
      name: "Aloe Vera",
      benefit: "Soothes the scalp and softens hair.",
      image: null,
      foundIn: ["hair-fall-defense-shampoo", "scalp-balance-daily-shampoo"],
    },
    {
      order: 2,
      word: "RICE PROTEIN",
      name: "Rice Protein",
      benefit: "Helps strengthen and thicken the look of hair.",
      image: null,
      foundIn: ["hair-fall-defense-shampoo", "hair-fall-defense-conditioner"],
    },
    {
      order: 3,
      word: "BATANA OIL",
      name: "Batana Oil",
      benefit: "Nourishes hair and scalp.",
      image: null,
      foundIn: [
        "hair-fall-defense-shampoo",
        "hair-fall-defense-conditioner",
        "scalp-balance-daily-shampoo",
      ],
    },
    {
      order: 4,
      word: "ROSEMARY",
      name: "Rosemary",
      benefit: "Part of a botanical scalp-care complex.",
      image: null,
      foundIn: ["hair-fall-defense-scalp-vitamin-serum", "scalp-balance-daily-shampoo"],
    },
    {
      order: 5,
      word: "NIACINAMIDE",
      name: "Niacinamide",
      benefit: "Vitamin B3 for scalp conditioning.",
      image: null,
      foundIn: ["hair-fall-defense-scalp-vitamin-serum", "scalp-balance-daily-shampoo"],
    },
  ],
  // Folded into the brand statement (P3-P15) rather than a separate card row.
  benefits: [
    {
      title: "Gentle daily cleansing",
      body: "Two sulfate-free shampoos — one for hair fall due to breakage, one for oily or flaky scalps.",
    },
    {
      title: "Silicone-free conditioning",
      body: "A plant-based conditioner that detangles, softens and strengthens.",
    },
    {
      title: "Leave-on scalp care",
      body: "A lightweight, non-greasy serum with a light peppermint cooling feel.",
    },
  ],
  // Steps follow the label directions in content/products.ts.
  routine: [
    {
      title: "Cleanse",
      body: [
        "Choose ",
        { slug: "hair-fall-defense-shampoo", label: "Hair Fall Defense Shampoo" },
        " or ",
        { slug: "scalp-balance-daily-shampoo", label: "Scalp Balance Daily Shampoo" },
        ". Massage into wet hair and scalp to a lather, then rinse well.",
      ],
    },
    {
      title: "Condition",
      body: [
        "Follow with ",
        { slug: "hair-fall-defense-conditioner", label: "Hair Fall Defense Conditioner" },
        "; leave for 2–3 minutes and rinse.",
      ],
    },
    {
      title: "Scalp care",
      body: [
        "Apply ",
        { slug: "hair-fall-defense-scalp-vitamin-serum", label: "Scalp Vitamin Serum" },
        " to a clean scalp and massage gently. Leave on; use once or twice daily.",
      ],
    },
  ],
  routineIntro: {
    headline: "Three steps, scalp to strand.",
    body: "See each product page for full directions and cautions.",
  },
  sustainability: null,
  givesBackHeadline: "",
  closing: {
    headline: "Make space for yourself.",
    subcopy: "Explore the full hair and scalp care collection.",
    cta: { label: "Visit the shop", href: "/shop" },
  },
  previewNotice: "Design preview — prices, sizes and product photography are not yet confirmed.",
  social: [],
};
