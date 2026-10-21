import { test, expect } from "@playwright/test";

test.describe("sections 3-5", () => {
  // P4-P7: the strip narrowed to three botanical tiles, #statement became an
  // open two-line statement (its benefit rows retired), and the editorial and
  // ingredient-spotlight sections were added in the reference page order.
  test("section order; #ingredients shows 3 tiles; spotlight has 3 callouts and a product link", async ({ page }) => {
    await page.goto("/");
    const ids = await page.locator("main > section").evaluateAll((els) => els.map((el) => el.id));
    expect(ids).toEqual(["", "collection", "care", "statement", "formula", "ingredients", "routine", "questions", "closing"]);
    await expect(page.locator("#ingredients li h3")).toHaveText(["Aloe Vera", "Batana Oil", "Rosemary"]);
    // P13: supplied ingredient and routine images replace the placeholders.
    const tileImages = page.locator("#ingredients li img");
    await expect(tileImages).toHaveCount(3);
    for (const [i, name] of ["aloe-vera", "batana-oil", "rosemary"].entries()) {
      await expect(tileImages.nth(i)).toHaveAttribute("src", `/images/ingredients/${name}.webp`);
    }
    await expect(page.locator("#routine img")).toHaveAttribute("src", "/images/home/routine-scalp-serum.webp");
    await expect(page.locator("#ingredients, #routine").getByTestId("media-placeholder")).toHaveCount(0);
    await expect(page.locator("#statement h3")).toHaveCount(0);
    await expect(page.locator("#benefits")).toHaveCount(0);
    await expect(page.locator("#formula li h3")).toHaveText(["Niacinamide", "Caffeine", "Peppermint Oil"]);
    await expect(page.locator("#formula")).not.toContainText(/Zinc PCA|Willow Bark|Tea Tree|Scalp Balance/);
    await expect(page.locator("#formula img")).toHaveAttribute("src", /spotlight-scalp-serum/);
    await expect(page.locator("#formula")).toContainText("Illustrative packaging");
    await expect(
      page.locator("#formula").getByRole("link", { name: "View Hair Fall Defense Scalp Vitamin Serum" }),
    ).toHaveAttribute("href", "/shop/hair-fall-defense-scalp-vitamin-serum");
    await expect(page.locator("#care").getByRole("link", { name: "Explore the routine" })).toHaveAttribute(
      "href",
      "#routine",
    );
  });

  test("exactly one h1 on /; section headings are h2", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toHaveCount(1);
    const h2Count = await page.locator("h2").count();
    expect(h2Count).toBeGreaterThanOrEqual(2);
  });

  // P3-P15 removed the scroll-triggered Reveal fade ("no unnecessary entrance
  // animation"); the safety property it guarded — content is never left
  // invisible without scrolling or without JS — is still asserted directly.
  test("no entrance animation: every section is fully opaque without scrolling", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("[data-reveal]")).toHaveCount(0);
    const sections = page.locator("main section");
    const count = await sections.count();
    expect(count).toBe(9);
    for (let i = 0; i < count; i++) {
      await expect(sections.nth(i)).toHaveCSS("opacity", "1");
    }
  });

  test("with JavaScript disabled: section content is visible", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/");
    for (const id of ["#collection", "#care", "#statement", "#formula", "#ingredients", "#routine", "#questions", "#closing"]) {
      await expect(page.locator(`${id} h2`)).toBeVisible();
      await expect(page.locator(id)).toHaveCSS("opacity", "1");
    }
    await context.close();
  });

  test("anchored sections land below the fixed header", async ({ page }) => {
    await page.goto("/");
    for (const id of ["collection", "care", "formula", "ingredients", "routine", "questions"]) {
      await page.evaluate((target) => {
        document.documentElement.style.scrollBehavior = "auto";
        document.getElementById(target)?.scrollIntoView();
      }, id);
      const { top, headerBottom } = await page.evaluate((target) => ({
        top: document.getElementById(target)!.getBoundingClientRect().top,
        headerBottom: document.querySelector("header")!.getBoundingClientRect().bottom,
      }), id);
      expect(top, `#${id} should not sit under the header`).toBeGreaterThanOrEqual(headerBottom - 1);
    }
  });

  test("no horizontal overflow", async ({ page }) => {
    await page.goto("/");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    );
    expect(overflow).toBe(true);
  });

  test("the P1-P3 spacer no longer exists", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#stage-test")).toHaveCount(0);
  });
});
