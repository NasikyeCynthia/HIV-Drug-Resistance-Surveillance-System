import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { listPatients, Patient, Risk } from "../api/patients";
import { RiskBadge } from "../components/RiskBadge";
import { VL_FAILURE_THRESHOLD } from "../config/clinical";

export function MonitoringPage() {
  const { me } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [query, setQuery] = useState("");
  const [risk, setRisk] = useState<Risk | "all">("all");

  useEffect(() => { if (me) listPatients(me).then(setPatients); }, [me]);

  const shown = useMemo(() => patients.filter((p) =>
    p.artNumber.toLowerCase().includes(query.trim().toLowerCase()) && (risk === "all" || p.risk === risk)),
    [patients, query, risk]);

  return (
    <div className="max-w-5xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Risk Monitoring</h1>
        <p className="text-sm text-slate-500">
          Showing patients at {me?.facility_id ?? "all facilities"}. Risk = estimated likelihood of drug resistance among patients with treatment failure.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by ART number"
          aria-label="Search by ART number" className="w-64 rounded-md border bg-white px-3 py-2 text-sm" />
        <select value={risk} onChange={(e) => setRisk(e.target.value as Risk | "all")} aria-label="Filter by risk"
          className="rounded-md border bg-white px-3 py-2 text-sm">
          <option value="all">All risk levels</option><option value="high">High</option>
          <option value="medium">Medium</option><option value="low">Low</option>
        </select>
      </div>
      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr><th className="p-3">ART no.</th><th className="p-3">Age / sex</th><th className="p-3">Last viral load</th><th className="p-3">Risk</th></tr>
          </thead>
          <tbody>
            {shown.map((p) => {
              const last = p.visits[p.visits.length - 1];
              const high = last?.viralLoad != null && last.viralLoad >= VL_FAILURE_THRESHOLD;
              return (
                <tr key={p.id} className="border-t hover:bg-slate-50">
                  <td className="p-3 font-medium">
                    <Link to={`/monitoring/${p.id}`} className="text-teal-700 underline">{p.artNumber}</Link>
                    {p.pregnant && <span className="ml-2 rounded bg-pink-100 px-1.5 py-0.5 text-xs text-pink-800">Pregnant</span>}
                  </td>
                  <td className="p-3">{p.age} / {p.sex}</td>
                  <td className="p-3">{last?.viralLoad == null ? "—" : `${last.viralLoad.toLocaleString()} copies/mL`}
                    {high && <span className="ml-2 text-xs text-red-700">above {VL_FAILURE_THRESHOLD}</span>}</td>
                  <td className="p-3"><RiskBadge risk={p.risk} /></td>
                </tr>
              );
            })}
            {shown.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-slate-500">No patients match.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
