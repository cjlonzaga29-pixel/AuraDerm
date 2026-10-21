import { test, expect, request } from "@playwright/test";

test.describe("home P1-P5", () => {
  // P4-P7: #collection moved directly under the hero and now renders the
  // shop's ProductCard (compact variant) through the catalog adapter. The
  // compact card carries no price row, so the former "Price coming soon"
  // per-row label is replaced by a working "View product" link per card.
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
      ["Hair Fall Defense Scalp Vitamin Serum", "/shop/hair-fall-defense-scalp-vitamin-serum"],
      ["Scalp Balance Daily Shampoo", "/shop/scalp-balance-daily-shampoo"],
    ];
    for (const [i, [name, href]] of expectedCards.entries()) {
      await expect(cards.nth(i).getByRole("link", { name, exact: true })).toHaveAttribute("href", href);
      await expect(cards.nth(i)).toContainText("View product");
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

  test("commerce disabled: no prices or add-to-cart actions on the homepage", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: /add to (cart|bag)/i })).toHaveCount(0);
    await expect(page.locator("main")).not.toContainText(/[₱$]\s?\d/);
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
