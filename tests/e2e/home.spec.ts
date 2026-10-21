import { test, expect, request } from "@playwright/test";

test.describe("home P1-P5", () => {
  // P4-P7: #collection moved directly under the hero and now renders the
  // shop's ProductCard (compact variant) through the catalog adapter.
  // P4-P10: explicit display order (serum last) and a labelled sample price
  // on every card; the card still links to its page rather than selling.
  test("#collection follows the hero with the 4 catalog products linking to their pages; #routine shows 3 ordered steps", async ({
    page,
  }) => {
    await page.goto("/");
    const collection = page.locator("#collection");
    await expect(collection).toHaveCount(1);
    await expect(page.locator("main > section").nth(1)).toHaveAttribute("id", "collection");
    const cards = collection.getByTestId("product-card");
    await expect(cards).toHaveCount(4);
    const expectedCards: [string, string][] = [
      ["Hair Fall Defense Shampoo", "/shop/hair-fall-defense-shampoo"],
      ["Hair Fall Defense Conditioner", "/shop/hair-fall-defense-conditioner"],
      ["Scalp Balance Daily Shampoo", "/shop/scalp-balance-daily-shampoo"],
      ["Hair Fall Defense Scalp Vitamin Serum", "/shop/hair-fall-defense-scalp-vitamin-serum"],
    ];
    for (const [i, [name, href]] of expectedCards.entries()) {
      await expect(cards.nth(i).getByRole("link", { name, exact: true })).toHaveAttribute("href", href);
      await expect(cards.nth(i)).toContainText("View product");
      await expect(cards.nth(i).getByTestId("price")).toHaveText(/^₱1,299\.00\s*Sample price$/);
    }
    await expect(collection.getByText("Price coming soon")).toHaveCount(0);
    await expect(page.locator("#actives")).toHaveCount(0);

    const steps = page.locator("#routine ol li h3");
    await expect(steps).toHaveCount(3);
    await expect(steps.nth(0)).toHaveText("Cleanse");
    await expect(steps.nth(1)).toHaveText("Condition");
    await expect(steps.nth(2)).toHaveText("Scalp care");
  });

  test("hero introduces the hair-care range; CTAs go to /shop and #routine", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toHaveText("Rooted in nature. Made for your hair.");
    const hero = page.locator("main section").first();
    await expect(hero.getByRole("link", { name: "Shop now" })).toHaveAttribute("href", "/shop");
    await hero.getByRole("link", { name: "Explore the routine" }).click();
    await expect(page).toHaveURL(/#routine$/);
    await expect(page.locator("#routine")).toBeInViewport();
  });

  test("routine and ingredient links point at the right product pages", async ({ page }) => {
    await page.goto("/");
    const routine = page.locator("#routine");
    const expected: [string, string][] = [
      ["Hair Fall Defense Shampoo", "/shop/hair-fall-defense-shampoo"],
      ["Scalp Balance Daily Shampoo", "/shop/scalp-balance-daily-shampoo"],
      ["Hair Fall Defense Conditioner", "/shop/hair-fall-defense-conditioner"],
      ["Scalp Vitamin Serum", "/shop/hair-fall-defense-scalp-vitamin-serum"],
    ];
    for (const [name, href] of expected) {
      await expect(routine.getByRole("link", { name, exact: true })).toHaveAttribute("href", href);
    }

    const ingredients = page.locator("#ingredients");
    await expect(ingredients).toContainText("Ingredients vary by product");
    const rosemary = ingredients.locator("li", { hasText: "Rosemary" });
    await expect(rosemary.getByRole("link")).toHaveCount(2);
    await rosemary.getByRole("link", { name: "Hair Fall Defense Scalp Vitamin Serum" }).click();
    await expect(page).toHaveURL(/\/shop\/hair-fall-defense-scalp-vitamin-serum$/);
  });

  test("no leftover skincare routine or botanicals on the homepage", async ({ page }) => {
    await page.goto("/");
    const main = page.locator("main");
    await expect(main).not.toContainText(/skincare|\bskin\b|sun protection|SPF|\blayer/i);
    await expect(main).not.toContainText(/chamomile|\brose\b|\boat\b/i);
  });

  test("commerce disabled: only labelled sample prices, no add-to-cart actions on the homepage", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: /add to (cart|bag)/i })).toHaveCount(0);
    const collection = page.locator("#collection");
    await expect(collection.getByText("Sample price", { exact: true })).toHaveCount(4);
    // Every peso amount on the page is a labelled sample price on a card.
    const amounts = await page
      .locator("main")
      .evaluate((el) => el.textContent?.match(/₱\s?[\d,.]+/g) ?? []);
    expect(amounts).toEqual(Array(4).fill("₱1,299.00"));
    await expect(page.locator("main")).not.toContainText(/\$\s?\d/);
  });

  test("compact collection cards: ~260px four across, 2/1 columns below, bottles uncropped", async ({
    page,
  }) => {
    for (const [width, columns] of [
      [390, 1],
      [768, 2],
      [1440, 4],
    ] as const) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      const cards = page.locator("#collection").getByTestId("product-card");
      await cards.first().scrollIntoViewIfNeeded();
      const boxes = await cards.evaluateAll((els) =>
        els.map((el) => {
          const r = el.getBoundingClientRect();
          return { x: Math.round(r.x), y: Math.round(r.y + window.scrollY), w: r.width, right: r.right };
        }),
      );
      expect(new Set(boxes.map((b) => b.y)).size, `rows at ${width}`).toBe(4 / columns);
      for (const box of boxes) {
        expect(box.right, `card inside viewport at ${width}`).toBeLessThanOrEqual(width);
      }
      if (width === 1440) {
        for (const box of boxes) {
          expect(box.w).toBeGreaterThanOrEqual(250);
          expect(box.w).toBeLessThanOrEqual(280);
        }
        // The serum is the far-right card of the row and last in the DOM.
        const rightmost = boxes.reduce((best, b, i) => (b.x > boxes[best].x ? i : best), 0);
        expect(rightmost).toBe(3);
        await expect(cards.nth(3)).toContainText("Hair Fall Defense Scalp Vitamin Serum");
        const fontSize = (selector: string) =>
          cards
            .first()
            .locator(selector)
            .first()
            .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
        const titleSize = await fontSize("h3");
        expect(titleSize).toBeGreaterThanOrEqual(22);
        expect(titleSize).toBeLessThanOrEqual(24);
        expect(await fontSize("h3 + p")).toBeGreaterThanOrEqual(16);
      }
      for (let i = 0; i < 4; i++) {
        const figure = cards.nth(i).getByTestId("product-image");
        await expect(figure.locator("img")).toHaveCSS("object-fit", "contain");
        await expect(figure.getByText("Illustrative packaging")).toBeVisible();
        const ratio = await figure.evaluate((el) => el.clientWidth / el.clientHeight);
        expect(ratio).toBeCloseTo(0.8, 2);
      }
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `overflow at ${width}`).toBeLessThanOrEqual(0);
    }
  });

  test("with site.sustainability null: no GivesBack element in the DOM", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('[data-testid="gives-back"]')).toHaveCount(0);
    await expect(page.locator("#gives-back")).toHaveCount(0);
  });

  test("footer shows no Shipping & Returns link while commerce is false", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("footer")).toHaveCount(1);
    await expect(page.locator("footer >> text=Shipping & Returns")).toHaveCount(0);
    await expect(page.locator("footer >> text=Privacy")).toHaveCount(1);
    await expect(page.locator("footer >> text=Terms")).toHaveCount(1);
  });

  test("no horizontal overflow; exactly one h1 on / and /about", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toHaveCount(1);
    let overflow = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    );
    expect(overflow).toBe(true);

    await page.goto("/about");
    await expect(page.locator("h1")).toHaveCount(1);
    overflow = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    );
    expect(overflow).toBe(true);
  });

  test("link integrity: every href on / and /about resolves", async ({ page, baseURL }) => {
    const apiContext = await request.newContext({ baseURL });
    const checked: { href: string; result: string }[] = [];

    for (const path of ["/", "/about"]) {
      await page.goto(path);
      const hrefs = await page.locator("a[href]").evaluateAll((anchors) =>
        anchors.map((a) => a.getAttribute("href")).filter((h): h is string => !!h),
      );

      for (const href of hrefs) {
        if (href.startsWith("#")) {
          const id = href.slice(1);
          const count = await page.locator(`#${id}`).count();
          checked.push({ href: `${path} -> ${href}`, result: count > 0 ? "matched id" : "MISSING id" });
          expect(count, `anchor ${href} on ${path} should match an element id`).toBeGreaterThan(0);
          continue;
        }

        if (href.startsWith("/")) {
          const [routePath, hash] = href.split("#");
          const response = await apiContext.get(routePath || "/");
          const status = response.status();
          checked.push({ href: `${path} -> ${href}`, result: `${status}` });
          expect(status, `internal link ${href} on ${path} should return 200`).toBe(200);

          if (hash) {
            const targetPage = await page.context().newPage();
            await targetPage.goto(routePath || "/");
            const count = await targetPage.locator(`#${hash}`).count();
            checked.push({
              href: `${path} -> ${href}`,
              result: count > 0 ? "matched id on target route" : "MISSING id on target route",
            });
            expect(count, `anchor ${href} on ${path} should match an id on ${routePath}`).toBeGreaterThan(0);
            await targetPage.close();
          }
          continue;
        }

        checked.push({ href: `${path} -> ${href}`, result: "external, skipped" });
      }
    }

    console.log("LINK INTEGRITY", JSON.stringify(checked, null, 2));
    await apiContext.dispose();
  });
});
