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
  linkLabel: string;
  href: string;
};

export type Active = {
  badge: string;
  name: string;
  oneLiner: string;
  image: string | null;
};

export type RoutineStep = {
  slot: "AM" | "SPF REAPPLY" | "PM";
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
    eyebrow: string;
    headlineLine1: string;
    headlineLine2: string;
    accentWord: string;
    subcopy: string;
    primaryCta: { label: string; href: string };
    secondaryCta: { label: string; href: string };
    trustBadges: { label: string }[];
    featuredProductSlug: string;
  };
  statement: {
    line1: string;
    line2: string;
    accentWord: string;
    subcopy: string;
  };
  ingredientsPanel: {
    title: string;
    sideLabelLeft: string;
    sideLabelRight: string;
  };
  products: Product[];
  ingredients: Ingredient[];
  benefits: Benefit[];
  actives: Active[];
  activesIntro: {
    eyebrow: string;
    headline: string;
    accentWord: string;
    body: string;
    cta: { label: string; href: string };
  };
  routine: RoutineStep[];
  routineIntro: {
    eyebrow: string;
    headline: string;
    body: string;
  };
  sustainability: SustainabilityItem[] | null;
  givesBackHeadline: string;
  closing: {
    line1: string;
    line2: string;
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
    eyebrow: "BOTANICAL SKINCARE, REIMAGINED",
    headlineLine1: "RETURN TO",
    headlineLine2: "YOUR RITUAL.",
    accentWord: "RITUAL.",
    subcopy:
      "A quieter moment for your skin. Explore botanical-inspired textures and a simple routine designed around everyday care.",
    primaryCta: {
      label: "EXPLORE THE COLLECTION",
      href: "#ingredients",
    },
    secondaryCta: {
      label: "FIND YOUR RITUAL",
      href: "#routine",
    },
    trustBadges: [
      { label: "Concept collection" },
      { label: "Illustrative routine" },
      { label: "Design preview" },
    ],
    featuredProductSlug: "radiance-barrier-serum",
  },
  statement: {
    line1: "ROOTED IN NATURE.",
    line2: "MADE FOR YOUR EVERYDAY.",
    accentWord: "NATURE.",
    subcopy: "Thoughtful textures. Simple steps. A little space to slow down.",
  },
  ingredientsPanel: {
    title: "A BOTANICAL PALETTE",
    sideLabelLeft: "CONCEPT",
    sideLabelRight: "FIVE NOTES",
  },
  products: [
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
    {
      slug: "botanical-cleansing-elixir",
      name: "Botanical Cleansing Elixir",
      size: "120 ml / 4.0 fl. oz.",
      priceMinor: null,
      currency: null,
      shopifyHandle: null,
      shortDescription: "Concept cleanser — illustrative, not a confirmed formulation.",
    },
  ],
  ingredients: [
    { order: 1, word: "GREEN TEA", name: "Green Tea", benefit: "A fresh botanical note.", image: null },
    { order: 2, word: "ALOE", name: "Aloe", benefit: "A familiar face in everyday skincare.", image: null },
    { order: 3, word: "OAT", name: "Oat", benefit: "A soft, comforting inspiration.", image: null },
    { order: 4, word: "CHAMOMILE", name: "Chamomile", benefit: "A gentle floral touch.", image: null },
    { order: 5, word: "ROSE", name: "Rose", benefit: "A classic botanical finish.", image: null },
  ],
  benefits: [
    {
      title: "LESS, BUT THOUGHTFUL",
      body: "A focused collection that keeps your daily ritual simple.",
      linkLabel: "See the collection",
      href: "#ingredients",
    },
    {
      title: "TEXTURES TO ENJOY",
      body: "Imagine lightweight layers and a comfortable finish.",
      linkLabel: "Meet the essentials",
      href: "#actives",
    },
    {
      title: "YOUR MOMENT OF CALM",
      body: "Turn everyday skincare into a small pause in your day.",
      linkLabel: "See the ritual",
      href: "#routine",
    },
  ],
  actives: [
    { badge: "CLN", name: "Cleanse", oneLiner: "The first step of the ritual.", image: null },
    { badge: "PRP", name: "Prepare", oneLiner: "A moment to ready the skin.", image: null },
    { badge: "HYD", name: "Hydrate", oneLiner: "A lightweight layer of moisture.", image: null },
    { badge: "FIN", name: "Finish", oneLiner: "The final step, every day.", image: null },
  ],
  activesIntro: {
    eyebrow: "CONCEPT ESSENTIALS",
    headline: "MEET YOUR\nDAILY ESSENTIALS.",
    accentWord: "ESSENTIALS.",
    body: "An illustrative collection, from the first cleanse to the final layer.",
    cta: { label: "EXPLORE THE COLLECTION", href: "#ingredients" },
  },
  routine: [
    { slot: "AM", title: "CLEANSE", body: "Begin with a gentle cleanse." },
    { slot: "SPF REAPPLY", title: "LAYER", body: "Apply your preferred skincare layers." },
    { slot: "PM", title: "COMPLETE", body: "Finish your routine; use sun protection during the day." },
  ],
  routineIntro: {
    eyebrow: "THE RITUAL",
    headline: "THREE STEPS.\nONE SIMPLE RITUAL.",
    body: "A simple, illustrative routine designed around everyday care.",
  },
  sustainability: null,
  givesBackHeadline: "",
  closing: {
    line1: "MAKE SPACE",
    line2: "FOR YOURSELF.",
    subcopy: "Discover a botanical-inspired approach to your everyday routine.",
    cta: { label: "BACK TO THE COLLECTION", href: "#ingredients" },
  },
  previewNotice: "Design preview — products, ingredients and copy are illustrative.",
  social: [],
};
