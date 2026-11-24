"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import { formatMoney } from "@/lib/money";

// Single-series charts: one brand hue each, no legend (the card title names the series).
const BAR = "var(--chart-1)";
const GRID = "var(--border)";
const INK_MUTED = "var(--muted-foreground)";

function TooltipBox({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="text-xs text-muted-foreground">{title}</p>
      <p className="font-semibold text-foreground tabular-nums">{value}</p>
    </div>
  );
}

export function RevenueChart({ data }: { data: { label: string; revenueMinor: number }[] }) {
  return (
    <div className="h-64 w-full md:h-72" role="img" aria-label="Bar chart of revenue by month for the last 12 months. A table view follows.">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barCategoryGap="28%">
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: INK_MUTED, fontSize: 11 }} interval="preserveStartEnd" minTickGap={8} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={56}
            tick={{ fill: INK_MUTED, fontSize: 11 }}
            tickFormatter={(v: number) => formatMoney(v, "NGN", { compact: true })}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            content={({ active, payload, label }: TooltipContentProps<ValueType, NameType>) =>
              active && payload?.length ? <TooltipBox title={String(label)} value={formatMoney(Number(payload[0].value), "NGN")} /> : null
            }
          />
          <Bar dataKey="revenueMinor" name="Revenue" fill={BAR} radius={[4, 4, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TierChart({ data }: { data: { tier: string; members: number }[] }) {
  return (
    <div className="h-64 w-full md:h-72" role="img" aria-label="Bar chart of members by tier. A table view follows.">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 28, left: 0, bottom: 0 }} barCategoryGap="30%">
          <CartesianGrid horizontal={false} stroke={GRID} />
          <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: INK_MUTED, fontSize: 11 }} />
          <YAxis type="category" dataKey="tier" tickLine={false} axisLine={false} width={108} tick={{ fill: INK_MUTED, fontSize: 12 }} />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            content={({ active, payload, label }: TooltipContentProps<ValueType, NameType>) =>
              active && payload?.length ? <TooltipBox title={String(label)} value={`${payload[0].value} members`} /> : null
            }
          />
          <Bar
            dataKey="members"
            name="Members"
            fill={BAR}
            radius={[0, 4, 4, 0]}
            maxBarSize={28}
            label={{ position: "right", fill: "var(--foreground)", fontSize: 12 }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
