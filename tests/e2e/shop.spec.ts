import { expect, test } from "@playwright/test";

test.describe("shop", () => {
  test("Shop is reachable from the homepage navigation", async ({ page }, testInfo) => {
    await page.goto("/");
    if (testInfo.project.name === "mobile") {
      await page.getByTestId("menu-toggle").click();
      await page.getByRole("navigation", { name: "Mobile" }).getByRole("link", { name: "Shop" }).click();
    } else {
      await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Shop" }).click();
    }
    await expect(page).toHaveURL(/\/shop$/);
    await expect(page.getByRole("heading", { level: 1, name: "Shop" })).toBeVisible();
    await expect(page.getByTestId("product-card")).toHaveCount(3);
    await expect(page.getByTestId("shop-preview-notice")).toBeVisible();
    await expect(page.getByText("Illustrative price", { exact: true })).toHaveCount(3);
  });

  test("product page: content, quantity, add to bag, cart edits, related links", async ({ page }) => {
    await page.goto("/shop");
    await page.getByRole("link", { name: "Radiance Barrier Serum" }).click();
    await expect(page).toHaveURL(/\/shop\/radiance-barrier-serum$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Radiance Barrier Serum");
    await expect(page.getByText("₱1,499.00")).toBeVisible();
    await expect(page.getByRole("combobox")).toHaveCount(0);

    await page.getByRole("button", { name: "Increase quantity of Radiance Barrier Serum" }).click();
    await expect(page.getByTestId("quantity-value")).toHaveText("2");
    await page.getByRole("button", { name: "Add to bag" }).click();

    const bag = page.getByRole("dialog", { name: "Your Bag" });
    await expect(bag).toBeVisible();
    await expect(bag.getByText("₱2,998.00")).toBeVisible();
    await expect(bag.getByRole("button", { name: "Checkout unavailable" })).toBeDisabled();
    await bag.getByRole("button", { name: "Increase quantity of Radiance Barrier Serum" }).click();
    await expect(bag.getByText("₱4,497.00")).toBeVisible();
    await bag.getByRole("button", { name: "Remove Radiance Barrier Serum from bag" }).click();
    await expect(bag.getByText("Your bag is empty.")).toBeVisible();
    await page.keyboard.press("Escape");

    await page.getByRole("button", { name: "Key ingredients" }).click();
    await expect(page.getByText("Squalane")).toBeVisible();

    const related = page.locator("section[aria-labelledby='related-heading']");
    await expect(related.getByTestId("product-card")).toHaveCount(2);
    await related.getByRole("link", { name: "Night Renewal Nectar" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Night Renewal Nectar");
  });

  test("unknown product handle returns 404", async ({ request }) => {
    const response = await request.get("/shop/not-a-real-product");
    expect(response.status()).toBe(404);
  });

  test("no horizontal overflow on shop pages", async ({ page }) => {
    for (const path of ["/shop", "/shop/botanical-cleansing-elixir"]) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
  });
});
