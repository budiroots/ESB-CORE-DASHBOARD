import React, { useState, useEffect } from "react";
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  X,
  ArrowRight,
  Sparkles,
  ChevronDown,
  KeyRound
} from "lucide-react";
import api from "../../api/axios";
import LicenseEntitlementModal from "./LicenseEntitlementModal";

const DEFAULT_FORM_STATE = {
  id: null,
  name: "",
  code: "",
  slug: "",
  // Plan/Env/Region/Users/Accent tidak lagi ditampilkan di form (lihat permintaan hapus field),
  // tapi tetap disimpan di state supaya nilai tenant yang sudah ada tidak ter-reset saat di-edit
  // (backend UpdateTenant men-.Set() field ini langsung dari payload).
  plan: "Pro",
  env: "Prod",
  region: "ap-southeast-3 (Jakarta)",
  users: 1,
  accent: "Accent",
  description: "",
  email: "",
  phone: "",
  address: "",
  pic: "",
  status: "Active",
};

export default function TenantsPage() {
  // --- STATES ---
  const [tenants, setTenants] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create' | 'edit'
  const [formData, setFormData] = useState(DEFAULT_FORM_STATE);
  const [licenseTenant, setLicenseTenant] = useState(null);

  // --- HANDLERS FOR MODAL ---
  const handleOpenCreateModal = () => {
    setModalMode("create");
    setFormData(DEFAULT_FORM_STATE);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (tenant) => {
    setModalMode("edit");
    setFormData({
      id: tenant.id,
      name: tenant.name,
      code: tenant.code,
      slug: tenant.slug || tenant.name.toLowerCase().replace(/\s+/g, "-"),
      plan: tenant.plan === "ENTERPRISE" ? "Enterprise" : tenant.plan === "PRO" ? "Pro" : "Trial",
      env: tenant.env,
      region: tenant.region || "ap-southeast-3 (Jakarta)",
      users: tenant.users,
      accent: tenant.accent || "Accent",
      description: tenant.description || "",
      email: tenant.email || "",
      phone: tenant.phone || "",
      address: tenant.address || "",
      pic: tenant.pic || "",
      status: tenant.isActive === false ? "Inactive" : "Active",
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData(DEFAULT_FORM_STATE);
  };

  // --- SAVE / SUBMIT TENANT ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.code) {
      alert("Tenant Name and Code are required!");
      return;
    }

    const newTenant = {
      name: formData.name,
      code: formData.code.toUpperCase().slice(0, 2),
      slug: formData.name.toLowerCase().replace(/\s+/g, "-"),
      isSuperAdmin: false,
      isActive: formData.status === "Active",
      description: formData.description,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      pic: formData.pic,
      plan: formData.plan.toUpperCase(),
      env: formData.env,
      region: formData.region,
      users: Number(formData.users) || 1,
      accent: formData.accent,
    };
    if (modalMode === "create") {
      await api.post(`/tenant`, newTenant, { headers: { 'Content-Type': 'application/json' } });
      fetchTenants(); // Refresh the tenants list after creation
    } else {
      // Edit Mode
      await api.put(`/tenant/${formData.id}`, newTenant, { headers: { 'Content-Type': 'application/json' } });
      fetchTenants(); // Refresh the tenants list after update
    }

    handleCloseModal();
  };

  // --- DELETE TENANT ---
  const handleDeleteTenant = async (id) => {
    if (window.confirm("Are you sure you want to delete this tenant?")) {
      await api.delete(`/tenant/${id}`);
      fetchTenants(); // Refresh the tenants list after deletion
    }
  };

  // Utility badge styling helper
  const getBadgeStyle = (accent) => {
    switch (accent) {
      case "Accent 2":
        return "bg-cyan-950/80 border-cyan-500/40 text-cyan-300";
      case "Violet":
        return "bg-purple-950/80 border-purple-500/40 text-purple-300";
      case "Amber":
        return "bg-amber-950/80 border-amber-500/40 text-amber-300";
      default:
        return "bg-blue-950/80 border-blue-500/40 text-blue-300";
    }
  };

  const fetchTenants = async () => {
    try {
      const response = await api.get('/tenant');
      setTenants(response.data.data);
    } catch (error) {
      console.error("Error fetching tenants:", error);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  return (
    <div className="min-h-screen bg-[#06090e] text-slate-300 p-8 font-sans select-none relative">
      {/* PAGE HEADER */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-blue-500" /> Tenant Management
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-md shadow-blue-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Create tenant
          </button>
        </div>
      </div>

      {/* TENANTS TABLE */}
      <div className="bg-[#0b0f17] border border-slate-800/80 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Total Tenants: {tenants.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-400">
            <thead className="bg-[#0e1420] text-slate-400 font-semibold border-b border-slate-800/80">
              <tr>
                <th className="p-3.5">Tenant</th>
                <th className="p-3.5">Users</th>
                <th className="p-3.5">pEdge</th>
                <th className="p-3.5">pRoutes</th>
                <th className="p-3.5">Expired Date</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {tenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-slate-500">
                    Belum ada tenant terdaftar.
                  </td>
                </tr>
              ) : (
                tenants.map((item) => (
                  <tr key={item.id} className="hover:bg-[#101622]/50 transition-colors">
                    {/* TENANT INFO */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 rounded-md border flex items-center justify-center font-bold text-xs shrink-0 ${getBadgeStyle(
                            item.accent
                          )}`}
                        >
                          {item.code}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">{item.name}</span>
                            {item.isSuperAdmin && (
                              <span className="bg-purple-950/60 border border-purple-700/50 text-purple-300 text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold uppercase">
                                SUPER-ADMIN
                              </span>
                            )}
                            {item.isActive && (
                              <span className="bg-blue-950/60 border border-blue-700/50 text-blue-300 text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold uppercase">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-xs">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* METRICS COLUMNS */}
                    <td className="p-3.5 font-mono text-slate-200">{item.users}</td>
                    <td className="p-3.5 font-mono text-slate-200">{item.instances}</td>
                    <td className="p-3.5 font-mono text-slate-200">{item.routes}</td>
                    <td className="p-3.5 font-mono text-slate-200">{item.expiredAt || "—"}</td>

                    {/* ACTIONS */}
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setLicenseTenant(item)}
                          className="p-1 hover:text-amber-400 text-slate-500 transition-colors"
                          title="License Entitlement"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1 hover:text-blue-400 text-slate-500 transition-colors"
                          title="Edit Tenant"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTenant(item.id)}
                          className="p-1 hover:text-rose-400 text-slate-500 transition-colors"
                          title="Delete Tenant"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CREATE / EDIT TENANT MODAL */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#0b1017] border border-slate-800/90 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            {/* MODAL HEADER */}
            <div className="p-5 flex items-start justify-between border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#111823] border border-slate-700/50 flex items-center justify-center text-slate-300">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    {modalMode === "create" ? "Create tenant" : "Edit tenant"}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {modalMode === "create"
                      ? "A new isolated workspace with its own routes, quotas and members"
                      : formData.slug}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* MODAL FORM BODY */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* ROW 1: Tenant name & Code */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-[11px] font-medium text-slate-300">Tenant name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Prima Smelting"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#111722] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-300">Code</label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    placeholder="PR"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    className="w-full bg-[#111722] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 uppercase focus:outline-none focus:border-blue-500 font-mono"
                  />
                  <span className="text-[9px] text-slate-500 block">2 letters</span>
                </div>
              </div>

              {/* ROW 2: PIC & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-300">PIC</label>
                  <input
                    type="text"
                    placeholder="Person in charge name"
                    value={formData.pic}
                    onChange={(e) => setFormData({ ...formData, pic: e.target.value })}
                    className="w-full bg-[#111722] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-300">Status</label>
                  <div className="relative">
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full bg-[#111722] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 appearance-none focus:outline-none focus:border-blue-500 pr-8"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* ROW 3: Email & Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-300">Email</label>
                  <input
                    type="email"
                    placeholder="email@domain.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-[#111722] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-300">Phone</label>
                  <input
                    type="text"
                    placeholder="+62 xxx"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-[#111722] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* ROW 4: Address */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-300">Address</label>
                <textarea
                  rows={2}
                  placeholder="Alamat lengkap"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-[#111722] border border-slate-800 rounded-lg p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              {/* ROW 5: Description */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-medium text-slate-300">Description</label>
                  <span className="text-[9px] text-slate-500 font-mono">OPTIONAL</span>
                </div>
                <textarea
                  rows={2}
                  placeholder="Short customer description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-[#111722] border border-slate-800 rounded-lg p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              {/* FOOTER BUTTONS */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800/60">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition-all"
                >
                  {modalMode === "create" ? "Create tenant" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LICENSE ENTITLEMENT MODAL */}
      {/* ========================================================================= */}
      {licenseTenant && (
        <LicenseEntitlementModal tenant={licenseTenant} onClose={() => setLicenseTenant(null)} />
      )}
    </div>
  );
}