import { test, expect } from "@playwright/test";

test.describe("sections 3-5", () => {
  // P3-P15: the benefit cards were folded into #statement as three h3 rows.
  test("#ingredients shows 5 items; statement shows the 3 benefits", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#ingredients")).toHaveCount(1);
    await expect(page.locator("#ingredients li h3")).toHaveCount(5);
    await expect(page.locator("#statement h3")).toHaveCount(3);
    await expect(page.locator("#benefits")).toHaveCount(0);
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
    expect(count).toBe(6);
    for (let i = 0; i < count; i++) {
      await expect(sections.nth(i)).toHaveCSS("opacity", "1");
    }
  });

  test("with JavaScript disabled: section content is visible", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/");
    for (const id of ["#statement", "#collection", "#ingredients", "#routine", "#closing"]) {
      await expect(page.locator(`${id} h2`)).toBeVisible();
      await expect(page.locator(id)).toHaveCSS("opacity", "1");
    }
    await context.close();
  });

  test("anchored sections land below the fixed header", async ({ page }) => {
    await page.goto("/");
    for (const id of ["collection", "ingredients", "routine"]) {
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
