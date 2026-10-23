import { defineConfig, devices } from "@playwright/test";

// In CI the workflow builds once, then Playwright starts its own server on an
// explicit port from that build and never reuses a server it did not start.
// Locally it builds and starts, or reuses a server already on the port.
const ci = Boolean(process.env.CI);
const port = Number(process.env.PLAYWRIGHT_PORT ?? 3000);
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: ci,
  reporter: ci ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: ci ? "retain-on-failure" : "off",
  },
  webServer: {
    command: ci ? `npx next start -p ${port}` : `npm run build && npx next start -p ${port}`,
    url: baseURL,
    reuseExistingServer: !ci,
    timeout: 180_000,
  },
  projects: [
    {
      name: "mobile",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
});
