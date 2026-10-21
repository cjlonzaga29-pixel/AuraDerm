import { test, expect } from "@playwright/test";

// P4-P18: homepage Q&A between the routine and the unchanged closing section.
test.describe("homepage questions & answers", () => {
  test("sits after #routine and before the unchanged closing section", async ({ page }) => {
    await page.goto("/");
    const ids = await page.locator("main > section").evaluateAll((els) => els.map((el) => el.id));
    expect(ids.slice(-3)).toEqual(["routine", "questions", "closing"]);
    const questions = page.locator("#questions");
    await expect(questions.getByRole("heading", { level: 2, name: "Questions & answers" })).toBeVisible();
    await expect(questions.getByRole("button")).toHaveText([
      "Where should I start with the routine?",
      "Which shampoo should I choose?",
      "Do I rinse out the scalp serum?",
      "Where can I find ingredients and precautions?",
      "Are these the final prices and packaging?",
      "Can I place an order?",
    ]);
    const closing = page.locator("#closing");
    await expect(closing.locator("h2")).toHaveText("Make space for yourself.");
    await expect(closing.getByRole("link", { name: "Visit the shop" })).toHaveAttribute("href", "/shop");
  });

  test("opens and closes with the pointer, Enter and Space; focus is visible", async ({ page }) => {
    await page.goto("/");
    const triggers = page.locator("#questions").getByRole("button");

    const first = triggers.nth(0);
    await first.click();
    await expect(first).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#questions")).toContainText("Follow the three steps");
    await first.click();
    await expect(first).toHaveAttribute("aria-expanded", "false");

    const second = triggers.nth(1);
    await second.focus();
    await page.keyboard.press("Enter");
    await expect(second).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Enter");
    await expect(second).toHaveAttribute("aria-expanded", "false");

    const third = triggers.nth(2);
    await page.keyboard.press("Tab");
    await expect(third).toBeFocused();
    expect(await third.evaluate((el) => getComputedStyle(el).boxShadow)).not.toBe("none");
    await page.keyboard.press(" ");
    await expect(third).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#questions")).toContainText("do not rinse");
    await page.keyboard.press(" ");
    await expect(third).toHaveAttribute("aria-expanded", "false");
  });

  test("ordering answer matches the checkout page's availability", async ({ page }) => {
    await page.goto("/checkout?buy=hair-fall-defense-shampoo&qty=1");
    const enabled = !(await page.getByTestId("place-test-order").textContent())?.includes("Checkout unavailable");

    await page.goto("/");
    await page.locator("#questions").getByRole("button", { name: "Can I place an order?" }).click();
    const answer = page.getByRole("region", { name: "Can I place an order?" });
    if (enabled) {
      await expect(answer).toContainText("Checkout is open in test mode only");
      await expect(answer).toContainText("no real payment");
    } else {
      await expect(answer).toContainText("Checkout is not enabled on this site");
      await expect(answer).not.toContainText(/test mode/i);
    }
  });

  test("every answer link resolves, and #routine clears the header", async ({ page, request }) => {
    await page.goto("/");
    const triggers = page.locator("#questions").getByRole("button");
    for (let i = 0; i < 6; i++) await triggers.nth(i).click();
    const hrefs = await page
      .locator("#questions a[href]")
      .evaluateAll((els) => els.map((a) => a.getAttribute("href")!));
    expect(hrefs.length).toBeGreaterThanOrEqual(9);

    for (const href of new Set(hrefs)) {
      if (href.startsWith("#")) {
        await expect(page.locator(href), href).toHaveCount(1);
        continue;
      }
      const [route, hash] = href.split("#");
      expect((await request.get(route)).status(), href).toBe(200);
      if (hash) {
        const target = await page.context().newPage();
        await target.goto(route);
        await expect(target.locator(`#${hash}`), href).toHaveCount(1);
        await target.close();
      }
    }

    await page.locator("#questions").getByRole("link", { name: "See the routine" }).click();
    await expect(page).toHaveURL(/#routine$/);
    // Smooth scrolling may still be settling; the target must end below the header.
    await expect
      .poll(() =>
        page.evaluate(() => {
          const top = document.getElementById("routine")!.getBoundingClientRect().top;
          const header = document.querySelector("header")!.getBoundingClientRect().bottom;
          return top >= header - 1 && top < window.innerHeight / 2;
        }),
      )
      .toBe(true);
  });

  test("centered ~800px column, 44px+ targets and no overflow at 390/768/1440", async ({ page }) => {
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      const panel = page.locator("#questions [data-testid=home-questions]").locator("..");
      await panel.scrollIntoViewIfNeeded();
      const box = (await panel.boundingBox())!;
      expect(box.width, `width at ${width}`).toBeLessThanOrEqual(800);
      expect(Math.abs(box.x + box.width / 2 - width / 2), `centered at ${width}`).toBeLessThanOrEqual(2);
      const triggers = page.locator("#questions").getByRole("button");
      for (let i = 0; i < 6; i++) {
        const t = (await triggers.nth(i).boundingBox())!;
        expect(t.height, `trigger ${i} at ${width}`).toBeGreaterThanOrEqual(44);
        await triggers.nth(i).click();
      }
      for (const a of await page.locator("#questions a").all()) {
        expect((await a.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      }
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `overflow at ${width}`).toBeLessThanOrEqual(0);
      await page.screenshot({ path: `test-results/questions-${width}.png`, fullPage: false });
    }
  });

  test("product-page Q&A is still in place", async ({ page }) => {
    await page.goto("/shop/hair-fall-defense-shampoo");
    await expect(page.getByTestId("product-questions")).toHaveCount(1);
  });
});
