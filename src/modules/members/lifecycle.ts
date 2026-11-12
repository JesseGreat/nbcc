import "server-only";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { sendEmail } from "@/lib/email";
import { publicEnv, serverEnv } from "@/lib/env";
import { AdminNewApplicationEmail, ApplicationReceivedEmail } from "@/emails/templates";

/**
 * Called after a user confirms their email. Moves the application from
 * PENDING_VERIFICATION to PENDING_APPROVAL (once) and notifies the member and admins.
 */
export async function onEmailVerified(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { member: { include: { tier: true, sector: true } } },
  });
  const member = user?.member;
  if (!user || !member) return;

  // Conditional update makes this idempotent if the link is opened twice.
  const { count } = await db.member.updateMany({
    where: { id: member.id, status: "PENDING_VERIFICATION" },
    data: { status: "PENDING_APPROVAL" },
  });
  if (count === 0) return;

  await audit({ actorId: user.id, action: "application.email_verified", targetType: "Member", targetId: member.id });

  await sendEmail({
    to: user.email,
    subject: "We have received your NBCC membership application",
    react: ApplicationReceivedEmail({ name: user.name, companyName: member.companyName }),
  });

  const admins = serverEnv.adminAlertEmails;
  if (admins.length) {
    await sendEmail({
      to: admins,
      subject: `New membership application: ${member.companyName}`,
      react: AdminNewApplicationEmail({
        companyName: member.companyName,
        tierName: member.tier.name,
        sectorName: member.sector.name,
        repName: member.repName,
        url: `${publicEnv.adminUrl}/applications/${member.id}`,
      }),
    });
  }
}
