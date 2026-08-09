import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Cpu,
  MemoryStick,
  HardDrive,
  Server,
  ShieldCheck,
  RefreshCw,
  Loader2,
  AlertTriangle
} from "lucide-react";
import api from "../../../api/axios";

// --- HELPERS ---
const barColor = (value) =>
  value >= 85 ? "bg-rose-500" : value >= 65 ? "bg-amber-500" : "bg-emerald-500";

// Nilai memory dari backend dalam satuan MB -> ditampilkan dalam GB
function formatMB(value) {
  if (value === undefined || value === null || Number.isNaN(value)) return "-";
  return `${(value / 1024).toFixed(1)} GB`;
}

// Nilai storage dari backend sudah dalam satuan GB
function formatGB(value) {
  if (value === undefined || value === null || Number.isNaN(value)) return "-";
  return `${value.toFixed(1)} GB`;
}

/**
 * Card "Site Health" — menampilkan CPU, Memory, Internal Storage, dan detail Server
 * dari site yang sedang dipilih. Data diambil live dari backend via SSH:
 *
 * - GET /site/cpu/{id}      -> { cpuDetail: { used, idle, available }, message }
 * - GET /site/memory/{id}   -> { memoryDetail: { total, used, free, available }, message } (MB)
 * - GET /site/storage/{id}  -> { storageDetail: { total, used, free, available }, message } (GB)
 * - GET /site/servers/{id}  -> { serverInfo: { operatingSystem, ipAddress, cpuModel, uptime, networkPeak }, message }
 *
 * Props:
 * - site: object site yang sedang difokuskan, minimal punya { id }
 */
export default function SiteHealth({ site }) {
  const navigate = useNavigate();

  const [cpu, setCpu] = useState(null);
  const [memory, setMemory] = useState(null);
  const [storage, setStorage] = useState(null);
  const [serverInfo, setServerInfo] = useState(null);

  const [loading, setLoading] = useState({
    cpu: false,
    memory: false,
    storage: false,
    server: false
  });
  const [errors, setErrors] = useState({
    cpu: null,
    memory: null,
    storage: null,
    server: null
  });

  // --- FETCH SEMUA DATA HEALTH (CPU, MEMORY, STORAGE, SERVER INFO) ---
  const fetchHealth = useCallback(async () => {
    const siteId = site?.id;
    if (!siteId) return;

    setLoading({ cpu: true, memory: true, storage: true, server: true });
    setErrors({ cpu: null, memory: null, storage: null, server: null });

    // --- CPU ---
    try {
      const res = await api.get(`/site/cpu/${siteId}`);
      setCpu(res.data?.cpuDetail || null);
    } catch (error) {
      console.error("Gagal mengambil data CPU:", error);
      setCpu(null);
      setErrors((prev) => ({
        ...prev,
        cpu: error?.response?.data?.message || "Gagal mengambil data CPU"
      }));
    } finally {
      setLoading((prev) => ({ ...prev, cpu: false }));
    }

    // --- MEMORY ---
    try {
      const res = await api.get(`/site/memory/${siteId}`);
      setMemory(res.data?.memoryDetail || null);
    } catch (error) {
      console.error("Gagal mengambil data memory:", error);
      setMemory(null);
      setErrors((prev) => ({
        ...prev,
        memory: error?.response?.data?.message || "Gagal mengambil data memory"
      }));
    } finally {
      setLoading((prev) => ({ ...prev, memory: false }));
    }

    // --- STORAGE ---
    try {
      const res = await api.get(`/site/storage/${siteId}`);
      setStorage(res.data?.storageDetail || null);
    } catch (error) {
      console.error("Gagal mengambil data storage:", error);
      setStorage(null);
      setErrors((prev) => ({
        ...prev,
        storage: error?.response?.data?.message || "Gagal mengambil data storage"
      }));
    } finally {
      setLoading((prev) => ({ ...prev, storage: false }));
    }

    // --- SERVER INFO ---
    try {
      const res = await api.get(`/site/servers/${siteId}`);
      setServerInfo(res.data?.serverInfo || null);
    } catch (error) {
      console.error("Gagal mengambil data server info:", error);
      setServerInfo(null);
      setErrors((prev) => ({
        ...prev,
        server: error?.response?.data?.message || "Gagal mengambil data server"
      }));
    } finally {
      setLoading((prev) => ({ ...prev, server: false }));
    }
  }, [site?.id]);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  const isLoadingAny = loading.cpu || loading.memory || loading.storage || loading.server;

  const metrics = [
    {
      key: "cpu",
      label: "CPU",
      icon: Cpu,
      value: cpu ? cpu.used : null,
      hint: cpu ? `Idle ${cpu.idle}% · Available ${cpu.available}%` : null,
      error: errors.cpu,
      loading: loading.cpu
    },
    {
      key: "memory",
      label: "Memory",
      icon: MemoryStick,
      value: memory ? Math.round((memory.used / memory.total) * 100) : null,
      hint: memory
        ? `${formatMB(memory.used)} used of ${formatMB(memory.total)} · ${formatMB(memory.available)} available`
        : null,
      error: errors.memory,
      loading: loading.memory
    },
    {
      key: "storage",
      label: "Internal Storage",
      icon: HardDrive,
      value: storage ? Math.round((storage.used / storage.total) * 100) : null,
      hint: storage
        ? `${formatGB(storage.used)} used of ${formatGB(storage.total)} · ${formatGB(storage.available)} free`
        : null,
      error: errors.storage,
      loading: loading.storage
    }
  ];

  const handleGoToFirewall = () => {
    if (!site?.id) return;
    navigate(`/firewall/${site.id}`);
  };

  return (
    <div className="bg-[#0b0f17] border border-slate-800/80 rounded-xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Site Health
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Resource usage & system information (live via SSH)
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={fetchHealth}
            disabled={isLoadingAny || !site?.id}
            title="Refresh"
            className="flex items-center justify-center w-7 h-7 rounded-lg border border-slate-800 bg-[#0e1420] hover:bg-[#141d2d] text-slate-300 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoadingAny ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={handleGoToFirewall}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-[#0e1420] hover:bg-[#141d2d] text-[11px] font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            Setting Firewall
          </button>
        </div>
      </div>

      {/* CPU / MEMORY / STORAGE BARS */}
      <div className="space-y-3">
        {metrics.map((m) => {
          const Icon = m.icon;
          const displayValue = m.loading ? "..." : m.error ? "N/A" : m.value !== null ? `${m.value}%` : "-";

          return (
            <div key={m.key}>
              <div className="flex items-center justify-between mb-1">
                <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Icon className="w-3.5 h-3.5 text-slate-500" />
                  {m.label}
                </span>
                <span className="text-[11px] font-mono text-slate-300">{displayValue}</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800/80 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    m.error || m.value === null ? "bg-slate-700" : barColor(m.value)
                  }`}
                  style={{ width: `${m.loading || m.error ? 0 : m.value ?? 0}%` }}
                />
              </div>
              {m.error ? (
                <p className="text-[10px] text-rose-400 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {m.error}
                </p>
              ) : (
                m.hint && <p className="text-[10px] text-slate-500 mt-1">{m.hint}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* SERVER / OS DETAIL */}
      <div className="pt-1">
        <span className="text-[11px] text-slate-500 flex items-center gap-1.5 mb-1.5">
          <Server className="w-3.5 h-3.5 text-slate-500" /> Server Detail:
        </span>

        {loading.server ? (
          <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-[#080c13] p-3 rounded-lg border border-slate-800/60">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Mengambil detail server...
          </div>
        ) : errors.server ? (
          <div className="flex items-center gap-2 text-[11px] text-rose-400 bg-rose-950/20 p-3 rounded-lg border border-rose-800/30">
            <AlertTriangle className="w-3.5 h-3.5" /> {errors.server}
          </div>
        ) : serverInfo ? (
          <div className="grid grid-cols-2 gap-2.5 text-[11px] font-mono bg-[#080c13] p-3 rounded-lg border border-slate-800/60">
            <div className="col-span-2">
              <span className="text-slate-500 block">Operating System</span>
              <span className="text-slate-200">{serverInfo.operatingSystem || "-"}</span>
            </div>
            <div>
              <span className="text-slate-500 block">IP Address</span>
              <span className="text-slate-200">{serverInfo.ipAddress || "-"}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Network Peak</span>
              <span className="text-slate-200">{serverInfo.networkPeak || "-"}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500 block">CPU Model</span>
              <span className="text-slate-200">{serverInfo.cpuModel || "-"}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500 block">Uptime</span>
              <span className="text-slate-200">{serverInfo.uptime || "-"}</span>
            </div>
          </div>
        ) : (
          <div className="text-[11px] text-slate-500 bg-[#080c13] p-3 rounded-lg border border-slate-800/60">
            Data server belum tersedia.
          </div>
        )}
      </div>
    </div>
  );
}