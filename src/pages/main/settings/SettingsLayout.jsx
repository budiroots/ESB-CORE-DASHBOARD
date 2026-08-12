import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  Mail,
  MessageSquare,
  BellRing,
  Building2,
  Shield,
  ShieldCheck,
  FileClock,
  Settings,
} from "lucide-react";

const MENU_SECTIONS = [
  {
    title: "GENERAL",
    items: [
      { label: "License", path: "/settings/license", icon: ShieldCheck },
      { label: "Security", path: "/settings/general/security", icon: Shield },
      { label: "Audit Log", path: "/settings/general/audit-log", icon: FileClock },
    ],
  },
  {
    title: "NOTIFICATIONS",
    items: [
      { label: "SMTP", path: "/settings/notifications/smtp", icon: Mail },
      { label: "Telegram", path: "/settings/notifications/telegram", icon: MessageSquare },
      { label: "Offline Reminder", path: "/settings/notifications/offline-reminder", icon: BellRing },
    ],
  },
  {
    title: "APPEARANCE",
    items: [
      { label: "Branding", path: "/settings/appearance/branding", icon: Building2 },
    ],
  },
];

export default function SettingsLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#06090e] text-slate-300 p-8 font-sans select-none">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-blue-500" /> Settings
        </h1>
      </div>

      <div className="flex gap-8 max-w-6xl">
        <div className="w-56 shrink-0 space-y-6">
          {MENU_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-1">
              <h3 className="px-3 text-[10px] font-bold text-slate-500 tracking-wider uppercase">
                {section.title}
              </h3>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        active
                          ? "bg-[#131b26] text-blue-400"
                          : "text-slate-400 hover:text-slate-200 hover:bg-[#0e1520]"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex-1 min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
