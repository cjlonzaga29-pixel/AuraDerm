import { expect, test, type Page } from "@playwright/test";

// Visible headings drop the brand prefix (shown as a label); the full catalog
// name stays in the page title.
// Display order: the serum comes last.
const PRODUCTS = [
  { handle: "hair-fall-defense-shampoo", name: "Hair Fall Defense Shampoo" },
  { handle: "hair-fall-defense-conditioner", name: "Hair Fall Defense Conditioner" },
  { handle: "scalp-balance-daily-shampoo", name: "Scalp Balance Daily Shampoo" },
  { handle: "hair-fall-defense-scalp-vitamin-serum", name: "Hair Fall Defense Scalp Vitamin Serum" },
];

const openBag = async (page: Page) => {
  await page.getByTestId("bag-button").click();
  return page.getByRole("dialog", { name: "Your Bag" });
};

test.describe("shop", () => {
  test("hero Shop now button opens the shop", async ({ page }) => {
    await page.goto("/");
    const cta = page.getByRole("link", { name: "Shop now" });
    await expect(cta).toBeVisible();
    await expect(cta).toBeInViewport();
    await cta.click();
    await expect(page).toHaveURL(/\/shop$/);
    await expect(page.getByRole("heading", { level: 1, name: "Hair & scalp care" })).toBeVisible();
  });

  test("Shop is reachable from the homepage navigation", async ({ page }, testInfo) => {
    await page.goto("/");
    if (testInfo.project.name === "mobile") {
      await page.getByTestId("menu-toggle").click();
      await page.getByRole("navigation", { name: "Mobile" }).getByRole("link", { name: "Shop" }).click();
    } else {
      await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Shop" }).click();
    }
    await expect(page).toHaveURL(/\/shop$/);
    const cards = page.getByTestId("product-card");
    await expect(cards).toHaveCount(4);
    for (const [i, { name }] of PRODUCTS.entries()) {
      await expect(cards.nth(i).getByRole("heading", { level: 3 })).toHaveText(name);
      await expect(cards.nth(i).getByTestId("price")).toHaveText(/^₱1,299\.00\s*Sample price$/);
    }
    await expect(page.getByText("Price coming soon", { exact: true })).toHaveCount(0);
    // Generated packaging mockups replace the placeholders, captioned as such.
    await expect(page.getByText("Product photography coming soon")).toHaveCount(0);
    await expect(page.getByText("Illustrative packaging", { exact: true })).toHaveCount(4);
    await expect(page.locator("main")).not.toContainText(/filter|sort by|rating|in stock/i);
    await expect(page.locator("main")).not.toContainText(/\$\s?\d/);
    await expect(page.locator("main")).not.toContainText(/concept/i);
  });

  test("each card opens its own product page", async ({ page }) => {
    for (const { handle, name } of PRODUCTS) {
      await page.goto("/shop");
      await page.getByRole("link", { name, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`/shop/${handle}$`));
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(name);
      await expect(page).toHaveTitle(`Aura Derm ${name} · AuraDerm Botanicals`);
    }
  });

  test("product page: label content, labelled sample price with buy controls, related links", async ({
    page,
  }) => {
    await page.goto("/shop/hair-fall-defense-scalp-vitamin-serum");
    const info = page.getByTestId("product-detail");
    const panel = info.getByTestId("purchase-panel");
    await expect(panel.getByTestId("price")).toHaveText(/^₱1,299\.00\s*Sample price$/);
    await expect(
      panel.getByText("Sample price for testing only. Real orders and payments are not enabled."),
    ).toBeVisible();
    await expect(panel.getByRole("button", { name: "Buy now" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Add to bag" })).toHaveCount(1);
    await expect(page.getByRole("group", { name: "Quantity" })).toHaveCount(1);
    await expect(info.getByText("Price coming soon", { exact: true })).toHaveCount(0);
    const gallery = info.getByTestId("product-image").first();
    await expect(gallery.locator("img")).toHaveAttribute(
      "src",
      "/images/products/follivance-hair-density-serum-01.webp",
    );
    await expect(gallery.getByText("Illustrative packaging")).toBeVisible();
    // The eight-image Follivance gallery, main image selected.
    const thumbs = info.getByRole("group", { name: /images$/ }).getByRole("button");
    await expect(thumbs).toHaveCount(8);
    await expect(thumbs.first()).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("highlights").getByRole("listitem")).toHaveCount(3);

    // Folder tabs: Overview first and alone; each tab replaces the panel.
    const tabs = page.getByRole("tablist", { name: "Product details" }).getByRole("tab");
    await expect(tabs).toHaveText([
      "Overview",
      "Key ingredients",
      "How to use",
      "Cautions",
      "Specifications",
      "Questions & answers",
      "Reviews",
    ]);
    await expect(page.getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("tabpanel")).toHaveCount(1);
    // The description appears exactly once, in Overview.
    await expect(page.getByText(/nourishes and refreshes the scalp/i)).toHaveCount(1);
    await expect(page.getByRole("tabpanel", { name: "Overview" })).toContainText(/nourishes and refreshes the scalp/i);
    await page.getByRole("tab", { name: "Key ingredients" }).click();
    const ingredients = page.getByRole("tabpanel", { name: "Key ingredients" });
    await expect(ingredients.getByText("Caffeine", { exact: true })).toBeVisible();
    await expect(page.getByText("Key ingredients only — not the full ingredient list.")).toBeVisible();
    // Each ingredient benefit appears exactly once.
    const product = await page.getByTestId("product-detail").locator("..").innerText();
    expect(product.split("Refreshes and energizes the scalp").length - 1).toBe(1);
    await page.getByRole("tab", { name: "How to use" }).click();
    await expect(page.getByText("Massage gently for 1–2 minutes. Do not rinse.")).toBeVisible();
    await expect(ingredients).toHaveCount(0);
    await page.getByRole("tab", { name: "Cautions" }).click();
    await expect(page.getByText("For external use only. For adults.")).toBeVisible();
    await expect(page.getByText(/patch test before first use/)).toBeVisible();
    await page.getByRole("tab", { name: "Reviews" }).click();
    await expect(page.getByRole("tabpanel", { name: "Reviews" })).toContainText("No reviews yet.");
    await expect(page.getByRole("tabpanel")).toHaveCount(1);
    // No invented commerce signals and no unconfirmed size.
    await expect(page.locator("main")).not.toContainText(/rating|★|sold|in stock|% off|free shipping|\b\d+\s?m[lL]\b/);

    // Related products sit below and outside the tabs.
    const related = page.locator("section[aria-labelledby='related-heading']");
    await expect(page.getByTestId("product-details").locator("#related-heading")).toHaveCount(0);
    await expect(related.getByTestId("product-card")).toHaveCount(3);
    await related.getByRole("link", { name: "Scalp Balance Daily Shampoo" }).click();
    await expect(page).toHaveURL(/\/shop\/scalp-balance-daily-shampoo$/);
    await expect(page.getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "true");
    await page.getByRole("tab", { name: "Key ingredients" }).click();
    await expect(
      page.getByRole("tabpanel", { name: "Key ingredients" }).getByText("Zinc PCA", { exact: true }),
    ).toBeVisible();
  });

  test("details tabs: hash links, back/forward, keyboard and mobile scrolling", async ({ page }, testInfo) => {
    const handle = "hair-fall-defense-scalp-vitamin-serum";
    const selected = (name: string) =>
      expect(page.getByRole("tab", { name, exact: true })).toHaveAttribute("aria-selected", "true");
    await page.emulateMedia({ reducedMotion: "reduce" });

    // Direct links select their tab on load and land below the fixed header.
    for (const [hash, name] of [
      ["ingredients", "Key ingredients"],
      ["how-to-use", "How to use"],
      ["cautions", "Cautions"],
      ["questions", "Questions & answers"],
    ] as const) {
      await page.goto(`/shop/${handle}#${hash}`);
      await selected(name);
      await expect(page.getByRole("tabpanel")).toHaveCount(1);
      await expect(page.getByRole("tabpanel", { name })).toBeVisible();
      const header = (await page.locator(".site-header").boundingBox())!;
      await expect
        .poll(async () => (await page.locator(`#${hash}`).boundingBox())!.y, { message: hash })
        .toBeGreaterThanOrEqual(header.y + header.height - 1);
      await expect(page.locator(`#${hash}`)).toBeInViewport();
    }

    // Clicking updates the hash without a reload or a page jump.
    await page.goto(`/shop/${handle}`);
    await selected("Overview");
    await page.evaluate(() => ((window as unknown as { __noReload: boolean }).__noReload = true));
    const cautionsTab = page.getByRole("tab", { name: "Cautions" });
    await cautionsTab.scrollIntoViewIfNeeded();
    const scrollBefore = await page.evaluate(() => window.scrollY);
    await cautionsTab.click();
    await expect(page).toHaveURL(/#cautions$/);
    expect(Math.abs((await page.evaluate(() => window.scrollY)) - scrollBefore)).toBeLessThan(2);
    await page.getByRole("tab", { name: "Specifications" }).click();
    await expect(page).toHaveURL(/#specifications$/);
    await expect(page.getByTestId("specifications")).toBeVisible();

    // Back and forward follow the selection, without reloading.
    await page.goBack();
    await expect(page).toHaveURL(/#cautions$/);
    await selected("Cautions");
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`/shop/${handle}$`));
    await selected("Overview");
    await page.goForward();
    await selected("Cautions");
    expect(await page.evaluate(() => (window as unknown as { __noReload?: boolean }).__noReload)).toBe(true);

    // Arrow keys, Home and End move between tabs; inactive panels are not rendered.
    await cautionsTab.focus();
    await page.keyboard.press("Home");
    await expect(page.getByRole("tab", { name: "Overview" })).toBeFocused();
    await selected("Overview");
    await page.keyboard.press("ArrowRight");
    await selected("Key ingredients");
    await expect(page).toHaveURL(/#ingredients$/);
    await page.keyboard.press("End");
    await selected("Reviews");
    await page.keyboard.press("ArrowLeft");
    await selected("Questions & answers");
    await expect(page.getByRole("tab", { name: "Questions & answers" })).toBeFocused();
    await expect(cautionsTab).toHaveAttribute("tabindex", "-1");
    await expect(page.getByRole("tabpanel")).toHaveCount(1);
    await expect(page.getByText("For external use only. For adults.")).toHaveCount(0);
    // Tab moves from the tab list to the open panel, never into hidden content.
    await page.keyboard.press("Tab");
    await expect(page.getByRole("tabpanel", { name: "Questions & answers" })).toBeFocused();

    // Q&A answer links open the How to use and Cautions tabs.
    for (const [link, name] of [
      ["See How to use", "How to use"],
      ["See all cautions", "Cautions"],
    ] as const) {
      await page.goto(`/shop/${handle}#questions`);
      const qa = page.getByRole("tabpanel", { name: "Questions & answers" });
      for (const trigger of await qa.getByRole("button").all()) await trigger.click();
      await qa.getByRole("link", { name: link }).first().click();
      await selected(name);
      await expect(page.getByRole("tabpanel", { name })).toBeVisible();
      await expect(page.getByRole("tab", { name, exact: true })).toBeInViewport();
    }

    // The highlights link opens Key ingredients.
    await page.goto(`/shop/${handle}`);
    await page.getByRole("link", { name: "All key ingredients and what they do" }).click();
    await selected("Key ingredients");

    // Touch targets, and on phones a scrolling tab list that never widens the page.
    for (const tab of await page.getByRole("tab").all()) {
      expect((await tab.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
    const list = page.getByRole("tablist", { name: "Product details" });
    if (testInfo.project.name === "mobile") {
      expect(await list.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
      await page.getByRole("tab", { name: "Overview" }).click();
      await expect(page.getByTestId("tabs-more")).toHaveCSS("opacity", "1");
      await page.getByRole("tab", { name: "Reviews" }).click();
      await expect(page.getByRole("tab", { name: "Reviews" })).toBeInViewport({ ratio: 1 });
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("questions & answers: product-specific, accessible accordion between Specifications and Reviews", async ({
    page,
  }) => {
    const expected: Record<string, { count: number; question: string; answer: RegExp }> = {
      "hair-fall-defense-shampoo": {
        count: 6,
        question: "How do I use this shampoo?",
        answer: /massage it into the scalp to a lather for 1–2 minutes/,
      },
      "hair-fall-defense-conditioner": {
        count: 6,
        question: "How long should I leave it on?",
        answer: /Leave it on for 2–3 minutes/,
      },
      "scalp-balance-daily-shampoo": {
        count: 5,
        question: "How often should I use it?",
        answer: /daily, or at least 2–3 times a week/,
      },
      "hair-fall-defense-scalp-vitamin-serum": {
        count: 6,
        question: "What should I do before first use?",
        answer: /patch test: apply a small amount behind the ear and wait 24 hours.*for adults/,
      },
    };
    // Instant anchor jumps: smooth scrolling makes the landing position timing-dependent.
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const { handle } of PRODUCTS) {
      const want = expected[handle];
      await page.goto(`/shop/${handle}`);

      // Tab order: Specifications, then Q&A, then Reviews.
      const order = await page.getByRole("tab").evaluateAll((els) => els.map((el) => el.id));
      expect(order.slice(-3), handle).toEqual(["specifications", "questions", "reviews"]);

      // The tab lands below the fixed header and shows the Q&A panel.
      const tab = page.getByRole("tab", { name: "Questions & answers" });
      await tab.click();
      await expect(page).toHaveURL(new RegExp(`#questions$`));
      const headerHeight = (await page.locator(".site-header").boundingBox())!.height;
      await expect
        .poll(async () => (await tab.boundingBox())!.y, { message: handle })
        .toBeGreaterThanOrEqual(headerHeight);
      const section = page.getByRole("tabpanel", { name: "Questions & answers" });
      await expect(section.getByRole("heading", { level: 2 })).toHaveText("Questions & answers");
      await expect(section).toContainText("editorial guidance");
      await expect(section).not.toContainText(/verified|helpful|ask a question/i);
      await expect(section.locator("form, input, textarea")).toHaveCount(0);

      const triggers = section.getByRole("button");
      await expect(triggers).toHaveCount(want.count);
      for (const trigger of await triggers.all()) {
        await expect(trigger).toHaveAttribute("aria-expanded", "false");
        expect((await trigger.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      }

      // Mouse opens and closes.
      const trigger = section.getByRole("button", { name: want.question });
      await trigger.click();
      await expect(trigger).toHaveAttribute("aria-expanded", "true");
      const panel = section.getByRole("region", { name: want.question });
      await expect(panel).toBeVisible();
      await expect(panel).toContainText(want.answer);
      await trigger.click();
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      await expect(panel).toBeHidden();

      // Enter and Space toggle the focused question.
      const first = triggers.first();
      await first.focus();
      await page.keyboard.press("Enter");
      await expect(first).toHaveAttribute("aria-expanded", "true");
      await page.keyboard.press("Space");
      await expect(first).toHaveAttribute("aria-expanded", "false");
      await page.keyboard.press("Space");
      await expect(first).toHaveAttribute("aria-expanded", "true");

      // Open everything: no overflow, and the last answer clears the sticky bar.
      for (const t of await triggers.all()) {
        if ((await t.getAttribute("aria-expanded")) === "false") await t.click();
      }
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, handle).toBeLessThanOrEqual(0);
      const lastAnswer = section.locator("[data-slot='accordion-content']").last();
      await lastAnswer.scrollIntoViewIfNeeded();
      const bar = page.getByTestId("sticky-purchase-bar");
      if (await bar.isVisible()) {
        const answerBox = (await lastAnswer.boundingBox())!;
        expect(answerBox.y + answerBox.height).toBeLessThanOrEqual((await bar.boundingBox())!.y + 1);
      }

      // In-answer links resolve: section anchors exist, product links return 200.
      for (const href of await section.locator("a").evaluateAll((els) => els.map((el) => el.getAttribute("href")!))) {
        if (href.startsWith("#")) {
          await expect(page.locator(href), `${handle} ${href}`).toHaveCount(1);
        } else {
          expect((await page.request.get(href)).status(), href).toBe(200);
        }
      }
    }
  });

  test("every product image loads, matches its product and is not cropped", async ({ page }) => {
    const failed: string[] = [];
    page.on("response", (res) => {
      if (res.url().includes("/images/products/") && res.status() >= 400) failed.push(res.url());
    });
    for (const path of ["/", "/shop", ...PRODUCTS.map((p) => `/shop/${p.handle}`)]) {
      await page.goto(path);
      const images = page.locator("[data-testid='product-image'] img");
      const count = await images.count();
      expect(count).toBeGreaterThan(0);
      for (let i = 0; i < count; i++) {
        const img = images.nth(i);
        await img.scrollIntoViewIfNeeded();
        await expect(img).toHaveJSProperty("complete", true);
        // Packshots are 1122 px wide; the square serum and shampoo galleries 1254.
        const [src, naturalWidth] = await img.evaluate((el: HTMLImageElement) => [el.src, el.naturalWidth] as const);
        expect(naturalWidth, src).toBe(/\/(follivance-|hair-fall-defense-shampoo-0)/.test(src) ? 1254 : 1122);
        await expect(img).toHaveCSS("object-fit", "contain");
      }
    }
    for (const { handle } of PRODUCTS) {
      await page.goto(`/shop/${handle}`);
      await expect(page.getByTestId("product-detail").locator("img").first()).toHaveAttribute(
        "src",
        handle === "hair-fall-defense-scalp-vitamin-serum"
          ? "/images/products/follivance-hair-density-serum-01.webp"
          : handle === "hair-fall-defense-shampoo"
            ? "/images/products/hair-fall-defense-shampoo-01.webp"
            : `/images/products/${handle}-front.webp`,
      );
    }
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(width).toBeLessThanOrEqual(page.viewportSize()!.width);
    expect(failed).toEqual([]);
  });

  test("stale demo cart is discarded, other storage is kept", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem(
        "auraderm_cart_v1",
        JSON.stringify([
          {
            productId: "prod_radiance_barrier_serum",
            handle: "radiance-barrier-serum",
            title: "Radiance Barrier Serum",
            priceMinor: 149900,
            quantity: 2,
            volume: "30 ml",
            image: "",
          },
        ]),
      );
      localStorage.setItem("unrelated_key", "keep-me");
    });
    await page.goto("/shop");
    await page.getByTestId("bag-button").click();
    const bag = page.getByRole("dialog", { name: "Your Bag" });
    await expect(bag.getByText("Your bag is empty.")).toBeVisible();
    await expect(bag).not.toContainText("Radiance Barrier Serum");
    const storage = await page.evaluate(() => ({
      v1: localStorage.getItem("auraderm_cart_v1"),
      unrelated: localStorage.getItem("unrelated_key"),
    }));
    expect(storage).toEqual({ v1: null, unrelated: "keep-me" });
  });

  test("a saved v2 cart is restored at current catalog prices, not overwritten by the first render", async ({
    page,
  }) => {
    // A stale saved price (₱1.00) and an entry the catalog no longer sells.
    const saved = JSON.stringify([
      {
        productId: "prod_hair-fall-defense-shampoo",
        handle: "hair-fall-defense-shampoo",
        title: "Old Title",
        priceMinor: 100,
        quantity: 2,
        volume: "",
        image: "",
      },
      {
        productId: "prod_radiance_barrier_serum",
        handle: "radiance-barrier-serum",
        title: "Radiance Barrier Serum",
        priceMinor: 149900,
        quantity: 1,
        volume: "",
        image: "",
      },
    ]);
    await page.goto("/");
    await page.evaluate((value) => {
      localStorage.setItem("auraderm_cart_v2", value);
      localStorage.setItem("unrelated_key", "keep-me");
    }, saved);
    await page.goto("/shop");
    const bag = await openBag(page);
    await expect(bag).toContainText("Aura Derm Hair Fall Defense Shampoo");
    await expect(bag).not.toContainText("Radiance Barrier Serum");
    await expect(bag).not.toContainText("₱1.00");
    await expect(bag.getByTestId("cart-subtotal")).toHaveText("₱2,598.00");
    await page.reload();
    const storage = await page.evaluate(() => ({
      cart: localStorage.getItem("auraderm_cart_v2"),
      unrelated: localStorage.getItem("unrelated_key"),
    }));
    expect(storage).toEqual({ cart: saved, unrelated: "keep-me" });
  });

  test("sample-priced bag: add, quantity, second product, remove, empty, persist; test checkout only", async ({
    page,
  }) => {
    await page.goto("/shop/hair-fall-defense-shampoo");
    const name = "Aura Derm Hair Fall Defense Shampoo";
    await page.getByRole("button", { name: `Increase quantity of ${name}` }).click();
    await expect(page.getByTestId("quantity-value")).toHaveText("2");
    await page.getByRole("button", { name: "Add to bag" }).click();
    let bag = page.getByRole("dialog", { name: "Your Bag" });
    await expect(bag.getByTestId("cart-subtotal")).toHaveText("₱2,598.00");
    await expect(
      bag.getByText("Sample prices for testing. Checkout is test-only: no real orders or payments."),
    ).toBeVisible();
    await expect(bag).toContainText("Sample price");
    await page.keyboard.press("Escape");
    await expect(bag).toBeHidden();

    await page.goto("/shop/hair-fall-defense-scalp-vitamin-serum");
    await page.getByRole("button", { name: "Add to bag" }).click();
    bag = page.getByRole("dialog", { name: "Your Bag" });
    await expect(bag.getByTestId("cart-subtotal")).toHaveText("₱3,897.00");

    await expect(bag.getByRole("link", { name: "Go to test checkout" })).toHaveAttribute("href", "/checkout");
    await expect(bag.getByRole("button", { name: /place order|pay|submit/i })).toHaveCount(0);
    await expect(bag.locator("form")).toHaveCount(0);

    // Reload: the bag comes back with the same items and total.
    await page.reload();
    bag = await openBag(page);
    await expect(bag.getByTestId("cart-subtotal")).toHaveText("₱3,897.00");

    await bag.getByRole("button", { name: `Decrease quantity of ${name}` }).click();
    await expect(bag.getByTestId("cart-subtotal")).toHaveText("₱2,598.00");
    await bag.getByRole("button", { name: `Increase quantity of ${name}` }).click();
    await expect(bag.getByTestId("cart-subtotal")).toHaveText("₱3,897.00");

    await bag.getByRole("button", { name: `Remove ${name} from bag` }).click();
    await expect(bag.getByTestId("cart-subtotal")).toHaveText("₱1,299.00");
    await bag
      .getByRole("button", { name: "Remove Aura Derm Hair Fall Defense Scalp Vitamin Serum from bag" })
      .click();
    await expect(bag.getByText("Your bag is empty.")).toBeVisible();

    await page.reload();
    bag = await openBag(page);
    await expect(bag.getByText("Your bag is empty.")).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem("auraderm_cart_v2"))).toBe("[]");
  });

  test("unknown and obsolete product handles return 404", async ({ request }) => {
    for (const path of ["/shop/not-a-real-product", "/shop/radiance-barrier-serum"]) {
      const response = await request.get(path);
      expect(response.status(), path).toBe(404);
    }
  });

  test("no horizontal overflow on shop pages", async ({ page }) => {
    for (const path of ["/shop", ...PRODUCTS.map((p) => `/shop/${p.handle}`), "/checkout"]) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
  });
});

// P4-P20: compact shop cards and a compact purchase area.
test.describe("compact shop and purchase area", () => {
  test.beforeEach(({ page }, testInfo) => {
    void page;
    test.skip(testInfo.project.name !== "desktop", "sets its own viewports");
  });

  test("shop cards: four ~250px across, two on tablet, one on phones; serum last", async ({ page }) => {
    for (const [width, columns] of [
      [1440, 4],
      [768, 2],
      [390, 1],
    ] as const) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/shop");
      const cards = page.getByTestId("product-card");
      await expect(cards).toHaveCount(4);
      await expect(cards.last().getByRole("heading", { level: 3 })).toHaveText(PRODUCTS[3].name);
      const boxes = await cards.evaluateAll((els) =>
        els.map((el) => {
          const r = el.getBoundingClientRect();
          return { y: Math.round(r.y + window.scrollY), w: r.width };
        }),
      );
      expect(new Set(boxes.map((b) => b.y)).size, `rows at ${width}`).toBe(4 / columns);
      if (width === 1440) {
        for (const b of boxes) {
          expect(b.w).toBeGreaterThanOrEqual(240);
          expect(b.w).toBeLessThanOrEqual(270);
        }
      }
      const title = cards.first().getByRole("heading", { level: 3 });
      const size = parseFloat(await title.evaluate((el) => getComputedStyle(el).fontSize));
      expect(size, `title at ${width}`).toBeGreaterThanOrEqual(18);
      expect(size, `title at ${width}`).toBeLessThanOrEqual(20);
      await expect(cards.first().getByTestId("price").locator("span").first()).toHaveCSS("font-size", "16px");
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `overflow at ${width}`).toBeLessThanOrEqual(0);
    }
  });

  // P4-P22: every listing and related card has a 1:1 media frame with the
  // whole 4:5 bottle contained on the linen backing, and a short body: title,
  // price and "View product" only (the summary stays on the product page).
  test("product cards: square media, whole bottle, no summary; related cards ~256px centred", async ({ page }) => {
    const surfaces = [
      ["/", "#collection [data-testid=product-card]", 4],
      ["/shop", "[data-testid=product-card]", 4],
      [`/shop/${PRODUCTS[0].handle}`, "section[aria-labelledby='related-heading'] [data-testid=product-card]", 3],
    ] as const;
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const [path, selector, count] of surfaces) {
        await page.goto(path);
        const cards = page.locator(selector);
        await expect(cards).toHaveCount(count);
        await expect(cards.last()).toContainText(PRODUCTS[3].name);
        for (let i = 0; i < count; i++) {
          const card = cards.nth(i);
          await card.scrollIntoViewIfNeeded();
          const img = card.getByTestId("product-image").locator("img");
          await expect(img).toHaveJSProperty("complete", true);
          const m = await img.evaluate((el: HTMLImageElement) => {
            const f = el.parentElement!.getBoundingClientRect();
            const r = el.getBoundingClientRect();
            const scale = Math.min(r.width / el.naturalWidth, r.height / el.naturalHeight);
            return {
              frame: f.width / f.height,
              fit: getComputedStyle(el).objectFit,
              painted: { w: el.naturalWidth * scale, h: el.naturalHeight * scale },
              box: { w: r.width, h: r.height },
              natural: el.naturalWidth / el.naturalHeight,
            };
          });
          expect(m.frame, `${path} card ${i} at ${width}`).toBeCloseTo(1, 2);
          expect(m.fit).toBe("contain");
          expect(m.painted.w).toBeLessThanOrEqual(m.box.w + 0.5);
          expect(m.painted.h).toBeLessThanOrEqual(m.box.h + 0.5);
          expect(m.painted.w / m.painted.h).toBeCloseTo(m.natural, 2);
          await expect(card.getByText("Illustrative packaging")).toBeVisible();
          await expect(card.getByTestId("price")).toHaveText(/^₱1,299\.00\s*Sample price$/);
          await expect(card).toContainText("View product");
          await expect(card.locator("h3 + p")).toHaveCount(0);
        }
        if (path.startsWith("/shop/")) {
          const boxes = await cards.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().toJSON() as DOMRect));
          const list = (await page.locator("section[aria-labelledby='related-heading'] ul").boundingBox())!;
          if (width >= 768) {
            expect(new Set(boxes.map((b) => Math.round(b.y))).size, `related rows at ${width}`).toBe(1);
            for (const b of boxes) {
              expect(b.width).toBeLessThanOrEqual(256.5);
              expect(Math.abs(b.width - boxes[0].width)).toBeLessThan(1);
            }
            const left = boxes[0].x - list.x;
            const right = list.x + list.width - boxes[2].right;
            expect(Math.abs(left - right), `related centred at ${width}`).toBeLessThanOrEqual(1);
          } else {
            for (const b of boxes) expect(b.width).toBeLessThanOrEqual(320);
          }
        }
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow, `${path} overflow at ${width}`).toBeLessThanOrEqual(0);
      }
    }
  });

  test("product page: compact title and details 24–32px below", async ({ page }) => {
    for (const { handle } of PRODUCTS) {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`/shop/${handle}`);
      const h1 = parseFloat(await page.getByRole("heading", { level: 1 }).evaluate((el) => getComputedStyle(el).fontSize));
      expect(h1).toBeGreaterThanOrEqual(30);
      expect(h1).toBeLessThanOrEqual(36);
      const detail = (await page.getByTestId("product-detail").boundingBox())!;
      const tabs = (await page.getByRole("tablist", { name: "Product details" }).boundingBox())!;
      const gap = tabs.y - (detail.y + detail.height);
      expect(gap, handle).toBeGreaterThanOrEqual(24);
      expect(gap, handle).toBeLessThanOrEqual(32);
      for (const name of ["Add to bag", "Buy now"]) {
        expect((await page.getByRole("button", { name }).boundingBox())!.height).toBeGreaterThanOrEqual(44);
      }

      await page.setViewportSize({ width: 390, height: 844 });
      const mobile = parseFloat(await page.getByRole("heading", { level: 1 }).evaluate((el) => getComputedStyle(el).fontSize));
      expect(mobile).toBeGreaterThanOrEqual(26);
      expect(mobile).toBeLessThanOrEqual(30);
    }
  });
});

// P4-P21: a square gallery frame beside an equal purchase column, centred in
// the 1200px container.
test.describe("square gallery and balanced purchase grid", () => {
  test.beforeEach(({ page }, testInfo) => {
    void page;
    test.skip(testInfo.project.name !== "desktop", "sets its own viewports");
  });

  for (const { handle } of PRODUCTS) {
    test(`${handle}: square contained gallery, columns fill the grid at every width`, async ({ page }) => {
      for (const width of [390, 768, 1280, 1440, 1920]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`/shop/${handle}`);
        const frame = page.getByTestId("product-gallery").getByTestId("product-image");
        const img = frame.locator("img");
        await expect(img).toHaveJSProperty("complete", true);
        const m = await page.evaluate(() => {
          const r = (el: Element) => el.getBoundingClientRect();
          const detail = document.querySelector('[data-testid="product-detail"]')!;
          const [left, right] = Array.from(detail.children).map(r);
          const fig = document.querySelector('[data-testid="product-gallery"] [data-testid="product-image"]')!;
          const img = fig.querySelector("img")!;
          const panel = document.querySelector('[data-testid="purchase-panel"]')!;
          const scale = Math.min(r(img).width / img.naturalWidth, r(img).height / img.naturalHeight);
          return {
            vw: document.documentElement.clientWidth,
            overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            detail: r(detail).toJSON(),
            left: left.toJSON(),
            right: right.toJSON(),
            frame: r(fig).toJSON(),
            img: r(img).toJSON(),
            fit: getComputedStyle(img).objectFit,
            painted: { width: img.naturalWidth * scale, height: img.naturalHeight * scale },
            panel: r(panel).toJSON(),
          };
        });
        const at = `${handle} @${width}`;
        expect(m.overflow, at).toBeLessThanOrEqual(0);

        // 1:1 frame; the whole bottle contained at its own ratio, undistorted.
        expect(Math.abs(m.frame.width - m.frame.height), at).toBeLessThanOrEqual(1);
        expect(m.fit, at).toBe("contain");
        expect(Math.abs(m.img.width - m.frame.width), at).toBeLessThanOrEqual(1);
        expect(Math.abs(m.img.height - m.frame.height), at).toBeLessThanOrEqual(1);
        expect(m.painted.width, at).toBeLessThanOrEqual(m.frame.width + 0.5);
        expect(m.painted.height, at).toBeLessThanOrEqual(m.frame.height + 0.5);

        // Gallery fills its track; balanced outer margins.
        expect(Math.abs(m.frame.width - m.left.width), at).toBeLessThanOrEqual(1);
        const outerLeft = m.detail.left;
        const outerRight = m.vw - m.detail.right;
        expect(Math.abs(outerLeft - outerRight), at).toBeLessThanOrEqual(1);
        // The purchase panel uses its whole column.
        expect(Math.abs(m.panel.width - m.right.width), at).toBeLessThanOrEqual(1);

        if (width >= 1024) {
          // Two equal columns, top-aligned, 32–40px apart, filling the container.
          expect(Math.abs(m.left.width - m.right.width), at).toBeLessThanOrEqual(1);
          expect(Math.abs(m.left.top - m.right.top), at).toBeLessThanOrEqual(1);
          const gap = m.right.left - m.left.right;
          expect(gap, at).toBeGreaterThanOrEqual(32);
          expect(gap, at).toBeLessThanOrEqual(40);
          expect(Math.abs(m.right.right - m.detail.right), at).toBeLessThanOrEqual(1);
          expect(m.detail.width, at).toBeGreaterThanOrEqual(Math.min(1104, width - 96) - 1);
        } else {
          // Stacked: the square gallery spans the content width.
          expect(m.right.top, at).toBeGreaterThan(m.left.bottom);
          expect(Math.abs(m.left.width - m.detail.width), at).toBeLessThanOrEqual(1);
        }
        await expect(frame.getByText("Illustrative packaging")).toBeVisible();
        await expect(page.getByRole("button", { name: /^Enlarge image/ })).toBeVisible();
        for (const name of ["Add to bag", "Buy now"]) {
          expect((await page.getByRole("button", { name }).boundingBox())!.height, at).toBeGreaterThanOrEqual(44);
        }
      }
    });
  }
});
