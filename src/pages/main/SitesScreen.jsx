import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Server,
  Plus,
  Activity,
  HardDrive,
  Cpu,
  MemoryStick,
  Layers,
  Network,
  Pencil,
  Trash2,
  X,
  Globe,
  Radio,
  AppWindow,
  CheckCircle2,
  Trash,
  Key,
  Lock,
  ShieldCheck,
  Settings,
  Eye,
  EyeOff,
  Loader2
} from "lucide-react";
import { useTenant } from "../../context/TenantContext";
import api from "../../api/axios";
import SiteTopology from "./SiteApp/SiteTopology";
import SiteHealth from "./SiteApp/SiteHealth";

// Catalog aplikasi bawaan
const AVAILABLE_APPS = [
  {
    "id": "docker",
    "name": "Docker Engine",
    "description": "Container runtime environment & Docker Compose",
    "version": "24.0+",
    "command": "curl -fsSL https://get.docker.com | sh && sudo usermod -aG docker $USER"
  },
  {
    "id": "java",
    "name": "Java OpenJDK 17",
    "description": "Java Development Kit (Required for Camel & Kafka)",
    "version": "17 LTS",
    "command": "sudo apt-get update && sudo apt-get install -y openjdk-17-jdk"
  },
  {
    "id": "camel-jbang",
    "name": "Camel JBang",
    "description": "Apache Camel CLI integration engine",
    "version": "4.x",
    "command": "curl -s https://jbang.dev/install.sh | bash && source ~/.bashrc && jbang app install camel@apache/camel"
  },
  {
    "id": "kafka",
    "name": "Apache Kafka",
    "description": "Enterprise event streaming platform (KRaft mode / No Zookeeper)",
    "version": "3.7.0",
    "command": "wget https://downloads.apache.org/kafka/3.7.0/kafka_2.13-3.7.0.tgz && tar -xzf kafka_2.13-3.7.0.tgz && mv kafka_2.13-3.7.0 /opt/kafka"
  }
];

const INITIAL_FORM_STATE = {
  id: "",
  tenantId: "",
  name: "",
  kind: 0,
  endpoint: "",
  desc: "",
  authMethod: "BasicAuth",
  sshUser: "root",
  sshPort: "22",
  privateKey: "",
  passphrase: "",
  password: "",
  apiKey: ""
};

// Interval polling status koneksi site yang sedang difokuskan
const CONNECTION_CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 menit

export default function SitesPage() {
  const { tenantId } = useTenant();

  const [sites, setSites] = useState([]);
  const [picked, setPicked] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [isAddAppModalOpen, setIsAddAppModalOpen] = useState(false);

  // Connection status tiap site (keyed by site id)
  // shape per entry: { status: 'checking' | 'connected' | 'disconnected', message: string, lastChecked: Date }
  const [connStatus, setConnStatus] = useState({});

  // Menandai tenant mana yang sudah dilakukan initial full-connection-check,
  // supaya sweep semua site hanya jalan sekali per tenant (bukan tiap fetchSites dipanggil ulang).
  const checkedTenantRef = useRef(null);

  // --- FETCH SITES (READ) ---
  const fetchSites = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/site/${tenantId || ''}`);
      const data = response.data.data || [];
      setSites(data);

      // Saat page pertama kali dibuka (atau tenant berganti), cek koneksi SEMUA site
      // satu per satu agar dari awal sudah ketahuan mana yang tidak terkoneksi.
      if (checkedTenantRef.current !== tenantId && data.length > 0) {
        checkedTenantRef.current = tenantId;
        checkAllSitesConnections(data);
      }
    } catch (error) {
      console.error("Gagal mengambil data site:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, [tenantId]);

  const site = useMemo(() => sites.find(s => s.id === picked) || sites[0], [sites, picked]);
  const spokeSites = useMemo(() => sites.filter(s => s.kind !== "Central Hub"), [sites]);
  const linksUp = spokeSites.filter(s => s.link !== "down").length;
  const totalRoutes = sites.reduce((a, s) => a + (s.routes || 0), 0);

  // --- CHECK CONNECTION STATUS (SSH TEST) ---
  const checkSiteConnection = async (siteId) => {
    if (!siteId) return;

    setConnStatus(prev => ({
      ...prev,
      [siteId]: { ...(prev[siteId] || {}), status: "checking" }
    }));

    try {
      const response = await api.get(`/site/test-connection/${siteId}`);
      const { success, message } = response.data;

      setConnStatus(prev => ({
        ...prev,
        [siteId]: {
          status: success ? "connected" : "disconnected",
          message: message || (success ? "Koneksi berhasil" : "Koneksi gagal"),
          lastChecked: new Date()
        }
      }));
    } catch (error) {
      console.error("Gagal test koneksi site:", error);
      setConnStatus(prev => ({
        ...prev,
        [siteId]: {
          status: "disconnected",
          message: error?.response?.data?.message || "Gagal terhubung ke server.",
          lastChecked: new Date()
        }
      }));
    }
  };

  // --- CHECK CONNECTION SEMUA SITE SATU-PER-SATU (dipanggil saat page pertama dibuka) ---
  const checkAllSitesConnections = async (siteList) => {
    for (const s of siteList) {
      if (!s?.id) continue;
      // eslint-disable-next-line no-await-in-loop
      await checkSiteConnection(s.id);
      // Jeda kecil antar pengecekan supaya tidak membanjiri backend sekaligus
      // dan status di UI terlihat "mengalir" diperbarui satu per satu.
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  };

  // Cek koneksi langsung saat site yang difokuskan berubah,
  // lalu ulangi tiap 5 menit selama site tsb masih menjadi fokus.
  useEffect(() => {
    if (!site?.id) return;

    checkSiteConnection(site.id);

    const intervalId = setInterval(() => {
      checkSiteConnection(site.id);
    }, CONNECTION_CHECK_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [site?.id]);

  // --- HANDLERS FOR SITE MODAL ---
  const handleOpenAddModal = () => {
    setModalMode("add");
    setFormData({
      ...INITIAL_FORM_STATE,
      tenantId: tenantId || ""
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (targetSite) => {
    setModalMode("edit");
    setFormData({
      id: targetSite.id || "",
      tenantId: targetSite.tenantId || tenantId || "",
      name: targetSite.name || "",
      kind: targetSite.kind || "On-Premises",
      endpoint: targetSite.endpoint || "",
      desc: targetSite.desc || "",
      authMethod: targetSite.authMethod || "SshKey",
      sshUser: targetSite.sshUser || "root",
      sshPort: targetSite.sshPort || "22",
      privateKey: targetSite.privateKey || "",
      passphrase: targetSite.passphrase || "",
      password: targetSite.password || "",
      apiKey: targetSite.apiKey || ""
    });
    setIsModalOpen(true);
  };

  // --- SAVE / UPDATE SITE (CREATE & UPDATE) ---
  const handleSaveSite = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.endpoint) {
      alert("Nama Site dan IP/Endpoint wajib diisi!");
      return;
    }

    setSubmitting(true);

    const payload = {
      tenantId: tenantId || formData.tenantId || "default",
      name: formData.name,
      kind: formData.kind,
      endpoint: formData.endpoint,
      desc: formData.desc,
      authMethod: formData.authMethod,
      sshUser: formData.sshUser,
      sshPort: formData.sshPort,
      privateKey: formData.privateKey,
      passphrase: formData.passphrase,
      password: formData.password,
      apiKey: formData.apiKey
    };

    try {
      if (modalMode === "add") {
        // POST to /site
        await api.post("/site", payload);
      } else {
        // PUT to /site/:id
        await api.put(`/site/${formData.id}`, payload);
      }
      await fetchSites();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error submitting site data:", error);
      alert("Terjadi kesalahan jaringan/server.");
    } finally {
      setSubmitting(false);
    }
  };

  // --- DELETE SITE ---
  const handleDeleteSite = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus site ini?")) return;

    try {
      await api.delete(`/site/${id}`);
      await fetchSites();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error deleting site:", error);
    }
  };

  // --- APPLICATION INSTALL/UNINSTALL HANDLERS ---
  const handleInstallApp = (appToInstall) => {
    if (!site) return;

    setSites(prev =>
      prev.map(s => {
        if (s.id === site.id) {
          const currentApps = s.installedApps || [];
          if (currentApps.some(a => a.id === appToInstall.id)) return s;
          return { ...s, installedApps: [...currentApps, appToInstall] };
        }
        return s;
      })
    );
    setIsAddAppModalOpen(false);
  };

  const handleUninstallApp = (appId) => {
    if (!site) return;
    if (window.confirm("Apakah Anda yakin ingin mencopot aplikasi ini?")) {
      setSites(prev =>
        prev.map(s => {
          if (s.id === site.id) {
            return {
              ...s,
              installedApps: (s.installedApps || []).filter(a => a.id !== appId)
            };
          }
          return s;
        })
      );
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#06090e] text-slate-300 p-8 font-sans select-none relative space-y-8">
      {/* HEADER */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            Sites Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Physical locations, topology layout, authentication policies, and node resources
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-md shadow-blue-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add site
        </button>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total Sites" value={sites.length} hint="incl. Central & Spokes" icon={<Globe className="w-4 h-4 text-blue-400" />} />
        <StatCard label="Links Up" value={`${linksUp}/${spokeSites.length}`} hint={spokeSites.length === 0 ? "No spoke nodes" : linksUp < spokeSites.length ? "Degraded" : "All connected"} icon={<Radio className="w-4 h-4 text-emerald-400" />} />
        <StatCard label="Routes Deployed" value={totalRoutes} hint="across all sites" icon={<Layers className="w-4 h-4 text-cyan-400" />} />
      </div>

      {/* LOADING STATE OR EMPTY STATE */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-xs text-slate-400">Loading site topology...</p>
        </div>
      ) : sites.length === 0 ? (
        <div className="py-16 text-center text-slate-500 text-xs bg-[#0b0f17] border border-slate-800/80 rounded-xl space-y-3">
          <Globe className="w-8 h-8 text-slate-600 mx-auto stroke-1" />
          <p className="text-sm font-semibold text-slate-400">Belum ada site yang terdaftar</p>
          <p className="text-slate-600 max-w-xs mx-auto text-[11px]">
            Tambahkan site baru dengan memilih jenis <strong className="text-blue-400 font-mono">Central Hub</strong> untuk site utama.
          </p>
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add First Site
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-12 gap-5 items-stretch">
            {/* Topology View Column */}
            <div className="col-span-12 lg:col-span-7 h-full">
              <SiteTopology sites={sites} picked={picked} onPick={setPicked} connStatus={connStatus} />
            </div>

            {/* Site Detail View Column */}
            <div className="col-span-12 lg:col-span-5 space-y-5">
              {site && (
                <>
                  <SiteDetail
                    s={site}
                    onEdit={() => handleOpenEditModal(site)}
                    connStatus={connStatus[site.id]}
                    onRecheck={() => checkSiteConnection(site.id)}
                  />
                  {/* <SiteHealth site={site} /> */}
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* MODAL CREATE / EDIT SITE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#0b1017] border border-slate-800/90 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 flex items-center justify-between border-b border-slate-800/80 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#111823] border border-slate-700/50 flex items-center justify-center text-blue-400">
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    {modalMode === "add" ? "Add New Site" : "Edit Site Details"}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Configure endpoint location & connection credentials
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSite} className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <label className="text-[11px] font-medium text-slate-300">Site Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Surabaya Branch"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#111722] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <label className="text-[11px] font-medium text-slate-300">Type / Kind</label>
                  <select
                    value={formData.kind}
                    onChange={e => setFormData({ ...formData, kind: e.target.value })}
                    className="w-full bg-[#111722] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value={0}>Central Hub (Utama/Kiri)</option>
                    <option value={1}>On-Premises (Cabang)</option>
                    <option value={2}>Cloud VPC (Cabang)</option>
                    <option value={3}>Edge Gateway (Cabang)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1 col-span-2">
                  <label className="text-[11px] font-medium text-slate-300">IP / Host Endpoint *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 192.168.1.100"
                    value={formData.endpoint}
                    onChange={e => setFormData({ ...formData, endpoint: e.target.value })}
                    className="w-full bg-[#111722] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-300">SSH Port</label>
                  <input
                    type="text"
                    required
                    placeholder="22"
                    value={formData.sshPort}
                    onChange={e => setFormData({ ...formData, sshPort: e.target.value })}
                    className="w-full bg-[#111722] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* AUTHENTICATION METHOD SELECTION */}
              <div className="space-y-2 pt-1 border-t border-slate-800/60">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Authentication Method
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    // { id: "SshKey", label: "SSH Key", icon: Key },
                    { id: "BasicAuth", label: "Basic Authentication", icon: Lock },
                    // { id: "ApiKey", label: "API Token", icon: ShieldCheck }
                  ].map(method => {
                    const IconComp = method.icon;
                    const isSelected = formData.authMethod === method.id;

                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, authMethod: method.id })}
                        className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border text-[11px] font-medium transition-all cursor-pointer ${isSelected
                          ? "bg-blue-950/60 border-blue-500 text-blue-300 shadow-sm"
                          : "bg-[#111722] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                          }`}
                      >
                        <IconComp className="w-3.5 h-3.5" />
                        <span>{method.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* DYNAMIC AUTHENTICATION FIELDS */}
              <div className="bg-[#0e1420] border border-slate-800/80 rounded-xl p-3.5 space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-300">SSH / Service Username</label>
                  <input
                    type="text"
                    placeholder="e.g. root or admin"
                    value={formData.sshUser}
                    onChange={e => setFormData({ ...formData, sshUser: e.target.value })}
                    className="w-full bg-[#090d14] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                {formData.authMethod === "SshKey" && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-slate-300">Private Key (RSA/Ed25519)</label>
                      <textarea
                        rows="3"
                        placeholder="-----BEGIN OPENSSH PRIVATE KEY-----..."
                        value={formData.privateKey}
                        onChange={e => setFormData({ ...formData, privateKey: e.target.value })}
                        className="w-full bg-[#090d14] border border-slate-800 rounded-lg px-3 py-1.5 text-[11px] text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-slate-300">Passphrase (Optional)</label>
                      <input
                        type="password"
                        placeholder="Key Passphrase if encrypted"
                        value={formData.passphrase}
                        onChange={e => setFormData({ ...formData, passphrase: e.target.value })}
                        className="w-full bg-[#090d14] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </>
                )}

                {formData.authMethod === "BasicAuth" && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-300">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Server Root Password"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        className="w-full bg-[#090d14] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 pr-8"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-2 text-slate-500 hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {formData.authMethod === "ApiKey" && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-300">API Gateway Bearer Token / Key</label>
                    <input
                      type="password"
                      placeholder="e.g. ps_live_secret_key_8f3a..."
                      value={formData.apiKey}
                      onChange={e => setFormData({ ...formData, apiKey: e.target.value })}
                      className="w-full bg-[#090d14] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-300">Description</label>
                <textarea
                  rows="2"
                  placeholder="Additional information about this site..."
                  value={formData.desc}
                  onChange={e => setFormData({ ...formData, desc: e.target.value })}
                  className="w-full bg-[#111722] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800/60 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {modalMode === "add" ? "Save Site" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL INSTALL APP CATALOG */}
      {isAddAppModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#0b1017] border border-slate-800/90 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 flex items-center justify-between border-b border-slate-800/80 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#111823] border border-slate-700/50 flex items-center justify-center text-blue-400">
                  <AppWindow className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">App Catalog Marketplace</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Select application to install on {site?.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddAppModalOpen(false)}
                className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
              {AVAILABLE_APPS.map(app => {
                const isAlreadyInstalled = (site?.installedApps || []).some(a => a.id === app.id);

                return (
                  <div
                    key={app.id}
                    className="p-3.5 bg-[#0e1420] border border-slate-800/80 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-xs font-semibold text-white flex items-center gap-2">
                        {app.name}
                        <span className="text-[9px] bg-blue-950/60 text-blue-300 border border-blue-800/60 px-1.5 py-0.2 rounded font-mono">
                          {app.category}
                        </span>
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5 text-[10.5px] font-mono text-slate-500">
                        <span>v{app.version}</span>
                        <span>·</span>
                        <span>{app.size}</span>
                      </div>
                    </div>

                    {isAlreadyInstalled ? (
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded border border-emerald-800/30">
                        Installed
                      </span>
                    ) : (
                      <button
                        onClick={() => handleInstallApp(app)}
                        className="px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors cursor-pointer"
                      >
                        Install
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- SUB-COMPONENTS SUPPORTING ---
function StatCard({ label, value, hint, icon }) {
  return (
    <div className="bg-[#0b0f17] border border-slate-800/80 rounded-xl p-4 flex items-center justify-between shadow-lg">
      <div>
        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">{label}</span>
        <span className="text-xl font-bold text-white tracking-tight mt-0.5 block">{value}</span>
        <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">{hint}</span>
      </div>
      <div className="w-10 h-10 rounded-xl bg-[#121927] border border-slate-700/50 flex items-center justify-center">
        {icon}
      </div>
    </div>
  );
}

function SiteDetail({ s, onEdit, onDelete, connStatus, onRecheck }) {
  const navigate = useNavigate();
  const status = connStatus?.status || "checking";

  const badgeConfig = {
    connected: {
      label: "Connected",
      dot: "bg-emerald-500",
      text: "text-emerald-400",
      bg: "bg-emerald-950/40 border-emerald-800/40"
    },
    disconnected: {
      label: "Disconnected",
      dot: "bg-rose-500",
      text: "text-rose-400",
      bg: "bg-rose-950/40 border-rose-800/40"
    },
    checking: {
      label: "Checking...",
      dot: "bg-amber-500 animate-pulse",
      text: "text-amber-400",
      bg: "bg-amber-950/40 border-amber-800/40"
    }
  };
  const badge = badgeConfig[status] || badgeConfig.checking;

  return (
    <div className="bg-[#0b0f17] border border-slate-800/80 rounded-xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
        <div>
          <h3 className="text-sm font-semibold text-white">{s.name}</h3>
          <p className="text-[11px] font-mono text-slate-400">{s.endpoint}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={onEdit} title="Edit" className="p-1.5 text-slate-400 hover:text-white rounded bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => navigate(`/setting/${s.id}`)}
            title="Node Settings (Installed Apps & Terminal)"
            className="p-1.5 text-slate-400 hover:text-white rounded bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* STATUS KONEKSI SSH (auto-check tiap 5 menit) */}
      <div className={`flex items-center justify-between p-2.5 rounded-lg border ${badge.bg}`}>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
          <span className={`text-[11px] font-mono font-medium ${badge.text}`}>{badge.label}</span>
        </div>
        <div className="flex items-center gap-2">
          {connStatus?.lastChecked && (
            <span className="text-[10px] font-mono text-slate-500">
              {connStatus.lastChecked.toLocaleTimeString()}
            </span>
          )}
          <button
            type="button"
            onClick={onRecheck}
            className="text-[10px] font-mono text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
          >
            Recheck
          </button>
        </div>
      </div>
      {connStatus?.message && (
        <p className="text-[10.5px] font-mono text-slate-500 -mt-2">{connStatus.message}</p>
      )}

      <div className="space-y-2 text-xs">
        <SiteHealth site={s} />
      </div>
    </div>
  );
}

// --- DUMMY HEALTH DATA GENERATOR ---
// Deterministik berdasarkan site.id supaya angkanya tidak berubah-ubah setiap render,
// tapi tetap berbeda antar site. Ganti dengan data asli dari backend saat sudah siap.
function generateDummyHealth(siteId) {
  const seed = String(siteId || "default")
    .split("")
    .reduce((acc, c) => acc + c.charCodeAt(0), 0) || 1;

  const rand = (min, max, salt = 0) => {
    const x = Math.sin(seed + salt) * 10000;
    const frac = x - Math.floor(x);
    return Math.round(min + frac * (max - min));
  };

  return {
    cpu: rand(15, 92, 1),
    memory: rand(25, 88, 2),
    storage: rand(10, 95, 3),
    network: {
      up: rand(1, 120, 4),
      down: rand(5, 480, 5)
    },
    os: {
      name: "Ubuntu Server",
      version: "22.04.3 LTS",
      kernel: "5.15.0-91-generic",
      arch: "x86_64",
      uptime: `${rand(1, 60, 6)}d ${rand(0, 23, 7)}h`
    }
  };
}

function TerminalConsole({ site, connStatus }) {
  const status = connStatus?.status || "checking";

  return (
    <div className="bg-[#05080e] border border-slate-800/90 rounded-lg p-3 font-mono text-[11px] text-emerald-400 h-[220px] overflow-y-auto space-y-1">
      <div>[system] Connecting to {site?.endpoint || "127.0.0.1"} via SSH...</div>

      {status === "checking" && (
        <div className="text-amber-400">[system] Menunggu hasil test koneksi...</div>
      )}

      {status === "connected" && (
        <>
          <div>[system] Authentication ({site?.authMethod || "SshKey"}) succeeded.</div>
          <div className="text-slate-400">{connStatus?.message || "Koneksi SSH Berhasil!"}</div>
          <div className="text-slate-400">Welcome to {site?.name || "Server"} node shell.</div>
        </>
      )}

      {status === "disconnected" && (
        <div className="text-rose-400">
          [system] Authentication failed: {connStatus?.message || "Tidak dapat terhubung ke server."}
        </div>
      )}

      <div className="text-slate-500">$ _</div>
    </div>
  );
}