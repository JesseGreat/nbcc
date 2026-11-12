import { z } from "zod";

export const announcementSchema = z
  .object({
    title: z.string().trim().min(3, "Title is too short").max(150, "Keep the title under 150 characters"),
    body: z.string().trim().min(10, "Write a little more").max(10_000),
    audience: z.enum(["ALL", "ACTIVE", "TIER"]),
    tierId: z.string().max(40).optional(),
  })
  .refine((d) => d.audience !== "TIER" || !!d.tierId, { path: ["tierId"], message: "Choose a tier" });

export type AnnouncementInput = z.infer<typeof announcementSchema>;

export const AUDIENCE_LABELS = {
  ALL: "All members (active and awaiting payment)",
  ACTIVE: "Active members only",
  TIER: "Members of one tier",
} as const;
