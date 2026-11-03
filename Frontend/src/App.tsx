import { Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { AppShell } from "./components/AppShell";
import { LoginPage } from "./pages/LoginPage";
import { HomePage } from "./pages/HomePage";
import { PlaceholderPage as P } from "./pages/PlaceholderPage";
import { MonitoringPage } from "./pages/MonitoringPage";
import { PatientDetailPage } from "./pages/PatientDetailPage";
import { RecommendationsPage } from "./pages/RecommendationsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forbidden" element={<P title="Not permitted" />} />

      {/* Signed in? Then the shell. Each route says what is needed to OPEN it;
          what a user may CHANGE on the page is decided inside the page (editPerm). */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/settings" element={<P title="Settings" />} />
          <Route element={<ProtectedRoute needs="clinical:read" />}>
            <Route path="/monitoring" element={<MonitoringPage />} />
            <Route path="/monitoring/:patientId" element={<PatientDetailPage />} />
            <Route path="/classify" element={<P title="Classify Resistance" editPerm="mutation:write" editors="Authorised laboratory focal persons" />} />
            <Route path="/results" element={<P title="Results" />} />
            <Route path="/maternal" element={<P title="Maternal (PMTCT) Viral Load Tracking" editPerm="monitoring:write" editors="Nurses and doctors" />} />
            <Route path="/recommendations" element={<RecommendationsPage />} />
            <Route path="/reports" element={<P title="Reports & Analysis" />} />
          </Route>
          <Route element={<ProtectedRoute needs="users:manage" />}>
            <Route path="/admin/users" element={<P title="User Accounts" />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
