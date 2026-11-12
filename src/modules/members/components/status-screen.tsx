import { Ban, Clock, MailWarning, XCircle } from "lucide-react";
import type { MemberStatus } from "@prisma/client";
import { ORG } from "@/lib/config";

/** Statuses that cannot use the member area yet (or any more). */
export const GATED_STATUSES: MemberStatus[] = ["PENDING_VERIFICATION", "PENDING_APPROVAL", "REJECTED", "BLACKLISTED"];

export function MemberStatusScreen({
  status,
  companyName,
  rejectionReason,
}: {
  status: MemberStatus;
  companyName: string;
  rejectionReason: string | null;
}) {
  const content = {
    PENDING_VERIFICATION: {
      icon: MailWarning,
      title: "Please confirm your email",
      body: "Open the confirmation link we emailed you to send your application for review.",
    },
    PENDING_APPROVAL: {
      icon: Clock,
      title: "Your application is under review",
      body: `Thank you for applying. The membership team is reviewing the application for ${companyName}. We will email you as soon as a decision is made, usually within five working days.`,
    },
    REJECTED: {
      icon: XCircle,
      title: "Your application was not approved",
      body: rejectionReason ?? "Please contact the Chamber for more information.",
    },
    BLACKLISTED: {
      icon: Ban,
      title: "Your membership is suspended",
      body: "Access to the member portal has been suspended. Please contact the Chamber.",
    },
  }[status as "PENDING_VERIFICATION" | "PENDING_APPROVAL" | "REJECTED" | "BLACKLISTED"];

  if (!content) return null;
  const Icon = content.icon;

  return (
    <div className="mx-auto max-w-lg py-6 text-center md:py-12" role="status">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-accent">
        <Icon className="size-8 text-accent-foreground" aria-hidden />
      </div>
      <h1 className="mt-5 text-2xl font-bold text-primary">{content.title}</h1>
      <p className="mt-2 text-muted-foreground">{content.body}</p>
      {status === "PENDING_APPROVAL" && (
        <ol className="mx-auto mt-8 max-w-sm space-y-3 text-left text-sm">
          {[
            ["Application submitted", true],
            ["Email confirmed", true],
            ["Review by the membership team", false],
            ["Pay your annual fee", false],
          ].map(([label, doneStep]) => (
            <li key={label as string} className="flex items-center gap-3">
              <span
                className={`flex size-6 items-center justify-center rounded-full text-xs font-bold ${doneStep ? "bg-success text-white" : "border-2 border-border text-muted-foreground"}`}
                aria-hidden
              >
                {doneStep ? "✓" : ""}
              </span>
              <span className={doneStep ? "" : "text-muted-foreground"}>{label as string}</span>
            </li>
          ))}
        </ol>
      )}
      <p className="mt-8 text-sm text-muted-foreground">
        Questions? Email{" "}
        <a className="font-medium text-primary underline" href={`mailto:${ORG.supportEmail}`}>
          {ORG.supportEmail}
        </a>
      </p>
    </div>
  );
}
