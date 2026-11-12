import { z } from "zod";
import { emailSchema, passwordSchema } from "@/modules/auth/schemas";
import { UPLOAD_KINDS } from "@/lib/uploads";

const text = (label: string, max = 200) =>
  z.string().trim().min(1, `${label} is required`).max(max, `${label} is too long`);

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9 ()-]{7,20}$/, "Enter a valid phone number, e.g. +234 803 123 4567");

/** Accepts "example.com" and normalises to "https://example.com". Empty = none. */
export const websiteSchema = z.preprocess(
  (v) => {
    if (typeof v !== "string") return v;
    const t = v.trim();
    if (!t) return undefined;
    return /^https?:\/\//i.test(t) ? t : `https://${t}`;
  },
  z.string().url("Enter a valid website address").max(200).optional(),
);

export const companyStepSchema = z.object({
  companyName: text("Company name", 160),
  rcNumber: text("RC number", 30),
  sectorId: text("Sector", 40),
  website: websiteSchema,
  address: text("Address", 300),
});

export const mdStepSchema = z.object({
  mdName: text("Managing Director's name", 120),
  mdEmail: emailSchema,
  mdPhone: phoneSchema,
});

export const repStepSchema = z.object({
  repName: text("Your name", 120),
  repEmail: emailSchema,
  repPhone: phoneSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, "Confirm your password"),
});

export const tierStepSchema = z.object({
  tierId: text("Membership tier", 40),
  reasonForJoining: z.string().trim().min(20, "Tell us a little more (at least 20 characters)").max(2000),
});

export const applicationSchema = companyStepSchema
  .merge(mdStepSchema)
  .merge(repStepSchema)
  .merge(tierStepSchema)
  .extend({ acceptTerms: z.boolean() })
  .refine((d) => d.password === d.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match" })
  .refine((d) => d.acceptTerms, { path: ["acceptTerms"], message: "Please confirm the details are correct" });

export type ApplicationInput = z.input<typeof applicationSchema>;

export const STEP_FIELDS = [
  Object.keys(companyStepSchema.shape),
  Object.keys(mdStepSchema.shape),
  [...Object.keys(repStepSchema.shape)],
  Object.keys(tierStepSchema.shape),
] as (keyof ApplicationInput)[][];

export const uploadRequestSchema = z.object({
  files: z
    .array(
      z.object({
        kind: z.enum(UPLOAD_KINDS),
        name: z.string().max(200),
        type: z.string().max(100),
        size: z.number().int().positive(),
      }),
    )
    .min(1)
    .max(3),
});
export type UploadRequest = z.infer<typeof uploadRequestSchema>;

export const submitApplicationSchema = z.object({
  application: applicationSchema,
  draftId: z.string().uuid(),
  uploads: z
    .array(z.object({ kind: z.enum(UPLOAD_KINDS), path: z.string().max(300), fileName: z.string().max(200) }))
    .max(3),
});
export type SubmitApplicationInput = z.input<typeof submitApplicationSchema>;

// ── Member self-service profile edits (tier/status are admin-only) ──────────
export const memberProfileSchema = z.object({
  website: websiteSchema,
  address: text("Address", 300),
  mdName: text("Managing Director's name", 120),
  mdEmail: emailSchema,
  mdPhone: phoneSchema,
  repName: text("Representative's name", 120),
  repPhone: phoneSchema,
});
export type MemberProfileInput = z.input<typeof memberProfileSchema>;
