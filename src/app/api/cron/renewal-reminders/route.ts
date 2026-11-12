import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { serverEnv } from "@/lib/env";
import { runRenewalJob } from "@/modules/renewals/service";

export const dynamic = "force-dynamic";
// 60s works on every Vercel plan. TODO(scale): queue emails if the member list grows into the thousands.
export const maxDuration = 60;

/**
 * Daily renewal job (see vercel.json). Vercel Cron sends
 * `Authorization: Bearer $CRON_SECRET`; anything else is rejected.
 */
export async function GET(request: NextRequest) {
  const secret = serverEnv.cronSecret;
  const header = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const ok =
    !!secret && header.length === expected.length && timingSafeEqual(Buffer.from(header), Buffer.from(expected));
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const summary = await runRenewalJob();
  console.info("[cron] renewal job", summary);
  return NextResponse.json({ ok: true, ...summary });
}
