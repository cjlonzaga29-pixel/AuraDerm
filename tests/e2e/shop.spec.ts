import { expect, test } from "@playwright/test";

// Visible headings drop the brand prefix (shown as a label); the full catalog
// name stays in the page title.
const PRODUCTS = [
  { handle: "hair-fall-defense-shampoo", name: "Hair Fall Defense Shampoo" },
  { handle: "hair-fall-defense-conditioner", name: "Hair Fall Defense Conditioner" },
  { handle: "hair-fall-defense-scalp-vitamin-serum", name: "Hair Fall Defense Scalp Vitamin Serum" },
  { handle: "scalp-balance-daily-shampoo", name: "Scalp Balance Daily Shampoo" },
];

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
    await expect(page.getByTestId("product-card")).toHaveCount(4);
    await expect(page.getByText("Price coming soon", { exact: true })).toHaveCount(4);
    // Generated packaging mockups replace the placeholders, captioned as such.
    await expect(page.getByText("Product photography coming soon")).toHaveCount(0);
    await expect(page.getByText("Illustrative packaging", { exact: true })).toHaveCount(4);
    await expect(page.locator("main")).not.toContainText(/filter|sort by|rating|in stock/i);
    await expect(page.locator("main")).not.toContainText(/[₱$]\s?\d/);
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

  test("product page: label content, single availability block, related links", async ({ page }) => {
    await page.goto("/shop/hair-fall-defense-scalp-vitamin-serum");
    const info = page.getByTestId("product-detail");
    await expect(info.getByText("Price coming soon", { exact: true })).toHaveCount(1);
    await expect(page.getByText("Purchasing will be available once pricing is confirmed.")).toHaveCount(1);
    await expect(page.getByRole("button", { name: "Add to bag" })).toHaveCount(0);
    await expect(page.getByRole("group", { name: "Quantity" })).toHaveCount(0);
    const gallery = info.getByTestId("product-image").first();
    await expect(gallery.locator("img")).toHaveAttribute(
      "src",
      "/images/products/hair-fall-defense-scalp-vitamin-serum-front.webp",
    );
    await expect(gallery.getByText("Illustrative packaging")).toBeVisible();
    // One image only, so no thumbnail controls.
    await expect(info.getByRole("group", { name: /images$/ })).toHaveCount(0);
    await expect(page.getByTestId("highlights").getByRole("listitem")).toHaveCount(3);

    await page.getByRole("button", { name: "Key ingredients" }).click();
    const ingredients = page.getByRole("region", { name: "Key ingredients" });
    await expect(ingredients.getByText("Caffeine", { exact: true })).toBeVisible();
    await expect(page.getByText("Key ingredients only — not the full ingredient list.")).toBeVisible();
    await page.getByRole("button", { name: "How to use" }).click();
    await expect(page.getByText("Massage gently for 1–2 minutes. Do not rinse.")).toBeVisible();
    await page.getByRole("button", { name: "Cautions" }).click();
    await expect(page.getByText("For external use only. For adults.")).toBeVisible();
    await expect(page.getByText(/patch test before first use/)).toBeVisible();

    const related = page.locator("section[aria-labelledby='related-heading']");
    await expect(related.getByTestId("product-card")).toHaveCount(3);
    await related.getByRole("link", { name: "Scalp Balance Daily Shampoo" }).click();
    await expect(page).toHaveURL(/\/shop\/scalp-balance-daily-shampoo$/);
    await page.getByRole("button", { name: "Key ingredients" }).click();
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

  test("a saved v2 cart is restored, not overwritten by the empty first render", async ({ page }) => {
    // Fixture only: no live product is purchasable while prices are unconfirmed.
    const saved = JSON.stringify([
      {
        productId: "fixture_item",
        handle: "hair-fall-defense-shampoo",
        title: "Fixture Cart Item",
        priceMinor: 100,
        quantity: 1,
        volume: "",
        image: "",
      },
    ]);
    await page.goto("/");
    await page.evaluate((value) => localStorage.setItem("auraderm_cart_v2", value), saved);
    await page.goto("/shop");
    await page.getByTestId("bag-button").click();
    await expect(page.getByRole("dialog", { name: "Your Bag" })).toContainText("Fixture Cart Item");
    await page.reload();
    expect(await page.evaluate(() => localStorage.getItem("auraderm_cart_v2"))).toBe(saved);
  });

  test("unknown and obsolete product handles return 404", async ({ request }) => {
    for (const path of ["/shop/not-a-real-product", "/shop/radiance-barrier-serum"]) {
      const response = await request.get(path);
      expect(response.status(), path).toBe(404);
    }
  });

  test("no horizontal overflow on shop pages", async ({ page }) => {
    for (const path of ["/shop", "/shop/hair-fall-defense-scalp-vitamin-serum"]) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
  });
});
