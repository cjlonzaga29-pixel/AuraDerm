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
};

export type Benefit = {
  title: string;
  body: string;
};

export type RoutineStep = {
  title: string;
  body: string;
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
    headline: "Return to your ritual.",
    accentWord: "ritual.",
    subcopy:
      "A quieter moment for your skin — botanical-inspired textures and a simple routine designed around everyday care.",
    primaryCta: {
      label: "Shop now",
      href: "/shop",
    },
    secondaryCta: {
      label: "Find your ritual",
      href: "#routine",
    },
  },
  statement: {
    headline: "Rooted in nature,\nmade for your everyday.",
    accentWord: "nature,",
    subcopy: "Thoughtful textures. Simple steps. A little space to slow down.",
  },
  collectionIntro: {
    headline: "The collection",
    body: "Four hair and scalp formulas — two daily shampoos, a conditioner and a leave-on scalp serum.",
    label: "Price coming soon",
  },
  ingredientsIntro: {
    headline: "A botanical palette",
    body: "Five familiar plants that inspire the textures and scents of the collection.",
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
  ingredients: [
    { order: 1, word: "GREEN TEA", name: "Green Tea", benefit: "A fresh botanical note.", image: null },
    { order: 2, word: "ALOE", name: "Aloe", benefit: "A familiar face in everyday skincare.", image: null },
    { order: 3, word: "OAT", name: "Oat", benefit: "A soft, comforting inspiration.", image: null },
    { order: 4, word: "CHAMOMILE", name: "Chamomile", benefit: "A gentle floral touch.", image: null },
    { order: 5, word: "ROSE", name: "Rose", benefit: "A classic botanical finish.", image: null },
  ],
  // Folded into the brand statement (P3-P15) rather than a separate card row.
  benefits: [
    {
      title: "Less, but thoughtful",
      body: "A focused collection that keeps your daily ritual simple.",
    },
    {
      title: "Textures to enjoy",
      body: "Imagine lightweight layers and a comfortable finish.",
    },
    {
      title: "Your moment of calm",
      body: "Turn everyday skincare into a small pause in your day.",
    },
  ],
  routine: [
    { title: "Cleanse", body: "Begin with a gentle cleanse." },
    { title: "Layer", body: "Apply your preferred skincare layers." },
    { title: "Complete", body: "Finish your routine; use sun protection during the day." },
  ],
  routineIntro: {
    headline: "Three steps, one simple ritual.",
    body: "An illustrative routine designed around everyday care.",
  },
  sustainability: null,
  givesBackHeadline: "",
  closing: {
    headline: "Make space for yourself.",
    subcopy: "Discover a botanical-inspired approach to your everyday routine.",
    cta: { label: "Visit the shop", href: "/shop" },
  },
  previewNotice: "Design preview — prices, sizes and product photography are not yet confirmed.",
  social: [],
};
