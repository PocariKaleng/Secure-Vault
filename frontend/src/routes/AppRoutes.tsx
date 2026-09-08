import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import AuditLogPage from "../pages/AuditLogPage";
import DashboardPage from "../pages/DashboardPage";
import DecryptPage from "../pages/DecryptPage";
import EncryptPage from "../pages/EncryptPage";
import SignaturePage from "../pages/SignaturePage";
import VaultPage from "../pages/VaultPage";

export default function AppRoutes() {
    return (
        <HashRouter>
            <Routes>
                <Route element={<AppLayout />}>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/encrypt" element={<EncryptPage />} />
                    <Route path="/decrypt" element={<DecryptPage />} />
                    <Route path="/vault" element={<VaultPage />} />
                    <Route path="/signatures" element={<SignaturePage />} />
                    <Route path="/audit-logs" element={<AuditLogPage />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Route>
            </Routes>
        </HashRouter>
    );
}
