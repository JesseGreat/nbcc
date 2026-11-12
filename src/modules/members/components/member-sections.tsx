import { FileText, ExternalLink } from "lucide-react";
import type { Member, MemberDocument, Sector, Tier } from "@prisma/client";
import { formatDate, formatDateTime } from "@/lib/dates";
import { formatBytes } from "@/lib/uploads";
import { signedDocumentUrl } from "../storage";

export function Section({ title, children, actions }: { title: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-4 md:p-6">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-primary">{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function DetailList({ items }: { items: [string, React.ReactNode][] }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="font-medium break-words">{value || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

type FullMember = Member & { tier: Tier; sector: Sector };

export function CompanyDetails({ m }: { m: FullMember }) {
  return (
    <DetailList
      items={[
        ["Company name", m.companyName],
        ["RC number", m.rcNumber],
        ["Sector", m.sector.name],
        ["Tier", m.tier.name],
        [
          "Website",
          m.website ? (
            <a href={m.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              {m.website.replace(/^https?:\/\//, "")}
            </a>
          ) : null,
        ],
        ["Address", m.address],
        ["Applied", formatDate(m.createdAt)],
      ]}
    />
  );
}

export function ContactDetails({ m }: { m: Member }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div>
        <h3 className="mb-2 text-sm font-semibold">Managing Director</h3>
        <DetailList items={[["Name", m.mdName], ["Email", <a key="e" className="text-primary hover:underline" href={`mailto:${m.mdEmail}`}>{m.mdEmail}</a>], ["Phone", <a key="p" className="text-primary hover:underline" href={`tel:${m.mdPhone.replace(/\s/g, "")}`}>{m.mdPhone}</a>]]} />
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold">Representative</h3>
        <DetailList items={[["Name", m.repName], ["Email", <a key="e" className="text-primary hover:underline" href={`mailto:${m.repEmail}`}>{m.repEmail}</a>], ["Phone", <a key="p" className="text-primary hover:underline" href={`tel:${m.repPhone.replace(/\s/g, "")}`}>{m.repPhone}</a>]]} />
      </div>
    </div>
  );
}

const DOC_LABELS: Record<string, string> = {
  CAC_CERTIFICATE: "CAC certificate",
  COMPANY_PROFILE: "Company profile",
  OTHER: "Other document",
};

/** Server component: creates short-lived signed URLs at render time. */
export async function DocumentsList({ documents }: { documents: MemberDocument[] }) {
  if (!documents.length) return <p className="text-sm text-muted-foreground">No documents uploaded.</p>;
  const urls = await Promise.all(documents.map((d) => signedDocumentUrl(d.storagePath).catch(() => null)));
  return (
    <ul className="grid gap-2">
      {documents.map((d, i) => (
        <li key={d.id} className="flex items-center gap-3 rounded-lg border p-3">
          <FileText className="size-5 shrink-0 text-muted-foreground" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{DOC_LABELS[d.type]}</p>
            <p className="truncate text-xs text-muted-foreground">
              {d.fileName} · {formatBytes(d.sizeBytes)}
            </p>
          </div>
          {urls[i] ? (
            <a
              href={urls[i]!}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-1 rounded-lg px-3 text-sm font-medium text-primary hover:bg-muted lg:min-h-9"
            >
              View <ExternalLink className="size-3.5" aria-hidden />
              <span className="sr-only">{DOC_LABELS[d.type]}</span>
            </a>
          ) : (
            <span className="text-xs text-muted-foreground">Unavailable</span>
          )}
        </li>
      ))}
    </ul>
  );
}

const ACTION_LABELS: Record<string, string> = {
  "application.submitted": "Application submitted",
  "application.email_verified": "Email confirmed",
  "application.approved": "Application approved",
  "application.rejected": "Application rejected",
  "member.tier_changed": "Tier changed",
  "member.deactivate": "Marked inactive",
  "member.archive": "Archived",
  "member.blacklist": "Blacklisted",
  "member.restore": "Restored",
  "member.profile_updated": "Profile updated",
  "member.expired": "Membership expired",
  "member.auto_archived": "Archived automatically",
  "payment.succeeded": "Payment received",
  "payment.failed": "Payment failed",
  "reminder.sent": "Renewal reminder sent",
};

export function AuditTrail({
  entries,
}: {
  entries: { id: string; action: string; createdAt: Date; metadata: unknown; actor: { name: string } | null }[];
}) {
  if (!entries.length) return <p className="text-sm text-muted-foreground">No activity yet.</p>;
  return (
    <ol className="relative grid gap-4 border-l pl-5">
      {entries.map((e) => {
        const meta = (e.metadata ?? {}) as Record<string, unknown>;
        const detail = [
          meta.from && meta.to ? `${meta.from} → ${meta.to}` : null,
          meta.membershipNumber ? String(meta.membershipNumber) : null,
          meta.reason ? `“${meta.reason}”` : null,
          meta.receiptNumber ? String(meta.receiptNumber) : null,
        ]
          .filter(Boolean)
          .join(" · ");
        return (
          <li key={e.id} className="relative">
            <span className="absolute top-1.5 -left-[1.6rem] size-2.5 rounded-full bg-primary ring-4 ring-card" aria-hidden />
            <p className="text-sm font-medium">{ACTION_LABELS[e.action] ?? e.action}</p>
            {detail && <p className="text-sm break-words text-muted-foreground">{detail}</p>}
            <p className="text-xs text-muted-foreground">
              {formatDateTime(e.createdAt)} · {e.actor?.name ?? "System"}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
