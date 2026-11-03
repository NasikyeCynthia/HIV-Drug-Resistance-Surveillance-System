import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { NAV } from "../auth/permissions";

const ROLE_LABEL: Record<string, string> = {
  clinician: "Clinician", lab_focal: "Lab focal person", decision_maker: "Decision maker", admin: "Administrator",
};

export function AppShell() {
  const { me, can, logout } = useAuth();
  // The sidebar is built from the permission list: users only see pages they may use.
  const items = NAV.filter((n) => !n.needs || can(n.needs));

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <aside className="hidden w-60 shrink-0 flex-col bg-teal-900 p-4 text-teal-50 md:flex">
        <div className="mb-6 text-lg font-semibold">HIVDR Surveillance</div>
        <nav aria-label="Main" className="flex flex-1 flex-col gap-1">
          {items.map((n) => (
            <NavLink key={n.path} to={n.path} end={n.path === "/"}
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm transition ${isActive ? "bg-teal-700 font-medium" : "hover:bg-teal-800"}`}>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <NavLink to="/settings" className="rounded-md px-3 py-2 text-sm hover:bg-teal-800">Settings</NavLink>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b bg-white px-6 py-3">
          <div>
            <p className="text-sm font-medium">{me?.name}</p>
            <p className="text-xs text-slate-500">
              {ROLE_LABEL[me?.role ?? ""] ?? me?.role} · {me?.facility_id ?? "All facilities"}
            </p>
          </div>
          <button onClick={logout} className="rounded-md border px-3 py-1.5 text-sm hover:bg-slate-100">Log out</button>
        </header>
        <main className="flex-1 p-6"><Outlet /></main>
      </div>
    </div>
  );
}
