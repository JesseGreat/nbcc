import { expect, test } from "@playwright/test";

const ADMIN_URL = "http://admin.localhost:3200";
const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY && !!process.env.DEMO_PASSWORD;

/** A tiny valid PDF used as the CAC certificate upload. */
const PDF = Buffer.from(
  "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n",
);

test.skip(!hasSupabase, "Needs Supabase keys and DEMO_PASSWORD in .env (see README → Testing).");

test("register → approve → pay → receipt", async ({ page, browser }) => {
  const stamp = Date.now();
  const company = `E2E Test Trading ${stamp} Ltd`;
  const email = `e2e+${stamp}@demo.nbcc.test`;

  // ── 1. Register (phone-sized viewport) ─────────────────────────────────
  await page.goto("/register");
  await page.getByLabel("Company name").fill(company);
  await page.getByLabel("RC number").fill(`RC ${stamp % 10_000_000}`);
  await page.getByLabel("Sector").selectOption({ label: "Logistics & Transport" });
  await page.getByLabel("Registered address").fill("1 Test Street, Victoria Island, Lagos");
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByLabel("Full name").fill("Test Director");
  await page.getByLabel("Email").fill(`md+${stamp}@demo.nbcc.test`);
  await page.getByLabel("Phone").fill("+234 803 000 0000");
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByLabel("Full name").fill("Test Representative");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Phone").fill("+234 803 111 1111");
  await page.getByLabel(/^Password/).fill("TestPassword123");
  await page.getByLabel("Confirm password").fill("TestPassword123");
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByRole("radio", { name: /Emerging/ }).check();
  await page.getByLabel(/Why do you want to join/).fill("End-to-end test application for the NBCC member portal.");
  await page.getByRole("button", { name: "Continue" }).click();

  await page.locator("#file-CAC_CERTIFICATE").setInputFiles({ name: "cac.pdf", mimeType: "application/pdf", buffer: PDF });
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Submit application" }).click();
  await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible({ timeout: 60_000 });

  // ── 2. Verify (demo shortcut uses the same token as the email link) ────
  await page.getByRole("link", { name: "Verify now (demo)" }).click();
  await expect(page.getByRole("heading", { name: "Your application is under review" })).toBeVisible();

  // ── 3. Approve on the admin subdomain ──────────────────────────────────
  const adminCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const admin = await adminCtx.newPage();
  await admin.goto(`${ADMIN_URL}/login`);
  await admin.getByRole("button", { name: "Super admin" }).click();
  await admin.getByRole("button", { name: "Sign in" }).click();
  await expect(admin.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await admin.goto(`${ADMIN_URL}/applications`);
  await admin.getByRole("link", { name: new RegExp(company) }).click();
  await admin.getByRole("button", { name: "Approve" }).click();
  await admin.getByRole("button", { name: "Approve application" }).click();
  await expect(admin.getByText("Membership number issued")).toBeVisible();
  await adminCtx.close();

  // ── 4. Pay (Paystack mocked) and get the receipt ───────────────────────
  await page.goto("/member/payments");
  await page.getByRole("button", { name: /Pay now/ }).click();
  await expect(page.getByRole("heading", { name: "Payment successful" })).toBeVisible({ timeout: 60_000 });

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download receipt" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^NBCC-RCT-\d{4}-\d{6}\.pdf$/);

  await page.goto("/member");
  await expect(page.getByText("Active", { exact: true })).toBeVisible();
});
