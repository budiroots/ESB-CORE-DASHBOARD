import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/auth/Login";
import Layout from "./components/Layout";
import DashboardPrimacom from "./pages/main/DashboardScreen";
import ProtectedRoute from "./components/ProtectedRoute";
import TrafficScreen from "./pages/main/TrafficScreen";
import CamelScreen from "./pages/main/CamelScreen";
import SitesScreen from "./pages/main/SitesScreen";
import SiteSettingScreen from "./pages/main/SiteApp/SiteSettingScreen";
import KafkaScreen from "./pages/main/KafkaScreen";
import RoutesScreen from "./pages/main/RoutesScreen";
import AppScreen from "./pages/main/AppsScreen";
import MarketplaceScreen from "./pages/main/MarketplaceScreen";
import RbacScreen from "./pages/main/RbacScreen";
import TenantsScreen from "./pages/main/TenantsScreen";
import SettingsLayout from "./pages/main/settings/SettingsLayout";
import SmtpSettings from "./pages/main/settings/SmtpSettings";
import TelegramSettings from "./pages/main/settings/TelegramSettings";
import OfflineReminderSettings from "./pages/main/settings/OfflineReminderSettings";
import BrandingSettings from "./pages/main/settings/BrandingSettings";
import SecuritySettings from "./pages/main/settings/SecuritySettings";
import AuditLogRetentionSettings from "./pages/main/settings/AuditLogRetentionSettings";

// import Dashboard from "./pages/admin/Dashboard";
// import Canvas from "./pages/admin/Canvas";
// import Routing from "./pages/admin/Routing";
import Account from "./pages/admin/Account";
import MemberScreen from "./pages/main/MemberScreen";
import FirewallSecurity from "./pages/main/SecurityScreen";
import LicenseManagement from "./pages/main/LicenseScreen";
import { TenantProvider } from "./context/TenantContext";
import AuditTrailPage from "./pages/main/AuditScreen";
// import MultiTenantApp from "./pages/primacom/HomePrimacom";

function App() {
  return (
    <TenantProvider>

      <Routes>
        {/* PUBLIC */}
        <Route path="/login" element={<Login />} />
        {/* <Route path="/canvas" element={<Canvas />} />
      <Route path="/primacom" element={<MultiTenantApp />} /> */}

        {/* PROTECTED */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* <Route path="dashboard" element={<Dashboard />} />
        <Route path="canvas" element={<Canvas />} />
        <Route path="routing" element={<Routing />} /> */}
          <Route path="settings/members" element={<MemberScreen />} />
          <Route path="firewall/:id" element={<FirewallSecurity />} />
          <Route path="setting/:id" element={<SiteSettingScreen />} />

          <Route path="dashboard" element={<DashboardPrimacom />} />
          <Route path="traffic" element={<TrafficScreen />} />
          <Route path="camel" element={<CamelScreen />} />
          <Route path="sites" element={<SitesScreen />} />
          <Route path="kafka" element={<KafkaScreen />} />

          <Route path="routes" element={<RoutesScreen />} />
          <Route path="apps" element={<AppScreen />} />
          <Route path="marketplace" element={<MarketplaceScreen />} />

          <Route path="rbac" element={<RbacScreen />} />
          <Route path="auditlog" element={<AuditTrailPage />} />

          <Route path="tenants" element={<TenantsScreen />} />

          <Route path="settings" element={<SettingsLayout />}>
            <Route index element={<Navigate to="license" replace />} />
            <Route path="license" element={<LicenseManagement />} />
            <Route path="general/security" element={<SecuritySettings />} />
            <Route path="general/audit-log" element={<AuditLogRetentionSettings />} />
            <Route path="notifications/smtp" element={<SmtpSettings />} />
            <Route path="notifications/telegram" element={<TelegramSettings />} />
            <Route path="notifications/offline-reminder" element={<OfflineReminderSettings />} />
            <Route path="appearance/branding" element={<BrandingSettings />} />
          </Route>

        </Route>
      </Routes>
    </TenantProvider>
  );
}

export default App;