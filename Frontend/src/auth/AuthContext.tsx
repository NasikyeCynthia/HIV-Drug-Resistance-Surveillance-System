import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "../api/client";
import type { Me, Permission } from "./permissions";

interface AuthState {
  me: Me | null;
  loading: boolean;                       // true until we know whether a session exists
  can: (p: Permission) => boolean;        // use this to show/hide UI
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}
const AuthCtx = createContext<AuthState>(null!);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  // On first load, ask the server "who am I?" - the answer comes from the secure cookie.
  useEffect(() => { api.me().then(setMe).finally(() => setLoading(false)); }, []);

  const login = useCallback(async (email: string, password: string) => {
    await api.login(email, password);
    setMe(await api.me());
  }, []);
  const logout = useCallback(async () => { await api.logout(); setMe(null); }, []);
  const can = useCallback((p: Permission) => !!me?.permissions.includes(p), [me]);

  return <AuthCtx.Provider value={{ me, loading, can, login, logout }}>{children}</AuthCtx.Provider>;
}
