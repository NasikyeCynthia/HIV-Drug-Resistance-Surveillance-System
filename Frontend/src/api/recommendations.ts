// DEMO ONLY (in-memory). The real backend must apply the SAME filtering rule on the server:
// people without "drafts:read" must never receive pending/rejected rows at all.
import type { Me } from "../auth/permissions";

export type Status = "pending" | "approved" | "rejected";
export interface Recommendation {
  id: string; patientCode: string; text: string; status: Status; createdAt: string;
  reviewedBy?: string; reviewNote?: string;
}

let store: Recommendation[] = [
  { id: "r1", patientCode: "ART-00123", status: "approved", createdAt: "2026-10-02", reviewedBy: "Dr. S. Namutebi",
    text: "Viral load remains ≥1000 copies/mL after enhanced adherence support: repeat viral load and refer for resistance testing." },
  { id: "r2", patientCode: "ART-00457", status: "approved", createdAt: "2026-10-09", reviewedBy: "Dr. S. Namutebi",
    text: "Pregnant client, last viral load over 3 months ago: schedule repeat viral load at next ANC visit." },
  { id: "r3", patientCode: "ART-00988", status: "pending", createdAt: "2026-11-01",
    text: "Predicted high risk of resistance (model output). Review adherence history and consider early resistance testing." },
  { id: "r4", patientCode: "ART-01102", status: "pending", createdAt: "2026-11-02",
    text: "Confirmed NRTI mutation reported. Refer case to the regional switch committee." },
];

export async function listRecommendations(me: Me): Promise<Recommendation[]> {
  const seesDrafts = me.permissions.includes("drafts:read");
  return store.filter((r) => seesDrafts || r.status === "approved");
}

export async function reviewRecommendation(me: Me, id: string, decision: "approved" | "rejected", note: string) {
  if (!me.permissions.includes("recommendations:review")) throw new Error("Not permitted");
  if (decision === "rejected" && !note.trim()) throw new Error("Please give a reason when rejecting.");
  store = store.map((r) => r.id === id
    ? { ...r, status: decision, reviewedBy: me.name, reviewNote: note.trim() || undefined } : r);
}
