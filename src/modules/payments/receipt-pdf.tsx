import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { Document, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import type { Member, Payment } from "@prisma/client";
import { ORG } from "@/lib/config";
import { formatDate } from "@/lib/dates";
import type { CurrencyCode } from "@/lib/money";

const navy = "#0B2545";
const gold = "#C9A227";
const muted = "#526075";

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#0F172A" },
  header: { backgroundColor: navy, color: "#fff", padding: 18, marginBottom: 24, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brandRow: { flexDirection: "row", alignItems: "center" },
  emblemTile: { backgroundColor: "#fff", borderRadius: 4, padding: 4, marginRight: 10 },
  emblem: { height: 40, width: 63 },
  brand: { fontSize: 16, fontFamily: "Helvetica-Bold" },
  brandSub: { fontSize: 9, color: "#C9D3E0", marginTop: 2 },
  title: { fontSize: 18, fontFamily: "Helvetica-Bold", color: gold, textAlign: "right" },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#E2E8F0", paddingVertical: 7 },
  label: { width: "38%", color: muted },
  value: { width: "62%", fontFamily: "Helvetica-Bold" },
  section: { marginBottom: 18 },
  sectionTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", color: navy, marginBottom: 6 },
  total: { marginTop: 10, padding: 12, backgroundColor: "#F6EFD6", flexDirection: "row", justifyContent: "space-between" },
  totalText: { fontSize: 13, fontFamily: "Helvetica-Bold", color: navy },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, fontSize: 8, color: muted, textAlign: "center" },
  paid: { marginTop: 18, alignSelf: "flex-start", borderWidth: 2, borderColor: "#067647", color: "#067647", paddingVertical: 4, paddingHorizontal: 10, fontFamily: "Helvetica-Bold", fontSize: 12 },
});

/** Helvetica has no ₦ glyph, so PDFs show the ISO code (e.g. "NGN 750,000.00"). */
function money(amountMinor: number, currency: string) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: currency as CurrencyCode, currencyDisplay: "code" })
    .format(amountMinor / 100)
    .replace(/ /g, " ");
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.row}>
      <Text style={s.label}>{label}</Text>
      <Text style={s.value}>{value}</Text>
    </View>
  );
}

const CHANNELS: Record<string, string> = { card: "Card", bank: "Bank", bank_transfer: "Bank transfer", ussd: "USSD", mobile_money: "Mobile money", qr: "QR" };

function Receipt({ payment, member, emblem }: { payment: Payment; member: Member; emblem: Buffer | null }) {
  return (
    <Document title={`Receipt ${payment.receiptNumber}`} author={ORG.name}>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View style={s.brandRow}>
            {emblem && (
              <View style={s.emblemTile}>
                {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt */}
                <Image src={emblem} style={s.emblem} />
              </View>
            )}
            <View>
              <Text style={s.brand}>{ORG.shortName} Member Portal</Text>
              <Text style={s.brandSub}>{ORG.name}</Text>
            </View>
          </View>
          <Text style={s.title}>RECEIPT</Text>
        </View>

        <View style={s.section}>
          <Row label="Receipt number" value={payment.receiptNumber ?? ""} />
          <Row label="Date paid" value={formatDate(payment.paidAt)} />
          <Row label="Payment reference" value={payment.reference} />
          <Row label="Payment method" value={CHANNELS[payment.channel ?? ""] ?? payment.channel ?? "—"} />
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Received from</Text>
          <Row label="Company" value={member.companyName} />
          <Row label="Membership number" value={member.membershipNumber ?? "—"} />
          <Row label="Address" value={member.address} />
          <Row label="Representative" value={`${member.repName} (${member.repEmail})`} />
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Description</Text>
          <Row label="Item" value={`${payment.tierName} membership — ${payment.purpose === "NEW" ? "new membership" : "renewal"}`} />
          <Row label="Membership period" value={`${formatDate(payment.periodStart)} to ${formatDate(payment.periodEnd)}`} />
          <View style={s.total}>
            <Text style={s.totalText}>Total paid</Text>
            <Text style={s.totalText}>{money(payment.amountMinor, payment.currency)}</Text>
          </View>
          <Text style={s.paid}>PAID</Text>
        </View>

        <Text style={s.footer} fixed>
          This is a computer-generated receipt from the {ORG.portalName}. Questions: {ORG.supportEmail}. Powered by {ORG.poweredBy}.
        </Text>
      </Page>
    </Document>
  );
}

let emblemCache: Promise<Buffer | null> | null = null;
/** The crest for the receipt header; the receipt still renders if the file is unavailable. */
function loadEmblem() {
  emblemCache ??= readFile(path.join(process.cwd(), "public/brand/nbcc-emblem-print.png")).catch(() => null);
  return emblemCache;
}

export async function renderReceiptPdf(payment: Payment, member: Member): Promise<Buffer> {
  return renderToBuffer(<Receipt payment={payment} member={member} emblem={await loadEmblem()} />);
}
