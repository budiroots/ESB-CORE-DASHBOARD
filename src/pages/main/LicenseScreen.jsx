import React, { useState, useEffect } from 'react';
import {
  Key,
  GitBranch,
  Workflow,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  X,
  RefreshCw,
  FileText,
  UploadCloud
} from 'lucide-react';
import api from '../../api/axios';

const LicenseManagement = () => {
  // State untuk data lisensi aktif
  const [licenseData, setLicenseData] = useState(null);
  const [loading, setLoading] = useState(false);

  // State Modal: Generate Activation Request
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestFingerprint, setRequestFingerprint] = useState('');
  const [requestedAt, setRequestedAt] = useState('');

  // State Modal: Upload License File
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [activateLoading, setActivateLoading] = useState(false);

  // ==========================================
  // 1. GET: FETCH & VALIDATE CURRENT LICENSE
  // ==========================================
  const fetchLicenseStatus = async () => {
    setLoading(true);
    try {
      const response = await api.get('/License/validated', {
        headers: { accept: '*/*' }
      });
      setLicenseData(response.data);
    } catch (err) {
      console.error('Gagal memuat status lisensi:', err);
      setLicenseData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLicenseStatus();
  }, []);

  // Helper format tanggal ISO ke lokal Indonesia
  const formatLocalTargetDate = (isoString) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ==========================================
  // 2. GENERATE ACTIVATION REQUEST (request.json)
  // ==========================================
  const handleOpenRequestModal = () => {
    setRequestFingerprint(`ONPREM-${Math.random().toString(36).slice(2, 10).toUpperCase()}`);
    setRequestedAt(new Date().toISOString());
    setIsRequestModalOpen(true);
  };

  const handleDownloadRequest = () => {
    const payload = {
      hostname: window.location.hostname,
      fingerprint: requestFingerprint,
      requestedAt,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'request.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // ==========================================
  // 3. UPLOAD & ACTIVATE LICENSE FILE (.lic)
  // ==========================================
  const handleActivateLicense = async () => {
    if (!selectedFile) {
      alert('Silakan pilih file lisensi (.lic) terlebih dahulu.');
      return;
    }
    setActivateLoading(true);
    try {
      const text = await selectedFile.text();
      const parsed = JSON.parse(text);
      setLicenseData({
        isValid: true,
        status: 'ACTIVE',
        expiredAt: parsed.validUntil || parsed.expiredAt || null,
        pEdgeQuota: parsed.quota?.maxPEdge ?? parsed.maxFolders ?? 0,
        routeQuota: parsed.quota?.maxPRoutes ?? parsed.maxRoutes ?? 0,
      });
      setIsUploadModalOpen(false);
      setSelectedFile(null);
      alert('Lisensi berhasil diaktivasi (demo).');
    } catch (err) {
      console.error('Gagal mengaktivasi lisensi:', err);
      alert('File lisensi tidak valid atau rusak.');
    } finally {
      setActivateLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#090D14] text-slate-300 p-4 sm:p-6 lg:p-8 font-sans flex flex-col justify-between">
      {/* WRAPPER KONTEN UTAMA */}
      <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto">

        {/* HEADER & ACTION BAR */}
        <div className="flex flex-col gap-4 mb-6 pb-6 border-b border-slate-800/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-950/40 border border-blue-500/30 text-blue-400 rounded-xl">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-slate-100 tracking-tight">License & Subscription</h3>
                <span className="bg-slate-900 border border-slate-700 text-slate-400 text-[9px] font-mono px-1.5 py-0.5 rounded font-semibold uppercase">
                  On-Prem
                </span>
                <button
                  onClick={fetchLicenseStatus}
                  className="text-slate-500 hover:text-slate-300 transition-colors p-1"
                  title="Refresh Data"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-400' : ''}`} />
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Kelola aktivasi lisensi dari file yang diterbitkan oleh provider (Primacom).</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleOpenRequestModal}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-slate-800 bg-[#0d131d] hover:bg-[#121824] text-slate-300 transition-all flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>Generate Activation Request</span>
            </button>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20 active:scale-[0.98]"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload License File</span>
            </button>
          </div>
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 bg-[#0d131d]/50 border border-slate-800/60 rounded-2xl">
            <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mb-3" />
            <p className="text-xs text-slate-400 font-mono">Memeriksa status aktivasi server...</p>
          </div>
        ) : licenseData ? (
          /* DISPLAY ACTIVE SUBSCRIPTION INFO — STATUS + QUOTA POOL TABLES */
          <div className="space-y-4">
            <div className="bg-[#0d131d] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-sm">
                <tbody className="divide-y divide-slate-800/60">
                  <tr>
                    <td className="px-5 py-4 text-slate-400 font-medium">Status</td>
                    <td className="px-5 py-4 text-right">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                          licenseData.isValid
                            ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-400'
                            : 'bg-rose-950/50 border-rose-500/30 text-rose-400'
                        }`}
                      >
                        {licenseData.isValid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {licenseData.status || (licenseData.isValid ? 'ACTIVE' : 'EXPIRED')}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-5 py-4 text-slate-400 font-medium">Valid Until</td>
                    <td className="px-5 py-4 text-right font-mono text-slate-100">
                      {formatLocalTargetDate(licenseData.expiredAt)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-[#0d131d] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
              <div className="px-5 py-4 border-b border-slate-800/60">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quota Pool</h4>
              </div>
              <table className="w-full text-left text-sm">
                <tbody className="divide-y divide-slate-800/60">
                  <tr>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-950/40 border border-blue-500/20 text-blue-400">
                          <GitBranch className="w-4 h-4" />
                        </div>
                        <span className="text-slate-300 font-medium">pEdge Quota Max</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right font-mono text-lg font-black text-slate-100">
                      {licenseData.pEdgeQuota}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-950/40 border border-indigo-500/20 text-indigo-400">
                          <Workflow className="w-4 h-4" />
                        </div>
                        <span className="text-slate-300 font-medium">Route Quota Max</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right font-mono text-lg font-black text-slate-100">
                      {licenseData.routeQuota}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* FALLBACK JIKA LISENSI TIDAK TERSEDIA / INVALID */
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-rose-950/20 border border-rose-500/30 rounded-2xl text-center">
            <div className="p-3 bg-rose-900/40 border border-rose-500/40 text-rose-400 rounded-xl mb-3">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h4 className="text-base font-semibold text-rose-200">Lisensi On-Prem Belum Aktif</h4>
            <p className="text-xs text-rose-300/70 max-w-md mt-1 mb-6">
              Generate Activation Request, kirim ke provider (Primacom), lalu upload file lisensi (.lic) yang
              diterbitkan untuk mengaktifkan sistem ini.
            </p>
            <div className="flex items-center gap-2.5">
              <button
                onClick={handleOpenRequestModal}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-slate-700 bg-[#0d131d] hover:bg-[#121824] text-slate-300 transition-all flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                <span>Generate Activation Request</span>
              </button>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-rose-600/20 transition-all flex items-center gap-2"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload License File</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* POP-UP MODAL: GENERATE ACTIVATION REQUEST */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-xs" onClick={() => setIsRequestModalOpen(false)} />

          <div className="bg-[#0d131d] border border-slate-800 text-slate-300 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 animate-scaleUp">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-[#111722]">
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-slate-100">Generate Activation Request</h3>
              </div>
              <button
                onClick={() => setIsRequestModalOpen(false)}
                className="text-slate-500 hover:text-slate-300 hover:bg-slate-800 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                File ini berisi fingerprint hardware server on-prem Anda. Kirim file ini ke provider (Primacom) —
                mereka akan menerbitkan file lisensi (.lic) yang di-bind ke fingerprint tersebut.
              </p>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Hardware Fingerprint
                </label>
                <div className="w-full bg-[#161f2c] border border-slate-700/60 rounded-xl p-2.5 text-xs text-blue-300 font-mono break-all">
                  {requestFingerprint}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Requested At
                </label>
                <div className="w-full bg-[#161f2c] border border-slate-700/60 rounded-xl p-2.5 text-xs text-slate-300 font-mono">
                  {formatLocalTargetDate(requestedAt)}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-800/80 mt-6">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="w-1/3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs py-2.5 rounded-xl transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleDownloadRequest}
                  className="w-2/3 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs py-2.5 rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Download request.json</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POP-UP MODAL: UPLOAD LICENSE FILE */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-xs"
            onClick={() => {
              setIsUploadModalOpen(false);
              setSelectedFile(null);
            }}
          />

          <div className="bg-[#0d131d] border border-slate-800 text-slate-300 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 animate-scaleUp">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-[#111722]">
              <div className="flex items-center gap-2.5">
                <UploadCloud className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-slate-100">Upload License File</h3>
              </div>
              <button
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setSelectedFile(null);
                }}
                className="text-slate-500 hover:text-slate-300 hover:bg-slate-800 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                File lisensi (.lic) diterbitkan oleh provider (Primacom) berdasarkan Activation Request yang Anda
                kirimkan sebelumnya. Server on-prem tidak dapat menerbitkan lisensinya sendiri.
              </p>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  License File (.lic)
                </label>
                <label className="flex items-center gap-2 w-full bg-[#161f2c] border border-dashed border-slate-700/60 rounded-xl p-3 text-xs text-slate-300 cursor-pointer hover:border-blue-500/60 transition-colors">
                  <UploadCloud className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="truncate">{selectedFile?.name || 'Select license file...'}</span>
                  <input
                    type="file"
                    accept=".lic,application/json"
                    className="hidden"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-800/80 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsUploadModalOpen(false);
                    setSelectedFile(null);
                  }}
                  className="w-1/3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs py-2.5 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleActivateLicense}
                  disabled={activateLoading}
                  className="w-2/3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-medium text-xs py-2.5 rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                >
                  {activateLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Activating...</span>
                    </>
                  ) : (
                    <span>Activate License</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LicenseManagement;
