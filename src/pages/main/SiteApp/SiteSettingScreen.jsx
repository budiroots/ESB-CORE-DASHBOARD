import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft,
  LayoutGrid,
  Terminal as TerminalIcon,
  Activity,
  ShieldCheck,
  Settings,
  Loader2,
  Plus,
  X,
  RefreshCw,
  Trash2,
  Copy,
  Check,
  AlertTriangle
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

// Modul inti yang dicek langsung ke node via endpoint:
// GET /installedapp/{id}/common?apps=docker, java, jbang, kafka, mongodb, nodejs, pm2, postgresql
// -> { data: [{ name, installed, version, path, rawOutput }] }
const MODULE_META = {
  docker: {
    name: "Docker Engine",
    letter: "D",
    color: "cyan",
    command: "curl -fsSL https://get.docker.com | sh && sudo usermod -aG docker $USER"
  },
  java: {
    name: "Java OpenJDK 17",
    letter: "J",
    color: "amber",
    command: "sudo apt-get update && sudo apt-get install -y openjdk-17-jdk"
  },
  jbang: {
    name: "Apache Camel (JBang)",
    letter: "C",
    color: "blue",
    command: "curl -Ls https://sh.jbang.dev | bash -s - app setup"
  },
  kafka: {
    name: "Apache Kafka",
    letter: "K",
    color: "purple",
    command:
      "wget https://downloads.apache.org/kafka/3.7.0/kafka_2.13-3.7.0.tgz && tar -xzf kafka_2.13-3.7.0.tgz && mv kafka_2.13-3.7.0 /opt/kafka"
  },
  mongodb: {
    name: "MongoDB",
    letter: "M",
    color: "emerald",
    command:
      'curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor && echo "deb [signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list && sudo apt-get update && sudo apt-get install -y mongodb-org'
  },
  nodejs: {
    name: "Node.js",
    letter: "N",
    color: "lime",
    command: "curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs"
  },
  pm2: {
    name: "PM2 Process Manager",
    letter: "P",
    color: "orange",
    command: "sudo npm install -g pm2"
  },
  postgresql: {
    name: "PostgreSQL",
    letter: "Pg",
    color: "sky",
    command: "sudo apt-get update && sudo apt-get install -y postgresql postgresql-contrib"
  }
};
const MODULE_APP_IDS = Object.keys(MODULE_META);

const COLOR_STYLES = {
  amber: "bg-amber-500/15 text-amber-400 border-amber-800/40",
  blue: "bg-blue-500/15 text-blue-400 border-blue-800/40",
  cyan: "bg-cyan-500/15 text-cyan-400 border-cyan-800/40",
  purple: "bg-purple-500/15 text-purple-400 border-purple-800/40",
  emerald: "bg-emerald-500/15 text-emerald-400 border-emerald-800/40",
  lime: "bg-lime-500/15 text-lime-400 border-lime-800/40",
  orange: "bg-orange-500/15 text-orange-400 border-orange-800/40",
  sky: "bg-sky-500/15 text-sky-400 border-sky-800/40"
};

/**
 * Halaman "pEdge Node Settings" — diakses dari tombol gear pada panel detail node
 * (SitesScreen -> SiteDetail) menuju rute /setting/:id.
 *
 * Struktur mengikuti desain: header node + tab (pEdge Module, Terminal,
 * Monitoring, Security, Maintenance).
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

  // --- CEK MODUL TERPASANG (real check via SSH, endpoint /installedapp) ---
  const [checkedApps, setCheckedApps] = useState([]);
  const [modulesLoading, setModulesLoading] = useState(true);
  const [modulesError, setModulesError] = useState(null);
  const [isAddModuleOpen, setIsAddModuleOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

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

  // --- CEK MODUL YANG SUDAH TERPASANG DI NODE (docker, java, jbang, kafka) ---
  const checkInstalledModules = useCallback(async () => {
    if (!id) return;

    setModulesLoading(true);
    setModulesError(null);
    try {
      const response = await api.get(`/installedapp/${id}/common`, {
        params: { apps: MODULE_APP_IDS.join(", ") }
      });
      setCheckedApps(response.data?.data || []);
    } catch (error) {
      console.error("Gagal memeriksa modul terpasang:", error);
      setCheckedApps([]);
      setModulesError(error?.response?.data?.message || "Gagal memeriksa modul terpasang pada node.");
    } finally {
      setModulesLoading(false);
    }
  }, [id]);

  useEffect(() => {
    checkInstalledModules();
  }, [checkInstalledModules]);

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

  const handleCopyCommand = async (moduleId, command) => {
    try {
      await navigator.clipboard.writeText(command);
      setCopiedId(moduleId);
      setTimeout(() => setCopiedId((prev) => (prev === moduleId ? null : prev)), 1500);
    } catch (error) {
      console.error("Gagal menyalin command:", error);
    }
  };

  // Gabungkan metadata tampilan (nama/warna) dengan hasil cek real dari backend.
  const moduleComposition = MODULE_APP_IDS.map((appId) => {
    const meta = MODULE_META[appId];
    const check = checkedApps.find((a) => a.name === appId);
    return {
      id: appId,
      name: meta.name,
      letter: meta.letter,
      color: meta.color,
      command: meta.command,
      installed: !!check?.installed,
      version: check?.version || null,
      path: check?.path || null
    };
  });
  // Modul yang belum terpasang (installed: false) tidak ditampilkan di tabel utama —
  // cukup terlihat di modal "Add Module" supaya kelihatan komposisinya.
  const installedModules = moduleComposition.filter((m) => m.installed);

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
                <div className="flex justify-end gap-2">
                  <button
                    onClick={checkInstalledModules}
                    disabled={modulesLoading}
                    title="Recheck modules"
                    className="flex items-center justify-center w-8 h-8 rounded-lg border border-slate-800 bg-[#0e1420] hover:bg-[#141d2d] text-slate-300 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {modulesLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                  </button>
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
                    <div className="col-span-2">Path</div>
                    <div className="col-span-2 text-right">Actions</div>
                  </div>

                  {modulesLoading ? (
                    <div className="py-12 text-center flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                      <p className="text-xs text-slate-500">Memeriksa modul terpasang via SSH...</p>
                    </div>
                  ) : modulesError ? (
                    <div className="py-12 text-center flex flex-col items-center justify-center gap-2 px-5">
                      <AlertTriangle className="w-5 h-5 text-rose-400" />
                      <p className="text-xs text-rose-400">{modulesError}</p>
                    </div>
                  ) : installedModules.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-500">
                      Belum ada modul terpasang pada node ini. Klik{" "}
                      <span className="text-blue-400">Add Module</span> untuk melihat pilihan yang tersedia.
                    </div>
                  ) : (
                    installedModules.map((m) => <ModuleRow key={m.id} module={m} />)
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

      {/* MODAL ADD MODULE — menampilkan komposisi lengkap (sudah/belum terpasang) */}
      {isAddModuleOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#0b1017] border border-slate-800/90 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 flex items-center justify-between border-b border-slate-800/80 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#111823] border border-slate-700/50 flex items-center justify-center text-blue-400">
                  <LayoutGrid className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Module Composition</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Status modul inti pada {site?.name || "node ini"} — hasil cek langsung via SSH
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
              {modulesLoading ? (
                <div className="flex items-center justify-center gap-2 text-xs text-slate-500 py-8">
                  <Loader2 className="w-4 h-4 animate-spin" /> Memeriksa modul...
                </div>
              ) : (
                moduleComposition.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 bg-[#0e1420] border border-slate-800/80 rounded-xl space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg border flex items-center justify-center text-xs font-bold shrink-0 ${COLOR_STYLES[item.color]}`}
                        >
                          {item.letter}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-semibold text-white truncate">{item.name}</h4>
                          {item.installed ? (
                            <span className="text-[10px] font-mono text-slate-500 truncate block">
                              v{item.version} · {item.path}
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-slate-600">Belum terpasang</span>
                          )}
                        </div>
                      </div>

                      {item.installed ? (
                        <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded border border-emerald-800/30 shrink-0">
                          <Check className="w-3 h-3" />
                          Installed
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-800/40 px-2.5 py-1 rounded border border-slate-700/50 shrink-0">
                          Not Installed
                        </span>
                      )}
                    </div>

                    {!item.installed && (
                      <div className="flex items-center gap-2 bg-[#090d14] border border-slate-800/60 rounded-lg px-2.5 py-1.5">
                        <code className="text-[10px] font-mono text-slate-400 truncate flex-1">
                          {item.command}
                        </code>
                        <button
                          onClick={() => handleCopyCommand(item.id, item.command)}
                          title="Copy install command"
                          className="shrink-0 flex items-center gap-1 text-[10px] font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 px-2 py-1 rounded transition-colors cursor-pointer"
                        >
                          {copiedId === item.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" /> Copy
                            </>
                          )}
                        </button>
                      </div>
                    )}
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

function ModuleRow({ module: m }) {
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

      <div className="col-span-2 text-xs font-mono text-slate-400">{m.version ? `v${m.version}` : "-"}</div>

      <div className="col-span-2 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span className="text-xs font-mono text-emerald-400">Installed</span>
      </div>

      <div className="col-span-2 text-xs font-mono text-slate-500 truncate">{m.path || "—"}</div>

      <div className="col-span-2 flex items-center justify-end gap-3">
        <button
          onClick={() => alert("Uninstall belum tersedia lewat API. Jalankan secara manual via tab Terminal.")}
          className="text-xs text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
        >
          Uninstall
        </button>
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
