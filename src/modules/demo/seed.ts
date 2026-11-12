/**
 * Demo / initial seed. Used by `pnpm db:seed` (prisma/seed.ts) and by the
 * SUPER_ADMIN "Reset demo data" button (DEMO_MODE only).
 *
 * All company names, people, emails (.example / .test domains) and RC numbers
 * are fictional. Do not add real NBCC member data here.
 *
 * No `server-only` imports: this file also runs under tsx from the CLI.
 */
import { randomUUID } from "node:crypto";
import type { Currency, MemberStatus, Prisma, PrismaClient } from "@prisma/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { MEMBERSHIP_NUMBER_PREFIX, RECEIPT_NUMBER_PREFIX, UPLOADS } from "@/lib/config";
import { ensureStorageBuckets } from "@/lib/storage";
import { toMinor } from "@/lib/money";
import { DEMO_ACCOUNTS } from "./accounts";

type Log = (msg: string) => void;

export type SeedOptions = {
  db: PrismaClient;
  /** Service-role client. When null, auth users get placeholder ids (DB-only seed). */
  supabase: SupabaseClient | null;
  demoPassword: string | null;
  /** Wipe existing data first. */
  reset: boolean;
  log?: Log;
};

export const TIERS = [
  { name: "Premium", slug: "premium", feeNaira: 1_500_000, description: "For large corporates and multinationals." },
  { name: "Corporate", slug: "corporate", feeNaira: 750_000, description: "For established companies." },
  { name: "SME", slug: "sme", feeNaira: 300_000, description: "For small and medium-sized enterprises." },
  { name: "Individual", slug: "individual", feeNaira: 100_000, description: "For professionals and sole traders." },
  { name: "Emerging", slug: "emerging", feeNaira: 50_000, description: "For start-ups in their first three years." },
] as const;

export const SECTORS = [
  "Banking & Finance",
  "Oil & Gas / Energy",
  "Technology & Telecoms",
  "Manufacturing",
  "Professional Services",
  "Legal",
  "Education",
  "Healthcare",
  "Agriculture",
  "Logistics & Transport",
  "Real Estate & Construction",
  "Hospitality",
  "Other",
] as const;


type Sector = (typeof SECTORS)[number];
type TierSlug = (typeof TIERS)[number]["slug"];

/**
 * status + days until expiry (negative = already expired). Expiry drives the
 * payment history so the revenue chart spreads across the last 12 months.
 */
type FakeCompany = {
  name: string;
  sector: Sector;
  tier: TierSlug;
  status: MemberStatus;
  expiresInDays?: number;
  md: string;
  rep: string;
  city: string;
};

const COMPANIES: FakeCompany[] = [
  { name: "Ikoyi Harbour Capital Ltd", sector: "Banking & Finance", tier: "premium", status: "ACTIVE", expiresInDays: 21, md: "Chidi Okonkwo", rep: "Ngozi Eze", city: "Ikoyi, Lagos" },
  { name: "Thamesbridge Advisory Partners", sector: "Professional Services", tier: "corporate", status: "ACTIVE", expiresInDays: 300, md: "Oliver Pemberton", rep: "Kemi Adebayo", city: "Victoria Island, Lagos" },
  { name: "Ogun Valley Agro-Allied Ltd", sector: "Agriculture", tier: "sme", status: "ACTIVE", expiresInDays: 45, md: "Babatunde Ogunleye", rep: "Sola Akinola", city: "Abeokuta, Ogun" },
  { name: "Brightwater Petroleum Services Nigeria", sector: "Oil & Gas / Energy", tier: "premium", status: "ACTIVE", expiresInDays: 250, md: "Emeka Nwosu", rep: "Hannah Clarke", city: "Port Harcourt, Rivers" },
  { name: "Lekki Lane Technologies Ltd", sector: "Technology & Telecoms", tier: "sme", status: "ACTIVE", expiresInDays: 75, md: "Tobi Adesanya", rep: "Ife Ogundipe", city: "Lekki, Lagos" },
  { name: "Kensal & Adeyemi Solicitors", sector: "Legal", tier: "corporate", status: "ACTIVE", expiresInDays: 190, md: "Rachel Kensal", rep: "Dayo Adeyemi", city: "Ikeja, Lagos" },
  { name: "Ashdown Ridge Cement Works Ltd", sector: "Manufacturing", tier: "premium", status: "ACTIVE", expiresInDays: 330, md: "Musa Abdullahi", rep: "James Whitmore", city: "Kano" },
  { name: "Osun Meadow Healthcare Ltd", sector: "Healthcare", tier: "corporate", status: "ACTIVE", expiresInDays: 12, md: "Dr. Folake Ajayi", rep: "Bisi Olatunji", city: "Osogbo, Osun" },
  { name: "Crescent Isle Logistics Ltd", sector: "Logistics & Transport", tier: "sme", status: "ACTIVE", expiresInDays: 140, md: "Ifeanyi Obi", rep: "Grace Ugo", city: "Apapa, Lagos" },
  { name: "Bellmont Okafor Realty", sector: "Real Estate & Construction", tier: "corporate", status: "ACTIVE", expiresInDays: 60, md: "Chuka Okafor", rep: "Sarah Bellmont", city: "Abuja, FCT" },
  { name: "Palmgrove Hospitality Group", sector: "Hospitality", tier: "corporate", status: "ACTIVE", expiresInDays: 210, md: "Adaeze Nnamdi", rep: "Peter Hollis", city: "Calabar, Cross River" },
  { name: "Victoria Quay Learning Trust", sector: "Education", tier: "sme", status: "ACTIVE", expiresInDays: 105, md: "Prof. Yemi Balogun", rep: "Lucy Fairbairn", city: "Victoria Island, Lagos" },
  { name: "Harrowfield Insurance Brokers Nigeria", sector: "Banking & Finance", tier: "corporate", status: "ACTIVE", expiresInDays: 270, md: "William Harrow", rep: "Tola Bakare", city: "Marina, Lagos" },
  { name: "Kaduna Plains Farms Ltd", sector: "Agriculture", tier: "emerging", status: "ACTIVE", expiresInDays: 165, md: "Aisha Lawal", rep: "Yusuf Danjuma", city: "Kaduna" },
  { name: "Sapphire Delta Energy Ltd", sector: "Oil & Gas / Energy", tier: "premium", status: "ACTIVE", expiresInDays: 85, md: "Ebi Tamuno", rep: "Mark Ellison", city: "Warri, Delta" },
  { name: "Ironbridge Data Systems Ltd", sector: "Technology & Telecoms", tier: "corporate", status: "ACTIVE", expiresInDays: 230, md: "Daniel Ashford", rep: "Chioma Udeh", city: "Yaba, Lagos" },
  { name: "Amberleigh Clinics Ltd", sector: "Healthcare", tier: "sme", status: "ACTIVE", expiresInDays: 310, md: "Dr. Helen Amberleigh", rep: "Femi Oyedele", city: "Ibadan, Oyo" },
  { name: "Wexford & Bello Consulting", sector: "Professional Services", tier: "individual", status: "ACTIVE", expiresInDays: 125, md: "Ibrahim Bello", rep: "Ibrahim Bello", city: "Abuja, FCT" },
  { name: "Greywell Renewables Nigeria Ltd", sector: "Oil & Gas / Energy", tier: "sme", status: "ACTIVE", expiresInDays: 35, md: "Sophie Greywell", rep: "Uche Mbah", city: "Lekki, Lagos" },
  { name: "Mainland Mosaic Hotels Ltd", sector: "Hospitality", tier: "sme", status: "ACTIVE", expiresInDays: 285, md: "Bolaji Coker", rep: "Rita Osei", city: "Surulere, Lagos" },
  { name: "Kingsway Telecom Towers Ltd", sector: "Technology & Telecoms", tier: "premium", status: "ACTIVE", expiresInDays: 175, md: "Segun Alade", rep: "Fiona MacLeod", city: "Ikeja, Lagos" },
  { name: "Marlowe & Eze Accountants", sector: "Professional Services", tier: "sme", status: "ACTIVE", expiresInDays: 350, md: "Claire Marlowe", rep: "Obinna Eze", city: "Enugu" },
  // Expired / unpaid
  { name: "Calabar Coastline Shipping Co", sector: "Logistics & Transport", tier: "corporate", status: "INACTIVE", expiresInDays: -40, md: "Effiong Bassey", rep: "Mary Etim", city: "Calabar, Cross River" },
  { name: "Riverside Ijebu Foods Ltd", sector: "Manufacturing", tier: "sme", status: "INACTIVE", expiresInDays: -120, md: "Kunle Odusanya", rep: "Joy Adeola", city: "Ijebu-Ode, Ogun" },
  { name: "Ashcombe Property Partners", sector: "Real Estate & Construction", tier: "corporate", status: "INACTIVE", md: "George Ashcombe", rep: "Halima Sani", city: "Abuja, FCT" },
  // Archived (12+ months unpaid)
  { name: "Lagos Lantern Media Ltd", sector: "Other", tier: "sme", status: "ARCHIVED", expiresInDays: -420, md: "Niyi Fashola", rep: "Toyin Akande", city: "Ikeja, Lagos" },
  { name: "Abeokuta Hills Academy", sector: "Education", tier: "emerging", status: "ARCHIVED", expiresInDays: -500, md: "Mrs. Bose Oke", rep: "Ayo Oke", city: "Abeokuta, Ogun" },
  // Other statuses
  { name: "Coral Reef Microfinance Bank", sector: "Banking & Finance", tier: "sme", status: "BLACKLISTED", expiresInDays: -200, md: "Victor Ehi", rep: "Joan Pratt", city: "Benin City, Edo" },
  { name: "Owerri Orchard Pharmaceuticals", sector: "Healthcare", tier: "sme", status: "REJECTED", md: "Kelechi Iwu", rep: "Ada Iwu", city: "Owerri, Imo" },
  { name: "Elmhurst Akande Chambers", sector: "Legal", tier: "individual", status: "PENDING_VERIFICATION", md: "Tunde Akande", rep: "Tunde Akande", city: "Lekki, Lagos" },
  // Pending applications, ready to approve live in the demo
  { name: "Jos Plateau Dairy Co-operative", sector: "Agriculture", tier: "sme", status: "PENDING_APPROVAL", md: "Danladi Gyang", rep: "Esther Pam", city: "Jos, Plateau" },
  { name: "Stratford Oyo Engineering Ltd", sector: "Manufacturing", tier: "corporate", status: "PENDING_APPROVAL", md: "Adewale Stratford-Ojo", rep: "Emily Carter", city: "Ibadan, Oyo" },
  { name: "Bluepoint Fintech Labs Ltd", sector: "Technology & Telecoms", tier: "emerging", status: "PENDING_APPROVAL", md: "Zainab Usman", rep: "Michael Okoro", city: "Yaba, Lagos" },
];

/** The demo member account's company. */
const DEMO_MEMBER_COMPANY: FakeCompany = {
  name: "Coker-Ashworth Trading Ltd",
  sector: "Logistics & Transport",
  tier: "corporate",
  status: "ACTIVE",
  expiresInDays: 64,
  md: "Edward Ashworth",
  rep: DEMO_ACCOUNTS.member.name,
  city: "Victoria Island, Lagos",
};

const DAY = 24 * 60 * 60 * 1000;

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function domainFor(company: string) {
  const base = slugify(company.replace(/\b(ltd|limited|nigeria|co|group|plc)\b/gi, "")).replace(/-/g, "");
  return `${base.slice(0, 24)}.example`;
}

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

/** Deterministic pseudo-random numbers so every reset produces the same data. */
function prng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/** A tiny valid one-page PDF used as a stand-in CAC certificate / company profile. */
export function samplePdf(title: string, subtitle: string): Uint8Array {
  const esc = (t: string) => t.replace(/[()\\]/g, (m) => `\\${m}`);
  const stream = `BT /F1 20 Tf 60 760 Td (${esc(title)}) Tj ET\nBT /F1 12 Tf 60 730 Td (${esc(subtitle)}) Tj ET\nBT /F1 10 Tf 60 700 Td (SAMPLE DOCUMENT - FICTIONAL - FOR DEMONSTRATION ONLY) Tj ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let out = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((o, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  out += offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(out);
}

async function findAuthUserIdByEmail(supabase: SupabaseClient, email: string): Promise<string | null> {
  for (let page = 1; page < 50; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (hit) return hit.id;
    if (data.users.length < 200) return null;
  }
  return null;
}

/** Create or update a confirmed Supabase auth user and return its id. */
async function upsertAuthUser(
  supabase: SupabaseClient | null,
  email: string,
  password: string | null,
  role: string,
  fallbackId: string,
): Promise<string> {
  if (!supabase) return fallbackId;
  if (!password) throw new Error("DEMO_PASSWORD must be set to create demo logins.");
  const existingId = await findAuthUserIdByEmail(supabase, email);
  if (existingId) {
    const { error } = await supabase.auth.admin.updateUserById(existingId, {
      password,
      email_confirm: true,
      app_metadata: { role },
    });
    if (error) throw error;
    return existingId;
  }
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role },
  });
  if (error) throw error;
  return data.user.id;
}

async function wipe(db: PrismaClient, supabase: SupabaseClient | null, log: Log) {
  const demoEmails = new Set(Object.values(DEMO_ACCOUNTS).map((a) => a.email));

  if (supabase) {
    // Remove member auth accounts created during the demo (e.g. live registrations).
    // Staff accounts are kept so a reset never locks out the admin who triggered it.
    const users = await db.user.findMany({ where: { role: "MEMBER" }, select: { id: true, email: true } });
    for (const u of users) {
      if (demoEmails.has(u.email)) continue;
      const { error } = await supabase.auth.admin.deleteUser(u.id);
      if (error && !/not.*found/i.test(error.message)) log(`  ! could not delete auth user ${u.email}: ${error.message}`);
    }
    const docs = await db.memberDocument.findMany({ select: { storagePath: true } });
    if (docs.length) await supabase.storage.from(UPLOADS.documentsBucket).remove(docs.map((d) => d.storagePath));
  }

  await db.$transaction([
    db.auditLog.deleteMany(),
    db.reminderLog.deleteMany(),
    db.announcement.deleteMany(),
    db.payment.deleteMany(),
    db.memberDocument.deleteMany(),
    db.user.deleteMany({ where: { role: "MEMBER" } }),
    db.user.updateMany({ data: { memberId: null } }),
    db.member.deleteMany(),
    db.tier.deleteMany(),
    db.sector.deleteMany(),
    db.counter.deleteMany(),
    db.setting.deleteMany(),
  ]);
  log("Wiped existing data.");
}

export async function runSeed({ db, supabase, demoPassword, reset, log = console.log }: SeedOptions) {
  const now = new Date();
  const rand = prng(20261112);

  if (reset) await wipe(db, supabase, log);

  if (supabase) {
    await ensureStorageBuckets(supabase);
    log("Storage buckets ready.");
  } else {
    log("! SUPABASE_SERVICE_ROLE_KEY not set: skipping auth users and storage (DB-only seed).");
  }

  // Tiers and sectors (upsert so a non-reset seed is safe to re-run).
  const tiers = new Map<TierSlug, { id: string; feeMinor: number; currency: Currency; name: string }>();
  for (const [i, t] of TIERS.entries()) {
    const row = await db.tier.upsert({
      where: { slug: t.slug },
      update: {},
      create: { name: t.name, slug: t.slug, description: t.description, feeMinor: toMinor(t.feeNaira), sortOrder: i },
    });
    tiers.set(t.slug, row);
  }
  const sectors = new Map<string, string>();
  for (const [i, name] of SECTORS.entries()) {
    const row = await db.sector.upsert({
      where: { slug: slugify(name) },
      update: {},
      create: { name, slug: slugify(name), sortOrder: i },
    });
    sectors.set(name, row.id);
  }
  log(`Tiers: ${tiers.size}, sectors: ${sectors.size}.`);

  if (!reset && (await db.member.count()) > 0) {
    log("Members already exist; skipping demo members (run with --reset to rebuild).");
    return;
  }

  // Staff accounts.
  const adminId = await upsertAuthUser(supabase, DEMO_ACCOUNTS.admin.email, demoPassword, "SUPER_ADMIN", "00000000-0000-4000-8000-000000000001");
  const staffId = await upsertAuthUser(supabase, DEMO_ACCOUNTS.staff.email, demoPassword, "STAFF", "00000000-0000-4000-8000-000000000002");
  await db.user.createMany({
    data: [
      { id: adminId, email: DEMO_ACCOUNTS.admin.email, name: DEMO_ACCOUNTS.admin.name, role: "SUPER_ADMIN" },
      { id: staffId, email: DEMO_ACCOUNTS.staff.email, name: DEMO_ACCOUNTS.staff.name, role: "STAFF" },
    ],
    skipDuplicates: true,
  });

  // Build all companies, then issue membership numbers and receipts in date order
  // so numbering is sequential, like it would be in real life.
  const all = [DEMO_MEMBER_COMPANY, ...COMPANIES];
  type Planned = FakeCompany & { createdAt: Date; approvedAt: Date | null; expiresAt: Date | null; payments: { paidAt: Date; purpose: "NEW" | "RENEWAL" }[] };

  const planned: Planned[] = all.map((c) => {
    const expiresAt = c.expiresInDays !== undefined ? new Date(now.getTime() + c.expiresInDays * DAY) : null;
    const payments: Planned["payments"] = [];
    let approvedAt: Date | null = null;
    let createdAt = new Date(now.getTime() - (5 + Math.floor(rand() * 20)) * DAY);

    if (expiresAt) {
      const lastPaid = addMonths(expiresAt, -12);
      // ~half of members have a previous year's payment too (renewals).
      const renewed = rand() > 0.45;
      if (renewed) payments.push({ paidAt: addMonths(lastPaid, -12), purpose: "NEW" });
      payments.push({ paidAt: lastPaid, purpose: renewed ? "RENEWAL" : "NEW" });
      approvedAt = new Date(payments[0].paidAt.getTime() - (1 + Math.floor(rand() * 5)) * DAY);
      createdAt = new Date(approvedAt.getTime() - (3 + Math.floor(rand() * 10)) * DAY);
    } else if (c.status === "INACTIVE") {
      // Approved but never paid.
      approvedAt = new Date(now.getTime() - 18 * DAY);
      createdAt = new Date(now.getTime() - 25 * DAY);
    } else if (c.status === "REJECTED") {
      createdAt = new Date(now.getTime() - 30 * DAY);
    }
    return { ...c, createdAt, approvedAt, expiresAt, payments };
  });

  // Number memberships and receipts in date order (as in real life), in memory, then
  // write everything with a few bulk inserts so a reset stays fast on a remote database.
  const yearSeq = new Map<string, number>();
  const next = (key: string) => {
    const n = (yearSeq.get(key) ?? 0) + 1;
    yearSeq.set(key, n);
    return n;
  };
  const membershipNumbers = new Map<string, string>();
  for (const p of planned.filter((x) => x.approvedAt).sort((a, b) => a.approvedAt!.getTime() - b.approvedAt!.getTime())) {
    const y = p.approvedAt!.getFullYear();
    membershipNumbers.set(p.name, `${MEMBERSHIP_NUMBER_PREFIX}-${y}-${String(next(`membership:${y}`)).padStart(4, "0")}`);
  }

  const sampleCac = samplePdf("CERTIFICATE OF INCORPORATION", "Corporate Affairs Commission - sample");
  const sampleProfile = samplePdf("COMPANY PROFILE", "Sample company profile");
  if (supabase) {
    for (const [name, bytes] of [["cac-certificate.pdf", sampleCac], ["company-profile.pdf", sampleProfile]] as const) {
      const { error } = await supabase.storage
        .from(UPLOADS.documentsBucket)
        .upload(`samples/${name}`, bytes, { contentType: "application/pdf", upsert: true });
      if (error) log(`  ! sample upload failed: ${error.message}`);
    }
  }

  const memberRows: Prisma.MemberCreateManyInput[] = [];
  const docRows: Prisma.MemberDocumentCreateManyInput[] = [];
  const paymentPlan: { memberId: string; tier: { feeMinor: number; currency: Currency; name: string }; paidAt: Date; purpose: "NEW" | "RENEWAL" }[] = [];
  let demoMemberId = "";

  for (const p of planned) {
    const id = randomUUID();
    const tier = tiers.get(p.tier)!;
    const domain = domainFor(p.name);
    memberRows.push({
      id,
      companyName: p.name,
      rcNumber: `RC ${1000000 + Math.floor(rand() * 899999)}`,
      sectorId: sectors.get(p.sector)!,
      tierId: tier.id,
      status: p.status,
      membershipNumber: membershipNumbers.get(p.name) ?? null,
      website: `https://www.${domain}`,
      address: `${10 + Math.floor(rand() * 180)} ${["Adeola Odeku Street", "Broad Street", "Awolowo Road", "Ademola Adetokunbo Crescent", "Aba Road", "Herbert Macaulay Way"][Math.floor(rand() * 6)]}, ${p.city}`,
      mdName: p.md,
      mdEmail: `md@${domain}`,
      mdPhone: `+234 80${Math.floor(rand() * 10)} ${String(Math.floor(rand() * 1000)).padStart(3, "0")} ${String(Math.floor(rand() * 10000)).padStart(4, "0")}`,
      repName: p.rep,
      repEmail: p.name === DEMO_MEMBER_COMPANY.name ? DEMO_ACCOUNTS.member.email : `${slugify(p.rep.split(" ")[0])}@${domain}`,
      repPhone: `+234 81${Math.floor(rand() * 10)} ${String(Math.floor(rand() * 1000)).padStart(3, "0")} ${String(Math.floor(rand() * 10000)).padStart(4, "0")}`,
      reasonForJoining: "We trade between Nigeria and the UK and want access to the Chamber's network, trade missions and policy briefings.",
      approvedAt: p.approvedAt,
      approvedById: p.approvedAt ? adminId : null,
      rejectionReason: p.status === "REJECTED" ? "CAC certificate could not be verified. Please re-apply with a certified copy." : null,
      blacklistReason: p.status === "BLACKLISTED" ? "Misrepresentation of Chamber affiliation in marketing materials (demo record)." : null,
      expiresAt: p.expiresAt,
      createdAt: p.createdAt,
    });
    if (p.name === DEMO_MEMBER_COMPANY.name) demoMemberId = id;

    // Seeded members share two sample PDFs (uploaded once above), mainly so pending applications can be reviewed live.
    const docs = [
      { type: "CAC_CERTIFICATE" as const, fileName: "cac-certificate.pdf", bytes: sampleCac },
      ...(rand() > 0.4 ? [{ type: "COMPANY_PROFILE" as const, fileName: "company-profile.pdf", bytes: sampleProfile }] : []),
    ];
    for (const d of docs) {
      docRows.push({ memberId: id, type: d.type, storagePath: `samples/${d.fileName}`, fileName: d.fileName, mimeType: "application/pdf", sizeBytes: d.bytes.byteLength, uploadedAt: p.createdAt });
    }
    for (const pay of p.payments) paymentPlan.push({ memberId: id, tier, paidAt: pay.paidAt, purpose: pay.purpose });
  }

  const paymentRows: Prisma.PaymentCreateManyInput[] = paymentPlan
    .sort((a, b) => a.paidAt.getTime() - b.paidAt.getTime())
    .map((pay) => {
      const y = pay.paidAt.getFullYear();
      return {
        memberId: pay.memberId,
        reference: `DEMO-${pay.memberId.slice(-8)}-${pay.paidAt.getTime().toString(36)}`,
        amountMinor: pay.tier.feeMinor,
        currency: pay.tier.currency,
        status: "SUCCESS",
        channel: ["card", "bank_transfer", "card", "ussd"][Math.floor(rand() * 4)],
        purpose: pay.purpose,
        tierName: pay.tier.name,
        periodStart: pay.paidAt,
        periodEnd: addMonths(pay.paidAt, 12),
        paidAt: pay.paidAt,
        receiptNumber: `${RECEIPT_NUMBER_PREFIX}-${y}-${String(next(`receipt:${y}`)).padStart(6, "0")}`,
        createdAt: pay.paidAt,
      };
    });

  await db.member.createMany({ data: memberRows });
  await db.memberDocument.createMany({ data: docRows });
  await db.payment.createMany({ data: paymentRows });
  // Continue live numbering after the seeded numbers.
  for (const [key, value] of yearSeq) {
    await db.$executeRaw`INSERT INTO "Counter" ("key", "value") VALUES (${key}, ${value})
      ON CONFLICT ("key") DO UPDATE SET "value" = GREATEST("Counter"."value", EXCLUDED."value")`;
  }

  // A couple of failed attempts so the payments list shows realistic states.
  const someone = await db.member.findFirst({ where: { status: "INACTIVE", expiresAt: { not: null } }, include: { tier: true } });
  if (someone) {
    await db.payment.create({
      data: {
        memberId: someone.id,
        reference: `DEMO-FAILED-${someone.id.slice(-8)}`,
        amountMinor: someone.tier.feeMinor,
        currency: someone.tier.currency,
        status: "FAILED",
        channel: "card",
        purpose: "RENEWAL",
        tierName: someone.tier.name,
        createdAt: new Date(now.getTime() - 9 * DAY),
      },
    });
  }

  // Demo member login.
  const memberUserId = await upsertAuthUser(supabase, DEMO_ACCOUNTS.member.email, demoPassword, "MEMBER", "00000000-0000-4000-8000-000000000003");
  await db.user.create({
    data: { id: memberUserId, email: DEMO_ACCOUNTS.member.email, name: DEMO_ACCOUNTS.member.name, role: "MEMBER", memberId: demoMemberId },
  });

  // Announcements.
  await db.announcement.createMany({
    data: [
      {
        title: "UK–Nigeria Trade Mission: registration open",
        body: "Members are invited to join the Chamber's trade mission to London and Manchester. Places are limited; register interest with the secretariat by the end of the month.",
        audience: "ACTIVE",
        createdById: adminId,
        recipientCount: 22,
        sentAt: new Date(now.getTime() - 6 * DAY),
        createdAt: new Date(now.getTime() - 6 * DAY),
      },
      {
        title: "Annual General Meeting — save the date",
        body: "The Chamber's AGM will hold in Lagos. Agenda and proxy forms will be shared with members in good standing two weeks before the meeting.",
        audience: "ALL",
        createdById: adminId,
        recipientCount: 31,
        sentAt: new Date(now.getTime() - 20 * DAY),
        createdAt: new Date(now.getTime() - 20 * DAY),
      },
      {
        title: "Premium members' policy roundtable",
        body: "An invitation-only roundtable on FX policy and cross-border payments for Premium members.",
        audience: "TIER",
        tierId: tiers.get("premium")!.id,
        createdById: adminId,
        recipientCount: 4,
        sentAt: new Date(now.getTime() - 35 * DAY),
        createdAt: new Date(now.getTime() - 35 * DAY),
      },
    ],
  });

  await db.auditLog.create({
    data: { actorId: adminId, action: reset ? "demo.reset" : "demo.seed", targetType: "System", metadata: { members: planned.length } },
  });

  log(`Seeded ${planned.length} members, demo logins: ${Object.values(DEMO_ACCOUNTS).map((a) => a.email).join(", ")}.`);
}
