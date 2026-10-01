import { test, expect, type Page } from "@playwright/test";

async function scrollPastHero(page: Page) {
  await page.evaluate(() => window.scrollTo(0, 1.2 * window.innerHeight));
  await page.waitForFunction(
    () => window.scrollY >= 1.2 * window.innerHeight,
  );
}

test.describe("pinned video stage", () => {
  test("scrollY 0: hero video has required attributes", async ({ page }) => {
    await page.goto("/");

    const videoA = page.getByTestId("stage-video-a");
    await expect(videoA).toHaveCount(1);
    await expect(videoA).toHaveJSProperty("muted", true);
    await expect(videoA).toHaveAttribute("playsinline", "");
    await expect(videoA).toHaveAttribute("loop", "");
    await expect(videoA).toHaveAttribute("autoplay", "");
    await expect(videoA).toHaveJSProperty("loop", true);
  });

  test("scrollY 0: hero video keeps playing across a loop/ended cycle", async ({ page }) => {
    await page.goto("/");
    const videoA = page.getByTestId("stage-video-a");
    await videoA.evaluate((el: HTMLVideoElement) => {
      el.dispatchEvent(new Event("ended"));
    });
    await page.waitForFunction(() => {
      const el = document.querySelector('[data-testid="stage-video-a"]') as HTMLVideoElement | null;
      return el ? !el.paused : false;
    });
    const paused = await videoA.evaluate((el: HTMLVideoElement) => el.paused);
    expect(paused).toBe(false);
  });

  test("scrolling past the hero: same sharp video stays visible and keeps playing", async ({
    page,
  }) => {
    await page.goto("/");
    const videoA = page.getByTestId("stage-video-a");
    const srcBefore = await videoA.evaluate(
      (el: HTMLVideoElement) => el.currentSrc,
    );

    await scrollPastHero(page);

    await expect(page.getByTestId("stage-video-a")).toHaveCount(1);
    await expect(page.locator('[data-testid="scroll-stage"] video')).toHaveCount(1);
    const srcAfter = await videoA.evaluate((el: HTMLVideoElement) => el.currentSrc);
    expect(srcAfter).toBe(srcBefore);
    await expect(page.getByTestId("scroll-stage")).toHaveCSS("opacity", "1");

    const paused = await videoA.evaluate((el: HTMLVideoElement) => el.paused);
    expect(paused).toBe(false);
    const timeBefore = await videoA.evaluate((el: HTMLVideoElement) => el.currentTime);
    await page.waitForTimeout(500);
    const timeAfter = await videoA.evaluate((el: HTMLVideoElement) => el.currentTime);
    expect(timeAfter).toBeGreaterThan(timeBefore);

    await page.evaluate(() => window.scrollTo(0, 0));
    const timeAtTop = await videoA.evaluate((el: HTMLVideoElement) => el.currentTime);
    await page.waitForTimeout(500);
    const timeAfterTop = await videoA.evaluate((el: HTMLVideoElement) => el.currentTime);
    expect(timeAfterTop).toBeGreaterThan(timeAtTop);
  });

  test("computed filter is none for every stage layer", async ({ page }) => {
    await page.goto("/");
    const filters = await page.evaluate(() => {
      const stage = document.querySelector('[data-testid="scroll-stage"]');
      if (!stage) return [];
      return Array.from(stage.querySelectorAll("*"))
        .filter((el) => el.tagName !== "SOURCE" && getComputedStyle(el).display !== "none")
        .map((el) => getComputedStyle(el).filter);
    });
    expect(filters.length).toBeGreaterThan(0);
    for (const value of filters) {
      expect(value).toBe("none");
    }
  });

  test("backdrop-filter applies only to the nav, per breakpoint", async ({ page }, testInfo) => {
    await page.goto("/");
    const count = await page.evaluate(
      () =>
        Array.from(document.querySelectorAll("*")).filter(
          (el) =>
            el.tagName !== "SOURCE" &&
            getComputedStyle(el).display !== "none" &&
            getComputedStyle(el).backdropFilter !== "none",
        ).length,
    );
    expect(count).toBe(testInfo.project.name === "mobile" ? 0 : 1);
  });

  test("exactly one video on mobile and desktop", async ({ page }) => {
    await page.goto("/");
    const videoCount = await page.locator('[data-testid="scroll-stage"] video').count();
    expect(videoCount).toBe(1);
  });

  test("reduced motion: no video, sharp poster shown, opacity unchanged after scroll", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator('[data-testid="scroll-stage"] video')).toHaveCount(0);
    await expect(page.getByTestId("stage-poster")).toBeVisible();

    const before = await page
      .getByTestId("scroll-stage")
      .evaluate((el) => getComputedStyle(el).opacity);
    await page.evaluate(() => window.scrollTo(0, 1.2 * window.innerHeight));
    await page.waitForTimeout(200);
    const after = await page
      .getByTestId("scroll-stage")
      .evaluate((el) => getComputedStyle(el).opacity);
    expect(after).toBe(before);
  });

  test("Save-Data: no video elements are rendered", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window.navigator, "connection", {
        value: { saveData: true },
        configurable: true,
      });
    });
    await page.goto("/");
    await expect(page.locator('[data-testid="scroll-stage"] video')).toHaveCount(0);
  });

  test("rejected play() does not throw and the poster stays visible", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript(() => {
      HTMLMediaElement.prototype.play = () => Promise.reject(new DOMException("blocked"));
    });
    await page.goto("/");
    await page.waitForTimeout(200);
    expect(errors).toEqual([]);
    await expect(page.getByTestId("stage-video-a").or(page.getByTestId("stage-poster"))).toBeVisible();
  });

  test("no horizontal overflow", async ({ page }) => {
    await page.goto("/");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    );
    expect(overflow).toBe(true);
  });

  test("mobile menu: opens, Esc closes, focus returns to toggle", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "menu toggle only relevant under 1024px");
    await page.goto("/");
    const toggle = page.getByTestId("menu-toggle");
    await toggle.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(toggle).toBeFocused();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  test("commerce disabled: no cart, search, or account buttons", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: /^cart$/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^search$/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^account$/i })).toHaveCount(0);
  });

  test("/about returns 200", async ({ page }) => {
    const response = await page.goto("/about");
    expect(response?.status()).toBe(200);
  });
});
