import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.TGP_E2E_EXTERNAL_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  // Two-CPU development builds compile routes on first use. Keep assertions
  // condition-based while allowing cold compilation within bounded CI budgets.
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "off",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Start the frontend separately with pnpm dev before running browser tests.
  webServer: undefined,
});
