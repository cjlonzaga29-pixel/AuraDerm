import { expect, test } from "@playwright/test";

const PRODUCTS = [
  { handle: "hair-fall-defense-shampoo", name: "Aura Derm Hair Fall Defense Shampoo" },
  { handle: "hair-fall-defense-conditioner", name: "Aura Derm Hair Fall Defense Conditioner" },
  {
    handle: "hair-fall-defense-scalp-vitamin-serum",
    name: "Aura Derm Hair Fall Defense Scalp Vitamin Serum",
  },
  { handle: "scalp-balance-daily-shampoo", name: "Aura Derm Scalp Balance Daily Shampoo" },
];

test.describe("shop", () => {
  test("hero Shop now button opens the shop", async ({ page }) => {
    await page.goto("/");
    const cta = page.getByRole("link", { name: "Shop now" });
    await expect(cta).toBeVisible();
    await expect(cta).toBeInViewport();
    await cta.click();
    await expect(page).toHaveURL(/\/shop$/);
    await expect(page.getByRole("heading", { level: 1, name: "Shop" })).toBeVisible();
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
    await expect(page.getByTestId("shop-preview-notice")).toBeVisible();
    await expect(page.getByText("Price coming soon", { exact: true })).toHaveCount(4);
    await expect(page.locator("main")).not.toContainText(/[₱$]\s?\d/);
    await expect(page.locator("main")).not.toContainText(/concept|illustrative/i);
  });

  test("each card opens its own product page", async ({ page }) => {
    for (const { handle, name } of PRODUCTS) {
      await page.goto("/shop");
      await page.getByRole("link", { name, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`/shop/${handle}$`));
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(name);
    }
  });

  test("product page: label content, disabled purchase, related links", async ({ page }) => {
    await page.goto("/shop/hair-fall-defense-scalp-vitamin-serum");
    await expect(page.getByText("Price coming soon").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Add to bag" })).toBeDisabled();
    await expect(page.getByText("Unavailable to add until a price is confirmed.")).toBeVisible();
    await expect(page.getByText("Product image coming soon").first()).toBeVisible();

    await page.getByRole("button", { name: "Key ingredients" }).click();
    await expect(page.getByText("Caffeine", { exact: true })).toBeVisible();
    await expect(page.getByText("Key ingredients only — not the full ingredient list.")).toBeVisible();
    await page.getByRole("button", { name: "Directions" }).click();
    await expect(page.getByText("Massage gently for 1–2 minutes. Do not rinse.")).toBeVisible();
    await page.getByRole("button", { name: "Caution" }).click();
    await expect(page.getByText("For external use only. For adults.")).toBeVisible();
    await expect(page.getByText(/patch test before first use/)).toBeVisible();

    const related = page.locator("section[aria-labelledby='related-heading']");
    await expect(related.getByTestId("product-card")).toHaveCount(3);
    await related.getByRole("link", { name: "Aura Derm Scalp Balance Daily Shampoo" }).click();
    await expect(page).toHaveURL(/\/shop\/scalp-balance-daily-shampoo$/);
    await page.getByRole("button", { name: "Key ingredients" }).click();
    await expect(page.getByText("Zinc PCA", { exact: true })).toBeVisible();
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
