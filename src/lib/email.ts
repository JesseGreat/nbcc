import "server-only";
import type { ReactElement } from "react";
import { render } from "@react-email/render";
import { Resend } from "resend";
import { serverEnv } from "@/lib/env";

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  react: ReactElement;
  replyTo?: string;
  attachments?: { filename: string; content: Buffer }[];
};

export type SendEmailResult = { ok: true; id: string | null; logged?: boolean } | { ok: false; error: string };

/**
 * Sends a transactional email via Resend. Without RESEND_API_KEY the email is
 * printed to the server console instead, so local dev and demos never fail.
 * Never throws: email problems must not break the user's action.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  try {
    const [html, text] = await Promise.all([render(input.react), render(input.react, { plainText: true })]);
    const key = serverEnv.resendApiKey;

    if (!key) {
      console.info(
        [
          "─── [email:console] ─────────────────────────────",
          `To:      ${[input.to].flat().join(", ")}`,
          `Subject: ${input.subject}`,
          input.attachments?.length ? `Attach:  ${input.attachments.map((a) => a.filename).join(", ")}` : null,
          "",
          text,
          "─────────────────────────────────────────────────",
        ]
          .filter((l) => l !== null)
          .join("\n"),
      );
      return { ok: true, id: null, logged: true };
    }

    const resend = new Resend(key);
    const { data, error } = await resend.emails.send({
      from: serverEnv.emailFrom,
      to: input.to,
      subject: input.subject,
      html,
      text,
      replyTo: input.replyTo,
      attachments: input.attachments,
    });
    if (error) {
      console.error("[email] send failed", error);
      return { ok: false, error: error.message };
    }
    return { ok: true, id: data?.id ?? null };
  } catch (err) {
    console.error("[email] unexpected error", err);
    return { ok: false, error: err instanceof Error ? err.message : "Unknown email error" };
  }
}
