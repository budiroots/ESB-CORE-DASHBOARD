import React, { useEffect, useState } from "react";
import {
  Download,
  Calendar,
  ChevronDown,
  ChevronUp,
  Code,
} from "lucide-react";
import api from "../../api/axios";

export default function AuditTrailPage() {
  const [auditLogs, setAuditLogs] = useState([]);

  // --- STATE EXPANDED JSON DESC (LOG ID) ---
  const [expandedLogIds, setExpandedLogIds] = useState({});

  // --- STATE FILTER TANGGAL ---
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // --- TOGGLE EXPAND/COLLAPSE JSON DESC ---
  const toggleExpandLog = (id) => {
    setExpandedLogIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // --- HELPER UNTUK PARSE & FORMAT JSON ---
  const renderFormattedJson = (jsonString) => {
    try {
      const parsed = typeof jsonString === "string" ? JSON.parse(jsonString) : jsonString;
      return JSON.stringify(parsed, null, 2);
    } catch {
      return jsonString; // Jika bukan JSON valid, tampilkan string aslinya
    }
  };

  // --- API FETCHER ---
  const fetchAuditLogs = async () => {
    try {
      const response = await api.get("/logs/logs");
      const sortedData = [...response.data.data].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      setAuditLogs(sortedData);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  // --- FILTER AUDIT LOGS BY DATE ---
  const filteredAuditLogs = auditLogs.filter((log) => {
    if (!log.createdAt) return true;
    const logDate = new Date(log.createdAt);

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      if (logDate < start) return false;
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (logDate > end) return false;
    }

    return true;
  });

  // --- EXPORT TO CSV ---
  const handleExportCSV = () => {
    if (filteredAuditLogs.length === 0) {
      alert("Tidak ada data log yang bisa di-export.");
      return;
    }

    const headers = ["Waktu", "Status", "User ID", "Deskripsi"];
    const csvRows = [
      headers.join(","),
      ...filteredAuditLogs.map((log) => {
        const timeFormatted = new Date(log.createdAt).toLocaleString("id-ID");
        const status = `"${(log.status || "").replace(/"/g, '""')}"`;
        const user = `"${(log.userId || "").replace(/"/g, '""')}"`;
        const desc = `"${(log.desc || "").replace(/"/g, '""')}"`;
        return [timeFormatted, status, user, desc].join(",");
      }),
    ];

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Audit_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#06090e] text-slate-300 p-8 font-sans select-none relative space-y-8">
      {/* HEADER PAGE */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            Audit Trail
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Immutable, signed activity log
          </p>
        </div>
      </div>

      {/* SECTION: AUDIT TRAIL */}
      <div className="bg-[#0b0f17] border border-slate-800/80 rounded-xl p-5 shadow-xl">
        {/* HEADER & FILTER AUDIT */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-800/60">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Audit Trail
              </h2>
              <span className="text-[10px] text-slate-500">
                {filteredAuditLogs.length} events found
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>signed · immutable logs</span>
            </div>
          </div>

          {/* ACTIONS: DATE FILTER & EXPORT BUTTON */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Tanggal */}
            <div className="flex items-center gap-2 bg-[#0e1420] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-slate-300 focus:outline-none [color-scheme:dark]"
              />
              <span className="text-slate-600">s/d</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-slate-300 focus:outline-none [color-scheme:dark]"
              />
              {(startDate || endDate) && (
                <button
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                  }}
                  className="text-slate-500 hover:text-slate-300 text-[10px] underline ml-1"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-800 bg-[#0c1017] hover:bg-[#121824] text-xs font-medium text-slate-300 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              Export CSV
            </button>
          </div>
        </div>

        {/* LIST LOGS WITH JSON DROPDOWN */}
        <div className="font-mono text-xs max-h-[520px] overflow-y-auto pr-2 divide-y divide-slate-800/40 custom-scrollbar">
          {filteredAuditLogs.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              Tidak ada data log yang sesuai filter.
            </div>
          ) : (
            filteredAuditLogs.map((log) => {
              const isExpanded = !!expandedLogIds[log.id];

              return (
                <div key={log.id} className="py-2.5 hover:bg-[#101622]/40 rounded-lg transition-colors px-2">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500 text-[11px] w-40 shrink-0">
                      {new Date(log.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                    <span className={`w-20 font-semibold text-[11px] shrink-0 ${log.actionColor}`}>
                      {log.status}
                    </span>
                    <span className="text-slate-400 text-[11px] w-44 shrink-0 truncate">
                      {log.userId}
                    </span>

                    {/* Desc Preview & Dropdown Toggle */}
                    <div className="flex-1 flex items-center justify-end gap-2 overflow-hidden">
                      <span className="text-slate-400 text-[11px] truncate text-right max-w-[280px]">
                        {log.desc}
                      </span>
                      <button
                        onClick={() => toggleExpandLog(log.id)}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-sans font-medium transition-all shrink-0 ${
                          isExpanded
                            ? "bg-blue-950/60 border border-blue-800/60 text-blue-300"
                            : "bg-[#141b2a] border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                        }`}
                      >
                        <Code className="w-3 h-3 text-blue-400" />
                        <span>{isExpanded ? "Hide JSON" : "View JSON"}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* JSON PRETTY DISPLAY (ACCORDION / DROPDOWN) */}
                  {isExpanded && (
                    <div className="mt-3 p-3.5 bg-[#05080e] border border-slate-800/90 rounded-lg overflow-x-auto shadow-inner animate-in fade-in duration-150">
                      <div className="flex justify-between items-center mb-2 pb-1.5 border-b border-slate-800/50">
                        <span className="text-[10px] font-sans font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Code className="w-3 h-3 text-blue-400" /> Payload JSON
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          Raw String Parsed
                        </span>
                      </div>
                      <pre className="text-[11px] font-mono text-emerald-400/90 leading-relaxed whitespace-pre-wrap break-all select-text">
                        {renderFormattedJson(log.desc)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}