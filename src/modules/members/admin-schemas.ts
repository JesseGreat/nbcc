import { z } from "zod";

const id = z.string().min(1).max(40);
const reason = z.string().trim().min(5, "Please give a reason (at least 5 characters)").max(1000);

export const approveSchema = z.object({ memberId: id });
export const rejectSchema = z.object({ memberId: id, reason });
export const changeTierSchema = z.object({ memberId: id, tierId: id });

export const STATUS_ACTIONS = ["deactivate", "archive", "blacklist", "restore"] as const;
export type StatusAction = (typeof STATUS_ACTIONS)[number];

export const statusActionSchema = z
  .object({ memberId: id, action: z.enum(STATUS_ACTIONS), reason: z.string().trim().max(1000).optional() })
  .refine((d) => d.action !== "blacklist" || (d.reason && d.reason.length >= 5), {
    path: ["reason"],
    message: "A reason is required to blacklist a member (at least 5 characters)",
  });
