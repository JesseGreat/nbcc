/**
 * pnpm db:seed           → tiers + sectors, plus demo data when the database is empty
 * pnpm db:seed --reset   → wipe and rebuild all demo data
 */
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { runSeed } from "@/modules/demo/seed";

async function main() {
  const db = new PrismaClient();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null;

  try {
    await runSeed({
      db,
      supabase,
      demoPassword: process.env.DEMO_PASSWORD ?? null,
      reset: process.argv.includes("--reset"),
    });
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
