import React, { useState } from "react";
import { Settings2 } from "lucide-react";

const inputClass =
  "w-full bg-[#111722] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500";

export default function AuditLogRetentionSettings() {
  const [retentionDays, setRetentionDays] = useState(90);

  return (
    <div className="bg-[#0e1420] border border-slate-800/80 rounded-xl p-6 space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-white">Audit Log Retention</h2>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          How long audit logs (user activity across sites, routes, tenants, and other modules) are kept before
          being purged automatically. The cleanup runs once a day.
        </p>
      </div>

      <div className="space-y-1.5 max-w-sm">
        <label className="text-xs text-slate-400">Retention Period (days)</label>
        <input
          type="number"
          value={retentionDays}
          onChange={(e) => setRetentionDays(e.target.value)}
          className={inputClass}
        />
        <p className="text-[11px] text-slate-600">Logs older than this are deleted daily. Default: 90 days.</p>
      </div>

      <div className="flex justify-end pt-2 border-t border-slate-800/80">
        <button
          onClick={() => alert("Retention audit log disimpan (demo).")}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors mt-6"
        >
          <Settings2 className="w-3.5 h-3.5" /> Save Changes
        </button>
      </div>
    </div>
  );
}
