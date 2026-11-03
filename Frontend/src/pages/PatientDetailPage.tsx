import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { addVisit, getPatient, Patient } from "../api/patients";
import { RiskBadge } from "../components/RiskBadge";
import { ReadOnlyNotice } from "../components/ReadOnlyNotice";
import { ADHERENCE, PSYCHOSOCIAL_OPTIONS, REGIMENS } from "../config/clinical";

const today = () => new Date().toISOString().slice(0, 10);
const toNum = (s: string) => (s.trim() === "" ? null : Number(s));

function RiskPanel({ p }: { p: Patient }) {
  return (
    <section className="rounded-lg border bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Resistance risk</h2><RiskBadge risk={p.risk} />
      </div>
      <p className="mt-1 text-xs text-slate-500">Example output: the prediction model is not connected yet.</p>
      <h3 className="mt-3 text-sm font-medium">Why this estimate</h3>
      <ul className="mt-2 space-y-2">
        {p.factors.map((f) => (
          <li key={f.label} className="flex items-center gap-3 text-sm">
            <span className={`w-20 shrink-0 text-xs font-medium ${f.direction === "up" ? "text-red-700" : "text-green-700"}`}>
              {f.direction === "up" ? "▲ raises" : "▼ lowers"}
            </span>
            <span className="flex-1">{f.label}</span>
            <span aria-hidden className={`h-2 rounded ${f.direction === "up" ? "bg-red-400" : "bg-green-400"}`} style={{ width: f.strength * 24 }} />
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-slate-500">
        Factors show what the model weighed, not what caused resistance. This supports clinical review and does not replace laboratory testing or clinical judgement.
      </p>
    </section>
  );
}

function VisitForm({ patientId, onSaved }: { patientId: string; onSaved: () => void }) {
  const { me } = useAuth();
  const [date, setDate] = useState(today());
  const [vl, setVl] = useState(""); const [cd4, setCd4] = useState("");
  const [regimen, setRegimen] = useState(""); const [adherence, setAdherence] = useState("");
  const [flags, setFlags] = useState<string[]>([]);
  const [error, setError] = useState(""); const [saved, setSaved] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault(); setError(""); setSaved(false);
    try {
      await addVisit(me!, patientId, { date, viralLoad: toNum(vl), cd4: toNum(cd4), regimen, adherence, flags });
      setVl(""); setCd4(""); setFlags([]); setSaved(true); onSaved();
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save"); }
  }
  const input = "mt-1 w-full rounded-md border px-3 py-2 text-sm";
  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border bg-white p-4">
      <h2 className="font-medium">Record a visit</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">Visit date<input type="date" max={today()} value={date} onChange={(e) => setDate(e.target.value)} className={input} /></label>
        <label className="text-sm">Viral load (copies/mL)<input type="number" min={0} value={vl} onChange={(e) => setVl(e.target.value)} className={input} /></label>
        <label className="text-sm">CD4 count<input type="number" min={0} value={cd4} onChange={(e) => setCd4(e.target.value)} className={input} /></label>
        <label className="text-sm">Regimen
          <select value={regimen} onChange={(e) => setRegimen(e.target.value)} className={input}>
            <option value="">Select…</option>{REGIMENS.map((r) => <option key={r}>{r}</option>)}</select></label>
        <label className="text-sm">Adherence
          <select value={adherence} onChange={(e) => setAdherence(e.target.value)} className={input}>
            <option value="">Select…</option>{ADHERENCE.map((a) => <option key={a}>{a}</option>)}</select></label>
      </div>
      <fieldset>
        <legend className="text-sm">Psychosocial challenges noted</legend>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
          {PSYCHOSOCIAL_OPTIONS.map((o) => (
            <label key={o} className="flex items-center gap-1.5 text-sm">
              <input type="checkbox" checked={flags.includes(o)}
                onChange={() => setFlags((f) => f.includes(o) ? f.filter((x) => x !== o) : [...f, o])} />{o}
            </label>
          ))}
        </div>
      </fieldset>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {saved && <p role="status" className="text-sm text-teal-700">Visit saved.</p>}
      <button className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800">Save visit</button>
    </form>
  );
}

export function PatientDetailPage() {
  const { patientId } = useParams();
  const { me, can } = useAuth();
  const [patient, setPatient] = useState<Patient | null | undefined>(undefined);
  const load = useCallback(() => { if (me && patientId) getPatient(me, patientId).then((p) => setPatient(p ?? null)); }, [me, patientId]);
  useEffect(load, [load]);

  if (patient === undefined) return null;
  if (patient === null) return <p>Patient not found. <Link to="/monitoring" className="text-teal-700 underline">Back to list</Link></p>;

  return (
    <div className="max-w-3xl space-y-4">
      <Link to="/monitoring" className="text-sm text-teal-700 underline">← All patients</Link>
      <h1 className="text-2xl font-semibold">{patient.artNumber}
        <span className="ml-3 text-base font-normal text-slate-500">{patient.age} yrs · {patient.sex}{patient.pregnant ? " · pregnant" : ""}</span></h1>
      <RiskPanel p={patient} />
      <section className="rounded-lg border bg-white p-4">
        <h2 className="mb-2 font-medium">Visit history</h2>
        <div className="overflow-x-auto"><table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-slate-500"><tr><th className="py-1">Date</th><th>VL</th><th>CD4</th><th>Regimen</th><th>Adherence</th></tr></thead>
          <tbody>{[...patient.visits].reverse().map((x) => (
            <tr key={x.id} className="border-t"><td className="py-1.5">{x.date}</td><td>{x.viralLoad ?? "—"}</td><td>{x.cd4 ?? "—"}</td><td>{x.regimen}</td><td>{x.adherence}</td></tr>))}</tbody>
        </table></div>
      </section>
      {can("monitoring:write") ? <VisitForm patientId={patient.id} onSaved={load} /> : <ReadOnlyNotice who="Nurses and doctors" />}
    </div>
  );
}
