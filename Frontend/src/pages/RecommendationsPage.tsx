import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { ReadOnlyNotice } from "../components/ReadOnlyNotice";
import { listRecommendations, reviewRecommendation, Recommendation } from "../api/recommendations";

function ReviewControls({ id, onDone }: { id: string; onDone: () => void }) {
  const { me } = useAuth();
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  async function decide(d: "approved" | "rejected") {
    try { await reviewRecommendation(me!, id, d, note); onDone(); }
    catch (e) { setError(e instanceof Error ? e.message : "Failed"); }
  }
  return (
    <div className="mt-3 space-y-2">
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Review note (required to reject)"
        aria-label="Review note" className="w-full rounded-md border px-3 py-1.5 text-sm" />
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button onClick={() => decide("approved")} className="rounded-md bg-teal-700 px-3 py-1.5 text-sm text-white hover:bg-teal-800">Approve</button>
        <button onClick={() => decide("rejected")} className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50">Reject</button>
      </div>
    </div>
  );
}

function Card({ r, children }: { r: Recommendation; children?: React.ReactNode }) {
  return (
    <li className="rounded-lg border bg-white p-4">
      <div className="flex justify-between text-xs text-slate-500"><span>{r.patientCode}</span><span>{r.createdAt}</span></div>
      <p className="mt-2 text-sm">{r.text}</p>
      {r.reviewedBy && <p className="mt-2 text-xs text-slate-500">Reviewed by {r.reviewedBy}{r.reviewNote ? ` — ${r.reviewNote}` : ""}</p>}
      {children}
    </li>
  );
}

export function RecommendationsPage() {
  const { me, can } = useAuth();
  const [items, setItems] = useState<Recommendation[]>([]);
  const load = useCallback(() => { if (me) listRecommendations(me).then(setItems); }, [me]);
  useEffect(load, [load]);

  const approved = items.filter((r) => r.status === "approved");
  const pending = items.filter((r) => r.status === "pending");

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Recommendations</h1>
        <p className="text-sm text-slate-500">
          These support, and never replace, clinical judgement and laboratory testing.
        </p>
      </div>
      {!can("recommendations:review") && <ReadOnlyNotice who="Expert reviewers" />}

      {can("drafts:read") && (
        <section>
          <h2 className="mb-2 font-medium">Awaiting expert review ({pending.length})</h2>
          <ul className="space-y-3">
            {pending.map((r) => (
              <Card key={r.id} r={r}>{can("recommendations:review") && <ReviewControls id={r.id} onDone={load} />}</Card>
            ))}
            {pending.length === 0 && <p className="text-sm text-slate-500">Nothing waiting.</p>}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-2 font-medium">Approved recommendations ({approved.length})</h2>
        <ul className="space-y-3">{approved.map((r) => <Card key={r.id} r={r} />)}</ul>
      </section>
    </div>
  );
}
