import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import api from "../api/axios";
import React, { useState, useEffect } from 'react';

function Layout() {
  const [licenseInfo, setLicenseInfo] = useState({ isValid: true }); 

  const fetchLicenseData = async () => {
    try {
      const statusRes = await api.get("/license/validated");
      setLicenseInfo({
        isValid: statusRes.data.isValid,
      });
    } catch (err) {
      console.error("Gagal mengambil data lisensi:", err);
      setLicenseInfo({ isValid: false });
    }
  };

  useEffect(() => {
    fetchLicenseData();
  }, []);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* PERBAIKAN: Sidebar hanya muncul jika lisensi VALID */}
      {licenseInfo?.isValid !== false && <Sidebar />}

      {/* Area Konten Utama (Otomatis mengambil full width jika Sidebar di-hide) */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar relative">
          {licenseInfo?.isValid === false ? (
            /* TAMPILAN JIKA LISENSI HABIS (FULL SCREEN BLOCKED) */
            <div className="absolute inset-0 bg-slate-100 flex items-center justify-center p-6 z-50">
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 max-w-md w-full text-center">
                {/* Icon Warning */}
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5 text-red-500 text-3xl">
                  🔒
                </div>
                
                {/* Konten Teks */}
                <h2 className="text-xl font-bold text-slate-800 mb-2">
                  Lisensi Telah Habis
                </h2>
                <p className="text-sm text-slate-500 leading-relaxed mb-6">
                  Masa berlaku lisensi sistem Anda telah berakhir. Seluruh akses menu navigasi, fitur konfigurasi, dan pemrosesan routing telah dinonaktifkan.
                </p>

                {/* Banner Call to Action */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
                  <p className="text-xs font-semibold text-amber-800 mb-1 flex items-center gap-1.5">
                    ⚠️ Perlu Pembaruan Lisensi
                  </p>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Harap segera hubungi tim teknis atau administrator <strong className="font-bold text-slate-900">Primacom</strong> untuk melakukan aktivasi atau perpanjangan lisensi.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* TAMPILAN NORMAL JIKA LISENSI VALID */
            <div className="mx-auto">
              <Outlet />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Layout;