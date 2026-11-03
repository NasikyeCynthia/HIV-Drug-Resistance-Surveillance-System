// DEMO ONLY (in-memory). The real backend must apply the same facility rule on the server.
import type { Me } from "../auth/permissions";

export type Risk = "low" | "medium" | "high";
export interface Factor { label: string; direction: "up" | "down"; strength: 1 | 2 | 3 }
export interface Visit {
  id: string; date: string; viralLoad: number | null; cd4: number | null;
  regimen: string; adherence: string; flags: string[]; recordedBy: string;
}
export interface Patient {
  id: string; artNumber: string; sex: "F" | "M"; age: number; facility: string; pregnant: boolean;
  risk: Risk; factors: Factor[]; visits: Visit[];
}
export interface NewVisit {
  date: string; viralLoad: number | null; cd4: number | null; regimen: string; adherence: string; flags: string[];
}

const v = (id: string, date: string, viralLoad: number | null, cd4: number | null, regimen: string, adherence: string, flags: string[] = []): Visit =>
  ({ id, date, viralLoad, cd4, regimen, adherence, flags, recordedBy: "Demo nurse" });

let store: Patient[] = [
  { id: "p1", artNumber: "ART-00123", sex: "F", age: 34, facility: "Yumbe Hospital", pregnant: false, risk: "high",
    factors: [{ label: "Viral load stayed high across 3 visits", direction: "up", strength: 3 },
              { label: "Poor adherence recorded", direction: "up", strength: 2 },
              { label: "Long time on first-line therapy", direction: "up", strength: 1 },
              { label: "No missed appointments", direction: "down", strength: 1 }],
    visits: [v("a1", "2026-07-10", 24000, 180, "TDF/3TC/DTG", "Poor", ["Economic challenges/poverty"]),
             v("a2", "2026-09-12", 31000, 150, "TDF/3TC/DTG", "Poor")] },
  { id: "p2", artNumber: "ART-00457", sex: "F", age: 27, facility: "Yumbe Hospital", pregnant: true, risk: "medium",
    factors: [{ label: "Viral load above threshold at last visit", direction: "up", strength: 2 },
              { label: "Good adherence recorded", direction: "down", strength: 2 }],
    visits: [v("b1", "2026-08-02", 1800, 420, "TDF/3TC/DTG", "Good")] },
  { id: "p3", artNumber: "ART-00988", sex: "M", age: 12, facility: "Yumbe Hospital", pregnant: false, risk: "high",
    factors: [{ label: "Child on first-line therapy with rising viral load", direction: "up", strength: 3 },
              { label: "Non-disclosure of status", direction: "up", strength: 1 }],
    visits: [v("c1", "2026-06-20", 5200, 300, "AZT/3TC/LPV/r", "Fair", ["Non-disclosure"]),
             v("c2", "2026-09-25", 9800, 260, "AZT/3TC/LPV/r", "Fair", ["Non-disclosure"])] },
  { id: "p4", artNumber: "ART-01102", sex: "M", age: 45, facility: "Yumbe Hospital", pregnant: false, risk: "low",
    factors: [{ label: "Viral load suppressed at last 3 visits", direction: "down", strength: 3 },
              { label: "Good adherence recorded", direction: "down", strength: 2 }],
    visits: [v("d1", "2026-09-30", 40, 610, "TDF/3TC/DTG", "Good")] },
  { id: "p5", artNumber: "ART-02210", sex: "F", age: 29, facility: "Kampala Clinic", pregnant: false, risk: "medium",
    factors: [{ label: "Recent regimen change", direction: "up", strength: 2 }],
    visits: [v("e1", "2026-10-05", 1200, 350, "AZT/3TC/DTG", "Fair")] },
];

const inScope = (me: Me, p: Patient) => !me.facility_id || p.facility === me.facility_id;

export async function listPatients(me: Me): Promise<Patient[]> { return store.filter((p) => inScope(me, p)); }

// Out-of-scope patients look exactly like patients that don't exist.
export async function getPatient(me: Me, id: string): Promise<Patient | undefined> {
  return store.find((p) => p.id === id && inScope(me, p));
}

export function validateVisit(n: NewVisit): string | null {
  if (!n.date) return "Visit date is required.";
  if (n.date > new Date().toISOString().slice(0, 10)) return "Visit date cannot be in the future.";
  if (n.viralLoad === null && n.cd4 === null) return "Enter at least a viral load or a CD4 count.";
  if (n.viralLoad !== null && (n.viralLoad < 0 || n.viralLoad > 10_000_000)) return "Viral load looks invalid.";
  if (n.cd4 !== null && (n.cd4 < 0 || n.cd4 > 3000)) return "CD4 looks invalid.";
  if (!n.regimen || !n.adherence) return "Choose a regimen and an adherence level.";
  return null;
}

export async function addVisit(me: Me, id: string, n: NewVisit) {
  if (!me.permissions.includes("monitoring:write")) throw new Error("Not permitted");
  const p = await getPatient(me, id);
  if (!p) throw new Error("Patient not found");
  const err = validateVisit(n);                 // the server repeats this check: never trust the browser
  if (err) throw new Error(err);
  p.visits = [...p.visits, { id: crypto.randomUUID(), ...n, flags: n.flags, recordedBy: me.name }];
}
