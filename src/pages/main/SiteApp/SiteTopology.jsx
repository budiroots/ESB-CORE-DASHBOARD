import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * Card "Site Topology" — menampilkan Central Hub (kiri) dan Branch Spokes (kanan),
 * dihubungkan garis animasi seperti aliran listrik saat koneksi site aktif.
 *
 * Aturan status garis:
 * - HQ connected DAN Node connected  -> garis biru + animasi aliran listrik.
 * - Node (atau HQ) tidak connected   -> garis merah, tanpa animasi aliran.
 *
 * Props:
 * - sites: array of site object { id, name, endpoint, kind, link, ... }
 * - picked: id site yang sedang dipilih
 * - onPick: (id) => void, dipanggil saat sebuah node diklik
 * - connStatus: (opsional) hasil live SSH test-connection dari parent,
 *   berbentuk { [siteId]: { status: 'connected' | 'disconnected' | 'checking' } }.
 *   Jika belum ada data live untuk suatu site, statusnya fallback ke field `link`.
 */
export default function SiteTopology({ sites, picked, onPick, connStatus = {} }) {
  return (
    <div className="bg-[#0b0f17] border border-slate-800/80 rounded-xl p-5 shadow-xl h-full flex flex-col">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800/60 shrink-0">
        <div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Site Topology
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Central Hubs (Left) connected to Branch Spokes (Right)
          </p>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Connected
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Disconnected
          </span>
        </div>
      </div>

      <TopologyGraph sites={sites} picked={picked} onPick={onPick} connStatus={connStatus} />
    </div>
  );
}

// Resolusi status koneksi sebuah site: prioritaskan data live (hasil SSH test-connection),
// fallback ke field `link` bawaan data site jika belum ada data live.
function resolveConnected(id, fallbackLink, connStatus) {
  const live = connStatus?.[id];
  if (live?.status === "connected") return true;
  if (live?.status === "disconnected") return false;
  // status live masih "checking" / belum ada -> pakai field `link`
  return fallbackLink !== "down";
}

function TopologyGraph({ sites, picked, onPick, connStatus }) {
  const hqSites = sites.filter((s) => s.kind === 0);
  const branchSites = sites.filter((s) => s.kind !== 0);

  const hub = hqSites[0];
  const hubConnected = hub ? resolveConnected(hub.id, hub.link, connStatus) : false;

  const containerRef = useRef(null);
  const nodeElsRef = useRef({}); // id -> DOM element
  const [positions, setPositions] = useState([]); // [{ id, x1, y1, x2, y2 }]

  const setNodeRef = (id) => (el) => {
    if (el) {
      nodeElsRef.current[id] = el;
    } else {
      delete nodeElsRef.current[id];
    }
  };

  // --- HITUNG ULANG KOORDINAT GARIS PENGHUBUNG (tanpa menghitung status) ---
  // Backbone topology dihubungkan dari Central Hub pertama ke tiap Branch Spoke.
  const recalcPositions = useCallback(() => {
    const containerEl = containerRef.current;

    if (!containerEl || !hub) {
      setPositions([]);
      return;
    }

    const hubEl = nodeElsRef.current[hub.id];
    if (!hubEl) {
      setPositions([]);
      return;
    }

    const containerRect = containerEl.getBoundingClientRect();
    const hubRect = hubEl.getBoundingClientRect();
    const hubPoint = {
      x: hubRect.right - containerRect.left,
      y: hubRect.top + hubRect.height / 2 - containerRect.top
    };

    const nextPositions = branchSites
      .map((s) => {
        const el = nodeElsRef.current[s.id];
        if (!el) return null;

        const rect = el.getBoundingClientRect();
        const point = {
          x: rect.left - containerRect.left,
          y: rect.top + rect.height / 2 - containerRect.top
        };

        return {
          id: s.id,
          x1: hubPoint.x,
          y1: hubPoint.y,
          x2: point.x,
          y2: point.y
        };
      })
      .filter(Boolean);

    setPositions(nextPositions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sites, hub?.id, branchSites.length]);

  // Hitung ulang setiap kali daftar site / pilihan berubah (setelah DOM ter-render)
  useLayoutEffect(() => {
    recalcPositions();
  }, [recalcPositions, picked]);

  // Hitung ulang saat ukuran container/window berubah (resize, sidebar toggle, dll)
  useEffect(() => {
    const handleResize = () => recalcPositions();
    window.addEventListener("resize", handleResize);

    let observer;
    if (typeof ResizeObserver !== "undefined" && containerRef.current) {
      observer = new ResizeObserver(() => recalcPositions());
      observer.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      if (observer) observer.disconnect();
    };
  }, [recalcPositions]);

  return (
    <div ref={containerRef} className="grid grid-cols-2 gap-8 py-4 relative min-h-[220px] flex-1">
      {/* Keyframes animasi "aliran listrik" pada garis koneksi yang aktif */}
      <style>{`
        @keyframes topology-current-flow {
          to { stroke-dashoffset: -48; }
        }
        .topology-flow-line {
          animation: topology-current-flow 1s linear infinite;
          filter: drop-shadow(0 0 3px rgba(56, 189, 248, 0.85));
        }
      `}</style>

      {/* SVG overlay garis penghubung HQ -> Spoke */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
        style={{ zIndex: 0 }}
      >
        {positions.map((pos) => {
          const spoke = branchSites.find((s) => s.id === pos.id);
          const spokeConnected = spoke ? resolveConnected(spoke.id, spoke.link, connStatus) : false;
          // Jalur hanya bisa "mengalir" jika HQ dan node itu sendiri sama-sama connected
          const pathIsUp = hubConnected && spokeConnected;

          const midX = (pos.x1 + pos.x2) / 2;
          const path = `M ${pos.x1} ${pos.y1} C ${midX} ${pos.y1}, ${midX} ${pos.y2}, ${pos.x2} ${pos.y2}`;

          return (
            <g key={pos.id}>
              {/* Garis dasar (kabel statis) */}
              <path
                d={path}
                fill="none"
                stroke={pathIsUp ? "#1d4ed8" : "#f43f5e"}
                strokeWidth="1.5"
                strokeOpacity={pathIsUp ? 0.45 : 0.55}
              />
              {/* Aliran listrik animasi — hanya muncul saat HQ & node sama-sama connected */}
              {pathIsUp && (
                <path
                  d={path}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="6 14"
                  className="topology-flow-line"
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* Central Hubs Column */}
      <div className="space-y-3 relative z-10">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2 font-mono">
          Central Hubs
        </span>
        {hqSites.length === 0 ? (
          <div className="p-4 border border-dashed border-slate-800 rounded-xl text-[11px] text-slate-600 text-center">
            No Central Hub
          </div>
        ) : (
          hqSites.map((s) => {
            const isHubConnected = resolveConnected(s.id, s.link, connStatus);

            return (
              <div
                key={s.id}
                ref={setNodeRef(s.id)}
                onClick={() => onPick(s.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  picked === s.id
                    ? "bg-blue-950/40 border-blue-500/80 shadow-lg shadow-blue-500/10"
                    : "bg-[#0e1420] border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">{s.name}</span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isHubConnected ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                      }`}
                    />
                    <span className="text-[9px] bg-blue-900/50 text-blue-300 border border-blue-700/40 px-1.5 py-0.5 rounded font-mono">
                      HQ
                    </span>
                  </div>
                </div>
                <span className="text-[10.5px] font-mono text-slate-400 mt-1 block">
                  {s.endpoint}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Spokes Column */}
      <div className="space-y-3 relative z-10">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2 font-mono">
          Branch Spokes
        </span>
        {branchSites.length === 0 ? (
          <div className="p-4 border border-dashed border-slate-800 rounded-xl text-[11px] text-slate-600 text-center">
            No Spoke Sites
          </div>
        ) : (
          branchSites.map((s) => {
            const isSpokeConnected = resolveConnected(s.id, s.link, connStatus);
            const pathIsUp = hubConnected && isSpokeConnected;

            return (
              <div
                key={s.id}
                ref={setNodeRef(s.id)}
                onClick={() => onPick(s.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  picked === s.id
                    ? "bg-blue-950/40 border-blue-500/80 shadow-lg shadow-blue-500/10"
                    : "bg-[#0e1420] border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">{s.name}</span>
                  <span className="text-[9px] bg-slate-800 text-slate-300 border border-slate-700 px-1.5 py-0.5 rounded font-mono">
                    {s.kind}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10.5px] font-mono text-slate-400">{s.endpoint}</span>
                  <span className="flex items-center gap-1">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSpokeConnected ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                      }`}
                    />
                    <span
                      className={`text-[9px] font-mono ${
                        pathIsUp ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {pathIsUp ? "Linked" : "No Flow"}
                    </span>
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}