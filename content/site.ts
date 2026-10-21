/** An approved photograph; dimensions are the source file's intrinsic size. */
export type MediaImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** Generated packaging mockup, not product photography; captioned as such. */
  illustrative?: boolean;
};

/**
 * A homepage image slot. Setting `image` swaps the placeholder for the photo
 * with no JSX change; `subject` describes what the photo should show and
 * labels the placeholder until then.
 */
export type MediaSlot = {
  id: string;
  subject: string;
  ratio: "4:5" | "16:9" | "3:2" | "4:3";
  image: MediaImage | null;
};

export type Product = {
  slug: string;
  name: string;
  /** Net content; null until the owner confirms it. */
  size: string | null;
  priceMinor: number | null;
  currency: "PHP" | "USD" | null;
  shopifyHandle: string | null;
  shortDescription: string;
  /** Front packshot (4:5, shown contained); null until an image is approved. */
  image: MediaImage | null;
};

export type Ingredient = {
  order: number;
  word: string;
  name: string;
  benefit: string;
  media: MediaSlot;
  /** Slugs of the products whose label lists this ingredient. */
  foundIn: string[];
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
  collectionIntro: {
    headline: string;
    body: string;
  };
  editorial: {
    headline: string;
    accentWord: string;
    body: string;
    cta: { label: string; href: string };
    media: MediaSlot;
  };
  statement: {
    headline: string;
    accentWord: string;
  };
  spotlight: {
    headline: string;
    productSlug: string;
    /** Each name must appear in that product's key-ingredient list. */
    callouts: { name: string; benefit: string }[];
    cta: { label: string; href: string };
    /** Optional dedicated shot; falls back to the product's packshot. */
    media: MediaSlot;
  };
  ingredientsIntro: {
    headline: string;
    note: string;
  };
  products: Product[];
  ingredients: Ingredient[];
  routine: RoutineStep[];
  routineIntro: {
    headline: string;
    body: string;
    media: MediaSlot;
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
  collectionIntro: {
    headline: "The collection",
    body: "Daily care for hair and scalp.",
  },
  editorial: {
    headline: "Care from scalp to strand.",
    accentWord: "strand.",
    body: "Explore cleansing, conditioning and leave-on scalp care, with ingredients selected for each step.",
    cta: { label: "Explore the routine", href: "#routine" },
    media: {
      id: "home-editorial",
      subject: "Forest stream and mossy stones in soft daylight",
      ratio: "16:9",
      image: null,
    },
  },
  statement: {
    headline: "A little care.\nFrom root to tip.",
    accentWord: "tip.",
  },
  // Callouts quote the Scalp Balance label copy in content/products.ts.
  spotlight: {
    headline: "Inside the formula",
    productSlug: "scalp-balance-daily-shampoo",
    callouts: [
      { name: "Zinc PCA", benefit: "Helps control excess oil." },
      { name: "Willow Bark", benefit: "Helps reduce visible flakes." },
      { name: "Tea Tree Oil", benefit: "For a fresh, clean-feeling scalp." },
    ],
    cta: { label: "View Scalp Balance Daily Shampoo", href: "/shop/scalp-balance-daily-shampoo" },
    media: {
      id: "home-spotlight-product",
      subject: "Scalp Balance Daily Shampoo bottle",
      ratio: "4:5",
      image: null,
    },
  },
  ingredientsIntro: {
    headline: "Botanical ingredients, thoughtfully selected.",
    note: "Ingredients vary by product.",
  },
  // Real Aura Derm hair-care range (label guide, COSMOS version). Images are
  // owner-supplied generated packaging mockups (illustrative only: their label
  // text is not a source for names, ingredients or sizes). Prices and
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
      image: {
        src: "/images/products/hair-fall-defense-shampoo-front.webp",
        alt: "Illustrative packaging: white Hair Fall Defense Shampoo pump bottle with a gold collar on a limestone plinth",
        width: 1122,
        height: 1402,
        illustrative: true,
      },
      shortDescription: "Sulfate-free daily shampoo for stronger, fuller-looking hair.",
    },
    {
      slug: "hair-fall-defense-conditioner",
      name: "Aura Derm Hair Fall Defense Conditioner",
      size: null,
      priceMinor: null,
      currency: null,
      shopifyHandle: null,
      image: {
        src: "/images/products/hair-fall-defense-conditioner-front.webp",
        alt: "Illustrative packaging: white conditioner pump bottle with a gold collar on a limestone plinth",
        width: 1122,
        height: 1402,
        illustrative: true,
      },
      shortDescription: "Silicone-free conditioner that detangles, softens and strengthens.",
    },
    {
      slug: "hair-fall-defense-scalp-vitamin-serum",
      name: "Aura Derm Hair Fall Defense Scalp Vitamin Serum",
      size: null,
      priceMinor: null,
      currency: null,
      shopifyHandle: null,
      image: {
        src: "/images/products/hair-fall-defense-scalp-vitamin-serum-front.webp",
        alt: "Illustrative packaging: emerald-to-gold glass serum bottle with a gold cap on a limestone plinth",
        width: 1122,
        height: 1402,
        illustrative: true,
      },
      shortDescription: "Lightweight leave-on scalp serum with a light peppermint cooling feel.",
    },
    {
      slug: "scalp-balance-daily-shampoo",
      name: "Aura Derm Scalp Balance Daily Shampoo",
      size: null,
      priceMinor: null,
      currency: null,
      shopifyHandle: null,
      image: {
        src: "/images/products/scalp-balance-daily-shampoo-front.webp",
        alt: "Illustrative packaging: white Scalp Balance Shampoo pump bottle with a gold collar on a limestone plinth",
        width: 1122,
        height: 1402,
        illustrative: true,
      },
      shortDescription: "Sulfate-free daily shampoo for oily or flaky scalps.",
    },
  ],
  // The three botanicals shown on the homepage strip. foundIn must match the
  // key-ingredient lists in content/products.ts (asserted in tests) so no
  // product is implied to contain them all.
  ingredients: [
    {
      order: 1,
      word: "ALOE VERA",
      name: "Aloe Vera",
      benefit: "Soothes the scalp and softens hair.",
      media: {
        id: "home-ingredient-aloe-vera",
        subject: "Aloe vera leaves",
        ratio: "3:2",
        image: null,
      },
      foundIn: ["hair-fall-defense-shampoo", "scalp-balance-daily-shampoo"],
    },
    {
      order: 2,
      word: "BATANA OIL",
      name: "Batana Oil",
      benefit: "Nourishes hair and scalp.",
      media: {
        id: "home-ingredient-batana-oil",
        subject: "Batana palm fruit and oil",
        ratio: "3:2",
        image: null,
      },
      foundIn: [
        "hair-fall-defense-shampoo",
        "hair-fall-defense-conditioner",
        "scalp-balance-daily-shampoo",
      ],
    },
    {
      order: 3,
      word: "ROSEMARY",
      name: "Rosemary",
      benefit: "Part of a botanical scalp-care complex.",
      media: {
        id: "home-ingredient-rosemary",
        subject: "Fresh rosemary sprigs",
        ratio: "3:2",
        image: null,
      },
      foundIn: ["hair-fall-defense-scalp-vitamin-serum", "scalp-balance-daily-shampoo"],
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
    media: {
      id: "home-routine",
      subject: "Hands massaging serum into the scalp",
      ratio: "4:3",
      image: null,
    },
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
