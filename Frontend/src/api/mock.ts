// DEMO ONLY. Lets you run the frontend without the backend. Remove once the API is connected.
// Permissions mirror ROLE_PERMS in backend/app/deps.py.
import type { Me } from "../auth/permissions";

const DEMO_PASSWORD = "Demo-Password-1";
const USERS: Record<string, Me> = {
  "nurse@demo.ug": { id: "1", name: "Grace Akello (Nurse)", role: "clinician", facility_id: "Yumbe Hospital",
    must_change_password: false, permissions: ["clinical:read", "monitoring:write"] },
  "lab@demo.ug": { id: "2", name: "Peter Okello (Lab focal)", role: "lab_focal", facility_id: "Yumbe Hospital",
    must_change_password: false, permissions: ["clinical:read", "mutation:write"] },
  "lead@demo.ug": { id: "3", name: "Dr. Sarah Namutebi (Programme)", role: "decision_maker", facility_id: null,
    must_change_password: false, permissions: ["clinical:read", "drafts:read", "recommendations:review"] },
  "admin@demo.ug": { id: "4", name: "Admin (Accounts)", role: "admin", facility_id: null,
    must_change_password: false, permissions: ["users:manage"] },
};
const wait = (ms = 400) => new Promise((r) => setTimeout(r, ms));

export const mockApi = {
  async login(email: string, password: string) {
    await wait();
    const user = USERS[email.trim().toLowerCase()];
    if (!user || password !== DEMO_PASSWORD) throw new Error("Invalid credentials");
    sessionStorage.setItem("mock_user", email.trim().toLowerCase());
  },
  async me(): Promise<Me | null> {
    const email = sessionStorage.getItem("mock_user");
    return email ? USERS[email] : null;
  },
  async logout() { sessionStorage.removeItem("mock_user"); },
};
export const DEMO_HINT = { emails: Object.keys(USERS), password: DEMO_PASSWORD };
