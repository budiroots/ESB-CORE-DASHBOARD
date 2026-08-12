import React, { useState } from "react";
import { Settings2, Eye, Send } from "lucide-react";
import ToggleSwitch from "./ToggleSwitch";
import TemplatePreviewModal from "./TemplatePreviewModal";

const PLACEHOLDERS = [
  "{{eventTitle}}",
  "{{eventType}}",
  "{{statusEmoji}}",
  "{{statusColor}}",
  "{{timestamp}}",
  "{{details}}",
];

const inputClass =
  "w-full bg-[#111722] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500";

export default function SmtpSettings() {
  const [form, setForm] = useState({
    host: "mailgw.primacom.id",
    port: 25,
    username: "alerts@primacom.id",
    password: "",
    fromAddress: "alerts@primacom.id",
    useTls: false,
  });
  const [subject, setSubject] = useState("[Primacom] {{eventTitle}}");
  const [body, setBody] = useState(
    '<h2 style="color:{{statusColor}}">{{statusEmoji}} {{eventType}}</h2>\n{{details}}'
  );
  const [testEmail, setTestEmail] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  const update = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="bg-[#0e1420] border border-slate-800/80 rounded-xl p-6 space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-white">SMTP Configuration</h2>
        <p className="text-xs text-slate-500 mt-1">Configure outgoing email for alert notifications.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_140px] gap-4">
        <div className="space-y-1.5">
          <label className="text-xs text-slate-400">SMTP Host</label>
          <input value={form.host} onChange={update("host")} className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-slate-400">Port</label>
          <input type="number" value={form.port} onChange={update("port")} className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs text-slate-400">Username</label>
          <input value={form.username} onChange={update("username")} className={inputClass} placeholder="alerts@primacom.id" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-slate-400">Password</label>
          <input type="password" value={form.password} onChange={update("password")} className={inputClass} placeholder="········" />
          <p className="text-[11px] text-slate-600">Leave blank to keep current password</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-slate-400">From Address</label>
        <input value={form.fromAddress} onChange={update("fromAddress")} className={inputClass} />
      </div>

      <ToggleSwitch
        checked={form.useTls}
        onChange={(v) => setForm((prev) => ({ ...prev, useTls: v }))}
        label="Use TLS/SSL (port 465)"
      />

      <div className="border-t border-slate-800/80 pt-6 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Email Notification Template</h3>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
            Customize the subject and body of alert emails. Placeholders:{" "}
            {PLACEHOLDERS.map((p) => (
              <code key={p} className="text-slate-400 bg-[#111722] border border-slate-800 rounded px-1 mx-0.5">
                {p}
              </code>
            ))}
            {" "}— <code className="text-slate-400 bg-[#111722] border border-slate-800 rounded px-1">{"{{details}}"}</code> inserts an
            auto-generated table of the fields relevant to the event (pEdge name, site, region, IP address, etc).
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-slate-400">Subject Template</label>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} className={inputClass} />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-slate-400">Body Template (HTML)</label>
          <textarea
            rows={6}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className={`${inputClass} font-mono resize-y`}
          />
        </div>

        <div className="flex items-center gap-2">
          <select className={`${inputClass} w-auto`} defaultValue="pEdge Offline">
            <option>pEdge Offline</option>
          </select>
          <button
            onClick={() => setPreviewOpen(true)}
            className="flex items-center gap-1.5 text-xs text-slate-300 border border-slate-800 rounded-lg px-3 py-2 hover:bg-[#111722] transition-colors"
          >
            <Eye className="w-3.5 h-3.5" /> Preview
          </button>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={() => alert("Perubahan konfigurasi SMTP disimpan (demo).")}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Settings2 className="w-3.5 h-3.5" /> Save Changes
        </button>
      </div>

      <div className="border-t border-slate-800/80 pt-6 space-y-2">
        <h3 className="text-sm font-semibold text-white">Send Test Email</h3>
        <div className="flex gap-2">
          <input
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="recipient@example.com"
            className={inputClass}
          />
          <button
            onClick={() => alert(`Email test dikirim ke ${testEmail || "(kosong)"} (demo).`)}
            className="flex items-center gap-1.5 shrink-0 text-xs text-slate-300 border border-slate-800 rounded-lg px-3 py-2 hover:bg-[#111722] transition-colors"
          >
            <Send className="w-3.5 h-3.5" /> Send Test
          </button>
        </div>
      </div>

      <TemplatePreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        subject={subject}
        body={body}
        sampleKey="pEdge Offline"
      />
    </div>
  );
}
