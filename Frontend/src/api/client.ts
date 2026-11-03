// One place where the frontend talks to the server. Pages never call fetch() directly,
// so switching from mock to the real backend means changing this file only.
import type { Me } from "../auth/permissions";
import { mockApi } from "./mock";

export const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";
const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

interface Api {
  login(email: string, password: string): Promise<void>;
  me(): Promise<Me | null>;
  logout(): Promise<void>;
}

const realApi: Api = {
  async login(email, password) {
    const r = await fetch(`${API}/auth/login`, {
      method: "POST", credentials: "include",           // "include" sends/receives the httpOnly cookie
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (r.status === 429) throw new Error("Too many attempts. Please try again later.");
    if (!r.ok) throw new Error("Invalid credentials");
  },
  async me() {
    const r = await fetch(`${API}/auth/me`, { credentials: "include" });
    return r.ok ? r.json() : null;
  },
  async logout() { await fetch(`${API}/auth/logout`, { method: "POST", credentials: "include" }); },
};

export const api: Api = USE_MOCK ? mockApi : realApi;
