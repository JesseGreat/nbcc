/** Demo logins (DEMO_MODE only). Password comes from DEMO_PASSWORD. */
export const DEMO_ACCOUNTS = {
  admin: { email: "admin@demo.nbcc.test", name: "Amaka Obi (Demo Admin)", role: "SUPER_ADMIN" as const },
  staff: { email: "staff@demo.nbcc.test", name: "Tom Reynolds (Demo Staff)", role: "STAFF" as const },
  member: { email: "member@demo.nbcc.test", name: "Funmi Coker (Demo Member)", role: "MEMBER" as const },
};
