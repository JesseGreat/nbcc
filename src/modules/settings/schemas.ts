import { z } from "zod";
import { emailSchema } from "@/modules/auth/schemas";

export const tierSchema = z.object({
  id: z.string().max(40).optional(),
  name: z.string().trim().min(2).max(60),
  description: z.string().trim().max(300).optional(),
  /** Entered in naira (major units); stored in kobo. */
  feeMajor: z.coerce.number().int("Whole naira only").min(0).max(1_000_000_000),
  isActive: z.boolean(),
});
export type TierInput = z.input<typeof tierSchema>;

export const sectorSchema = z.object({
  id: z.string().max(40).optional(),
  name: z.string().trim().min(2).max(80),
  isActive: z.boolean(),
});
export type SectorInput = z.input<typeof sectorSchema>;

export const reminderSettingsSchema = z.object({
  startDaysBeforeExpiry: z.coerce.number().int().min(7).max(365),
  intervalDays: z.coerce.number().int().min(1).max(180),
});
export type ReminderSettingsInput = z.input<typeof reminderSettingsSchema>;

export const STAFF_ROLES = ["SUPER_ADMIN", "ADMIN", "STAFF"] as const;

export const inviteStaffSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: emailSchema,
  role: z.enum(STAFF_ROLES),
});
export type InviteStaffInput = z.infer<typeof inviteStaffSchema>;

export const updateStaffSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(STAFF_ROLES),
  isDisabled: z.boolean(),
});
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
