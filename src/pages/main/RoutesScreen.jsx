import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  List,
  LayoutGrid,
  Plus,
  X,
  Filter,
  FileText,
  UploadCloud,
  Check,
  Wand2,
  Loader2,
  Pencil,
  Terminal as TerminalIcon
} from "lucide-react";
import { useTenant } from "../../context/TenantContext";
import api from "../../api/axios";

/**
 * "Routes" — daftar pipeline integrasi Camel (dummy/local state, belum ada endpoint backend).
 *
 * Alur "Create route" sengaja disederhanakan dari referensi desain:
 * - Saat membuat route baru, modal cuma punya 2 tab: General & Deploy (Pipeline/Policies
 *   belum ada karena belum ada canvas builder-nya).
 * - Tombol "Open in builder" TIDAK muncul di modal add — builder baru relevan untuk
 *   route yang sudah tersimpan, jadi aksi "Open Builder" muncul di baris tabel/board
 *   setelah route ada di list.
 */

// --- STATUS META ---
const STATUS_META = {
  running: { label: "Running", dot: "bg-emerald-500", text: "text-emerald-400" },
  warning: { label: "Warning", dot: "bg-amber-500", text: "text-amber-400" },
  errors: { label: "Errors", dot: "bg-rose-500", text: "text-rose-400" },
  draft: { label: "Draft", dot: "bg-slate-500", text: "text-slate-400" }
};
const BOARD_COLUMNS = ["draft", "running", "warning", "errors"];

const GROUPS = ["MINING", "IOT", "LOGISTICS", "ERP", "PLATFORM"];
const ROLLOUTS = ["Rolling", "Canary 10%", "All at once"];

const INITIAL_FORM = {
  id: null,
  name: "",
  group: GROUPS[0],
  environment: "Dev",
  description: "",
  targets: [],
  rollout: "Rolling"
};

// Kode singkat 2-huruf dari nama site, dipakai sebagai avatar "Deployed On"/target picker.
// Multi-kata -> inisial tiap kata (mis. "HQ Central" -> "HC"); satu kata -> 2 huruf pertama (mis. "Grasberg" -> "Gr").
function deriveCode(name) {
  const trimmed = (name || "").trim();
  if (!trimmed) return "??";
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return trimmed.slice(0, 1).toUpperCase() + trimmed.slice(1, 2).toLowerCase();
}

// --- DUMMY SEED DATA ---
// `targets` sengaja dikosongkan di data seed (kode "Gr/Sa/Ad/HQ" cuma label tampilan lama,
// belum tentu cocok dengan id node tenant yang sebenarnya) — saat rute seed ini di-edit/deploy,
// picker target akan menampilkan node tenant yang sedang difokuskan untuk dipilih ulang.
const SEED_ROUTES = [
  { id: "r1", name: "fms-dispatch-ingest", group: "MINING", environment: "Prod", description: "", targets: [], rollout: "Rolling", from: "FMS", to: "fms.telemetry", status: "warning", deployed: ["Gr", "Sa", "Ad"], instances: 3, down: 1, throughput: 800, owner: "BU", ver: "V1.9" },
  { id: "r2", name: "sensor-iot-ingest", group: "IOT", environment: "Prod", description: "", targets: [], rollout: "Rolling", from: "IoT", to: "sensor.iot", status: "errors", deployed: ["Gr"], instances: 1, down: 0, throughput: 1180, owner: "BU", ver: "V2.1" },
  { id: "r3", name: "condition-monitor-ingest", group: "IOT", environment: "Prod", description: "", targets: [], rollout: "Rolling", from: "Vibrasi/Suhu", to: "sensor.iot", status: "warning", deployed: ["Sa"], instances: 1, down: 0, throughput: 540, owner: "BU", ver: "V1.4" },
  { id: "r4", name: "weighbridge-ingest", group: "LOGISTICS", environment: "Prod", description: "", targets: [], rollout: "Rolling", from: "Weighbridge", to: "weighbridge.events", status: "warning", deployed: ["Gr", "Ad"], instances: 2, down: 1, throughput: 35, owner: "RA", ver: "V1.2" },
  { id: "r5", name: "fuel-system-ingest", group: "LOGISTICS", environment: "Dev", description: "", targets: [], rollout: "Rolling", from: "Fuel", to: "fuel.events", status: "draft", deployed: ["Gr"], instances: 1, down: 0, throughput: null, owner: "RA", ver: "V1.0" },
  { id: "r6", name: "sap-idoc-sink", group: "ERP", environment: "Prod", description: "", targets: [], rollout: "Rolling", from: "sap.outbound", to: "SAP PM", status: "warning", deployed: ["HQ"], instances: 1, down: 0, throughput: 90, owner: "RA", ver: "V3.2" },
  { id: "r7", name: "sap-odata-sink", group: "ERP", environment: "Prod", description: "", targets: [], rollout: "Rolling", from: "sap.outbound", to: "SAP ERP", status: "running", deployed: ["HQ"], instances: 1, down: 0, throughput: 45, owner: "RA", ver: "V2.4" },
  { id: "r8", name: "dlq-handler", group: "PLATFORM", environment: "Prod", description: "", targets: [], rollout: "Rolling", from: "*.DLQ", to: "audit.dlq", status: "running", deployed: ["HQ"], instances: 1, down: 0, throughput: 4, owner: "DM", ver: "V1.1" }
];

// --- HELPERS ---
function formatThroughput(v) {
  return v === null || v === undefined ? "—" : `${v.toLocaleString()}/s`;
}

export default function RoutesScreen() {
  const navigate = useNavigate();
  const { tenantId } = useTenant();

  const [routes, setRoutes] = useState(SEED_ROUTES);
  const [view, setView] = useState("table"); // "table" | "board"
  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add" | "edit"
  const [activeTab, setActiveTab] = useState("general"); // "general" | "deploy"
  const [formData, setFormData] = useState(INITIAL_FORM);

  // --- NODE LIST TENANT YANG SEDANG DIFOKUSKAN (dipakai sebagai target deploy) ---
  const [tenantSites, setTenantSites] = useState([]);
  const [sitesLoading, setSitesLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchTenantSites = async () => {
      setSitesLoading(true);
      try {
        const response = await api.get(`/site/${tenantId || ""}`);
        const data = response.data?.data || [];
        if (!cancelled) setTenantSites(data);
      } catch (error) {
        console.error("Gagal mengambil daftar node tenant:", error);
        if (!cancelled) setTenantSites([]);
      } finally {
        if (!cancelled) setSitesLoading(false);
      }
    };

    fetchTenantSites();
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  // Node/site tenant ini diperlakukan sebagai instance Camel yang bisa jadi target deploy.
  const camelInstances = useMemo(
    () =>
      tenantSites.map((s) => ({
        id: String(s.id),
        code: deriveCode(s.name),
        name: `Camel ${s.name}`,
        site: s.endpoint || (s.kind === 0 ? "Central Hub" : "Branch Site"),
        online: s.link !== "down"
      })),
    [tenantSites]
  );
  const instanceById = useMemo(
    () => Object.fromEntries(camelInstances.map((i) => [i.id, i])),
    [camelInstances]
  );

  const filteredRoutes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return routes;
    return routes.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.group.toLowerCase().includes(q) ||
        r.from.toLowerCase().includes(q) ||
        r.to.toLowerCase().includes(q)
    );
  }, [routes, search]);

  // --- STATS ---
  const stats = useMemo(() => {
    const total = routes.length;
    const running = routes.filter((r) => r.status === "running").length;
    const warn = routes.filter((r) => r.status === "warning").length;
    const errors = routes.filter((r) => r.status === "errors").length;
    const deployments = routes.reduce((acc, r) => acc + r.instances, 0);
    const totalThru = routes.reduce((acc, r) => acc + (r.throughput || 0), 0);
    const uniqueInstances = new Set(routes.flatMap((r) => r.deployed)).size;
    return { total, running, warn, errors, deployments, totalThru, uniqueInstances };
  }, [routes]);

  // --- MODAL HANDLERS ---
  const openCreateModal = () => {
    setModalMode("add");
    setFormData({
      ...INITIAL_FORM,
      targets: camelInstances.length > 0 ? [camelInstances[0].id] : []
    });
    setActiveTab("general");
    setIsModalOpen(true);
  };

  // Dipakai baik oleh tombol Edit (buka di tab General) maupun Deploy (buka di tab Deploy)
  // pada baris list — keduanya reuse modal yang sama, cuma beda tab awal.
  const openEditModal = (route, tab = "general") => {
    setModalMode("edit");
    setFormData({
      id: route.id,
      name: route.name,
      group: route.group,
      environment: route.environment || "Dev",
      description: route.description || "",
      targets:
        route.targets && route.targets.length > 0
          ? route.targets
          : camelInstances.length > 0
            ? [camelInstances[0].id]
            : [],
      rollout: route.rollout || "Rolling"
    });
    setActiveTab(tab);
    setIsModalOpen(true);
  };

  const toggleTarget = (instanceId) => {
    setFormData((prev) => ({
      ...prev,
      targets: prev.targets.includes(instanceId)
        ? prev.targets.filter((t) => t !== instanceId)
        : [...prev.targets, instanceId]
    }));
  };

  // --- SAVE (local-only, belum ada endpoint backend) — handle tambah & edit sekaligus ---
  const handleSubmitRoute = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Route name wajib diisi!");
      return;
    }

    const deployedCodes = formData.targets.map((t) => instanceById[t]?.code).filter(Boolean);

    if (modalMode === "edit") {
      setRoutes((prev) =>
        prev.map((r) =>
          r.id === formData.id
            ? {
                ...r,
                name: formData.name.trim(),
                group: formData.group,
                environment: formData.environment,
                description: formData.description,
                targets: formData.targets,
                rollout: formData.rollout,
                deployed: deployedCodes,
                instances: formData.targets.length,
                down: 0,
                status: formData.targets.length > 0 ? "running" : r.status
              }
            : r
        )
      );
    } else {
      const newRoute = {
        id: `r-${Date.now()}`,
        name: formData.name.trim(),
        group: formData.group,
        environment: formData.environment,
        description: formData.description,
        targets: formData.targets,
        rollout: formData.rollout,
        from: "manual",
        to: `${formData.group.toLowerCase()}.events`,
        status: "draft",
        deployed: deployedCodes,
        instances: formData.targets.length,
        down: 0,
        throughput: null,
        owner: "ME",
        ver: "V1.0"
      };
      setRoutes((prev) => [newRoute, ...prev]);
    }

    setIsModalOpen(false);
  };

  const handleOpenBuilder = (route) => {
    // Visual builder belum tersedia — stub yang jujur, bukan navigasi ke halaman yang belum ada.
    alert(`Visual Builder untuk "${route.name}" belum tersedia — coming soon.`);
  };

  const handleOpenTerminal = (route) => {
    // Live console per-route belum tersedia — stub yang jujur, bukan navigasi ke halaman yang belum ada.
    alert(`Live console untuk route "${route.name}" belum tersedia — coming soon.`);
  };

  const targetNodeLabel = `${formData.targets.length} target node${formData.targets.length === 1 ? "" : "s"} · ${formData.environment.toLowerCase()}`;

  return (
    <div className="w-full min-h-screen bg-[#06090e] text-slate-300 p-8 font-sans select-none space-y-6">
      {/* HEADER */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Routes</h1>
          <p className="text-xs text-slate-500 mt-1">
            {stats.total} routes · {stats.deployments} deployments across all Camel instances
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search routes..."
              className="bg-[#0b0f17] border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 w-48"
            />
          </div>

          <div className="flex items-center bg-[#0b0f17] border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setView("table")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                view === "table" ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <List className="w-3.5 h-3.5" /> Table
            </button>
            <button
              onClick={() => setView("board")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                view === "board" ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Board
            </button>
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New route
          </button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <RouteStatCard label="Total" value={stats.total} />
        <RouteStatCard label="Running" value={stats.running} badge={stats.running > 0 ? { label: "ok", tone: "ok" } : null} />
        <RouteStatCard label="Warn" value={stats.warn} />
        <RouteStatCard label="Errors" value={stats.errors} badge={stats.errors > 0 ? { label: "needs attn", tone: "attn" } : null} />
        <RouteStatCard label="Deployments" value={stats.deployments} hint={`on ${stats.uniqueInstances} instances`} />
        <RouteStatCard label="Total Thru" value={stats.totalThru.toLocaleString()} unit="msg/s" />
      </div>

      {/* TABLE VIEW */}
      {view === "table" && (
        <div className="bg-[#0b0f17] border border-slate-800/80 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-800/60">
                  <th className="py-3 px-5 font-semibold">Route</th>
                  <th className="py-3 px-3 font-semibold">Group</th>
                  <th className="py-3 px-3 font-semibold">Status</th>
                  <th className="py-3 px-3 font-semibold">Deployed On</th>
                  <th className="py-3 px-3 font-semibold text-right">Throughput</th>
                  <th className="py-3 px-3 font-semibold">Owner</th>
                  <th className="py-3 px-3 font-semibold">Ver</th>
                  <th className="py-3 px-5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filteredRoutes.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-xs text-slate-500">
                      Tidak ada route yang cocok dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredRoutes.map((r) => (
                    <RouteRow
                      key={r.id}
                      route={r}
                      onEdit={() => openEditModal(r, "general")}
                      onDeploy={() => openEditModal(r, "deploy")}
                      onOpenTerminal={() => handleOpenTerminal(r)}
                      onOpenBuilder={() => handleOpenBuilder(r)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BOARD VIEW */}
      {view === "board" && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {BOARD_COLUMNS.map((status) => (
            <BoardColumn
              key={status}
              status={status}
              routes={filteredRoutes.filter((r) => r.status === status)}
              onOpenBuilder={handleOpenBuilder}
            />
          ))}
        </div>
      )}

      {/* MODAL CREATE ROUTE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#0b1017] border border-slate-800/90 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 flex items-center justify-between border-b border-slate-800/80 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#111823] border border-slate-700/50 flex items-center justify-center text-blue-400">
                  <Filter className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">
                      {modalMode === "edit" ? "Edit route" : "Create route"}
                    </h3>
                    {modalMode === "add" && (
                      <span className="text-[9px] font-mono text-blue-300 border border-blue-800/50 bg-blue-950/30 px-1.5 py-0.5 rounded uppercase tracking-wide">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {modalMode === "edit" ? "Update pipeline configuration & deploy targets" : "Define a new integration pipeline"}
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

            {/* TABS — cuma General & Deploy untuk alur "add" */}
            <div className="flex items-center gap-1 px-5 pt-3 border-b border-slate-800/60 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab("general")}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === "general"
                    ? "bg-[#111823] text-white border border-b-0 border-slate-800"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> General
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("deploy")}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === "deploy"
                    ? "bg-[#111823] text-white border border-b-0 border-slate-800"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5" /> Deploy
              </button>
            </div>

            <form onSubmit={handleSubmitRoute} className="flex flex-col flex-1 min-h-0">
              <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                {activeTab === "general" && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-slate-300">Route name</label>
                      <div className="relative">
                        <Filter className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          placeholder="sap-idoc-ingest"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full bg-[#111722] border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <p className="text-[10.5px] text-slate-500">lowercase, hyphenated · used as the pipeline identifier</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-slate-300">Group</label>
                        <select
                          value={formData.group}
                          onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                          className="w-full bg-[#111722] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                        >
                          {GROUPS.map((g) => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-slate-300">Environment</label>
                        <div className="grid grid-cols-3 bg-[#111722] border border-slate-800 rounded-lg p-0.5">
                          {["Dev", "Staging", "Prod"].map((env) => (
                            <button
                              key={env}
                              type="button"
                              onClick={() => setFormData({ ...formData, environment: env })}
                              className={`px-2 py-1.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                                formData.environment === env
                                  ? "bg-slate-800 text-white"
                                  : "text-slate-500 hover:text-slate-300"
                              }`}
                            >
                              {env}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-medium text-slate-300">Description</label>
                        <span className="text-[9px] font-mono text-slate-600 uppercase tracking-wide">Optional</span>
                      </div>
                      <textarea
                        rows="2"
                        placeholder="What does this route do, and who owns it?"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full bg-[#111722] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </>
                )}

                {activeTab === "deploy" && (
                  <>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Target Camel instances
                      </label>

                      {sitesLoading ? (
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-[#111722] border border-slate-800 rounded-lg px-3 py-4 justify-center">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Memuat node tenant...
                        </div>
                      ) : camelInstances.length === 0 ? (
                        <div className="text-center bg-[#111722] border border-dashed border-slate-800 rounded-lg px-3 py-4 space-y-1.5">
                          <p className="text-[11px] text-slate-400">Belum ada node terdaftar untuk tenant ini.</p>
                          <button
                            type="button"
                            onClick={() => navigate("/sites")}
                            className="text-[11px] text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
                          >
                            Tambahkan node di Sites Management →
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-2 gap-2">
                            {camelInstances.map((inst) => {
                              const isSelected = formData.targets.includes(inst.id);
                              return (
                                <button
                                  key={inst.id}
                                  type="button"
                                  onClick={() => toggleTarget(inst.id)}
                                  className={`flex items-center justify-between gap-2 p-3 rounded-lg border text-left transition-all cursor-pointer ${
                                    isSelected
                                      ? "bg-blue-950/30 border-blue-500"
                                      : "bg-[#111722] border-slate-800 hover:border-slate-700"
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <span
                                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                        isSelected ? "bg-blue-600 border-blue-500" : "border-slate-700"
                                      }`}
                                    >
                                      {isSelected && <Check className="w-3 h-3 text-white" />}
                                    </span>
                                    <div className="min-w-0">
                                      <p className="text-[11px] font-medium text-slate-200 truncate">{inst.name}</p>
                                      <p className="text-[10px] text-slate-500 truncate">{inst.site}</p>
                                    </div>
                                  </div>
                                  <span
                                    className={`w-2 h-2 rounded-full shrink-0 ${inst.online ? "bg-emerald-500" : "bg-rose-500"}`}
                                  />
                                </button>
                              );
                            })}
                          </div>
                          <p className="text-[10.5px] text-slate-500">
                            {formData.targets.length} selected · routes deploy onto agent-managed Camel runtimes
                          </p>
                        </>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Rollout strategy
                      </label>
                      <div className="grid grid-cols-3 bg-[#111722] border border-slate-800 rounded-lg p-0.5">
                        {ROLLOUTS.map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setFormData({ ...formData, rollout: r })}
                            className={`px-2 py-1.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                              formData.rollout === r ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-[#0e1420] border border-slate-800/80 rounded-xl p-3.5 space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Deploy Summary
                      </span>
                      <SummaryRow label="Pipeline" value={formData.name || "—"} />
                      <SummaryRow label="Environment" value={formData.environment.toLowerCase()} />
                      <SummaryRow
                        label="Targets"
                        value={`${formData.targets.length} node${formData.targets.length === 1 ? "" : "s"} · ${formData.rollout.toLowerCase()}`}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* FOOTER — tanpa "Open in builder"; builder cuma relevan untuk route yang sudah tersimpan */}
              <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-800/60 shrink-0">
                <span className="text-[10.5px] font-mono text-slate-500">{targetNodeLabel}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  {modalMode === "add" && (
                    <button
                      type="button"
                      onClick={handleSubmitRoute}
                      className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-300 border border-slate-700 hover:border-slate-600 hover:text-white transition-colors cursor-pointer"
                    >
                      Save as draft
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {modalMode === "edit" ? "Save changes" : "Create route"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- SUB-COMPONENTS ---

function RouteStatCard({ label, value, unit, hint, badge }) {
  const badgeStyles = { ok: "text-emerald-400", attn: "text-rose-400" };
  return (
    <div className="bg-[#0b0f17] border border-slate-800/80 rounded-xl p-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        {badge && <span className={`text-[10px] font-medium ${badgeStyles[badge.tone]}`}>{badge.label}</span>}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold text-white tracking-tight">{value}</span>
        {unit && <span className="text-xs text-slate-500">{unit}</span>}
      </div>
      {hint && <p className="text-[10.5px] text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-300 font-mono">{value}</span>
    </div>
  );
}

function RouteRow({ route, onEdit, onDeploy, onOpenTerminal, onOpenBuilder }) {
  const status = STATUS_META[route.status] || STATUS_META.draft;

  return (
    <tr className="hover:bg-slate-900/20 transition-colors">
      <td className="py-3.5 px-5">
        <div className="flex items-start gap-2">
          <Filter className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">{route.name}</p>
            <p className="text-[10.5px] font-mono text-slate-500 truncate">
              {route.from} <span className="text-slate-600">→</span>{" "}
              <span className="text-blue-400">{route.to}</span>
            </p>
          </div>
        </div>
      </td>

      <td className="py-3.5 px-3">
        <span className="text-[10px] font-mono text-blue-300 border border-blue-800/50 bg-blue-950/20 px-1.5 py-0.5 rounded uppercase tracking-wide">
          {route.group}
        </span>
      </td>

      <td className="py-3.5 px-3">
        <span className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
          <span className={`text-[11px] font-mono ${status.text}`}>{status.label}</span>
        </span>
      </td>

      <td className="py-3.5 px-3">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {route.deployed.map((code, i) => (
              <span
                key={i}
                className="w-6 h-6 rounded-full bg-[#141d2d] border-2 border-[#0b0f17] text-[9px] font-mono text-slate-300 flex items-center justify-center"
              >
                {code}
              </span>
            ))}
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {route.instances}
            {route.down > 0 && <span className="text-rose-400"> · {route.down}↓</span>}
          </span>
        </div>
      </td>

      <td className="py-3.5 px-3 text-right text-xs font-mono text-slate-300">
        {formatThroughput(route.throughput)}
      </td>

      <td className="py-3.5 px-3">
        <span className="w-6 h-6 rounded-full bg-blue-900/50 border border-blue-700/40 text-blue-300 text-[10px] font-mono flex items-center justify-center">
          {route.owner}
        </span>
      </td>

      <td className="py-3.5 px-3 text-xs font-mono text-slate-400">{route.ver}</td>

      <td className="py-3.5 px-5 text-right">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={onEdit}
            title="Edit Route"
            className="p-1.5 text-slate-400 hover:text-white rounded bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDeploy}
            title="Deploy"
            className="p-1.5 text-slate-400 hover:text-emerald-400 rounded bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onOpenTerminal}
            title="Open Terminal"
            className="p-1.5 text-slate-400 hover:text-amber-400 rounded bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <TerminalIcon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onOpenBuilder}
            title="Open in Builder"
            className="p-1.5 text-slate-400 hover:text-blue-400 rounded bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Wand2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function BoardColumn({ status, routes, onOpenBuilder }) {
  const meta = STATUS_META[status];
  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
          <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
          {meta.label}
        </span>
        <span className="text-[11px] text-slate-500 font-mono">{routes.length}</span>
      </div>
      <div className="space-y-2.5">
        {routes.length === 0 ? (
          <div className="border border-dashed border-slate-800 rounded-lg py-8 text-center text-[11px] text-slate-600">
            No routes
          </div>
        ) : (
          routes.map((r) => (
            <button
              key={r.id}
              onClick={() => onOpenBuilder(r)}
              title="Open in Builder"
              className="w-full text-left bg-[#0b0f17] border border-slate-800/80 rounded-lg p-3 hover:border-slate-700 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-white truncate">{r.name}</span>
                <span className="text-[10px] font-mono text-slate-500 border border-slate-700 rounded px-1.5 py-0.5 shrink-0">
                  {r.ver}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10.5px] text-slate-500">{r.instances} inst</span>
                <span className="text-[10.5px] font-mono text-slate-400">{formatThroughput(r.throughput)}</span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
