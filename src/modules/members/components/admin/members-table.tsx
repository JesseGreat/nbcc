import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Member, Sector, Tier } from "@prisma/client";
import { MemberStatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/dates";

type Row = Member & { tier: Tier; sector: Sector };

/** Table on md+ screens; stacked cards on phones (no horizontal scrolling). */
export function MembersTable({ rows }: { rows: Row[] }) {
  return (
    <>
      <ul className="grid gap-3 md:hidden">
        {rows.map((m) => (
          <li key={m.id}>
            <Link href={`/members/${m.id}`} className="flex items-center gap-3 rounded-xl border bg-card p-4 active:bg-muted">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{m.companyName}</p>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                  {m.membershipNumber ?? "No number yet"} · {m.tier.name}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <MemberStatusBadge status={m.status} />
                  {m.expiresAt && <span>Expires {formatDate(m.expiresAt)}</span>}
                </div>
              </div>
              <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs tracking-wide text-muted-foreground uppercase">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Company</th>
              <th scope="col" className="px-4 py-3 font-semibold">Number</th>
              <th scope="col" className="px-4 py-3 font-semibold">Tier</th>
              <th scope="col" className="hidden px-4 py-3 font-semibold lg:table-cell">Sector</th>
              <th scope="col" className="px-4 py-3 font-semibold">Status</th>
              <th scope="col" className="px-4 py-3 font-semibold">Expires</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((m) => (
              <tr key={m.id} className="hover:bg-muted/40">
                <td className="max-w-64 px-4 py-3">
                  <Link href={`/members/${m.id}`} className="font-medium text-primary hover:underline">
                    {m.companyName}
                  </Link>
                </td>
                <td className="px-4 py-3 whitespace-nowrap tabular-nums">{m.membershipNumber ?? "—"}</td>
                <td className="px-4 py-3">{m.tier.name}</td>
                <td className="hidden px-4 py-3 lg:table-cell">{m.sector.name}</td>
                <td className="px-4 py-3"><MemberStatusBadge status={m.status} /></td>
                <td className="px-4 py-3 whitespace-nowrap">{formatDate(m.expiresAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
