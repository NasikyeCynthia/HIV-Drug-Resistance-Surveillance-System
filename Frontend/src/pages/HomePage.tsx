import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { NAV } from "../auth/permissions";

export function HomePage() {
  const { me, can } = useAuth();
  const shortcuts = NAV.filter((n) => n.path !== "/" && (!n.needs || can(n.needs)));
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Welcome, {me?.name.split(" ")[0]}</h1>
        <p className="text-slate-500">Here is what you can do with your account.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {shortcuts.map((n) => (
          <Link key={n.path} to={n.path} className="rounded-lg border bg-white p-4 hover:border-teal-600 hover:shadow">
            <p className="font-medium">{n.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
