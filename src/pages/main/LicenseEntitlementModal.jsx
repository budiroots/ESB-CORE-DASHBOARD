import React, { useState } from "react";
import { KeyRound, X, ShieldCheck, Check, Download, Upload, Calendar, Info } from "lucide-react";

const inputClass =
  "w-full bg-[#111722] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500";

const DEFAULT_STATE = {
  viewMode: "form", // 'form' | 'json'
  deployment: "cloud", // 'cloud' | 'onprem'
  maxPEdge: 3,
  maxPRoutes: 10,
  validUntil: "2026-12-31T23:59",
  graceDays: 7,
  requestFileName: null,
};

export default function LicenseEntitlementModal({ tenant, onClose }) {
  const [viewMode, setViewMode] = useState(DEFAULT_STATE.viewMode);
  const [deployment, setDeployment] = useState(DEFAULT_STATE.deployment);
  const [maxPEdge, setMaxPEdge] = useState(DEFAULT_STATE.maxPEdge);
  const [maxPRoutes, setMaxPRoutes] = useState(DEFAULT_STATE.maxPRoutes);
  const [validUntil, setValidUntil] = useState(DEFAULT_STATE.validUntil);
  const [graceDays, setGraceDays] = useState(DEFAULT_STATE.graceDays);
  const [requestFileName, setRequestFileName] = useState(DEFAULT_STATE.requestFileName);

  const isOnPrem = deployment === "onprem";

  const buildPayload = () => ({
    tenant: tenant?.slug || tenant?.code || null,
    deployment,
    quota: { maxPEdge: Number(maxPEdge) || 0, maxPRoutes: Number(maxPRoutes) || 0 },
    validUntil,
    graceDays: Number(graceDays) || 0,
    ...(isOnPrem ? { activationRequest: requestFileName } : {}),
  });

  const handleValidate = () => {
    if (!validUntil) {
      alert("Valid Until wajib diisi.");
      return;
    }
    if (isOnPrem && !requestFileName) {
      alert("Silakan pilih file request.json terlebih dahulu.");
      return;
    }
    alert("Entitlement valid.");
  };

  const handlePrimaryAction = () => {
    if (isOnPrem && !requestFileName) {
      alert("Silakan pilih file request.json terlebih dahulu.");
      return;
    }
    if (isOnPrem) {
      alert(`File .lic untuk ${tenant?.name} sedang di-generate (demo).`);
    } else {
      alert(`Entitlement diterapkan untuk ${tenant?.name} (demo).`);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-[#0b1017] border border-slate-800/90 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* HEADER */}
        <div className="p-5 flex items-start justify-between border-b border-slate-800/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#111823] border border-slate-700/50 flex items-center justify-center text-slate-300">
              <KeyRound className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">License Entitlement — {tenant?.name}</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto">
          {/* TOP BAR: FORM/JSON TOGGLE + VALIDATE */}
          <div className="flex items-center justify-between">
            <div className="flex bg-[#111722] p-1 rounded-lg border border-slate-800">
              {["form", "json"].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md capitalize transition-all ${
                    viewMode === mode
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleValidate}
              className="flex items-center gap-1.5 text-xs text-slate-300 border border-slate-800 rounded-lg px-3 py-1.5 hover:bg-[#111722] transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Validate
            </button>
          </div>

          {viewMode === "json" ? (
            <div className="space-y-1.5">
              <textarea
                rows={12}
                readOnly
                value={JSON.stringify(buildPayload(), null, 2)}
                className={`${inputClass} font-mono resize-none`}
              />
              <p className="text-[11px] text-slate-600">Read-only preview generated from the form.</p>
            </div>
          ) : (
            <>
              {/* DEPLOYMENT */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Deployment</label>
                <div className="flex bg-[#111722] p-1 rounded-lg border border-slate-800 gap-1">
                  {[
                    { key: "cloud", label: "Cloud (managed)" },
                    { key: "onprem", label: "On-prem" },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setDeployment(opt.key)}
                      className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
                        deployment === opt.key
                          ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* INFO BOX */}
              <div className="flex items-start gap-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3.5">
                <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-blue-300 leading-relaxed">
                  {isOnPrem
                    ? "Customer menjalankan control plane sendiri. Entitlement dikirim sebagai file .lic yang di-bind ke fingerprint hardware dari request.json."
                    : "Tenant berjalan di shared controller yang dioperasikan Primacom. Entitlement langsung berlaku — tanpa file, tanpa fingerprint."}
                </p>
              </div>

              {/* ACTIVATION REQUEST (ON-PREM ONLY) */}
              {isOnPrem && (
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400">
                    <span className="text-rose-400">*</span> Activation Request (request.json)
                  </label>
                  <label className="flex items-center gap-1.5 w-fit text-xs text-slate-300 border border-slate-800 rounded-lg px-3 py-2 hover:bg-[#111722] transition-colors cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    {requestFileName || "Select request.json"}
                    <input
                      type="file"
                      accept="application/json,.json"
                      className="hidden"
                      onChange={(e) => setRequestFileName(e.target.files?.[0]?.name || null)}
                    />
                  </label>
                  <p className="text-[11px] text-slate-600">The customer creates this file from their dashboard.</p>
                </div>
              )}

              {/* QUOTA POOL */}
              <div className="space-y-3 border-t border-slate-800/80 pt-4">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quota Pool</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400">Max pEdge</label>
                    <input
                      type="number"
                      min={0}
                      value={maxPEdge}
                      onChange={(e) => setMaxPEdge(e.target.value)}
                      className={`${inputClass} font-mono`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400">Max pRoutes</label>
                    <input
                      type="number"
                      min={0}
                      value={maxPRoutes}
                      onChange={(e) => setMaxPRoutes(e.target.value)}
                      className={`${inputClass} font-mono`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400">
                      <span className="text-rose-400">*</span> Valid Until
                    </label>
                    <div className="relative">
                      <input
                        type="datetime-local"
                        value={validUntil}
                        onChange={(e) => setValidUntil(e.target.value)}
                        required
                        className={`${inputClass} font-mono pr-8`}
                      />
                      <Calendar className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400">Grace (days)</label>
                    <input
                      type="number"
                      min={0}
                      value={graceDays}
                      onChange={(e) => setGraceDays(e.target.value)}
                      className={`${inputClass} font-mono`}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex justify-between items-center p-5 border-t border-slate-800/80 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrimaryAction}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition-all"
          >
            {isOnPrem ? (
              <>
                <Download className="w-3.5 h-3.5" /> Generate & Download
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" /> Apply Entitlement
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
