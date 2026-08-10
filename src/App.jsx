import { Routes, Route } from "react-router-dom";

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
import SettingsScreen from "./pages/main/SettingsScreen";

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
          <Route path="settings/license" element={<LicenseManagement />} />

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
          <Route path="settings" element={<SettingsScreen />} />

        </Route>
      </Routes>
    </TenantProvider>
  );
}

export default App;