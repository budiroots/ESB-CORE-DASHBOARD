import React, { useState } from "react";
import { X, User, Mail, MessageCircle, Lock, LogOut } from "lucide-react";

const inputClass =
  "w-full bg-[#111722] border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500";

function IconInput({ icon, ...props }) {
  const Icon = icon;
  return (
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
      <input className={inputClass} {...props} />
    </div>
  );
}

export default function AccountPanel({ open, onClose, userData, onLogout }) {
  const [activeTab, setActiveTab] = useState("profile");
  const [fullName, setFullName] = useState(userData?.fullName || "");
  const [email, setEmail] = useState(userData?.email || "");
  const [telegramChatId, setTelegramChatId] = useState(userData?.telegramChatId || "");
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });

  if (!open) return null;

  const initial = (userData?.fullName || "U").charAt(0).toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex justify-start">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative w-full max-w-sm h-full bg-[#0b0f17] border-r border-slate-800/80 shadow-2xl flex flex-col">
        <div className="bg-[#090D14] border-b border-slate-800/60 px-5 pt-4 pb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">My Account</h2>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full bg-blue-600 text-white text-2xl font-bold flex items-center justify-center">
              {initial}
            </div>
            <span className="text-sm font-semibold text-white">{userData?.fullName || "User"}</span>
            {userData?.role && (
              <span className="text-[10px] font-bold uppercase tracking-wide text-blue-400 bg-blue-500/15 border border-blue-500/30 rounded-full px-2.5 py-1">
                {userData.role}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 border-b border-slate-800/70 px-5">
          {[
            { id: "profile", label: "Edit Profile" },
            { id: "password", label: "Change Password" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.id
                  ? "text-blue-400 border-blue-500"
                  : "text-slate-500 border-transparent hover:text-slate-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {activeTab === "profile" ? (
            <>
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Full Name</label>
                <IconInput icon={User} value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Email</label>
                <IconInput
                  icon={Mail}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@domain.com"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Telegram Chat ID</label>
                <IconInput
                  icon={MessageCircle}
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                  placeholder="Your Telegram Chat ID"
                />
                <p className="text-[11px] text-slate-600">
                  Used for personal Telegram alert notifications. Get your Chat ID from{" "}
                  <span className="text-slate-500 font-medium">@userinfobot</span>
                </p>
              </div>
              <button
                onClick={() => alert("Profil disimpan (demo).")}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium py-2.5 rounded-lg transition-colors"
              >
                Save Profile
              </button>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Current Password</label>
                <IconInput
                  icon={Lock}
                  type="password"
                  value={passwords.current}
                  onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
                  placeholder="········"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">New Password</label>
                <IconInput
                  icon={Lock}
                  type="password"
                  value={passwords.next}
                  onChange={(e) => setPasswords((p) => ({ ...p, next: e.target.value }))}
                  placeholder="········"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Confirm New Password</label>
                <IconInput
                  icon={Lock}
                  type="password"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
                  placeholder="········"
                />
              </div>
              <button
                onClick={() => alert("Password diperbarui (demo).")}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium py-2.5 rounded-lg transition-colors"
              >
                Save Password
              </button>
            </>
          )}
        </div>

        <div className="border-t border-slate-800/60 px-5 py-4">
          <button
            onClick={onLogout}
            className="flex items-center gap-2 text-xs text-rose-500 hover:text-rose-400 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
