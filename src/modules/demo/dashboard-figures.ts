/**
 * Headline figures shown on the admin dashboard while DEMO_MODE=true.
 * Edit the numbers here; set DEMO_MODE=false to show the live database figures.
 * "Pending approval" always stays live so approving an application still shows on the dashboard.
 */
export const DEMO_DASHBOARD = {
  total: 400,
  active: 372, // placeholder: not supplied
  expiring: 38, // placeholder: not supplied
  archivedOrBlacklisted: 28, // placeholder: not supplied
  revenueNaira: 100_000_000,
  tiers: [
    { tier: "Premium", members: 26 },
    { tier: "Prestige", members: 31 },
    { tier: "Corporate Plus", members: 71 },
    { tier: "Corporate", members: 111 },
    { tier: "Emerging", members: 180 },
  ],
  /** Share of the year's revenue per month, oldest first (sums to 100). */
  monthlyShare: [6, 5, 7, 8, 9, 7, 10, 8, 9, 11, 12, 8],
};
