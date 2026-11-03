import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { Permission } from "./permissions";

export function ProtectedRoute({ needs }: { needs?: Permission }) {
  const { me, loading, can } = useAuth();
  if (loading) return null;
  if (!me) return <Navigate to="/login" replace />;
  if (me.must_change_password) return <Navigate to="/change-password" replace />;
  if (needs && !can(needs)) return <Navigate to="/forbidden" replace />;
  return <Outlet />;
}
