import { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { DEMO_HINT } from "../api/mock";
import { USE_MOCK } from "../api/client";

export function LoginPage() {
  const { me, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (me) return <Navigate to="/" replace />;   // already signed in

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    try { await login(email, password); navigate("/", { replace: true }); }
    catch (err) { setError(err instanceof Error ? err.message : "Something went wrong"); }
    finally { setBusy(false); }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-teal-900 p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded-xl bg-white p-8 shadow-xl">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">HIVDR Surveillance</h1>
          <p className="text-sm text-slate-500">Sign in with the account your administrator created.</p>
        </div>
        <label className="block text-sm font-medium">Email
          <input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2 focus:outline-2 focus:outline-teal-600" />
        </label>
        <label className="block text-sm font-medium">Password
          <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2 focus:outline-2 focus:outline-teal-600" />
        </label>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button disabled={busy} className="w-full rounded-md bg-teal-700 py-2 font-medium text-white hover:bg-teal-800 disabled:opacity-60">
          {busy ? "Signing in…" : "Sign in"}
        </button>
        {USE_MOCK && (
          <div className="rounded-md bg-amber-50 p-3 text-xs text-amber-900">
            <p className="font-semibold">Demo mode (no backend)</p>
            <p>Password: {DEMO_HINT.password}</p>
            <ul className="mt-1">{DEMO_HINT.emails.map((e) => <li key={e}>{e}</li>)}</ul>
          </div>
        )}
      </form>
    </div>
  );
}
