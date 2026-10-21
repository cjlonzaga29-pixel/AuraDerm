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

/** Owner-authorized placeholder price for exercising the cart; not retail. */
export type SamplePrice = {
  priceMinor: number;
  currency: "PHP";
};

export type Product = {
  slug: string;
  name: string;
  /** Net content; null until the owner confirms it. */
  size: string | null;
  /** Confirmed retail price; null until the owner confirms it. */
  priceMinor: number | null;
  currency: "PHP" | "USD" | null;
  /**
   * Cart-testing price, always labelled "Sample price". Used only while the
   * retail price is null; checkout stays disabled either way.
   */
  samplePrice: SamplePrice | null;
  shopifyHandle: string | null;
  shortDescription: string;
  /**
   * Gallery views in display order, front view first. List only views that
   * were actually supplied — never repeat an image to fill the gallery.
   */
  images: ProductImage[];
};

/**
 * Which side of the pack an image shows. "front" may be a styled scene as
 * long as the front label faces the camera; "front-back" is a single combined
 * image (often 16:9) showing both sides.
 */
export type ProductImageView = "front" | "back" | "styled" | "front-back";

export type ProductImage = MediaImage & { view: ProductImageView };

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

/** A link under a homepage answer: a homepage anchor or a site route. */
export type HomeQuestionLink = { label: string; href: string };

/** Checkout availability as resolved on the server (lib/server/config.ts). */
export type CheckoutMode = "test" | "disabled";

/**
 * Editorial guidance drawn from the catalog and product copy. An answer that
 * depends on checkout availability carries one version per mode; the page
 * picks the one matching the configured mode so the copy never contradicts it.
 */
export type HomeQuestion = {
  question: string;
  answer: string | Record<CheckoutMode, string>;
  links?: HomeQuestionLink[];
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
  /** Display order for the homepage collection and /shop, by product slug. */
  productOrder: string[];
  ingredients: Ingredient[];
  routine: RoutineStep[];
  routineIntro: {
    headline: string;
    body: string;
    media: MediaSlot;
  };
  sustainability: SustainabilityItem[] | null;
  givesBackHeadline: string;
  questions: {
    headline: string;
    note: string;
    items: HomeQuestion[];
  };
  closing: {
    headline: string;
    subcopy: string;
    cta: { label: string; href: string };
  };
  previewNotice: string;
  social: SocialLink[];
};

// Owner-authorized sample price (PHP 1,299) so the bag can be tested end to
// end. Confirmed retail prices stay null; nothing here is a retail price.
const SAMPLE_PRICE: SamplePrice = { priceMinor: 129900, currency: "PHP" };

export const site: Site = {
  brand: "AuraDerm Botanicals",
  commerce: false,
  hero: {
    headline: "Rooted in nature. Made for your hair.",
    accentWord: "hair.",
    subcopy:
      "Explore daily cleansing, conditioning, and scalp care for softer, stronger, fuller-looking hair.",
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
    body: "Explore cleansing, conditioning, and leave-on scalp care with ingredients selected for each step.",
    cta: { label: "Explore the routine", href: "#routine" },
    media: {
      id: "home-editorial",
      subject: "Hands massaging the scalp along the part",
      ratio: "16:9",
      image: {
        src: "/images/home/scalp-to-strand.webp",
        alt: "Seen from behind, a woman massages her scalp with both hands along the part, her long dark hair falling past her shoulders",
        width: 1672,
        height: 941,
      },
    },
  },
  statement: {
    headline: "A little care.\nFrom root to tip.",
    accentWord: "tip.",
  },
  // Callouts restate the scalp serum's key-ingredient copy in content/products.ts.
  spotlight: {
    headline: "Inside the formula",
    productSlug: "hair-fall-defense-scalp-vitamin-serum",
    callouts: [
      { name: "Niacinamide", benefit: "Scalp conditioning" },
      { name: "Caffeine", benefit: "Refreshes and energizes the scalp" },
      { name: "Peppermint Oil", benefit: "A light cooling sensation" },
    ],
    cta: {
      label: "Explore the scalp serum",
      href: "/shop/hair-fall-defense-scalp-vitamin-serum",
    },
    media: {
      id: "home-spotlight-product",
      subject: "Hair Fall Defense Scalp Vitamin Serum bottle",
      ratio: "4:5",
      image: {
        src: "/images/home/spotlight-scalp-serum.webp",
        alt: "Illustrative packaging: emerald-to-gold glass serum bottle with a gold dispenser, floating above its shadow in soft green light",
        width: 1122,
        height: 1402,
        illustrative: true,
      },
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
  // packaging references say 250 mL / 50 mL — so both stay null for now
  // (each carries the labelled sample price above for cart testing).
  products: [
    {
      slug: "hair-fall-defense-shampoo",
      name: "Aura Derm Hair Fall Defense Shampoo",
      size: null,
      priceMinor: null,
      currency: null,
      samplePrice: SAMPLE_PRICE,
      shopifyHandle: null,
      images: [
        {
          view: "front",
          src: "/images/products/hair-fall-defense-shampoo-front.webp",
          alt: "Illustrative packaging: white Hair Fall Defense Shampoo pump bottle with a gold collar on a limestone plinth",
          width: 1122,
          height: 1402,
          illustrative: true,
        },
      ],
      shortDescription: "Sulfate-free daily shampoo for stronger, fuller-looking hair.",
    },
    {
      slug: "hair-fall-defense-conditioner",
      name: "Aura Derm Hair Fall Defense Conditioner",
      size: null,
      priceMinor: null,
      currency: null,
      samplePrice: SAMPLE_PRICE,
      shopifyHandle: null,
      images: [
        {
          view: "front",
          src: "/images/products/hair-fall-defense-conditioner-front.webp",
          alt: "Illustrative packaging: white conditioner pump bottle with a gold collar on a limestone plinth",
          width: 1122,
          height: 1402,
          illustrative: true,
        },
      ],
      shortDescription: "Silicone-free conditioner that detangles, softens, and strengthens.",
    },
    {
      slug: "hair-fall-defense-scalp-vitamin-serum",
      name: "Aura Derm Hair Fall Defense Scalp Vitamin Serum",
      size: null,
      priceMinor: null,
      currency: null,
      samplePrice: SAMPLE_PRICE,
      shopifyHandle: null,
      images: [
        {
          view: "front",
          src: "/images/products/hair-fall-defense-scalp-vitamin-serum-front.webp",
          alt: "Illustrative packaging: emerald-to-gold glass serum bottle with a gold cap on a limestone plinth",
          width: 1122,
          height: 1402,
          illustrative: true,
        },
      ],
      shortDescription: "Lightweight leave-on scalp serum with a light peppermint cooling feel.",
    },
    {
      slug: "scalp-balance-daily-shampoo",
      name: "Aura Derm Scalp Balance Daily Shampoo",
      size: null,
      priceMinor: null,
      currency: null,
      samplePrice: SAMPLE_PRICE,
      shopifyHandle: null,
      images: [
        {
          view: "front",
          src: "/images/products/scalp-balance-daily-shampoo-front.webp",
          alt: "Illustrative packaging: white Scalp Balance Shampoo pump bottle with a gold collar on a limestone plinth",
          width: 1122,
          height: 1402,
          illustrative: true,
        },
      ],
      shortDescription: "Sulfate-free daily shampoo for oily or flaky scalps.",
    },
  ],
  // Shampoo, conditioner, the second shampoo, then the leave-on serum last.
  productOrder: [
    "hair-fall-defense-shampoo",
    "hair-fall-defense-conditioner",
    "scalp-balance-daily-shampoo",
    "hair-fall-defense-scalp-vitamin-serum",
  ],
  // The three botanicals shown on the homepage strip. foundIn must match the
  // key-ingredient lists in content/products.ts (asserted in tests) so no
  // product is implied to contain them all.
  ingredients: [
    {
      order: 1,
      word: "ALOE VERA",
      name: "Aloe Vera",
      benefit: "Soothes the scalp and softens hair",
      media: {
        id: "home-ingredient-aloe-vera",
        subject: "Cut aloe vera leaves showing their gel",
        ratio: "3:2",
        image: {
          src: "/images/ingredients/aloe-vera.webp",
          alt: "Cut aloe vera leaves and two halved pieces showing clear gel, resting on pale limestone in soft green light",
          width: 1536,
          height: 1024,
        },
      },
      foundIn: ["hair-fall-defense-shampoo", "scalp-balance-daily-shampoo"],
    },
    {
      order: 2,
      word: "BATANA OIL",
      name: "Batana Oil",
      benefit: "Nourishes hair and scalp",
      media: {
        id: "home-ingredient-batana-oil",
        subject: "Palm fruit beside a bowl of oil",
        ratio: "3:2",
        image: {
          src: "/images/ingredients/batana-oil.webp",
          alt: "Dark red palm fruits, one halved to show orange flesh and a dark seed, beside a glass bowl of amber oil on limestone",
          width: 1536,
          height: 1024,
        },
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
      benefit: "Part of a botanical scalp-care complex",
      media: {
        id: "home-ingredient-rosemary",
        subject: "Fresh rosemary sprigs",
        ratio: "3:2",
        image: {
          src: "/images/ingredients/rosemary.webp",
          alt: "Fresh rosemary sprigs with small lavender-blue flowers lying across a limestone block",
          width: 1536,
          height: 1024,
        },
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
      subject: "Dropper applying serum along the scalp part",
      ratio: "4:3",
      image: {
        src: "/images/home/routine-scalp-serum.webp",
        alt: "Seen from behind, a woman with long dark curly hair releases a drop from a dropper onto her scalp part, her other hand resting in her hair",
        width: 1448,
        height: 1086,
      },
    },
  },
  sustainability: null,
  givesBackHeadline: "",
  // Answers restate the routine above and the product copy in
  // content/products.ts; exact usage stays on each product page.
  questions: {
    headline: "Questions & answers",
    note: "Editorial guidance based on our product directions and cautions.",
    items: [
      {
        question: "Where should I start with the routine?",
        answer:
          "Follow the three steps: cleanse with one of the two shampoos, follow with Hair Fall Defense Conditioner, then finish with the leave-on Scalp Vitamin Serum on a clean scalp. Each product’s How to use section gives its exact directions.",
        links: [
          { label: "See the routine", href: "#routine" },
          { label: "Shop the collection", href: "/shop" },
        ],
      },
      {
        question: "Which shampoo should I choose?",
        answer:
          "Hair Fall Defense Shampoo is a sulfate-free daily shampoo for stronger, fuller-looking hair. Scalp Balance Daily Shampoo is a sulfate-free daily shampoo for oily or flaky scalps. Each product page lists its key ingredients and directions.",
        links: [
          { label: "Hair Fall Defense Shampoo", href: "/shop/hair-fall-defense-shampoo" },
          { label: "Scalp Balance Daily Shampoo", href: "/shop/scalp-balance-daily-shampoo" },
        ],
      },
      {
        question: "Do I rinse out the scalp serum?",
        answer:
          "No. It is a leave-on serum: apply a few drops directly onto a clean scalp, on dry or towel-dried hair, massage gently for 1–2 minutes and do not rinse. Use it once or twice daily, and do a patch test before first use.",
        links: [
          {
            label: "Scalp Vitamin Serum: How to use",
            href: "/shop/hair-fall-defense-scalp-vitamin-serum#how-to-use",
          },
          { label: "Cautions", href: "/shop/hair-fall-defense-scalp-vitamin-serum#cautions" },
        ],
      },
      {
        question: "Where can I find ingredients and precautions?",
        answer:
          "Every product page has Key ingredients, How to use and Cautions sections. Key ingredients highlights selected ingredients; it is not a complete ingredient list.",
        links: [
          { label: "Hair Fall Defense Shampoo", href: "/shop/hair-fall-defense-shampoo#ingredients" },
          { label: "Hair Fall Defense Conditioner", href: "/shop/hair-fall-defense-conditioner#ingredients" },
          { label: "Scalp Balance Daily Shampoo", href: "/shop/scalp-balance-daily-shampoo#ingredients" },
          { label: "Scalp Vitamin Serum", href: "/shop/hair-fall-defense-scalp-vitamin-serum#ingredients" },
        ],
      },
      {
        question: "Are these the final prices and packaging?",
        answer:
          "Not yet. The prices shown are sample prices for testing the bag and checkout, not retail prices. Product images are illustrative packaging mockups, and sizes are not yet confirmed.",
      },
      {
        question: "Can I place an order?",
        answer: {
          test: "Not a real one yet. Checkout is open in test mode only: test orders use sample prices, are never fulfilled and take no real payment. Real orders will open once retail prices, delivery pricing and store policies are confirmed.",
          disabled:
            "Not yet. Checkout is not enabled on this site, so no orders can be placed and no payments are taken. Ordering will open once retail prices, delivery pricing and store policies are confirmed.",
        },
      },
    ],
  },
  closing: {
    headline: "Make space for yourself.",
    subcopy: "Explore the full hair and scalp care collection.",
    cta: { label: "Visit the shop", href: "/shop" },
  },
  previewNotice: "Design preview — prices, sizes and product photography are not yet confirmed.",
  social: [],
};
