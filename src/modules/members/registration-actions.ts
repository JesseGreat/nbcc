"use server";

import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { createAdminClient } from "@/lib/supabase/server";
import { fail, fromZodError, type ActionResult } from "@/lib/action-result";
import { isDemoMode, publicEnv } from "@/lib/env";
import { sendEmail } from "@/lib/email";
import { extensionFor, rulesFor, validateFileMeta } from "@/lib/uploads";
import { VerifyEmail } from "@/emails/templates";
import { confirmUrl } from "@/modules/auth/links";
import { submitApplicationSchema, uploadRequestSchema, type SubmitApplicationInput, type UploadRequest } from "./schemas";
import { moveObject, verifyUpload } from "./storage";

type PreparedUpload = { kind: UploadRequest["files"][number]["kind"]; bucket: string; path: string; token: string };

/**
 * Step 1 of uploading: validate the declared files and return signed upload URLs
 * under `pending/<draftId>/`. The browser uploads directly to Supabase Storage,
 * which also enforces size and MIME limits at the bucket level.
 * TODO(phase1): rate-limit by IP and purge `pending/` objects older than 24h.
 */
export async function prepareUploadsAction(input: UploadRequest): Promise<ActionResult<{ draftId: string; uploads: PreparedUpload[] }>> {
  const parsed = uploadRequestSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);

  const kinds = parsed.data.files.map((f) => f.kind);
  if (new Set(kinds).size !== kinds.length) return fail("Each document type can only be uploaded once.");

  for (const f of parsed.data.files) {
    const problem = validateFileMeta(f.kind, f);
    if (problem) return fail(`${f.name}: ${problem}`);
  }

  const draftId = crypto.randomUUID();
  const storage = createAdminClient().storage;
  const uploads: PreparedUpload[] = [];
  for (const f of parsed.data.files) {
    const { bucket } = rulesFor(f.kind);
    const path = `pending/${draftId}/${f.kind.toLowerCase()}.${extensionFor(f.type)}`;
    const { data, error } = await storage.from(bucket).createSignedUploadUrl(path);
    if (error || !data) return fail("Could not prepare the upload. Please try again.");
    uploads.push({ kind: f.kind, bucket, path, token: data.token });
  }
  return { ok: true, data: { draftId, uploads } };
}

/** Step 2: create the auth user, member record and documents, then email the verification link. */
export async function submitApplicationAction(
  input: SubmitApplicationInput,
): Promise<ActionResult<{ email: string; demoToken: string | null }>> {
  const parsed = submitApplicationSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);
  const { application: a, draftId, uploads } = parsed.data;

  // Uploads must be ours (this draft) and the CAC certificate is required.
  if (uploads.some((u) => !u.path.startsWith(`pending/${draftId}/`))) return fail("Invalid upload reference.");
  if (!uploads.some((u) => u.kind === "CAC_CERTIFICATE")) return fail("Please upload your CAC certificate.");

  const [tier, sector, existing] = await Promise.all([
    db.tier.findFirst({ where: { id: a.tierId, isActive: true } }),
    db.sector.findFirst({ where: { id: a.sectorId, isActive: true } }),
    db.user.findUnique({ where: { email: a.repEmail } }),
  ]);
  if (!tier) return fail("Please choose a valid membership tier.");
  if (!sector) return fail("Please choose a valid sector.");
  if (existing) return fail("An account with this email already exists. Try signing in instead.", "email_taken");

  let verified;
  try {
    verified = await Promise.all(uploads.map((u) => verifyUpload(u.kind, u.path, u.fileName)));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Upload check failed.");
  }

  // Create the (unconfirmed) auth user and get a verification token without Supabase sending its own email.
  const supabaseAdmin = createAdminClient();
  const { data: link, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: "signup",
    email: a.repEmail,
    password: a.password,
    options: { data: { name: a.repName } },
  });
  if (linkError || !link.user || !link.properties) {
    if (linkError?.code === "email_exists" || /already/i.test(linkError?.message ?? "")) {
      return fail("An account with this email already exists. Try signing in instead.", "email_taken");
    }
    console.error("[register] generateLink failed", linkError);
    return fail("We could not create your account. Please try again.");
  }
  const authUserId = link.user.id;

  try {
    await supabaseAdmin.auth.admin.updateUserById(authUserId, { app_metadata: { role: "MEMBER" } });

    // Move files to their permanent folder (named after the user id).
    const stored = [];
    for (const v of verified) {
      const finalPath = `members/${authUserId}/${v.kind.toLowerCase()}.${extensionFor(v.mimeType)}`;
      stored.push({ ...v, path: await moveObject(v.kind, v.path, finalPath) });
    }
    const logo = stored.find((s) => s.kind === "LOGO");
    const docs = stored.filter((s) => s.kind !== "LOGO");

    await db.$transaction(async (tx) => {
      const member = await tx.member.create({
        data: {
          companyName: a.companyName,
          rcNumber: a.rcNumber,
          sectorId: sector.id,
          tierId: tier.id,
          status: "PENDING_VERIFICATION",
          website: a.website ?? null,
          address: a.address,
          logoPath: logo?.path ?? null,
          mdName: a.mdName,
          mdEmail: a.mdEmail,
          mdPhone: a.mdPhone,
          repName: a.repName,
          repEmail: a.repEmail,
          repPhone: a.repPhone,
          reasonForJoining: a.reasonForJoining,
          documents: {
            create: docs.map((d) => ({
              type: d.kind as "CAC_CERTIFICATE" | "COMPANY_PROFILE",
              storagePath: d.path,
              fileName: d.fileName,
              mimeType: d.mimeType,
              sizeBytes: d.sizeBytes,
            })),
          },
        },
      });
      await tx.user.create({
        data: { id: authUserId, email: a.repEmail, name: a.repName, role: "MEMBER", memberId: member.id },
      });
      await audit(
        { actorId: authUserId, action: "application.submitted", targetType: "Member", targetId: member.id, metadata: { tier: tier.name } },
        tx,
      );
    });
  } catch (err) {
    console.error("[register] failed after auth user creation; rolling back", err);
    await supabaseAdmin.auth.admin.deleteUser(authUserId).catch(() => {});
    return fail("We could not save your application. Please try again.");
  }

  const url = confirmUrl(publicEnv.appUrl, link.properties.hashed_token, "email", "/member");
  await sendEmail({
    to: a.repEmail,
    subject: "Confirm your email to continue your NBCC application",
    react: VerifyEmail({ name: a.repName, url }),
  });

  return {
    ok: true,
    // Demo only: lets the presenter verify without opening an inbox. It is the same
    // token as the email link and is only shown to the person who just registered.
    data: { email: a.repEmail, demoToken: isDemoMode() ? link.properties.hashed_token : null },
  };
}
