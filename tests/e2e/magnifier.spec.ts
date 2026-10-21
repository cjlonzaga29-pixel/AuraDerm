import { expect, test, type Locator, type Page } from "@playwright/test";

// Hover magnifier on product pages: desktop mouse only, mapped through the
// image's object-contain bounds, never shifting layout or taking clicks.
// Phones keep tap-to-enlarge and swipe with no lens.

const PRODUCTS = [
  "hair-fall-defense-shampoo",
  "hair-fall-defense-conditioner",
  "scalp-balance-daily-shampoo",
  "hair-fall-defense-scalp-vitamin-serum",
];

const image = (page: Page) => page.getByTestId("product-gallery").getByTestId("product-image").locator("img");
const box = async (locator: Locator) => (await locator.boundingBox())!;

// Painted (object-contain) bounds of the gallery image, in page coordinates.
const paintedBounds = (img: Locator) =>
  img.evaluate((el: HTMLImageElement) => {
    const r = el.getBoundingClientRect();
    const scale = Math.min(r.width / el.naturalWidth, r.height / el.naturalHeight);
    const width = el.naturalWidth * scale;
    const height = el.naturalHeight * scale;
    return { x: r.left + (r.width - width) / 2, y: r.top + (r.height - height) / 2, width, height };
  });

test.describe("hover magnifier (desktop)", () => {
  test.beforeEach(({ page }, testInfo) => {
    void page;
    test.skip(testInfo.project.name !== "desktop", "desktop mouse only");
  });

  for (const handle of PRODUCTS) {
    test(`${handle}: follows the pointer, clamps at edges and dismisses without layout shift`, async ({ page }) => {
      await page.goto(`/shop/${handle}`);
      const img = image(page);
      await expect(img).toHaveJSProperty("complete", true);
      const preview = page.getByTestId("magnifier-preview");
      const lens = page.getByTestId("magnifier-lens");
      const heading = page.getByRole("heading", { level: 1 });
      const addToBag = page.getByRole("button", { name: "Add to bag" });
      const before = { heading: await box(heading), add: await box(addToBag) };

      await expect(preview).toHaveCount(0);
      const p = await paintedBounds(img);
      const gallery = await box(img);

      // Centre: preview appears beside the gallery, lens centred on the image.
      await page.mouse.move(p.x + p.width / 2, p.y + p.height / 2);
      await expect(preview).toBeVisible();
      const pv = await box(preview);
      expect(pv.x).toBeGreaterThanOrEqual(gallery.x + gallery.width);
      expect(pv.x + pv.width).toBeLessThanOrEqual(page.viewportSize()!.width);
      // Square frame: the lens and preview follow the painted bottle, not the
      // pillarbox bands, and the preview stays inside the purchase grid.
      expect(Math.abs(gallery.width - gallery.height)).toBeLessThanOrEqual(1);
      expect(Math.abs(pv.height - p.height)).toBeLessThan(1.5);
      const grid = await box(page.getByTestId("product-detail"));
      expect(pv.x + pv.width).toBeLessThanOrEqual(grid.x + grid.width + 0.5);
      const centre = await box(lens);
      expect(Math.abs(centre.x + centre.width / 2 - (p.x + p.width / 2))).toBeLessThan(2);
      expect(Math.abs(centre.y + centre.height / 2 - (p.y + p.height / 2))).toBeLessThan(2);
      // ~2× from the 1122px source, not more.
      const zoomed = await box(preview.locator("img"));
      expect(zoomed.width / p.width).toBeGreaterThan(1.9);
      expect(zoomed.width / p.width).toBeLessThanOrEqual(2.001);
      // An overlay that never takes clicks.
      await expect(preview).toHaveCSS("pointer-events", "none");
      await expect(lens).toHaveCSS("pointer-events", "none");

      // Edges: the lens is clamped inside the painted image.
      const edges = [
        { x: p.x + 2, y: p.y + p.height / 2, check: (l: typeof centre) => Math.abs(l.x - p.x) },
        { x: p.x + p.width - 2, y: p.y + p.height / 2, check: (l: typeof centre) => Math.abs(l.x + l.width - (p.x + p.width)) },
        { x: p.x + p.width / 2, y: p.y + 2, check: (l: typeof centre) => Math.abs(l.y - p.y) },
        { x: p.x + p.width / 2, y: p.y + p.height - 2, check: (l: typeof centre) => Math.abs(l.y + l.height - (p.y + p.height)) },
      ];
      for (const edge of edges) {
        await page.mouse.move(edge.x, edge.y);
        await expect(preview).toBeVisible();
        expect(edge.check(await box(lens))).toBeLessThan(1.5);
        // The magnified image always covers the preview: no blank margin.
        const z = await box(preview.locator("img"));
        const pb = await box(preview);
        expect(z.x).toBeLessThanOrEqual(pb.x + 1.5);
        expect(z.y).toBeLessThanOrEqual(pb.y + 1.5);
        expect(z.x + z.width).toBeGreaterThanOrEqual(pb.x + pb.width - 1.5);
        expect(z.y + z.height).toBeGreaterThanOrEqual(pb.y + pb.height - 1.5);
      }

      // Exit: immediate dismissal; product copy never moved.
      await page.mouse.move(gallery.x + gallery.width / 2, gallery.y + gallery.height + 120);
      await expect(preview).toHaveCount(0);
      await expect(lens).toHaveCount(0);
      expect(await box(heading)).toEqual(before.heading);
      expect(await box(addToBag)).toEqual(before.add);
      await expect(addToBag).toBeVisible();
    });
  }

  test("letterbox and pillarbox padding never show a crop; landscape maps through object-contain", async ({ page }) => {
    await page.goto(`/shop/${PRODUCTS[0]}`);
    const img = image(page);
    await expect(img).toHaveJSProperty("complete", true);
    const preview = page.getByTestId("magnifier-preview");
    const lens = page.getByTestId("magnifier-lens");

    // Portrait source in a wide frame → pillarbox bands left and right.
    await page.getByTestId("product-gallery").getByTestId("product-image").evaluate((el: HTMLElement) => {
      el.style.aspectRatio = "16 / 9";
    });
    let p = await paintedBounds(img);
    let frame = await box(img);
    expect(p.x - frame.x).toBeGreaterThan(40);
    await page.mouse.move(frame.x + 10, p.y + p.height / 2);
    await expect(preview).toHaveCount(0);
    await page.mouse.move(frame.x + frame.width - 10, p.y + p.height / 2);
    await expect(preview).toHaveCount(0);
    await page.mouse.move(p.x + 3, p.y + p.height / 2);
    await expect(preview).toBeVisible();
    expect((await box(lens)).x).toBeGreaterThanOrEqual(p.x - 0.5);

    // Landscape source (a combined front/back shot's shape) in the 4:5 frame →
    // letterbox bands above and below.
    await page.mouse.move(0, 0);
    await page.getByTestId("product-gallery").getByTestId("product-image").evaluate((el: HTMLElement) => {
      el.style.aspectRatio = "4 / 5";
    });
    await img.evaluate(
      (el: HTMLImageElement) =>
        new Promise<void>((resolve) => {
          el.addEventListener("load", () => resolve(), { once: true });
          el.src = "/images/ingredients/aloe-vera.webp"; // 1536 × 1024
        }),
    );
    p = await paintedBounds(img);
    frame = await box(img);
    expect(p.y - frame.y).toBeGreaterThan(80);
    await page.mouse.move(p.x + p.width / 2, frame.y + 10);
    await expect(preview).toHaveCount(0);
    await page.mouse.move(p.x + p.width / 2, frame.y + frame.height - 10);
    await expect(preview).toHaveCount(0);
    await page.mouse.move(p.x + p.width / 2, p.y + p.height / 2);
    await expect(preview).toBeVisible();
    const l = await box(lens);
    expect(l.y).toBeGreaterThanOrEqual(p.y - 0.5);
    expect(l.y + l.height).toBeLessThanOrEqual(p.y + p.height + 0.5);
    expect(Math.abs(l.y + l.height / 2 - (p.y + p.height / 2))).toBeLessThan(2);
    // The preview takes the painted image's shape, not the frame's.
    expect(Math.abs((await box(preview)).height - p.height)).toBeLessThan(1.5);
  });

  test("scrolling, the controls and the dialog dismiss it; keyboard zoom returns focus", async ({ page }) => {
    await page.goto(`/shop/${PRODUCTS[3]}`);
    const img = image(page);
    await expect(img).toHaveJSProperty("complete", true);
    const preview = page.getByTestId("magnifier-preview");
    const p = await paintedBounds(img);

    await page.mouse.move(p.x + p.width / 2, p.y + p.height / 2);
    await expect(preview).toBeVisible();
    await page.mouse.wheel(0, 200);
    await expect(preview).toHaveCount(0);
    await page.evaluate(() => window.scrollTo(0, 0));

    // Hovering the Enlarge control leaves the image: no preview over it.
    const enlarge = page.getByRole("button", { name: /^Enlarge image/ });
    const q = await paintedBounds(img);
    await page.mouse.move(q.x + q.width / 2, q.y + q.height / 2);
    await expect(preview).toBeVisible();
    await enlarge.hover();
    await expect(preview).toHaveCount(0);

    // Clicking the image opens the dialog, and the preview is gone.
    await page.mouse.click(q.x + q.width / 2, q.y + q.height / 2);
    const dialog = page.getByRole("dialog", { name: /Scalp Vitamin Serum/ });
    await expect(dialog).toBeVisible();
    await expect(preview).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();

    // Keyboard route: Enter on the Enlarge button, Escape, focus returns.
    await page.mouse.move(0, 0);
    await enlarge.focus();
    await page.keyboard.press("Enter");
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(enlarge).toBeFocused();

    // Changing image under a resting pointer drops the stale preview; the
    // next move rebuilds it from the new image.
    await page.mouse.move(q.x + q.width / 2, q.y + q.height / 2);
    await expect(preview.locator("img")).toHaveAttribute("src", /follivance-hair-density-serum-01\.webp$/);
    await page.getByRole("button", { name: "Next image" }).focus();
    await page.keyboard.press("Enter");
    await expect(img).toHaveAttribute("src", /follivance-hair-density-serum-02\.webp$/);
    await expect(preview).toHaveCount(0);
    await page.mouse.move(q.x + q.width / 2 + 4, q.y + q.height / 2 + 4);
    await expect(preview.locator("img")).toHaveAttribute("src", /follivance-hair-density-serum-02\.webp$/);
    await page.mouse.move(0, 0);

    // Purchase controls stay clickable straight after a hover.
    await page.mouse.move(q.x + q.width / 2, q.y + q.height / 2);
    await expect(preview).toBeVisible();
    await page.getByRole("button", { name: "Add to bag" }).click();
    await expect(page.getByRole("dialog", { name: "Your Bag" })).toBeVisible();
  });
});

test.describe("touch (phone)", () => {
  test.beforeEach(({ page }, testInfo) => {
    void page;
    test.skip(testInfo.project.name !== "mobile", "phone viewport only");
  });

  test("no lens; a swipe does not enlarge, a tap does", async ({ browser, baseURL }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
      baseURL,
    });
    const page = await context.newPage();
    await page.goto(`/shop/${PRODUCTS[0]}`);
    const img = image(page);
    await expect(img).toHaveJSProperty("complete", true);
    const b = await box(img);
    const cx = b.x + b.width / 2;
    const cy = b.y + b.height / 2;

    const cdp = await context.newCDPSession(page);
    const touch = (type: "touchStart" | "touchMove" | "touchEnd", x: number, y: number) =>
      cdp.send("Input.dispatchTouchEvent", {
        type,
        touchPoints: type === "touchEnd" ? [] : [{ x, y }],
      });
    await touch("touchStart", cx, cy);
    for (let i = 1; i <= 8; i++) await touch("touchMove", cx - i * 12, cy);
    // Rest before lifting: a fling would make Chrome swallow the next tap.
    await page.waitForTimeout(300);
    await touch("touchMove", cx - 96, cy);
    await touch("touchEnd", cx - 96, cy);
    await page.waitForTimeout(700);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByTestId("magnifier-preview")).toHaveCount(0);

    await page.touchscreen.tap(cx, cy);
    const dialog = page.getByRole("dialog", { name: /Hair Fall Defense Shampoo/ });
    await expect(dialog).toBeVisible();
    await expect(page.getByTestId("magnifier-preview")).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await context.close();
  });

  test("Follivance serum: swiping steps through the gallery without enlarging", async ({ browser, baseURL }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
      baseURL,
    });
    const page = await context.newPage();
    await page.goto(`/shop/${PRODUCTS[3]}`);
    const img = image(page);
    await expect(img).toHaveJSProperty("complete", true);
    const b = await box(img);
    const cx = b.x + b.width / 2;
    const cy = b.y + b.height / 2;

    const cdp = await context.newCDPSession(page);
    const touch = (type: "touchStart" | "touchMove" | "touchEnd", x: number, y: number) =>
      cdp.send("Input.dispatchTouchEvent", {
        type,
        touchPoints: type === "touchEnd" ? [] : [{ x, y }],
      });
    const swipe = async (dx: number) => {
      await touch("touchStart", cx, cy);
      for (let i = 1; i <= 8; i++) await touch("touchMove", cx + (dx * i) / 8, cy);
      await page.waitForTimeout(300);
      await touch("touchEnd", cx + dx, cy);
      await page.waitForTimeout(700);
    };
    await swipe(-96);
    await expect(img).toHaveAttribute("src", /follivance-hair-density-serum-02\.webp$/);
    await swipe(96);
    await expect(img).toHaveAttribute("src", /follivance-hair-density-serum-01\.webp$/);
    await swipe(96);
    await expect(img).toHaveAttribute("src", /follivance-hair-density-serum-08\.webp$/);
    await expect(page.getByRole("dialog")).toHaveCount(0);

    await page.touchscreen.tap(cx, cy);
    const dialog = page.getByRole("dialog", { name: /Scalp Vitamin Serum — Image 8 of 8/ });
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await context.close();
  });

  test("a mouse at phone width gets no lens", async ({ page }) => {
    await page.goto(`/shop/${PRODUCTS[0]}`);
    const b = await box(image(page));
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await page.mouse.move(b.x + b.width / 2 + 5, b.y + b.height / 2 + 5);
    await expect(page.getByTestId("magnifier-preview")).toHaveCount(0);
  });
});
