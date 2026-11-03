// UX only: the server (backend/app/deps.py) is the real gatekeeper. Keep both in sync.
//
// Two kinds of permission:
//   READ  -> "clinical:read" (see pages), "drafts:read" (see unapproved drafts)
//   WRITE -> each one names a specific action a person may perform
export type Permission =
  | "clinical:read"            // view monitoring, results, maternal, reports, APPROVED recommendations
  | "drafts:read"              // also view drafts: unfinalised mutation results, pending recommendations
  | "monitoring:write"         // enter visit data
  | "mutation:write"           // enter identified mutations
  | "recommendations:review"   // approve / reject recommendations
  | "users:manage";            // create accounts

export interface Me {
  id: string; name: string; role: string; facility_id: string | null;
  must_change_password: boolean; permissions: Permission[];
}

// `needs` = permission required to OPEN the page. Omitted = every signed-in user.
export interface NavItem { label: string; path: string; needs?: Permission }

export const NAV: NavItem[] = [
  { label: "Home",                path: "/" },
  { label: "Risk Monitoring",     path: "/monitoring",      needs: "clinical:read" },
  { label: "Classify Resistance", path: "/classify",        needs: "clinical:read" },
  { label: "Results",             path: "/results",         needs: "clinical:read" },
  { label: "Maternal (PMTCT)",    path: "/maternal",        needs: "clinical:read" },
  { label: "Recommendations",     path: "/recommendations", needs: "clinical:read" },
  { label: "Reports",             path: "/reports",         needs: "clinical:read" },
  { label: "Users",               path: "/admin/users",     needs: "users:manage" },
];
