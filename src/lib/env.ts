/**
 * Central place for reading environment variables.
 * Server-only values must never be imported into client components;
 * client code uses only the NEXT_PUBLIC_* helpers at the bottom.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}. See .env.example.`);
  }
  return value;
}

export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "true";
}

export const serverEnv = {
  get supabaseServiceRoleKey() {
    return required("SUPABASE_SERVICE_ROLE_KEY");
  },
  get paystackSecretKey() {
    return required("PAYSTACK_SECRET_KEY");
  },
  get resendApiKey() {
    return process.env.RESEND_API_KEY || null;
  },
  get emailFrom() {
    return process.env.EMAIL_FROM || "NBCC Member Portal <no-reply@example.com>";
  },
  /** Comma-separated list of addresses that receive "new application" alerts. */
  get adminAlertEmails(): string[] {
    return (process.env.ADMIN_ALERT_EMAILS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  },
  get cronSecret() {
    return process.env.CRON_SECRET || null;
  },
  get demoPassword() {
    return process.env.DEMO_PASSWORD || null;
  },
};

/** Values safe to expose to the browser. */
export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  appUrl: (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, ""),
  adminUrl: (process.env.NEXT_PUBLIC_ADMIN_URL || "http://admin.localhost:3000").replace(/\/$/, ""),
  paystackPublicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "",
};
