import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { requireAdmin } from "@/lib/rbac";
import { listActiveTiers } from "@/modules/settings/queries";
import { AnnouncementForm } from "@/modules/announcements/components/announcement-form";

export const metadata: Metadata = { title: "New announcement" };

export default async function NewAnnouncementPage() {
  await requireAdmin("announcements.send");
  const tiers = await listActiveTiers();
  return (
    <>
      <Link href="/announcements" className="mb-3 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Announcements
      </Link>
      <PageHeader title="New announcement" />
      <AnnouncementForm tiers={tiers.map((t) => ({ id: t.id, name: t.name }))} />
    </>
  );
}
