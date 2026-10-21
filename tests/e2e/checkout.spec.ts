import { expect, test } from "@playwright/test";

// The e2e server runs with no checkout configuration (no database, PayMongo
// or Google credentials), so these tests cover the honest unavailable state
// and the server's input guards. Sandbox payment flows are not exercised here.

const SERUM = "hair-fall-defense-scalp-vitamin-serum";
const SHAMPOO = "hair-fall-defense-shampoo";
const CONDITIONER = "hair-fall-defense-conditioner";

test.describe("product gallery", () => {
  test("single image: no gallery navigation; enlarge dialog keeps the native ratio and returns focus", async ({ page }) => {
    await page.goto(`/shop/${CONDITIONER}`);
    const gallery = page.getByTestId("product-gallery");
    await expect(gallery.getByRole("button", { name: "Previous image" })).toHaveCount(0);
    await expect(gallery.getByRole("button", { name: "Next image" })).toHaveCount(0);
    await expect(gallery.getByRole("group", { name: /images$/ })).toHaveCount(0);

    const enlarge = gallery.getByRole("button", { name: /^Enlarge image/ });
    await enlarge.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: /Hair Fall Defense Conditioner/ });
    await expect(dialog).toBeVisible();
    const img = dialog.locator("img");
    await expect(img).toHaveAttribute("src", `/images/products/${CONDITIONER}-front.webp`);
    await expect(img).toHaveCSS("object-fit", "contain");
    await expect(dialog.getByText("Illustrative packaging", { exact: true })).toBeVisible();
    const box = (await img.boundingBox())!;
    expect(Math.abs(box.width / box.height - 1122 / 1402)).toBeLessThan(0.02);
    const viewport = page.viewportSize()!;
    expect(box.height).toBeLessThanOrEqual(viewport.height);
    expect(box.width).toBeLessThanOrEqual(viewport.width);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(enlarge).toBeFocused();
  });

  test("Hair Fall Defense Shampoo: eight images in order, image 1 main, thumbnails select", async ({ page }) => {
    const srcs = Array.from({ length: 8 }, (_, i) => `/images/products/${SHAMPOO}-0${i + 1}.webp`);
    await page.goto(`/shop/${SHAMPOO}`);
    const gallery = page.getByTestId("product-gallery");
    const main = gallery.getByTestId("product-image").locator("img");
    await expect(main).toHaveAttribute("src", srcs[0]);
    const thumbs = gallery.getByRole("group", { name: /images$/ }).getByRole("button");
    const thumbImgs = thumbs.locator("img");
    expect(await thumbImgs.evaluateAll((els) => els.map((el) => el.getAttribute("src")))).toEqual(srcs);
    for (const img of await thumbImgs.all()) {
      await img.scrollIntoViewIfNeeded();
      await expect(img).toHaveJSProperty("complete", true);
      expect(await img.evaluate((el: HTMLImageElement) => [el.naturalWidth, el.naturalHeight])).toEqual([1254, 1254]);
    }
    for (const i of [4, 7, 0]) {
      await thumbs.nth(i).click();
      await expect(main).toHaveAttribute("src", srcs[i]);
      await expect(thumbs.nth(i)).toHaveAttribute("aria-pressed", "true");
    }
  });

  test("Follivance serum: eight images in order, thumbnails, previous/next and keyboard dialog", async ({ page }) => {
    const srcs = Array.from(
      { length: 8 },
      (_, i) => `/images/products/follivance-hair-density-serum-0${i + 1}.webp`,
    );
    await page.goto(`/shop/${SERUM}`);
    const gallery = page.getByTestId("product-gallery");
    const main = gallery.getByTestId("product-image").locator("img");
    await expect(main).toHaveAttribute("src", srcs[0]);
    await expect(main).toHaveCSS("object-fit", "contain");

    const thumbs = gallery.getByRole("group", { name: /images$/ }).getByRole("button");
    await expect(thumbs).toHaveCount(8);
    const thumbImgs = thumbs.locator("img");
    expect(await thumbImgs.evaluateAll((els) => els.map((el) => el.getAttribute("src")))).toEqual(srcs);
    // Every view loads (no 404), at its native square size.
    for (const img of await thumbImgs.all()) {
      await img.scrollIntoViewIfNeeded();
      await expect(img).toHaveJSProperty("complete", true);
      expect(await img.evaluate((el: HTMLImageElement) => [el.naturalWidth, el.naturalHeight])).toEqual([1254, 1254]);
    }

    // Thumbnails select their own image and show the selection.
    for (const i of [2, 7, 0]) {
      await thumbs.nth(i).click();
      await expect(main).toHaveAttribute("src", srcs[i]);
      await expect(thumbs.nth(i)).toHaveAttribute("aria-pressed", "true");
      await expect(gallery.locator('[aria-pressed="true"]')).toHaveCount(1);
    }

    // Previous/next wrap around the eight views.
    await gallery.getByRole("button", { name: "Previous image" }).click();
    await expect(main).toHaveAttribute("src", srcs[7]);
    await gallery.getByRole("button", { name: "Next image" }).click();
    await expect(main).toHaveAttribute("src", srcs[0]);
    await gallery.getByRole("button", { name: "Next image" }).click();
    await expect(main).toHaveAttribute("src", srcs[1]);

    // Dialog: arrow keys step through the views; Escape returns focus.
    const enlarge = gallery.getByRole("button", { name: /^Enlarge image/ });
    await enlarge.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: /Scalp Vitamin Serum/ });
    await expect(dialog).toBeVisible();
    const zoomed = dialog.locator("img");
    await expect(zoomed).toHaveAttribute("src", srcs[1]);
    await expect(dialog.getByText("Styled · Image 2 of 8", { exact: true })).toBeVisible();
    await page.keyboard.press("ArrowRight");
    await expect(zoomed).toHaveAttribute("src", srcs[2]);
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    await expect(zoomed).toHaveAttribute("src", srcs[0]);
    await expect(zoomed).toHaveCSS("object-fit", "contain");
    const box = (await zoomed.boundingBox())!;
    expect(Math.abs(box.width / box.height - 1)).toBeLessThan(0.02);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(enlarge).toBeFocused();
    await expect(main).toHaveAttribute("src", srcs[0]);
  });
});

test.describe("buy now", () => {
  test("checks out only this product and quantity, leaving the bag untouched", async ({ page }) => {
    await page.goto(`/shop/${SHAMPOO}`);
    await page.getByRole("button", { name: "Add to bag" }).click();
    await page.keyboard.press("Escape");
    const before = await page.evaluate(() => localStorage.getItem("auraderm_cart_v2"));

    await page.goto(`/shop/${SERUM}`);
    await page.getByRole("button", { name: /Increase quantity of/ }).click();
    await page.getByRole("button", { name: "Buy now" }).click();
    await expect(page).toHaveURL(new RegExp(`/checkout\\?buy=${SERUM}&qty=2$`));

    const summary = page.getByTestId("order-summary");
    await expect(summary).toContainText("Hair Fall Defense Scalp Vitamin Serum");
    await expect(summary).not.toContainText("Hair Fall Defense Shampoo");
    await expect(page.getByTestId("checkout-subtotal")).toHaveText("₱2,598.00");
    expect(await page.evaluate(() => localStorage.getItem("auraderm_cart_v2"))).toBe(before);
  });
});

test.describe("test checkout without configuration", () => {
  test("bag checkout shows server totals, delivery not configured, and cannot submit", async ({ page }) => {
    await page.goto(`/shop/${SHAMPOO}`);
    await page.getByRole("button", { name: /Increase quantity of/ }).click();
    await page.getByRole("button", { name: "Add to bag" }).click();
    await page.keyboard.press("Escape");
    await page.goto(`/shop/${SERUM}`);
    await page.getByRole("button", { name: "Add to bag" }).click();
    await page.getByRole("dialog", { name: "Your Bag" }).getByRole("link", { name: "Go to test checkout" }).click();

    await expect(page).toHaveURL(/\/checkout$/);
    await expect(page.getByRole("heading", { name: "Test mode" })).toBeVisible();
    await expect(page.getByTestId("checkout-subtotal")).toHaveText("₱3,897.00");
    await expect(page.getByTestId("checkout-total")).toHaveText("₱3,897.00");
    await expect(page.getByText("Total (before delivery)")).toBeVisible();
    await expect(page.getByText("Not configured", { exact: true })).toBeVisible();
    await expect(page.getByText("Checkout is not enabled on this site yet, so orders cannot be placed.")).toBeVisible();
    await expect(page.getByText(/Delivery pricing is not configured/).first()).toBeVisible();
    await expect(page.getByTestId("place-test-order")).toBeDisabled();
    await expect(page.getByTestId("place-test-order")).toHaveText("Checkout unavailable");
    await expect(page.getByLabel("Full name")).toBeDisabled();
    await expect(page.locator("main")).not.toContainText(/SUPABASE|PAYMONGO|GOOGLE_|sk_test/);

    // The bag is untouched by visiting checkout.
    await page.reload();
    await expect(page.getByTestId("checkout-subtotal")).toHaveText("₱3,897.00");
  });

  test("empty bag shows an empty state", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page.getByText("Your bag is empty.")).toBeVisible();
  });

  test("result page never shows success for an unknown order", async ({ page }) => {
    await page.goto("/checkout/result?ref=AD-T-ABCDEFGH&token=x");
    // Unconfigured here, so the status service is unavailable; never a success state.
    await expect(page.getByText(/not available|temporarily unavailable|could not find/)).toBeVisible();
    await expect(page.locator("main")).not.toContainText(/confirmed|recorded/i);
  });
});

test.describe("checkout API guards", () => {
  test("quote recalculates on the server and rejects tampering", async ({ request }) => {
    const ok = await request.post("/api/checkout/quote", {
      data: { lines: [{ handle: SHAMPOO, quantity: 2 }, { handle: SERUM, quantity: 1 }] },
    });
    expect(ok.status()).toBe(200);
    expect(await ok.json()).toMatchObject({ subtotalMinor: 389700, shippingMinor: null, totalMinor: 389700 });

    const tampered = await request.post("/api/checkout/quote", {
      data: { lines: [{ handle: SHAMPOO, quantity: 2, priceMinor: 1 }] },
    });
    expect(tampered.status()).toBe(400);
    expect((await tampered.json()).error).toBe("client_price_rejected");

    for (const lines of [[{ handle: SHAMPOO, quantity: 0 }], [{ handle: SHAMPOO, quantity: 99 }], [{ handle: "nope", quantity: 1 }]]) {
      expect((await request.post("/api/checkout/quote", { data: { lines } })).status()).toBe(400);
    }
  });

  test("orders, status, webhook and sync endpoints refuse to act without configuration", async ({ request }) => {
    const order = await request.post("/api/checkout/orders", {
      data: { idempotencyKey: "0f1e2d3c-4b5a-6978-8796-a5b4c3d2e1f0", acknowledgeTestMode: true, paymentMethod: "cod", lines: [{ handle: SHAMPOO, quantity: 1 }], expectedSubtotalMinor: 129900, customer: {} },
    });
    expect(order.status()).toBe(503);
    expect(await order.json()).toMatchObject({ ok: false, error: "checkout_unavailable" });

    expect((await request.get("/api/checkout/status?ref=AD-T-ABCDEFGH&token=x")).status()).toBe(503);
    expect((await request.post("/api/paymongo/webhook", { data: "{}", headers: { "paymongo-signature": "t=1,te=00,li=" } })).status()).toBe(503);
    expect((await request.post("/api/internal/sheet-sync")).status()).toBe(401);
  });
});

test.describe("mobile sticky purchase bar", () => {
  test("appears only after the purchase controls scroll away, reserves space and hides under the bag", async ({ page }, testInfo) => {
    await page.goto(`/shop/${SHAMPOO}`);
    const bar = page.getByTestId("sticky-purchase-bar");
    await expect(bar).toHaveCount(0);

    if (testInfo.project.name !== "mobile") {
      // Desktop keeps the purchase panel beside the gallery: no sticky bar.
      await page.mouse.wheel(0, 3000);
      await page.waitForTimeout(300);
      await expect(bar).toBeHidden();
      expect(await page.evaluate(() => getComputedStyle(document.body).paddingBottom)).toBe("0px");
      return;
    }

    await page.getByRole("heading", { name: "More from the collection" }).scrollIntoViewIfNeeded();
    await page.mouse.wheel(0, 600);
    await expect(bar).toBeVisible();
    expect(await page.evaluate(() => document.body.dataset.stickyPurchase)).toBe("on");

    // At the very bottom the footer stays fully above the bar.
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(200);
    const barBox = (await bar.boundingBox())!;
    const footerBox = (await page.locator("footer").last().boundingBox())!;
    expect(footerBox.y + footerBox.height).toBeLessThanOrEqual(barBox.y + 1);

    await bar.getByRole("button", { name: "Add to bag" }).click();
    const bag = page.getByRole("dialog", { name: "Your Bag" });
    await expect(bag).toBeVisible();
    await expect(bar).toBeHidden();
    await page.keyboard.press("Escape");
    await expect(bar).toBeVisible();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
