import "server-only";
import { db } from "@/lib/db";
import { DEFAULT_REMINDER_CONFIG, type ReminderConfig } from "@/lib/config";

export function listActiveTiers() {
  return db.tier.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
}

export function listActiveSectors() {
  return db.sector.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
}

export function listAllTiers() {
  return db.tier.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { members: true } } } });
}

export function listAllSectors() {
  return db.sector.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { members: true } } } });
}

export async function getReminderConfig(): Promise<ReminderConfig> {
  const row = await db.setting.findUnique({ where: { key: "reminders" } });
  const value = row?.value as Partial<ReminderConfig> | undefined;
  return { ...DEFAULT_REMINDER_CONFIG, ...(value ?? {}) };
}
