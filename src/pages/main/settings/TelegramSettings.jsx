import React, { useState } from "react";
import { Settings2, Eye, Send, Info } from "lucide-react";
import TemplatePreviewModal from "./TemplatePreviewModal";

const PLACEHOLDERS = ["{{eventTitle}}", "{{eventType}}", "{{statusEmoji}}", "{{timestamp}}", "{{details}}"];

const inputClass =
  "w-full bg-[#111722] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500";

export default function TelegramSettings() {
  const [botToken, setBotToken] = useState("");
  const [message, setMessage] = useState(
    "{{statusEmoji}} <b>{{eventType}}</b>\n\n{{details}}"
  );
  const [testChatId, setTestChatId] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <div className="bg-[#0e1420] border border-slate-800/80 rounded-xl p-6 space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-white">Telegram Configuration</h2>
        <p className="text-xs text-slate-500 mt-1">Configure Telegram bot for instant alert notifications.</p>
      </div>

      <div className="flex items-start gap-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3.5">
        <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-blue-300 leading-relaxed">
          <span className="font-semibold">How to set up:</span> Create a bot via{" "}
          <span className="font-semibold">@BotFather</span> on Telegram, copy the token below, then add the bot to
          your group/channel and use the chat ID as the notification target per pEdge.
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-slate-400">Bot Token</label>
        <input
          type="password"
          value={botToken}
          onChange={(e) => setBotToken(e.target.value)}
          placeholder="Enter new token to replace..."
          className={inputClass}
        />
        <p className="text-[11px] text-slate-600">Token is already configured (masked). Enter a new value to replace it.</p>
      </div>

      <div className="border-t border-slate-800/80 pt-6 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Telegram Notification Template</h3>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
            Customize the text of alert messages. Placeholders:{" "}
            {PLACEHOLDERS.map((p) => (
              <code key={p} className="text-slate-400 bg-[#111722] border border-slate-800 rounded px-1 mx-0.5">
                {p}
              </code>
            ))}
            {" "}— {"{{details}}"} inserts the event-specific fields (pEdge name, site, region, IP address, etc).
            Supports Telegram's HTML formatting (&lt;b&gt;, &lt;i&gt;).
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-slate-400">Message Template</label>
          <textarea
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
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
          onClick={() => alert("Konfigurasi Telegram disimpan (demo).")}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Settings2 className="w-3.5 h-3.5" /> Save Changes
        </button>
      </div>

      <div className="border-t border-slate-800/80 pt-6 space-y-2">
        <h3 className="text-sm font-semibold text-white">Send Test Message</h3>
        <p className="text-[11px] text-slate-500">
          Enter your Telegram user or group Chat ID to verify the bot works. You can get your chat ID from{" "}
          <span className="font-semibold text-slate-400">@userinfobot</span>.
        </p>
        <div className="flex gap-2">
          <input
            value={testChatId}
            onChange={(e) => setTestChatId(e.target.value)}
            placeholder="e.g. -1001234567890"
            className={inputClass}
          />
          <button
            onClick={() => alert(`Pesan test dikirim ke chat ID ${testChatId || "(kosong)"} (demo).`)}
            className="flex items-center gap-1.5 shrink-0 text-xs text-slate-300 border border-slate-800 rounded-lg px-3 py-2 hover:bg-[#111722] transition-colors"
          >
            <Send className="w-3.5 h-3.5" /> Send Test
          </button>
        </div>
      </div>

      <TemplatePreviewModal open={previewOpen} onClose={() => setPreviewOpen(false)} body={message} sampleKey="pEdge Offline" />
    </div>
  );
}
