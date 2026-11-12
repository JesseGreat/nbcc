import { defineConfig, devices } from "@playwright/test";

// Make .env values (Supabase keys, DEMO_PASSWORD) visible to the test process too.
try {
  process.loadEnvFile(".env");
} catch {}

/**
 * Smoke test: register → approve → pay (Paystack mocked) → receipt.
 * Needs a real Supabase project in .env (auth + storage) and a seeded database
 * (`pnpm db:seed`) with DEMO_PASSWORD set. Paystack is mocked via PAYSTACK_MOCK,
 * which only works in non-production builds, so the test runs against `next dev`.
 */
const PORT = 3200;
const APP_URL = `http://localhost:${PORT}`;
const ADMIN_URL = `http://admin.localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 180_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: APP_URL,
    trace: "retain-on-failure",
    ...devices["Pixel 7"], // mobile-first: run the member journey at phone size
  },
  webServer: {
    command: `pnpm dev -p ${PORT}`,
    url: `${APP_URL}/login`,
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
    env: {
      PAYSTACK_MOCK: "true",
      DEMO_MODE: "true",
      NEXT_PUBLIC_APP_URL: APP_URL,
      NEXT_PUBLIC_ADMIN_URL: ADMIN_URL,
    },
  },
  metadata: { adminUrl: ADMIN_URL },
});
