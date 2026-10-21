// Customer-facing product details for the Aura Derm hair-care range, taken
// from the Arkana Laboratories label guide (COSMOS version formulas). Only
// label copy is published here: no formula percentages, procedures or
// stability data, and no full INCI list while supplier names are unresolved.
// Prices and net volumes are not confirmed, so neither is recorded here —
// content/site.ts holds those fields (null until the owner confirms them).

export type KeyIngredient = { name: string; benefit: string };

/** A link under an answer: an in-page section ("#how-to-use") or another product page. */
export type QuestionLink = { label: string; href: string };

/**
 * Editorial guidance written from this product's own directions, cautions and
 * description (and, for routine order, the shampoo's directions) — never
 * customer-submitted, and never a fact the label copy does not state.
 */
export type ProductQuestion = { question: string; answer: string; links?: QuestionLink[] };

export type ProductDetails = {
  handle: string;
  subtitle: string;
  description: string;
  keyIngredients: KeyIngredient[];
  directions: string[];
  cautions: string[];
  questions: ProductQuestion[];
};

const SEE_HOW_TO_USE: QuestionLink = { label: "See How to use", href: "#how-to-use" };
const SEE_CAUTIONS: QuestionLink = { label: "See all cautions", href: "#cautions" };

// The precautions answer for the products that share STANDARD_CAUTIONS;
// storage and the rest stay in the Cautions section.
const STANDARD_PRECAUTIONS: ProductQuestion = {
  question: "What precautions should I follow?",
  answer:
    "It is for external use only. Avoid contact with eyes; if contact occurs, rinse immediately and thoroughly with water. Discontinue use if irritation, redness or itching occurs.",
  links: [SEE_CAUTIONS],
};

const STANDARD_CAUTIONS = [
  "For external use only.",
  "Avoid contact with eyes. If contact occurs, rinse immediately and thoroughly with water.",
  "Discontinue use if irritation, redness or itching occurs.",
  "Keep out of reach of children.",
  "Store below 30 °C in a cool, dry place, away from direct sunlight.",
];

export const PRODUCT_DETAILS: ProductDetails[] = [
  {
    handle: "hair-fall-defense-shampoo",
    subtitle: "Sulfate-free daily shampoo for stronger, fuller-looking hair",
    description:
      "A gentle, sulfate-free daily shampoo made with amino-acid and sugar-based cleansers. Enriched with Redensyl®, Bioran HG Factor and Batana Oil to help reduce hair fall due to breakage, for stronger, fuller-looking hair.",
    keyIngredients: [
      { name: "Redensyl®", benefit: "Helps reduce hair fall due to breakage" },
      { name: "Bioran HG Factor", benefit: "Helps strengthen hair" },
      { name: "Batana Oil", benefit: "Nourishes hair and scalp" },
      { name: "Gugo (Entada) Extract", benefit: "Traditional Filipino hair-care botanical" },
      { name: "Rice Protein", benefit: "Helps strengthen and thicken the look of hair" },
      { name: "Aloe Vera & Argan Oil", benefit: "Soothe the scalp and soften hair" },
    ],
    directions: [
      "Wet hair and scalp thoroughly.",
      "Apply a small amount and massage into the scalp to a lather for 1–2 minutes.",
      "Rinse well. Repeat if needed.",
      "Follow with Hair Fall Defense Conditioner and Scalp Vitamin Serum. For daily use.",
    ],
    cautions: STANDARD_CAUTIONS,
    questions: [
      {
        question: "How do I use this shampoo?",
        answer:
          "Wet your hair and scalp thoroughly, apply a small amount and massage it into the scalp to a lather for 1–2 minutes.",
        links: [SEE_HOW_TO_USE],
      },
      {
        question: "Should I rinse it out?",
        answer: "Yes. Rinse well after massaging, and repeat if needed.",
      },
      {
        question: "How often can I use it?",
        answer: "It is made for daily use.",
      },
      {
        question: "Where does it fit in my routine?",
        answer: "It is the first step. Follow with Hair Fall Defense Conditioner, then Scalp Vitamin Serum.",
        links: [
          { label: "Hair Fall Defense Conditioner", href: "/shop/hair-fall-defense-conditioner" },
          { label: "Scalp Vitamin Serum", href: "/shop/hair-fall-defense-scalp-vitamin-serum" },
        ],
      },
      {
        question: "What kind of cleansers does it use?",
        answer: "It is sulfate-free, made with amino-acid and sugar-based cleansers.",
      },
      STANDARD_PRECAUTIONS,
    ],
  },
  {
    handle: "hair-fall-defense-conditioner",
    subtitle: "Silicone-free conditioner that detangles, softens, and strengthens",
    description:
      "A creamy, silicone-free conditioner with a plant-based conditioning system. With Redensyl®, Bioran HG Factor, Batana, Argan and Jojoba Oils and Rice Protein to detangle, soften and strengthen hair, helping reduce hair fall due to breakage.",
    keyIngredients: [
      { name: "Redensyl®", benefit: "Helps reduce hair fall due to breakage" },
      { name: "Bioran HG Factor", benefit: "Helps strengthen hair" },
      { name: "Plant-based (Brassica) conditioner", benefit: "Detangles and smooths without silicones" },
      { name: "Batana, Argan & Jojoba Oils", benefit: "Nourish and add shine" },
      { name: "Rice Protein & Betaine", benefit: "Strengthen and moisturize" },
      { name: "Vitamin E (Tocopherol)", benefit: "Antioxidant care" },
    ],
    directions: [
      "After shampooing, squeeze out excess water.",
      "Apply evenly through the hair from roots to ends.",
      "Leave on for 2–3 minutes, then rinse thoroughly.",
      "For daily use.",
    ],
    cautions: STANDARD_CAUTIONS,
    questions: [
      {
        question: "How do I apply it?",
        answer:
          "After shampooing, squeeze out excess water, then apply evenly through the hair from roots to ends.",
        links: [SEE_HOW_TO_USE],
      },
      {
        question: "How long should I leave it on?",
        answer: "Leave it on for 2–3 minutes.",
      },
      {
        question: "Should I rinse it out?",
        answer: "Yes. After 2–3 minutes, rinse thoroughly.",
      },
      {
        question: "How often can I use it?",
        answer: "It is made for daily use.",
      },
      {
        question: "Where does it fit in my routine?",
        answer:
          "It goes on after shampooing. The Hair Fall Defense Shampoo directions pair it with this conditioner, followed by the Scalp Vitamin Serum.",
        links: [
          { label: "Hair Fall Defense Shampoo", href: "/shop/hair-fall-defense-shampoo" },
          { label: "Scalp Vitamin Serum", href: "/shop/hair-fall-defense-scalp-vitamin-serum" },
        ],
      },
      STANDARD_PRECAUTIONS,
    ],
  },
  {
    handle: "hair-fall-defense-scalp-vitamin-serum",
    subtitle: "Lightweight leave-on scalp serum with a light peppermint cooling feel",
    description:
      "A lightweight, non-greasy leave-on scalp serum with Redensyl®, Bioran HG Factor, Niacinamide and Caffeine, plus a botanical complex. Nourishes and refreshes the scalp for thicker, fuller-looking hair, with a light peppermint cooling feel.",
    keyIngredients: [
      { name: "Redensyl®", benefit: "Supports a healthier-looking scalp and fuller-looking hair" },
      { name: "Bioran HG Factor", benefit: "Helps strengthen hair" },
      { name: "Niacinamide (Vitamin B3)", benefit: "Scalp conditioning" },
      { name: "Caffeine", benefit: "Refreshes and energizes the scalp" },
      { name: "Gugo, Shikakai, Horsetail, Centella, Rosemary", benefit: "Botanical scalp-care complex" },
      { name: "Peppermint Oil", benefit: "Light cooling sensation" },
    ],
    directions: [
      "Apply to a clean scalp, on dry or towel-dried hair.",
      "Part the hair and apply a few drops directly onto the scalp, especially on thinning areas.",
      "Massage gently for 1–2 minutes. Do not rinse.",
      "Use once or twice daily.",
    ],
    cautions: [
      "For external use only. For adults.",
      "Do a patch test before first use: apply a small amount behind the ear and wait 24 hours.",
      "A mild cooling sensation is normal.",
      "Avoid contact with eyes. If contact occurs, rinse immediately with water.",
      "Discontinue use if irritation occurs.",
      "Keep out of reach of children.",
      "Store below 30 °C in a cool, dry place, away from direct sunlight.",
    ],
    questions: [
      {
        question: "How do I apply the serum?",
        answer:
          "Part the hair and apply a few drops directly onto a clean scalp, especially on thinning areas, then massage gently for 1–2 minutes.",
        links: [SEE_HOW_TO_USE],
      },
      {
        question: "Should I rinse it out?",
        answer: "No. It is a leave-on serum: do not rinse.",
      },
      {
        question: "How often should I use it?",
        answer: "Use it once or twice daily.",
      },
      {
        question: "Where does it fit in my routine?",
        answer:
          "Apply it to a clean scalp, on dry or towel-dried hair. The Hair Fall Defense Shampoo directions place it after the shampoo and conditioner.",
        links: [{ label: "Hair Fall Defense Shampoo", href: "/shop/hair-fall-defense-shampoo" }],
      },
      {
        question: "What should I do before first use?",
        answer:
          "Do a patch test: apply a small amount behind the ear and wait 24 hours. The serum is for external use only, for adults.",
        links: [SEE_CAUTIONS],
      },
      {
        question: "Is the cooling feeling normal?",
        answer:
          "Yes. A mild cooling sensation is normal; the formula includes peppermint oil. Discontinue use if irritation occurs.",
        links: [SEE_CAUTIONS],
      },
    ],
  },
  {
    handle: "scalp-balance-daily-shampoo",
    subtitle: "Sulfate-free daily shampoo for oily or flaky scalps",
    description:
      "A gentle, sulfate-free daily shampoo for oily or flaky scalps. With Zinc PCA, Willow Bark and Tea Tree Oil plus Aloe Vera and alcohol-free Witch Hazel to help reduce visible flakes and keep the scalp fresh, clean and balanced.",
    keyIngredients: [
      { name: "Zinc PCA", benefit: "Helps control excess oil" },
      { name: "Willow Bark Extract", benefit: "Helps loosen and reduce visible flakes" },
      { name: "Tea Tree Oil", benefit: "Fresh, clean-feeling scalp" },
      { name: "Aloe Vera & Witch Hazel (alcohol-free)", benefit: "Soothe and refresh the scalp" },
      { name: "Niacinamide, Centella, Green Tea, Rosemary", benefit: "Scalp-conditioning botanicals" },
      { name: "Batana, Baobab & Macadamia Oils", benefit: "Light nourishment" },
    ],
    directions: [
      "Wet hair and scalp thoroughly.",
      "Massage into the scalp to a lather and leave on for 1–2 minutes.",
      "Rinse well. Repeat if needed.",
      "Use daily or at least 2–3 times a week.",
    ],
    cautions: STANDARD_CAUTIONS,
    questions: [
      {
        question: "How do I use this shampoo?",
        answer: "Wet your hair and scalp thoroughly, then massage it into the scalp to a lather.",
        links: [SEE_HOW_TO_USE],
      },
      {
        question: "How long should I leave it on?",
        answer: "Leave the lather on for 1–2 minutes, then rinse well. Repeat if needed.",
      },
      {
        question: "How often should I use it?",
        answer: "Use it daily, or at least 2–3 times a week.",
      },
      {
        question: "What kind of scalp is it made for?",
        answer: "It is a sulfate-free daily shampoo for oily or flaky scalps.",
      },
      STANDARD_PRECAUTIONS,
    ],
  },
];

export function getProductDetails(handle: string): ProductDetails | undefined {
  return PRODUCT_DETAILS.find((p) => p.handle === handle);
}
