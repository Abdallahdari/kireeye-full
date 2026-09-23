import {
  Building2,
  CalendarCheck,
  CreditCard,
  Flag,
  LayoutDashboard,
  ShieldCheck,
  UserCircle,
  Users,
} from "lucide-react";

// Nav items are defined in server components (the role layouts) and rendered
// by client components (sidebar/topbar). Passing component references across
// that boundary breaks RSC serialization, so nav items carry a string key
// and resolve to an icon component here, client-side.
export const navIcons = {
  overview: LayoutDashboard,
  users: Users,
  approvals: ShieldCheck,
  reports: Flag,
  profile: UserCircle,
  listings: Building2,
  bookings: CalendarCheck,
  report: Flag,
  billing: CreditCard,
} as const;

export type NavIconKey = keyof typeof navIcons;
