import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Plus,
  Trash2,
  Power,
  Globe,
  Server,
  RefreshCw
} from 'lucide-react';
import api from '../../api/axios';
import { useNavigate, useParams } from 'react-router-dom';

const FirewallSecurity = () => {
  const { id } = useParams();
  const navigate = useNavigate(); 

  // State Khusus Firewall Security
  const [fwRules, setFwRules] = useState([]);
  const [isFwActive, setIsFwActive] = useState(false);
  const [fwLoading, setFwLoading] = useState(false);

  // Form State Tambah Rule Baru
  const [newRule, setNewRule] = useState({
    port: '',
    ipAddress: '',
    protocol: 'tcp',
    direction: 'in', // 'in' = Inbound, 'out' = Outbound
    action: 'allow'  // 'allow' atau 'deny'
  });

  // Fetch Aturan Firewall UFW dari API .NET Core Tenant
  const fetchFirewallData = async () => {
    setFwLoading(true);
    try {
      // 1. Cek Status ON/OFF
      const statusRes = await api.get(`/site/firewall/status/${id}`);
      setIsFwActive(statusRes.data.ufwStatus);

      // 2. Cek List Rules Berformat JSON
      const rulesRes = await api.get(`/site/firewall/rules/${id}`);

      if (rulesRes.data && Array.isArray(rulesRes.data.rules_list)) {
        setFwRules(rulesRes.data.rules_list);
      } else {
        setFwRules([]);
      }
    } catch (err) {
      console.error("Gagal mengambil data firewall:", err);
      setFwRules([]);
    } finally {
      setFwLoading(false);
    }
  };

  useEffect(() => {
    fetchFirewallData();
  }, []);

  // Handler ON/OFF Firewall
  const handleToggleFirewall = async () => {
    try {
      const targetStatus = !isFwActive;
      await api.put(`/site/firewall/toggle/${id}?enable=${targetStatus}`);
      setIsFwActive(targetStatus);
      fetchFirewallData();
    } catch (err) {
      alert("Gagal mengubah status firewall. Pastikan API berjalan dengan privilege sudo.");
    }
  };

  // Handler Tambah Rule Baru (Allow/Deny)
  const handleAddRule = async (e) => {
    e.preventDefault();
    if (!newRule.port && !newRule.ipAddress) {
      alert("Isi minimal Port atau IP Address!");
      return;
    }

    const endpoint = `/site/firewall/${newRule.action}/${id}`;
    try {
      await api.post(endpoint, {
        port: newRule.port || null,
        ipAddress: newRule.ipAddress || null,
        protocol: newRule.protocol,
        direction: newRule.direction
      });

      setNewRule({ port: '', ipAddress: '', protocol: 'tcp', direction: 'in', action: 'allow' });
      fetchFirewallData();
    } catch (err) {
      alert("Gagal menambahkan aturan firewall.");
    }
  };

  // Handler Hapus Aturan berdasarkan ID/Nomor urut UFW
  const handleDeleteRule = async (ids) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus aturan nomor [${ids}]?`)) {
      try {
        await api.delete(`/site/firewall/rules/${ids}/${id}`);
        fetchFirewallData();
      } catch (err) {
        alert("Gagal menghapus aturan.");
      }
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#090D14] text-slate-300 p-4 sm:p-6 lg:p-8 font-sans flex flex-col justify-between">
      
      {/* WRAPPER KONTEN UTAMA */}
      <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto">
        
        {/* 1. HEADER & STATUS TOGGLE */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-slate-800/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              isFwActive 
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400' 
                : 'bg-rose-950/40 border-rose-500/30 text-rose-400'
            }`}>
              {isFwActive ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-slate-100 tracking-tight">UFW Firewall Security</h3>
                <button 
                  onClick={fetchFirewallData} 
                  className="text-slate-500 hover:text-slate-300 transition-colors p-1"
                  title="Refresh Data"
                >
                  <RefreshCw className={`w-4 h-4 ${fwLoading ? 'animate-spin text-blue-400' : ''}`} />
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Kelola aturan lalu lintas Inbound & Outbound server tenant.</p>
            </div>
          </div>

          {/* Toggle Active Button */}
          <button
            onClick={handleToggleFirewall}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 border shadow-lg ${
              isFwActive
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 shadow-emerald-950/20'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20 shadow-rose-950/20'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isFwActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
            <Power className="w-3.5 h-3.5" />
            <span>{isFwActive ? 'FIREWALL: ACTIVE' : 'FIREWALL: INACTIVE'}</span>
          </button>
        </div>

        {/* 2. FORM TAMBAH RULE BARU */}
        <div className="bg-[#0d131d] rounded-xl p-4 sm:p-5 mb-6 border border-slate-800/80 shrink-0">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="w-4 h-4 text-blue-400" />
            <h4 className="text-xs font-semibold text-slate-200 tracking-wide uppercase">Tambah Rule Kebijakan Baru</h4>
          </div>

          <form onSubmit={handleAddRule} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            {/* Tipe Action */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Kebijakan</label>
              <select
                value={newRule.action}
                onChange={(e) => setNewRule({ ...newRule, action: e.target.value })}
                className="w-full bg-[#161f2c] text-xs text-slate-200 border border-slate-700/60 rounded-lg p-2.5 focus:outline-none focus:border-blue-500/60 transition-colors"
              >
                <option value="allow">ALLOW (Izinkan)</option>
                <option value="deny">DENY (Blokir)</option>
              </select>
            </div>

            {/* Direction */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Arah Trafik</label>
              <select
                value={newRule.direction}
                onChange={(e) => setNewRule({ ...newRule, direction: e.target.value })}
                className="w-full bg-[#161f2c] text-xs text-slate-200 border border-slate-700/60 rounded-lg p-2.5 focus:outline-none focus:border-blue-500/60 transition-colors"
              >
                <option value="in">Inbound (Masuk)</option>
                <option value="out">Outbound (Keluar)</option>
              </select>
            </div>

            {/* Port */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Port</label>
              <input
                type="text"
                placeholder="Ex: 8080 atau 22"
                value={newRule.port}
                onChange={(e) => setNewRule({ ...newRule, port: e.target.value })}
                className="w-full bg-[#161f2c] text-xs text-slate-200 placeholder:text-slate-600 border border-slate-700/60 rounded-lg p-2.5 focus:outline-none focus:border-blue-500/60 transition-colors font-mono"
              />
            </div>

            {/* IP Address */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">IP Address</label>
              <input
                type="text"
                placeholder="Anywhere / 192.168.1.1"
                value={newRule.ipAddress}
                onChange={(e) => setNewRule({ ...newRule, ipAddress: e.target.value })}
                className="w-full bg-[#161f2c] text-xs text-slate-200 placeholder:text-slate-600 border border-slate-700/60 rounded-lg p-2.5 focus:outline-none focus:border-blue-500/60 transition-colors font-mono"
              />
            </div>

            {/* Submit Button */}
            <div className="sm:col-span-2 lg:col-span-1">
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white p-2.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Terapkan Rule</span>
              </button>
            </div>
          </form>
        </div>

        {/* 3. TABEL RULE AKTIF */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3 px-1 shrink-0">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Server className="w-3.5 h-3.5 text-slate-500" />
              <span>Daftar Aturan Terdaftar</span>
            </h4>
            <span className="text-[10px] text-slate-500 font-mono">Total: {fwRules.length} Rules</span>
          </div>

          {fwLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 bg-[#0d131d]/50 border border-slate-800/60 rounded-xl">
              <RefreshCw className="w-6 h-6 text-blue-400 animate-spin mb-2" />
              <p className="text-xs text-slate-500">Mengambil data aturan firewall dari server...</p>
            </div>
          ) : fwRules.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 border border-dashed rounded-xl border-slate-800 bg-[#0d131d]/30">
              <ShieldCheck className="w-10 h-10 text-slate-600 mb-2" />
              <p className="text-xs text-slate-400 font-medium">Tidak ada aturan khusus aktif</p>
              <p className="text-[11px] text-slate-600 mt-0.5">Server sedang mengikuti kebijakan standar (default rules).</p>
            </div>
          ) : (
            <div className="flex-1 border border-slate-800/80 rounded-xl overflow-hidden bg-[#0d131d] flex flex-col">
              <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-380px)]">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-[#111722] z-10">
                    <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                      <th className="py-3 px-4 w-16 text-center">ID</th>
                      <th className="py-3 px-4">Target (To)</th>
                      <th className="py-3 px-4">Kebijakan</th>
                      <th className="py-3 px-4">Sumber (From)</th>
                      <th className="py-3 px-4 w-20 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {fwRules.map((rule) => {
                      const isAllow = rule.action?.toUpperCase().includes("ALLOW");

                      return (
                        <tr key={rule.id} className="hover:bg-[#131b26] transition-colors">
                          {/* ID */}
                          <td className="py-3.5 px-4 text-center font-mono text-slate-500 bg-[#090d14]/40">
                            #{rule.id}
                          </td>

                          {/* Target (To) */}
                          <td className="py-3.5 px-4 font-medium text-slate-200 font-mono">
                            <div className="flex items-center gap-2">
                              <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span>{rule.to}</span>
                            </div>
                          </td>

                          {/* Action Badge */}
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-semibold border ${
                                isAllow
                                  ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-400'
                                  : 'bg-rose-950/50 border-rose-500/30 text-rose-400'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${isAllow ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                              {rule.action}
                            </span>
                          </td>

                          {/* From */}
                          <td className="py-3.5 px-4 text-slate-400 font-mono">
                            {rule.from}
                          </td>

                          {/* Delete Action */}
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => handleDeleteRule(rule.id)}
                              className="text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 p-1.5 rounded-lg transition-all"
                              title={`Hapus aturan #${rule.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default FirewallSecurity;