import React, { useState } from "react";
import { Settings2, Info } from "lucide-react";
import ToggleSwitch from "./ToggleSwitch";

const inputClass =
  "w-full bg-[#111722] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500";

const PRESETS = [
  { label: "15 minutes", minutes: 15 },
  { label: "30 minutes", minutes: 30 },
  { label: "1 hour", minutes: 60 },
  { label: "2 hours", minutes: 120 },
  { label: "4 hours", minutes: 240 },
  { label: "8 hours", minutes: 480 },
];

function formatInterval(minutes) {
  const n = Number(minutes) || 0;
  if (n < 60) return `${n} minute${n === 1 ? "" : "s"}`;
  if (n % 60 === 0) return `${n / 60} hour${n / 60 === 1 ? "" : "s"}`;
  return `${Math.floor(n / 60)}h ${n % 60}m`;
}

export default function OfflineReminderSettings() {
  const [enabled, setEnabled] = useState(true);
  const [intervalMinutes, setIntervalMinutes] = useState(60);
  const [maxReminders, setMaxReminders] = useState(0);

  return (
    <div className="bg-[#0e1420] border border-slate-800/80 rounded-xl p-6 space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-white">Offline Reminder</h2>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Repeat the offline alert every few minutes for as long as a pEdge stays offline, so an unnoticed outage
          keeps being reported instead of alerting only once.
        </p>
      </div>

      <ToggleSwitch checked={enabled} onChange={setEnabled} label="Enable recurring offline reminders" />

      <div className="space-y-1.5 max-w-xs">
        <label className="text-xs text-slate-400">Repeat Every (minutes)</label>
        <input
          type="number"
          value={intervalMinutes}
          onChange={(e) => setIntervalMinutes(e.target.value)}
          className={inputClass}
        />
        <p className="text-[11px] text-slate-600">
          Reminders are sent while the pEdge remains offline. Minimum 5, maximum 10080 (7 days). Default: 60 minutes.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.minutes}
            type="button"
            onClick={() => setIntervalMinutes(p.minutes)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              Number(intervalMinutes) === p.minutes
                ? "border-blue-500/60 bg-blue-500/10 text-blue-400"
                : "border-slate-800 text-slate-400 hover:bg-[#111722]"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="space-y-1.5 max-w-xs">
        <label className="text-xs text-slate-400">Maximum Reminders per Outage</label>
        <input
          type="number"
          value={maxReminders}
          onChange={(e) => setMaxReminders(e.target.value)}
          className={inputClass}
        />
        <p className="text-[11px] text-slate-600">
          Stop reminding after this many reminders for the same outage. Use 0 for unlimited (keep reminding until
          the pEdge is back online).
        </p>
      </div>

      <div className="flex items-start gap-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3.5">
        <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-blue-300 leading-relaxed">
          A pEdge that goes offline will be reported again every{" "}
          <span className="font-semibold">{formatInterval(intervalMinutes)}</span>
          {Number(maxReminders) > 0 ? ` up to ${maxReminders} time${Number(maxReminders) === 1 ? "" : "s"}` : " indefinitely"}
          , until it comes back online. Reminders go to the same users assigned to that pEdge, on the channels
          enabled for it (Email / Telegram).
        </p>
      </div>

      <div className="flex justify-end pt-2 border-t border-slate-800/80">
        <button
          onClick={() => alert("Konfigurasi Offline Reminder disimpan (demo).")}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors mt-6"
        >
          <Settings2 className="w-3.5 h-3.5" /> Save Changes
        </button>
      </div>
    </div>
  );
}
