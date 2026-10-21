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
      // Owner-numbered artwork, 1 (main image) to 8. Words set in the artwork
      // (headlines, the 250 mL label, benefit and free-from tags, the sale
      // banner) describe the picture only; they are not product facts,
      // results or offers.
      images: [
        {
          view: "front",
          src: "/images/products/hair-fall-defense-shampoo-01.webp",
          alt: "Illustrative packaging: white Hair Fall Defense Shampoo pump bottle with a gold collar on a sunlit rock among ferns and rice stalks, under large “STRONG” lettering and the headline “Hair Fall Defense gentle daily shampoo”",
          width: 1254,
          height: 1254,
          illustrative: true,
        },
        {
          view: "styled",
          src: "/images/products/hair-fall-defense-shampoo-02.webp",
          alt: "Illustrative packaging: a hand presses the shampoo pump into an open palm beside the headline “Cleanse. Strengthen. fuller-looking hair” and three benefit tags",
          width: 1254,
          height: 1254,
          illustrative: true,
        },
        {
          view: "styled",
          src: "/images/products/hair-fall-defense-shampoo-03.webp",
          alt: "Illustrative packaging: miniature figures carry bark, palm fruit, rice stalks and argan nuts around the shampoo bottle, beside the headline “Powered by nature & science” and tiles naming Redensyl®, Bioran HG Factor, Batana Oil, Gugo (Entada), Rice Protein, and Aloe Vera & Argan Oil",
          width: 1254,
          height: 1254,
          illustrative: true,
        },
        {
          view: "styled",
          src: "/images/products/hair-fall-defense-shampoo-04.webp",
          alt: "Illustrative packaging: the dew-covered shampoo bottle beside a mound of white foam on a wet rock, under large “LATHER” lettering and the headline “Rich, gentle sulfate-free lather”",
          width: 1254,
          height: 1254,
          illustrative: true,
        },
        {
          view: "styled",
          src: "/images/products/hair-fall-defense-shampoo-05.webp",
          alt: "Illustrative packaging: the shampoo bottle on a rock under large “GENTLE” lettering and the headline “Made without the harsh stuff”, with round icons for sulfate-free, silicone-free, paraben-free and EDTA-free",
          width: 1254,
          height: 1254,
          illustrative: true,
        },
        {
          view: "styled",
          src: "/images/products/hair-fall-defense-shampoo-06.webp",
          alt: "Illustrative packaging: a woman wrapped in a towel lathers her dark hair under falling water, eyes closed, beside the shampoo bottle and the headline “Your daily wash ritual — massage 1–2 minutes”",
          width: 1254,
          height: 1254,
          illustrative: true,
        },
        {
          view: "styled",
          src: "/images/products/hair-fall-defense-shampoo-07.webp",
          alt: "Illustrative packaging: “How to use” steps beside the shampoo bottle — wet hair and scalp, lather and massage 1–2 minutes, rinse well and repeat if needed, follow with conditioner and serum — with icons for daily use, avoiding eye contact, the conditioner and the scalp serum",
          width: 1254,
          height: 1254,
          illustrative: true,
        },
        {
          view: "styled",
          src: "/images/products/hair-fall-defense-shampoo-08.webp",
          alt: "Illustrative packaging: the shampoo bottle on a sunlit rock under large “11.11” artwork lettering and the headline “Your hair ritual starts here”, with a sale banner",
          width: 1254,
          height: 1254,
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
      // Owner-numbered Follivance artwork, 1 (main image) to 8. Words set in
      // the artwork (headlines, the 50 mL label, the sale banner) describe the
      // picture only; they are not product facts, results or offers.
      images: [
        {
          view: "front",
          src: "/images/products/follivance-hair-density-serum-01.webp",
          alt: "Illustrative packaging: emerald-to-gold Hair Fall Defense Follivance Hair Density Serum bottle with a gold dropper, on a sunlit rock among ferns under the headline “Hairfall Defense scalp care ritual”",
          width: 1254,
          height: 1254,
          illustrative: true,
        },
        {
          view: "styled",
          src: "/images/products/follivance-hair-density-serum-02.webp",
          alt: "Illustrative packaging: a hand holds the serum bottle beside the headline “Nourish. Refresh.” and three benefit tags — nourishes the scalp, helps strengthen hair, light peppermint cooling feel",
          width: 1254,
          height: 1254,
          illustrative: true,
        },
        {
          view: "styled",
          src: "/images/products/follivance-hair-density-serum-03.webp",
          alt: "Illustrative packaging: miniature figures tend rosemary, horsetail, coffee beans and a peppermint leaf around the serum bottle, beside tiles naming Redensyl®, Bioran HG Factor, Niacinamide, Caffeine, Peppermint Oil and Botanical Complex",
          width: 1254,
          height: 1254,
          illustrative: true,
        },
        {
          view: "styled",
          src: "/images/products/follivance-hair-density-serum-04.webp",
          alt: "Illustrative packaging: the serum bottle on a rock beside clear golden droplets, with the headline “Lightweight non-greasy texture” and tags for won’t weigh hair down and leave-on, no rinse",
          width: 1254,
          height: 1254,
          illustrative: true,
        },
        {
          view: "styled",
          src: "/images/products/follivance-hair-density-serum-05.webp",
          alt: "Illustrative packaging: the dew-covered serum bottle among mint leaves, coffee beans and cool mist, with the headline “Refresh & energize with peppermint & caffeine”",
          width: 1254,
          height: 1254,
          illustrative: true,
        },
        {
          view: "styled",
          src: "/images/products/follivance-hair-density-serum-06.webp",
          alt: "Illustrative packaging: a woman with long dark hair massages her scalp with both hands, eyes closed, beside the serum bottle and the headline “Your daily scalp ritual — massage 1–2 minutes”",
          width: 1254,
          height: 1254,
          illustrative: true,
        },
        {
          view: "styled",
          src: "/images/products/follivance-hair-density-serum-07.webp",
          alt: "Illustrative packaging: “How to use” steps beside the serum bottle — start with a clean scalp, part hair and apply a few drops, massage gently 1–2 minutes, do not rinse — with icons for patch testing and avoiding the eyes",
          width: 1254,
          height: 1254,
          illustrative: true,
        },
        {
          view: "styled",
          src: "/images/products/follivance-hair-density-serum-08.webp",
          alt: "Illustrative packaging: the serum bottle on a sunlit rock under large “11.11” artwork lettering and the headline “Your scalp ritual starts here”, with a sale banner",
          width: 1254,
          height: 1254,
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
      // Owner-numbered artwork, 1 (main image) to 8. Words set in the artwork
      // (headlines, the label's anti-dandruff line, Piroctone Olamine and
      // 250 mL, benefit and free-from tags, the sale banner) describe the
      // picture only; they are not product facts, results or offers.
      images: [
        {
          view: "front",
          src: "/images/products/scalp-balance-daily-shampoo-01.webp",
          alt: "Illustrative packaging: white Scalp Balance Shampoo pump bottle with a gold collar on a sunlit rock beside cut aloe vera and tea tree sprigs, under large “BALANCE” lettering and the headline “Scalp Balance fresh daily shampoo”",
          width: 1254,
          height: 1254,
          illustrative: true,
        },
        {
          view: "styled",
          src: "/images/products/scalp-balance-daily-shampoo-02.webp",
          alt: "Illustrative packaging: one hand presses the shampoo pump into an open palm beside the headline “Fresh. Clean. balanced scalp” and three benefit tags",
          width: 1254,
          height: 1254,
          illustrative: true,
        },
        {
          view: "styled",
          src: "/images/products/scalp-balance-daily-shampoo-03.webp",
          alt: "Illustrative packaging: miniature figures carry willow bark, aloe vera, witch hazel and nuts around the shampoo bottle, beside the headline “Powered by scalp-balancing botanicals” and tiles naming Zinc PCA, Willow Bark, Tea Tree Oil, Aloe Vera, Witch Hazel (alcohol-free) and Niacinamide",
          width: 1254,
          height: 1254,
          illustrative: true,
        },
        {
          view: "styled",
          src: "/images/products/scalp-balance-daily-shampoo-04.webp",
          alt: "Illustrative packaging: the dew-covered shampoo bottle beside a mound of white foam and a tea tree sprig on a wet rock, under large “FOAM” lettering and the headline “Gentle sulfate-free cleanse”",
          width: 1254,
          height: 1254,
          illustrative: true,
        },
        {
          view: "styled",
          src: "/images/products/scalp-balance-daily-shampoo-05.webp",
          alt: "Illustrative packaging: the shampoo bottle on a rock under large “FREE” lettering and the headline “Made for oily or flaky scalps”, with round icons for sulfate-free, silicone-free, paraben-free and EDTA-free",
          width: 1254,
          height: 1254,
          illustrative: true,
        },
        {
          view: "styled",
          src: "/images/products/scalp-balance-daily-shampoo-06.webp",
          alt: "Illustrative packaging: a man with a towel around his neck lathers his dark curly hair under falling water, eyes closed, beside the shampoo bottle and the headline “A fresh balanced scalp — leave on 1–2 minutes”",
          width: 1254,
          height: 1254,
          illustrative: true,
        },
        {
          view: "styled",
          src: "/images/products/scalp-balance-daily-shampoo-07.webp",
          alt: "Illustrative packaging: “How to use” steps beside the shampoo bottle — wet hair and scalp, lather and leave on 1–2 minutes, rinse well and repeat if needed — with tiles for how often to use, oily or flaky scalps, avoiding eye contact and stopping if irritation occurs",
          width: 1254,
          height: 1254,
          illustrative: true,
        },
        {
          view: "styled",
          src: "/images/products/scalp-balance-daily-shampoo-08.webp",
          alt: "Illustrative packaging: the shampoo bottle on a sunlit rock among aloe vera and tea tree under large “11.11” artwork lettering and the headline “Your fresh scalp starts here”, with a sale banner",
          width: 1254,
          height: 1254,
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
  previewNotice:
    "Design preview: product images show illustrative packaging, and prices are samples for testing — no real orders or payments are taken yet.",
  social: [],
};
