import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft,
  LayoutGrid,
  Terminal as TerminalIcon,
  Activity,
  FileText,
  ShieldCheck,
  Settings,
  Loader2,
  Plus,
  X,
  RotateCw,
  Power,
  Trash2
} from "lucide-react";
import { useTenant } from "../../../context/TenantContext";
import api from "../../../api/axios";
import LiveTerminal from "./LiveTerminal";
import SiteHealth from "./SiteHealth";
import { FirewallPanel } from "../SecurityScreen";

// --- TABS pEdge NODE ---
const TABS = [
  { id: "module", label: "pEdge Module", icon: LayoutGrid },
  { id: "terminal", label: "Terminal", icon: TerminalIcon },
  { id: "monitoring", label: "Monitoring", icon: Activity },
  // { id: "logs", label: "Logs", icon: FileText },
  { id: "security", label: "Security", icon: ShieldCheck },
  { id: "maintenance", label: "Maintenance", icon: Settings }
];

// Modul default yang selalu terpasang pada sebuah pEdge node
const DEFAULT_MODULES = [
  { id: "java", name: "Java OpenJDK 17", version: "17 LTS", letter: "J", color: "amber", status: "installed", cpu: null, mem: null },
  { id: "camel", name: "Apache Camel", version: "4.5.0", letter: "C", color: "blue", status: "running", cpu: 5.4, mem: 340 },
  { id: "docker", name: "Docker Engine", version: "24.0+", letter: "D", color: "cyan", status: "running", cpu: 3.2, mem: 210 },
  { id: "kafka", name: "Apache Kafka", version: "3.7.0", letter: "K", color: "purple", status: "running", cpu: 8.1, mem: 512 }
];

// Katalog tambahan yang bisa dipasang lewat tombol "Add Module"
const MODULE_CATALOG = [
  { id: "mongodb", name: "MongoDB", version: "7.0", letter: "M", color: "emerald" },
  { id: "redis", name: "Redis", version: "7.2", letter: "R", color: "rose" },
  { id: "nginx", name: "Nginx", version: "1.25", letter: "N", color: "teal" },
  { id: "postgres", name: "PostgreSQL", version: "16", letter: "P", color: "sky" }
];

const COLOR_STYLES = {
  amber: "bg-amber-500/15 text-amber-400 border-amber-800/40",
  blue: "bg-blue-500/15 text-blue-400 border-blue-800/40",
  cyan: "bg-cyan-500/15 text-cyan-400 border-cyan-800/40",
  purple: "bg-purple-500/15 text-purple-400 border-purple-800/40",
  emerald: "bg-emerald-500/15 text-emerald-400 border-emerald-800/40",
  rose: "bg-rose-500/15 text-rose-400 border-rose-800/40",
  teal: "bg-teal-500/15 text-teal-400 border-teal-800/40",
  sky: "bg-sky-500/15 text-sky-400 border-sky-800/40"
};

/**
 * Halaman "pEdge Node Settings" — diakses dari tombol gear pada panel detail node
 * (SitesScreen -> SiteDetail) menuju rute /setting/:id.
 *
 * Struktur mengikuti desain: header node + tab (pEdge Module, Terminal,
 * Monitoring, Logs, Security, Maintenance).
 */
export default function SiteSettingScreen() {
  const { id } = useParams();
  const { tenantId } = useTenant();
  const navigate = useNavigate();

  const [site, setSite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connStatus, setConnStatus] = useState(null);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("module");

  // --- MODULE MANAGEMENT (dummy/local state, belum ada endpoint backend) ---
  const [modules, setModules] = useState(DEFAULT_MODULES);
  const [isAddModuleOpen, setIsAddModuleOpen] = useState(false);
  const [pendingModuleId, setPendingModuleId] = useState(null);

  // --- AMBIL DATA NODE YANG DIPILIH ---
  useEffect(() => {
    let cancelled = false;

    const fetchSite = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/site/${tenantId || ""}`);
        const data = response.data.data || [];
        const found = data.find((s) => String(s.id) === String(id));
        if (!cancelled) setSite(found || null);
      } catch (error) {
        console.error("Gagal mengambil data pEdge node:", error);
        if (!cancelled) setSite(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchSite();
    return () => {
      cancelled = true;
    };
  }, [id, tenantId]);

  // --- CEK STATUS KONEKSI NODE ---
  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const checkConnection = async () => {
      setConnStatus((prev) => ({ ...(prev || {}), status: "checking" }));
      try {
        const response = await api.get(`/site/test-connection/${id}`);
        const { success, message } = response.data;
        if (!cancelled) {
          setConnStatus({
            status: success ? "connected" : "disconnected",
            message: message || (success ? "Koneksi berhasil" : "Koneksi gagal"),
            lastChecked: new Date()
          });
        }
      } catch (error) {
        if (!cancelled) {
          setConnStatus({
            status: "disconnected",
            message: error?.response?.data?.message || "Gagal terhubung ke server.",
            lastChecked: new Date()
          });
        }
      }
    };

    checkConnection();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const toggleTerminal = () => setIsTerminalOpen((prev) => !prev);

  // --- DELETE SITE (metode sama seperti SiteDetail di SitesScreen.jsx) ---
  const handleDeleteSite = async () => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus site ini?")) return;

    try {
      await api.delete(`/site/${id}`);
      navigate("/sites");
    } catch (error) {
      console.error("Error deleting site:", error);
    }
  };

  // --- MODULE ACTIONS (local-only, endpoint asli menyusul) ---
  const handleModuleAction = (moduleId, action) => {
    if (action === "uninstall") {
      if (!window.confirm("Copot modul ini dari node?")) return;
      setModules((prev) => prev.filter((m) => m.id !== moduleId));
      return;
    }

    if (action === "stop") {
      setModules((prev) =>
        prev.map((m) => (m.id === moduleId ? { ...m, status: "stopped", cpu: null, mem: null } : m))
      );
      return;
    }

    if (action === "start") {
      setModules((prev) =>
        prev.map((m) =>
          m.id === moduleId ? { ...m, status: "running", cpu: +(Math.random() * 10 + 1).toFixed(1), mem: Math.round(Math.random() * 400 + 100) } : m
        )
      );
      return;
    }

    if (action === "restart") {
      setPendingModuleId(moduleId);
      setModules((prev) => prev.map((m) => (m.id === moduleId ? { ...m, status: "restarting" } : m)));
      setTimeout(() => {
        setModules((prev) =>
          prev.map((m) =>
            m.id === moduleId ? { ...m, status: "running", cpu: +(Math.random() * 10 + 1).toFixed(1), mem: Math.round(Math.random() * 400 + 100) } : m
          )
        );
        setPendingModuleId(null);
      }, 900);
    }
  };

  const handleInstallModule = (catalogItem) => {
    setModules((prev) => [
      ...prev,
      {
        ...catalogItem,
        status: "running",
        cpu: +(Math.random() * 10 + 1).toFixed(1),
        mem: Math.round(Math.random() * 400 + 100)
      }
    ]);
    setIsAddModuleOpen(false);
  };

  const installedIds = modules.map((m) => m.id);
  const availableCatalog = MODULE_CATALOG.filter((c) => !installedIds.includes(c.id));

  const badgeConfig = {
    connected: { label: "Connected", dot: "bg-emerald-500", text: "text-emerald-400" },
    disconnected: { label: "Disconnected", dot: "bg-rose-500", text: "text-rose-400" },
    checking: { label: "Checking...", dot: "bg-amber-500 animate-pulse", text: "text-amber-400" }
  };
  const badge = badgeConfig[connStatus?.status] || badgeConfig.checking;

  return (
    <div className="w-full min-h-screen bg-[#06090e] text-slate-300 p-8 font-sans select-none">
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-xs text-slate-400">Loading node settings...</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* BREADCRUMB */}
          <button
            onClick={() => navigate("/sites")}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Sites Management
          </button>

          {/* HEADER: NAME + STATUS + IP */}
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold text-white tracking-tight">
              {site?.name || "pEdge Node"}
            </h1>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
              <span className={`text-xs font-medium ${badge.text}`}>{badge.label}</span>
            </div>
            <span className="text-xs font-mono text-slate-500">{site?.endpoint || id}</span>
          </div>

          {/* TABS */}
          <div className="flex items-center gap-1 border-b border-slate-800/70 overflow-x-auto">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium border-b-2 -mb-px whitespace-nowrap transition-colors cursor-pointer ${
                    isActive
                      ? "text-blue-400 border-blue-500"
                      : "text-slate-500 border-transparent hover:text-slate-300"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* TAB CONTENT */}
          <div className="pt-1">
            {activeTab === "module" && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <button
                    onClick={() => setIsAddModuleOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Add Module
                  </button>
                </div>

                <div className="bg-[#0b0f17] border border-slate-800/80 rounded-xl overflow-hidden shadow-xl">
                  {/* TABLE HEADER */}
                  <div className="grid grid-cols-12 gap-4 px-5 py-3 text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-800/60">
                    <div className="col-span-4">Module</div>
                    <div className="col-span-2">Version</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-2">Resource Usage</div>
                    <div className="col-span-2 text-right">Actions</div>
                  </div>

                  {modules.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-500">
                      Belum ada modul terpasang pada node ini.
                    </div>
                  ) : (
                    modules.map((m) => (
                      <ModuleRow
                        key={m.id}
                        module={m}
                        isBusy={pendingModuleId === m.id}
                        onAction={(action) => handleModuleAction(m.id, action)}
                      />
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === "terminal" && (
              <div className="bg-[#0b0f17] border border-slate-800/80 rounded-xl p-5 shadow-xl flex flex-col">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#141d2d] border border-slate-700/60 flex items-center justify-center text-emerald-400">
                      <TerminalIcon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Live Terminal Access
                      </h2>
                      <p className="text-[10px] text-slate-500 font-mono">
                        SSH connection to {site?.sshUser || "root"}@{site?.endpoint || "127.0.0.1"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={toggleTerminal}
                    className={`px-4 py-2 rounded-md font-medium text-sm transition-colors flex items-center gap-2 cursor-pointer ${
                      isTerminalOpen
                        ? "bg-rose-600 hover:bg-rose-700 text-white"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white"
                    }`}
                  >
                    <TerminalIcon className="w-4 h-4" />
                    {isTerminalOpen ? "Tutup SSH" : "Buka SSH"}
                  </button>
                </div>
                {isTerminalOpen ? (
                  <LiveTerminal siteId={site} connStatus={connStatus} />
                ) : (
                  <div className="py-14 text-center text-xs text-slate-500">
                    Klik "Buka SSH" untuk memulai sesi terminal langsung ke node ini.
                  </div>
                )}
              </div>
            )}

            {activeTab === "monitoring" && <SiteHealth site={site} />}

            {/* {activeTab === "logs" && (
              <div className="bg-[#0b0f17] border border-slate-800/80 rounded-xl p-5 shadow-xl">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/60">
                  <div>
                    <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">System Logs</h2>
                    <p className="text-[10px] text-slate-500 font-mono">Recent activity from pEdge modules</p>
                  </div>
                </div>
                <div className="bg-[#05080e] border border-slate-800/90 rounded-lg p-3 font-mono text-[11px] text-slate-500 h-[320px] flex items-center justify-center">
                  Log streaming belum tersedia untuk node ini.
                </div>
              </div>
            )} */}

            {activeTab === "security" && <FirewallPanel />}

            {activeTab === "maintenance" && (
              <div className="bg-[#0b0f17] border border-slate-800/80 rounded-xl p-5 shadow-xl space-y-3">
                <div className="pb-3 mb-1 border-b border-slate-800/60">
                  <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Maintenance</h2>
                  <p className="text-[10px] text-slate-500 font-mono">Node-level maintenance actions</p>
                </div>
                <MaintenanceRow
                  icon={Trash2}
                  title="Delete Node"
                  desc="Hapus site ini beserta seluruh konfigurasi & modul terpasang secara permanen."
                  actionLabel="Delete Node"
                  danger
                  onClick={handleDeleteSite}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL ADD MODULE */}
      {isAddModuleOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#0b1017] border border-slate-800/90 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 flex items-center justify-between border-b border-slate-800/80 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#111823] border border-slate-700/50 flex items-center justify-center text-blue-400">
                  <LayoutGrid className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Module Catalog</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Select a module to install on {site?.name || "this node"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModuleOpen(false)}
                className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
              {availableCatalog.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">
                  Semua modul pada katalog sudah terpasang.
                </p>
              ) : (
                availableCatalog.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 bg-[#0e1420] border border-slate-800/80 rounded-xl flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg border flex items-center justify-center text-xs font-bold ${COLOR_STYLES[item.color]}`}
                      >
                        {item.letter}
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-white">{item.name}</h4>
                        <span className="text-[10px] font-mono text-slate-500">v{item.version}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleInstallModule(item)}
                      className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors cursor-pointer"
                    >
                      Install
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- SUB-COMPONENTS ---

function ModuleRow({ module: m, isBusy, onAction }) {
  const statusStyles = {
    installed: { dot: "bg-slate-500", text: "text-slate-400", label: "Installed" },
    running: { dot: "bg-emerald-500 animate-pulse", text: "text-emerald-400", label: "Running" },
    stopped: { dot: "bg-rose-500", text: "text-rose-400", label: "Stopped" },
    restarting: { dot: "bg-amber-500 animate-pulse", text: "text-amber-400", label: "Restarting..." }
  };
  const status = statusStyles[m.status] || statusStyles.installed;
  const resourceUsage =
    m.status === "running" && m.cpu !== null
      ? `cpu ${m.cpu}% · mem ${m.mem}MB`
      : "— runtime";

  return (
    <div className="grid grid-cols-12 gap-4 px-5 py-4 items-center border-b border-slate-800/40 last:border-b-0 hover:bg-slate-900/20 transition-colors">
      <div className="col-span-4 flex items-center gap-3">
        <div
          className={`w-8 h-8 rounded-lg border flex items-center justify-center text-xs font-bold shrink-0 ${COLOR_STYLES[m.color]}`}
        >
          {m.letter}
        </div>
        <span className="text-sm text-white font-medium truncate">{m.name}</span>
      </div>

      <div className="col-span-2 text-xs font-mono text-slate-400">{m.version}</div>

      <div className="col-span-2 flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
        <span className={`text-xs font-mono ${status.text}`}>{status.label}</span>
      </div>

      <div className="col-span-2 text-xs font-mono text-slate-500">{resourceUsage}</div>

      <div className="col-span-2 flex items-center justify-end gap-3">
        {isBusy ? (
          <Loader2 className="w-3.5 h-3.5 text-slate-500 animate-spin" />
        ) : m.status === "installed" ? (
          <button
            onClick={() => onAction("uninstall")}
            className="text-xs text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
          >
            Uninstall
          </button>
        ) : m.status === "stopped" ? (
          <>
            <button
              onClick={() => onAction("start")}
              className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
            >
              Start
            </button>
            <button
              onClick={() => onAction("uninstall")}
              className="text-xs text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
            >
              Uninstall
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onAction("restart")}
              className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Restart
            </button>
            <button
              onClick={() => onAction("stop")}
              className="text-xs text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
            >
              Stop
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function MaintenanceRow({ icon, title, desc, actionLabel, danger, onClick }) {
  const Icon = icon;
  return (
    <div className="flex items-center justify-between gap-4 p-3.5 bg-[#0e1420] border border-slate-800/80 rounded-xl">
      <div className="flex items-start gap-3">
        <div
          className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${
            danger ? "bg-rose-500/10 border-rose-800/40 text-rose-400" : "bg-[#162032] border-slate-700/50 text-blue-400"
          }`}
        >
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-semibold text-white">{title}</h4>
          <p className="text-[10.5px] text-slate-500 mt-0.5">{desc}</p>
        </div>
      </div>
      <button
        onClick={onClick}
        className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors shrink-0 cursor-pointer ${
          danger
            ? "bg-rose-950/40 text-rose-400 border border-rose-800/40 hover:bg-rose-950/70"
            : "bg-blue-600 hover:bg-blue-500 text-white"
        }`}
      >
        {actionLabel}
      </button>
    </div>
  );
}
