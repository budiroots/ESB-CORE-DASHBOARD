import React, { useEffect, useState } from "react";
import {
  Download,
  Calendar,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Code,
  ScrollText,
  CalendarClock,
  Bell,
  RefreshCw,
} from "lucide-react";
import api from "../../api/axios";

// --- TABS: System Activity (Audit Log fungsional, sisanya demo — lihat catatan di tiap section) ---
const TABS = [
  { id: "audit", label: "Audit Log", icon: ScrollText },
  { id: "eventStatus", label: "Event Status Log", icon: CalendarClock },
  { id: "notification", label: "Notification Log", icon: Bell },
];

const PAGE_SIZE = 10;

// --- PAGINATION FOOTER (DIPAKAI DI SETIAP TAB) ---
function Pagination({ page, totalItems, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  if (totalItems === 0) return null;

  const from = (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, totalItems);

  return (
    <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-800/60 text-[11px] text-slate-500">
      <span>
        Menampilkan {from}–{to} dari {totalItems}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="flex items-center gap-1 px-2 py-1 rounded border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Prev
        </button>
        <span className="font-mono text-slate-400">
          Page {page} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="flex items-center gap-1 px-2 py-1 rounded border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          Next <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// --- DEMO DATA: belum terhubung ke backend (lihat catatan di changelog) ---
const DEMO_EVENT_STATUS_LOGS = [
  { id: 1, time: "2026-08-12T02:10:05", device: "pEdge Berau", from: "Offline", to: "Online" },
  { id: 2, time: "2026-08-12T01:55:41", device: "pEdge Nusaraya-1", from: "Online", to: "Offline" },
  { id: 3, time: "2026-08-11T23:40:12", device: "pEdge Nusaraya-2", from: "Offline", to: "Online" },
  { id: 4, time: "2026-08-11T20:02:37", device: "pEdge Berau", from: "Online", to: "Offline" },
];

const DEMO_NOTIFICATION_LOGS = [
  { id: 1, time: "2026-08-12T02:10:07", channel: "Telegram", recipient: "@ops_channel", message: "pEdge Berau kembali online", status: "Sent" },
  { id: 2, time: "2026-08-11T23:40:15", channel: "Email", recipient: "noc@primacom.co.id", message: "pEdge Nusaraya-2 kembali online", status: "Sent" },
  { id: 3, time: "2026-08-11T20:02:40", channel: "Telegram", recipient: "@ops_channel", message: "pEdge Berau offline", status: "Failed" },
];

// --- HELPER: FORMAT DATE UNTUK VALUE INPUT datetime-local (waktu lokal) ---
const toLocalDatetimeInputValue = (date) => {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
};

const getLast24HoursRange = () => ({
  start: toLocalDatetimeInputValue(new Date(Date.now() - 24 * 60 * 60 * 1000)),
  end: toLocalDatetimeInputValue(new Date()),
});

const formatDisplayDate = (value) =>
  new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

// --- HELPER: EXPORT ARRAY OF ROWS KE CSV ---
const exportCsv = (headers, rows, filenamePrefix) => {
  if (rows.length === 0) {
    alert("Tidak ada data yang bisa di-export.");
    return;
  }

  const csvRows = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")),
  ];

  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default function AuditTrailPage() {
  const [activeTab, setActiveTab] = useState("audit");
  const [auditLogs, setAuditLogs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // --- STATE EXPANDED JSON DESC (LOG ID) ---
  const [expandedLogIds, setExpandedLogIds] = useState({});

  // --- STATE FILTER RENTANG WAKTU (DEFAULT: 24 JAM TERAKHIR, DIPAKAI BERSAMA SEMUA TAB) ---
  const [startDate, setStartDate] = useState(() => getLast24HoursRange().start);
  const [endDate, setEndDate] = useState(() => getLast24HoursRange().end);

  // --- STATE PAGINATION (RESET KE HALAMAN 1 SETIAP GANTI TAB/FILTER) ---
  const [page, setPage] = useState(1);
  useEffect(() => {
    setPage(1);
  }, [activeTab, startDate, endDate]);

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
    setRefreshing(true);
    try {
      const response = await api.get("/logs/logs");
      const sortedData = [...response.data.data].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      setAuditLogs(sortedData);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  // --- FILTER BY DATE/TIME RANGE (DIPAKAI SEMUA TAB) ---
  const inRange = (dateValue) => {
    if (!dateValue) return true;
    const d = new Date(dateValue);
    if (startDate && d < new Date(startDate)) return false;
    if (endDate && d > new Date(endDate)) return false;
    return true;
  };

  const filteredAuditLogs = auditLogs.filter((log) => inRange(log.createdAt));
  const filteredEventStatusLogs = DEMO_EVENT_STATUS_LOGS.filter((ev) => inRange(ev.time));
  const filteredNotificationLogs = DEMO_NOTIFICATION_LOGS.filter((n) => inRange(n.time));

  // --- PAGINATION SLICE (PER TAB) ---
  const paginate = (items) => items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pagedAuditLogs = paginate(filteredAuditLogs);
  const pagedEventStatusLogs = paginate(filteredEventStatusLogs);
  const pagedNotificationLogs = paginate(filteredNotificationLogs);

  // --- EXPORT TO CSV (MENGIKUTI TAB YANG SEDANG AKTIF) ---
  const handleExportCSV = () => {
    if (activeTab === "audit") {
      exportCsv(
        ["Waktu", "Status", "User ID", "Deskripsi"],
        filteredAuditLogs.map((log) => [
          new Date(log.createdAt).toLocaleString("id-ID"),
          log.status,
          log.userId,
          log.desc,
        ]),
        "Audit_Log"
      );
    } else if (activeTab === "eventStatus") {
      exportCsv(
        ["Waktu", "pEdge", "Dari", "Ke"],
        filteredEventStatusLogs.map((ev) => [formatDisplayDate(ev.time), ev.device, ev.from, ev.to]),
        "Event_Status_Log"
      );
    } else if (activeTab === "notification") {
      exportCsv(
        ["Waktu", "Channel", "Penerima", "Pesan", "Status"],
        filteredNotificationLogs.map((n) => [formatDisplayDate(n.time), n.channel, n.recipient, n.message, n.status]),
        "Notification_Log"
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#06090e] text-slate-300 p-8 font-sans select-none relative space-y-6">
      {/* HEADER PAGE */}
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-2.5">
          <ScrollText className="w-6 h-6 text-blue-500" /> System Activity
        </h1>

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
      </div>

      {/* TOOLBAR BERSAMA: FILTER RENTANG WAKTU + REFRESH + EXPORT (DIPAKAI SEMUA TAB) */}
      <div className="flex flex-wrap items-center justify-end gap-3">
        <div className="flex items-center gap-2 bg-[#0e1420] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <input
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-transparent text-slate-300 focus:outline-none [color-scheme:dark]"
          />
          <span className="text-slate-600">s/d</span>
          <input
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-transparent text-slate-300 focus:outline-none [color-scheme:dark]"
          />
          <button
            onClick={() => {
              const { start, end } = getLast24HoursRange();
              setStartDate(start);
              setEndDate(end);
            }}
            className="text-slate-500 hover:text-slate-300 text-[10px] underline ml-1"
          >
            Last 24h
          </button>
        </div>

        <button
          onClick={fetchAuditLogs}
          disabled={refreshing}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-800 bg-[#0c1017] hover:bg-[#121824] text-xs font-medium text-slate-300 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-800 bg-[#0c1017] hover:bg-[#121824] text-xs font-medium text-slate-300 transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-slate-400" />
          Export CSV
        </button>
      </div>

      {/* SECTION: AUDIT TRAIL */}
      {activeTab === "audit" && (
      <div className="bg-[#0b0f17] border border-slate-800/80 rounded-xl p-5 shadow-xl">
        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-800/60">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Audit Trail
          </h2>
          <span className="text-[10px] text-slate-500">
            {filteredAuditLogs.length} events found
          </span>
        </div>

        {/* LIST LOGS WITH JSON DROPDOWN */}
        <div className="font-mono text-xs divide-y divide-slate-800/40">
          {filteredAuditLogs.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              Tidak ada data log yang sesuai filter.
            </div>
          ) : (
            pagedAuditLogs.map((log) => {
              const isExpanded = !!expandedLogIds[log.id];

              return (
                <div key={log.id} className="py-2.5 hover:bg-[#101622]/40 rounded-lg transition-colors px-2">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500 text-[11px] w-40 shrink-0">
                      {formatDisplayDate(log.createdAt)}
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
        <Pagination page={page} totalItems={filteredAuditLogs.length} onPageChange={setPage} />
      </div>
      )}

      {/* SECTION: EVENT STATUS LOG (demo — belum terhubung ke backend) */}
      {activeTab === "eventStatus" && (
      <div className="bg-[#0b0f17] border border-slate-800/80 rounded-xl p-5 shadow-xl">
        <div className="flex items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-800/60">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Event Status Log
              </h2>
              <span className="text-[10px] text-slate-500">
                {filteredEventStatusLogs.length} events found
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Riwayat perubahan status pEdge (offline ↔ online)
            </p>
          </div>
          <span className="text-[10px] font-mono text-amber-400 bg-amber-950/40 border border-amber-800/40 px-2 py-1 rounded">
            Demo data — belum terhubung ke backend
          </span>
        </div>
        <div className="font-mono text-xs divide-y divide-slate-800/40">
          {filteredEventStatusLogs.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              Tidak ada data yang sesuai filter.
            </div>
          ) : (
            pagedEventStatusLogs.map((ev) => (
              <div key={ev.id} className="py-2.5 flex items-center justify-between gap-4">
                <span className="text-slate-500 text-[11px] w-40 shrink-0">{formatDisplayDate(ev.time)}</span>
                <span className="text-slate-300 text-[11px] flex-1 truncate">{ev.device}</span>
                <span className="flex items-center gap-1.5 text-[11px] shrink-0">
                  <span className={ev.from === "Online" ? "text-emerald-400" : "text-rose-400"}>
                    {ev.from}
                  </span>
                  <span className="text-slate-600">→</span>
                  <span className={ev.to === "Online" ? "text-emerald-400" : "text-rose-400"}>
                    {ev.to}
                  </span>
                </span>
              </div>
            ))
          )}
        </div>
        <Pagination page={page} totalItems={filteredEventStatusLogs.length} onPageChange={setPage} />
      </div>
      )}

      {/* SECTION: NOTIFICATION LOG (demo — belum terhubung ke backend) */}
      {activeTab === "notification" && (
      <div className="bg-[#0b0f17] border border-slate-800/80 rounded-xl p-5 shadow-xl">
        <div className="flex items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-800/60">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Notification Log
              </h2>
              <span className="text-[10px] text-slate-500">
                {filteredNotificationLogs.length} events found
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Riwayat notifikasi Email/Telegram yang dikirim sistem
            </p>
          </div>
          <span className="text-[10px] font-mono text-amber-400 bg-amber-950/40 border border-amber-800/40 px-2 py-1 rounded">
            Demo data — belum terhubung ke backend
          </span>
        </div>
        <div className="font-mono text-xs divide-y divide-slate-800/40">
          {filteredNotificationLogs.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              Tidak ada data yang sesuai filter.
            </div>
          ) : (
            pagedNotificationLogs.map((n) => (
              <div key={n.id} className="py-2.5 flex items-center justify-between gap-4">
                <span className="text-slate-500 text-[11px] w-40 shrink-0">{formatDisplayDate(n.time)}</span>
                <span className="text-slate-400 text-[11px] w-20 shrink-0">{n.channel}</span>
                <span className="text-slate-400 text-[11px] w-44 shrink-0 truncate">{n.recipient}</span>
                <span className="text-slate-300 text-[11px] flex-1 truncate text-right">{n.message}</span>
                <span
                  className={`text-[10px] font-semibold w-16 text-right shrink-0 ${
                    n.status === "Sent" ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {n.status}
                </span>
              </div>
            ))
          )}
        </div>
        <Pagination page={page} totalItems={filteredNotificationLogs.length} onPageChange={setPage} />
      </div>
      )}

    </div>
  );
}
