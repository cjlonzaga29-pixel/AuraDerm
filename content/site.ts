export type Product = {
  slug: string;
  name: string;
  size: string;
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
      label: "Explore the collection",
      href: "#collection",
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
    body: "Three concept formulas, from the first cleanse to the last layer of the evening.",
    label: "Concept · not for sale",
  },
  ingredientsIntro: {
    headline: "A botanical palette",
    body: "Five familiar plants that inspire the textures and scents of the collection.",
  },
  products: [
    {
      slug: "botanical-cleansing-elixir",
      name: "Botanical Cleansing Elixir",
      size: "120 ml / 4.0 fl. oz.",
      priceMinor: null,
      currency: null,
      shopifyHandle: null,
      shortDescription: "Concept cleanser — illustrative, not a confirmed formulation.",
    },
    {
      slug: "radiance-barrier-serum",
      name: "Radiance Barrier Serum",
      size: "30 ml / 1.0 fl. oz.",
      priceMinor: null,
      currency: null,
      shopifyHandle: null,
      shortDescription: "Concept serum — illustrative, not a confirmed formulation.",
    },
    {
      slug: "night-renewal-nectar",
      name: "Night Renewal Nectar",
      size: "50 ml / 1.7 fl. oz.",
      priceMinor: null,
      currency: null,
      shopifyHandle: null,
      shortDescription: "Concept evening elixir — illustrative, not a confirmed formulation.",
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
  previewNotice: "Design preview — products, ingredients and copy are illustrative.",
  social: [],
};
