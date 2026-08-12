import React, { useRef, useState } from "react";
import { Settings2, Upload } from "lucide-react";
import logo from "../../../assets/logo.png";

const inputClass =
  "w-full bg-[#111722] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500";

function ImagePicker({ label, hint, previewSrc, onPick }) {
  const fileRef = useRef(null);

  return (
    <div className="space-y-1.5">
      <label className="text-xs text-slate-400">{label}</label>
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 rounded-lg border border-dashed border-slate-700 bg-[#0b0f17] flex items-center justify-center overflow-hidden shrink-0">
          {previewSrc ? (
            <img src={previewSrc} alt={label} className="w-full h-full object-contain" />
          ) : (
            <span className="text-[10px] text-slate-600">current</span>
          )}
        </div>
        <div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 text-xs text-slate-300 border border-slate-800 rounded-lg px-3 py-2 hover:bg-[#111722] transition-colors"
          >
            <Upload className="w-3.5 h-3.5" /> Choose Image
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onPick(URL.createObjectURL(file));
            }}
          />
          <p className="text-[11px] text-slate-600 mt-1.5">{hint}</p>
        </div>
      </div>
    </div>
  );
}

export default function BrandingSettings() {
  const [appName, setAppName] = useState("");
  const [tabTitle, setTabTitle] = useState("PrimaSphere - Dashboard");
  const [logoPreview, setLogoPreview] = useState(logo);
  const [faviconPreview, setFaviconPreview] = useState(null);

  return (
    <div className="bg-[#0e1420] border border-slate-800/80 rounded-xl p-6 space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-white">Branding</h2>
        <p className="text-xs text-slate-500 mt-1">
          Customize the application name, logo, favicon, browser tab title, and theme colours.
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-slate-400">Application Name</label>
        <input
          value={appName}
          onChange={(e) => setAppName(e.target.value)}
          placeholder="Primacom"
          className={inputClass}
        />
        <p className="text-[11px] text-slate-600">Shown in the sidebar and as the default tab title</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-slate-400">Browser Tab Title</label>
        <input value={tabTitle} onChange={(e) => setTabTitle(e.target.value)} className={inputClass} />
        <p className="text-[11px] text-slate-600">Overrides the application name in the browser tab. Leave blank to use the application name.</p>
      </div>

      <ImagePicker
        label="Sidebar Logo"
        hint="PNG, JPG, SVG — recommended: square or short-wide — max 2 MB."
        previewSrc={logoPreview}
        onPick={setLogoPreview}
      />

      <ImagePicker
        label="Favicon"
        hint="ICO, PNG, SVG — recommended: 32×32 or 64×64 px — max 1 MB."
        previewSrc={faviconPreview}
        onPick={setFaviconPreview}
      />

      <div className="flex justify-end pt-2 border-t border-slate-800/80">
        <button
          onClick={() => alert("Branding disimpan (demo).")}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors mt-6"
        >
          <Settings2 className="w-3.5 h-3.5" /> Save Changes
        </button>
      </div>
    </div>
  );
}
