/**
 * Transactional email templates (React Email). Each export is a component;
 * pair it with a subject in the calling code via `sendEmail()`.
 */
import { CTA, Details, EmailLayout, H1, Muted, P } from "./layout";

export function VerifyEmail({ name, url }: { name: string; url: string }) {
  return (
    <EmailLayout preview="Confirm your email to continue your NBCC application">
      <H1>Confirm your email address</H1>
      <P>Hello {name},</P>
      <P>Thank you for applying for membership of the Chamber. Please confirm your email address to send your application for review.</P>
      <CTA href={url}>Confirm email</CTA>
      <Muted>If the button does not work, copy this link into your browser: {url}</Muted>
      <Muted>If you did not apply, you can ignore this email.</Muted>
    </EmailLayout>
  );
}

export function PasswordResetEmail({ name, url }: { name: string; url: string }) {
  return (
    <EmailLayout preview="Reset your NBCC portal password">
      <H1>Reset your password</H1>
      <P>Hello {name},</P>
      <P>We received a request to reset your password. This link expires in one hour.</P>
      <CTA href={url}>Choose a new password</CTA>
      <Muted>If you did not request this, you can safely ignore this email.</Muted>
    </EmailLayout>
  );
}

export function ApplicationReceivedEmail({ name, companyName }: { name: string; companyName: string }) {
  return (
    <EmailLayout preview="We have received your membership application">
      <H1>Application received</H1>
      <P>Hello {name},</P>
      <P>
        Thank you. Your application for <strong>{companyName}</strong> has been received and is now under review by the
        membership team. We will email you as soon as a decision is made, usually within five working days.
      </P>
      <P>You can sign in to the portal at any time to check your status.</P>
    </EmailLayout>
  );
}

export function AdminNewApplicationEmail({
  companyName,
  tierName,
  sectorName,
  repName,
  url,
}: {
  companyName: string;
  tierName: string;
  sectorName: string;
  repName: string;
  url: string;
}) {
  return (
    <EmailLayout preview={`New membership application: ${companyName}`}>
      <H1>New membership application</H1>
      <Details
        rows={[
          ["Company", companyName],
          ["Tier", tierName],
          ["Sector", sectorName],
          ["Representative", repName],
        ]}
      />
      <CTA href={url}>Review application</CTA>
    </EmailLayout>
  );
}

export function ApprovedEmail({
  name,
  companyName,
  membershipNumber,
  feeLabel,
  url,
}: {
  name: string;
  companyName: string;
  membershipNumber: string;
  feeLabel: string;
  url: string;
}) {
  return (
    <EmailLayout preview={`Welcome to the Chamber — membership number ${membershipNumber}`}>
      <H1>Your application has been approved</H1>
      <P>Hello {name},</P>
      <P>
        We are delighted to welcome <strong>{companyName}</strong> to the Nigerian-British Chamber of Commerce.
      </P>
      <Details rows={[["Membership number", membershipNumber], ["Annual fee", feeLabel]]} />
      <P>To activate your membership, sign in and pay your first annual fee.</P>
      <CTA href={url}>Sign in and pay</CTA>
    </EmailLayout>
  );
}

export function RejectedEmail({ name, companyName, reason }: { name: string; companyName: string; reason: string }) {
  return (
    <EmailLayout preview="An update on your membership application">
      <H1>An update on your application</H1>
      <P>Hello {name},</P>
      <P>
        Thank you for your interest in the Chamber. After review, we are unable to approve the application for{" "}
        <strong>{companyName}</strong> at this time.
      </P>
      <Details rows={[["Reason", reason]]} />
      <P>If you have questions or would like to re-apply, please reply to this email.</P>
    </EmailLayout>
  );
}

export function PaymentReceiptEmail({
  name,
  companyName,
  receiptNumber,
  amountLabel,
  periodLabel,
  reference,
  url,
}: {
  name: string;
  companyName: string;
  receiptNumber: string;
  amountLabel: string;
  periodLabel: string;
  reference: string;
  url: string;
}) {
  return (
    <EmailLayout preview={`Payment received — receipt ${receiptNumber}`}>
      <H1>Payment received — thank you</H1>
      <P>Hello {name},</P>
      <P>
        We have received your membership payment for <strong>{companyName}</strong>. Your membership is active. Your PDF
        receipt is attached.
      </P>
      <Details
        rows={[
          ["Receipt number", receiptNumber],
          ["Amount", amountLabel],
          ["Membership period", periodLabel],
          ["Payment reference", reference],
        ]}
      />
      <CTA href={url}>View payment history</CTA>
    </EmailLayout>
  );
}

export function RenewalReminderEmail({
  name,
  companyName,
  expiryLabel,
  daysLeft,
  feeLabel,
  url,
}: {
  name: string;
  companyName: string;
  expiryLabel: string;
  daysLeft: number;
  feeLabel: string;
  url: string;
}) {
  const expired = daysLeft < 0;
  return (
    <EmailLayout preview={expired ? "Your NBCC membership has expired" : `Your NBCC membership expires in ${daysLeft} days`}>
      <H1>{expired ? "Your membership has expired" : "Time to renew your membership"}</H1>
      <P>Hello {name},</P>
      <P>
        {expired
          ? `The membership for ${companyName} expired on ${expiryLabel}. Renew now to restore your member benefits.`
          : `The membership for ${companyName} expires on ${expiryLabel} (${daysLeft} days from now). Renew early to keep your benefits without interruption.`}
      </P>
      <Details rows={[["Renewal fee", feeLabel], ["Expiry date", expiryLabel]]} />
      <CTA href={url}>Renew now</CTA>
    </EmailLayout>
  );
}

export function AnnouncementEmail({ title, body, url }: { title: string; body: string; url: string }) {
  return (
    <EmailLayout preview={title}>
      <H1>{title}</H1>
      {body.split(/\n{2,}/).map((para, i) => (
        <P key={i}>{para}</P>
      ))}
      <CTA href={url}>View in the portal</CTA>
    </EmailLayout>
  );
}
