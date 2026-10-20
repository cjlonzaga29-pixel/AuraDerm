import { test, expect, request } from "@playwright/test";

test.describe("home P1-P5", () => {
  // P3-P15: #actives (four concept badges) was consolidated into #collection,
  // and the routine dropped its AM/SPF REAPPLY/PM slot labels (the middle
  // label contradicted its "Layer" step) for plain numbered steps.
  test("#collection lists 3 concept products, each labelled not for sale; #routine shows 3 ordered steps", async ({
    page,
  }) => {
    await page.goto("/");
    const collection = page.locator("#collection");
    await expect(collection).toHaveCount(1);
    await expect(collection.locator("li h3")).toHaveCount(3);
    await expect(collection.getByText("Concept · not for sale")).toHaveCount(3);
    await expect(page.locator("#actives")).toHaveCount(0);

    const steps = page.locator("#routine ol li h3");
    await expect(steps).toHaveCount(3);
    await expect(steps.nth(0)).toHaveText("Cleanse");
    await expect(steps.nth(1)).toHaveText("Layer");
    await expect(steps.nth(2)).toHaveText("Complete");
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
