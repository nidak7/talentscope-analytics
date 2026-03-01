import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/app-shell";
import { ProtectedRoute } from "./components/protected-route";
import { AdminPage } from "./pages/admin-page";
import { DashboardPage } from "./pages/dashboard-page";
import { LoginPage } from "./pages/login-page";
import { RoleSearchPage } from "./pages/role-search-page";
import { SkillGapPage } from "./pages/skill-gap-page";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/roles" element={<RoleSearchPage />} />
          <Route path="/skill-gap" element={<SkillGapPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

