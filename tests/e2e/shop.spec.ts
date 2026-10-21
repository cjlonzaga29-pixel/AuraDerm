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
      "/images/products/hair-fall-defense-scalp-vitamin-serum-front.webp",
    );
    await expect(gallery.getByText("Illustrative packaging")).toBeVisible();
    // One image only, so no thumbnail controls.
    await expect(info.getByRole("group", { name: /images$/ })).toHaveCount(0);
    await expect(page.getByTestId("highlights").getByRole("listitem")).toHaveCount(3);

    // Every details section is open: no accordion to click through.
    const details = page.getByTestId("product-details");
    for (const title of ["Overview", "Key ingredients", "How to use", "Cautions", "Specifications", "Reviews"]) {
      await expect(details.getByRole("heading", { level: 2, name: title })).toBeVisible();
      await expect(details.getByRole("navigation", { name: "Product details" }).getByRole("link", { name: title })).toHaveAttribute("href", /^#/);
    }
    const ingredients = page.getByRole("region", { name: "Key ingredients" });
    await expect(ingredients.getByText("Caffeine", { exact: true })).toBeVisible();
    await expect(page.getByText("Key ingredients only — not the full ingredient list.")).toBeVisible();
    await expect(page.getByText("Massage gently for 1–2 minutes. Do not rinse.")).toBeVisible();
    await expect(page.getByText("For external use only. For adults.")).toBeVisible();
    await expect(page.getByText(/patch test before first use/)).toBeVisible();
    await expect(page.getByRole("region", { name: "Reviews" })).toContainText("No reviews yet.");
    // The description and each ingredient benefit appear exactly once.
    const product = await page.getByTestId("product-detail").locator("..").innerText();
    expect(product.split("Refreshes and energizes the scalp").length - 1).toBe(1);
    await expect(page.getByText(/nourishes and refreshes the scalp/i)).toHaveCount(1);
    // No invented commerce signals and no unconfirmed size.
    await expect(page.locator("main")).not.toContainText(/rating|★|sold|in stock|% off|free shipping|\b\d+\s?m[lL]\b/);

    const related = page.locator("section[aria-labelledby='related-heading']");
    await expect(related.getByTestId("product-card")).toHaveCount(3);
    await related.getByRole("link", { name: "Scalp Balance Daily Shampoo" }).click();
    await expect(page).toHaveURL(/\/shop\/scalp-balance-daily-shampoo$/);
    await expect(
      page.getByRole("region", { name: "Key ingredients" }).getByText("Zinc PCA", { exact: true }),
    ).toBeVisible();
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
        expect(await img.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBe(1122);
        await expect(img).toHaveCSS("object-fit", "contain");
      }
    }
    for (const { handle } of PRODUCTS) {
      await page.goto(`/shop/${handle}`);
      await expect(page.getByTestId("product-detail").locator("img").first()).toHaveAttribute(
        "src",
        `/images/products/${handle}-front.webp`,
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
    for (const path of ["/shop", "/shop/hair-fall-defense-scalp-vitamin-serum", "/checkout"]) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
  });
});
