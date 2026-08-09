import React, { useEffect, useState } from "react";
import { Coffee, Box, Database, Layers, Loader2, CheckCircle2, AppWindow } from "lucide-react";
import api from "../../../api/axios";

// --- DUMMY APP CATALOG ---
// Silakan tambah/ubah entri sesuai kebutuhan. "id" harus unik.
const APP_CATALOG = [
  {
    id: "java",
    name: "Java OpenJDK 17",
    description: "Java Development Kit (dibutuhkan untuk Camel & Kafka)",
    version: "17 LTS",
    icon: Coffee,
  },
  {
    id: "docker",
    name: "Docker Engine",
    description: "Container runtime environment & Docker Compose",
    version: "24.0+",
    icon: Box,
  },
  {
    id: "kafka",
    name: "Apache Kafka",
    description: "Enterprise event streaming platform (KRaft mode)",
    version: "3.7.0",
    icon: Layers,
  },
  {
    id: "mongodb",
    name: "MongoDB",
    description: "NoSQL document-oriented database",
    version: "7.0",
    icon: Database,
  },
];

/**
 * Panel daftar aplikasi yang bisa/di-install pada sebuah site.
 * Endpoint install masih DUMMY — ganti `/site/${site.id}/apps/install`
 * dengan endpoint asli backend saat sudah tersedia.
 */
export default function SiteInstalledApps({ site }) {
  const [installedIds, setInstalledIds] = useState([]);
  const [installingId, setInstallingId] = useState(null);

  // Sinkronkan status terinstall dari data site (jika backend sudah mengirim installedApps)
  useEffect(() => {
    if (!site?.id) {
      setInstalledIds([]);
      return;
    }
    setInstalledIds((site.installedApps || []).map((a) => a.id));
  }, [site?.id, site?.installedApps]);

  const handleInstall = async (app) => {
    if (!site?.id || installingId) return;

    setInstallingId(app.id);
    try {
      // --- DUMMY ENDPOINT ---
      // TODO: sesuaikan dengan endpoint backend asli
      await api.post(`/site/${site.id}/apps/install`, { appId: app.id });
      setInstalledIds((prev) => [...prev, app.id]);
    } catch (error) {
      console.error("Gagal install aplikasi (dummy endpoint):", error);
      // Fallback dummy: tetap tandai terinstall di UI supaya alur bisa dicoba
      setInstalledIds((prev) => [...prev, app.id]);
    } finally {
      setInstallingId(null);
    }
  };

  return (
    <div className="bg-[#0b0f17] border border-slate-800/80 rounded-xl p-5 shadow-xl flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#141d2d] border border-slate-700/60 flex items-center justify-center text-blue-400">
            <AppWindow className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Installed Apps
            </h2>
            <p className="text-[10px] text-slate-500 font-mono">
              Application catalog for {site?.name || "this site"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {APP_CATALOG.map((app) => {
          const isInstalled = installedIds.includes(app.id);
          const isInstalling = installingId === app.id;
          const Icon = app.icon;

          return (
            <div
              key={app.id}
              className="p-3.5 bg-[#0e1420] border border-slate-800/80 rounded-xl flex items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-[#162032] border border-slate-700/50 flex items-center justify-center shrink-0 text-blue-400">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <h4 className="text-xs font-semibold text-white truncate">
                    {app.name}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                    {app.description}
                  </p>
                  <span className="text-[10px] font-mono text-slate-600">
                    v{app.version}
                  </span>
                </div>
              </div>

              {isInstalled ? (
                <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded border border-emerald-800/30 shrink-0">
                  <CheckCircle2 className="w-3 h-3" />
                  Installed
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleInstall(app)}
                  disabled={isInstalling}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-medium transition-colors shrink-0 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isInstalling && <Loader2 className="w-3 h-3 animate-spin" />}
                  {isInstalling ? "Installing..." : "Install Now"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}