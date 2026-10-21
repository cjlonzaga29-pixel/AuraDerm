import { test, expect, type Page } from "@playwright/test";

// P4-P17: complete footer plus the /privacy and /terms preview policies.
// The local build has no checkout configuration, so both pages must report
// checkout as switched off.

const EXPLORE = [
  ["Shop", "/shop"],
  ["Collection", "/#collection"],
  ["Ingredients", "/#ingredients"],
  ["Routine", "/#routine"],
  ["Our story", "/about"],
] as const;

const INFORMATION = [
  ["Privacy Policy", "/privacy"],
  ["Terms & Conditions", "/terms"],
] as const;

async function expectNoOverflow(page: Page, label: string) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, `horizontal overflow on ${label}`).toBeLessThanOrEqual(0);
}

test.describe("footer and legal pages P4-P17", () => {
  test("footer lists Explore and Information links, the disclosures and the copyright", async ({ page }) => {
    await page.goto("/shop/hair-fall-defense-shampoo");
    const footer = page.locator("footer");
    await expect(footer.getByRole("link", { name: "AuraDerm Botanicals home" })).toHaveAttribute("href", "/");
    for (const [name, href] of EXPLORE) {
      await expect(footer.getByRole("navigation", { name: "Explore" }).getByRole("link", { name, exact: true })).toHaveAttribute("href", href);
    }
    for (const [name, href] of INFORMATION) {
      await expect(footer.getByRole("navigation", { name: "Information" }).getByRole("link", { name, exact: true })).toHaveAttribute("href", href);
    }
    // One concise preview line in the footer.
    await expect(footer).toContainText("illustrative packaging");
    await expect(footer).toContainText("samples for testing");
    await expect(footer.getByText(/Design preview/)).toHaveCount(1);
    await expect(footer).toContainText(`© ${new Date().getFullYear()} AuraDerm Botanicals`);
    // No invented contact or social links while site.social is empty.
    await expect(footer.locator('a[href^="mailto:"], a[href^="tel:"], a[href^="http"]')).toHaveCount(0);
    await expect(footer.locator("form")).toHaveCount(0);
  });

  test("every footer link resolves, and section links reach homepage anchors from a product page", async ({ page, request }) => {
    for (const [, href] of [...EXPLORE, ...INFORMATION]) {
      const response = await request.get(href.split("#")[0]);
      expect(response.status(), href).toBe(200);
    }
    await page.goto("/shop/hair-fall-defense-shampoo");
    await page.locator("footer").getByRole("link", { name: "Ingredients", exact: true }).click();
    await expect(page).toHaveURL(/\/#ingredients$/);
    await expect(page.locator("#ingredients")).toBeInViewport();
  });

  test("footer logo keeps its transparent background", async ({ page }) => {
    await page.goto("/privacy");
    const logo = page.locator("footer img[alt='AuraDerm Botanicals home']");
    await logo.scrollIntoViewIfNeeded();
    await expect(logo).toBeVisible();
    const result = await logo.evaluate(async (img: HTMLImageElement) => {
      await img.decode();
      const canvas = new OffscreenCanvas(img.naturalWidth, img.naturalHeight);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      return {
        cornerAlpha: ctx.getImageData(0, 0, 1, 1).data[3],
        imgBg: getComputedStyle(img).backgroundColor,
        linkBg: getComputedStyle(img.parentElement!).backgroundColor,
      };
    });
    expect(result.cornerAlpha).toBe(0);
    expect(result.imgBg).toBe("rgba(0, 0, 0, 0)");
    expect(result.linkBg).toBe("rgba(0, 0, 0, 0)");
  });

  test("privacy policy reflects the switched-off checkout and marks itself a preview", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.locator("header.site-header")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Privacy Policy");
    await expect(page.getByRole("note")).toContainText("Preview policy.");
    await expect(page.locator("#current-status")).toContainText("Checkout is switched off on this website.");
    for (const id of ["information-you-provide", "bag-and-browser-storage", "cookies-and-analytics", "service-providers", "security", "retention", "your-requests", "changes"]) {
      await expect(page.locator(`#${id}`)).toHaveCount(1);
    }
    await expect(page.locator("main")).not.toContainText("[");
  });

  test("terms reflect the switched-off checkout and make no sale, refund or shipping promises", async ({ page }) => {
    await page.goto("/terms");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Terms & Conditions");
    await expect(page.getByRole("note")).toContainText("Preview terms.");
    await expect(page.locator("#bag-and-checkout")).toContainText("Checkout is switched off");
    await expect(page.locator("main")).not.toContainText(/no refunds|free shipping|governing law/i);
    await expect(page.locator("main")).not.toContainText("[");
  });

  for (const width of [390, 768, 1440]) {
    test(`footer, privacy and terms have no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const path of ["/privacy", "/terms", "/about", "/shop/hair-fall-defense-scalp-vitamin-serum"]) {
        await page.goto(path);
        await expectNoOverflow(page, `${path} at ${width}px`);
        const footerBox = (await page.locator("footer").boundingBox())!;
        expect(footerBox.width, `footer width on ${path}`).toBeLessThanOrEqual(width);
      }
    });
  }
});
