import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Mail,
  User,
  Phone,
  Lock,
  Send,
  Building2,
  ShieldCheck
} from "lucide-react";
import api from "../../api/axios";

export default function MembersPage() {
  const [members, setMembers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);

  // State Modal Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create' | 'edit'
  const [selectedMemberId, setSelectedMemberId] = useState(null);

  // State Form Input
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    idRole: "",
    tenant: [],
    pin: "",
    telegramId: ""
  });

  // Fetch Semua Data Utama
  const fetchData = async () => {
    setLoading(true);
    try {
      await api.get("/rbac").then((res) => setRoles(res.data.data));
      await api.get("/tenant").then((res) => setTenants(res.data.data));
      await api.get("/user/members").then((res) => setMembers(res.data.data));
    } catch (err) {
      console.error("Gagal mengambil data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- HANDLER CHECKLIST TENANT ---
  const handleTenantCheck = (tenantId) => {
    setFormData((prev) => {
      const exists = prev.tenant.includes(tenantId);
      if (exists) {
        return { ...prev, tenant: prev.tenant.filter((id) => id !== tenantId) };
      } else {
        return { ...prev, tenant: [...prev.tenant, tenantId] };
      }
    });
  };

  // --- MODAL HANDLERS ---
  const handleOpenCreateModal = () => {
    setModalMode("create");
    setSelectedMemberId(null);
    setFormData({
      fullName: "",
      email: "",
      phone: "",
      idRole: roles.length > 0 ? roles[0].id : "",
      tenant: [],
      pin: "",
      telegramId: ""
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (member) => {
    setModalMode("edit");
    setSelectedMemberId(member.id);
    setFormData({
      fullName: member.fullName || "",
      email: member.email || "",
      phone: member.phone || "",
      idRole: member.idRole || "",
      tenant: member.tenant ? member.tenant.split(",").filter(Boolean) : [],
      pin: member.pin || "",
      telegramId: member.telegramId || ""
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      idRole: formData.idRole,
      tenant: formData.tenant.join(","),
      pin: formData.pin,
      telegramId: formData.telegramId
    };
    try {
      if(modalMode === "create") {
        await api.post("/user/members", payload);
        fetchData();
      }else{
        await api.put(`/user/members/${selectedMemberId}`, payload);
        fetchData();
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error submitting form:", err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus user ini?")) {
      try {
        await api.delete(`/user/members/${id}`);
        fetchData();
      } catch (err) {
        console.error("Gagal menghapus user:", err);
      }
    }
  };

  // Helper untuk mendapatkan Nama Role dari ID
  const getRoleName = (roleId) => {
    const role = roles.find((r) => r.id === roleId);
    return role ? role.name : "No Role";
  };

  return (
    <div className="min-h-screen bg-[#06090e] text-slate-300 p-8 font-sans select-none relative">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-blue-500" /> User Management
          </h1>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-md shadow-blue-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      {/* USER TABLE */}
      <div className="bg-[#0b0f17] border border-slate-800/80 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Total Users: {members.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-400">
            <thead className="bg-[#0e1420] text-slate-400 font-semibold border-b border-slate-800/80">
              <tr>
                <th className="p-3.5">User</th>
                <th className="p-3.5">Phone</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Assigned Tenants</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-slate-500">
                    Loading data...
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-slate-500">
                    Belum ada user terdaftar.
                  </td>
                </tr>
              ) : (
                members.map((m) => (
                  <tr key={m.id} className="hover:bg-[#101622]/50 transition-colors">
                    <td className="p-3.5">
                      <div className="font-semibold text-white">{m.fullName || "-"}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 text-slate-600" /> {m.email || "-"}
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-slate-300">{m.phone || "-"}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-1 rounded bg-blue-950/60 border border-blue-800/40 text-blue-400 text-[11px] font-medium">
                        {getRoleName(m.idRole)}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {m.tenant ? (
                          m.tenant.split(",").map((tId) => {
                            const tenantObj = tenants.find((t) => t.id === tId);
                            return (
                              <span
                                key={tId}
                                className="px-1.5 py-0.5 bg-slate-800 border border-slate-700/60 rounded text-[10px] text-slate-300"
                              >
                                {tenantObj ? tenantObj.name : tId}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-slate-600 font-italic">No Tenant</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(m)}
                          className="p-1 hover:text-blue-400 text-slate-500 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(m.id)}
                          className="p-1 hover:text-rose-400 text-slate-500 transition-colors"
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

      {/* MODAL FORM CREATE / EDIT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#0b1017] border border-slate-800/90 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* MODAL HEADER */}
            <div className="p-4 border-b border-slate-800/80 flex items-center justify-between shrink-0">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                {modalMode === "create" ? "Add New User" : "Edit User"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-300">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* MODAL BODY */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar text-xs">
              
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-slate-400 font-medium flex items-center gap-1">
                  <User className="w-3 h-3" /> Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full bg-[#111722] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  placeholder="e.g. John Doe"
                />
              </div>

              {/* Email & Password */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium flex items-center gap-1">
                    <Mail className="w-3 h-3" /> Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-[#111722] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                    placeholder="john@prima.id"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Password
                  </label>
                  <input
                    type="password"
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                    className="w-full bg-[#111722] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                    placeholder="Password"
                  />
                </div>
              </div>

              {/* Telegram ID & Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium flex items-center gap-1">
                    <Send className="w-3 h-3" /> Telegram ID
                  </label>
                  <input
                    type="text"
                    value={formData.telegramId}
                    onChange={(e) => setFormData({ ...formData, telegramId: e.target.value })}
                    className="w-full bg-[#111722] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                    placeholder="e.g. 123456789"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Phone
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-[#111722] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                    placeholder="+62812345678"
                  />
                </div>
              </div>

              {/* DROPDOWN ID ROLE (Pilih dari Endpoint RBAC) */}
              <div className="space-y-1">
                <label className="text-slate-400 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Assigned Role
                </label>
                <select
                  value={formData.idRole}
                  onChange={(e) => setFormData({ ...formData, idRole: e.target.value })}
                  className="w-full bg-[#111722] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Select Role --</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* CHECKLIST TENANT (Pilih dari List Tenants) */}
              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> Assigned Tenants (Checklist)
                </label>
                <div className="bg-[#0e1420] border border-slate-800 rounded-lg p-3 max-h-36 overflow-y-auto space-y-2 custom-scrollbar">
                  {tenants.length === 0 ? (
                    <span className="text-slate-600 italic">Tidak ada tenant tersedia</span>
                  ) : (
                    tenants.map((t) => {
                      const isChecked = formData.tenant.includes(t.id);
                      return (
                        <label
                          key={t.id}
                          onClick={() => handleTenantCheck(t.id)}
                          className="flex items-center justify-between p-2 rounded border border-slate-800/80 bg-[#121824] hover:border-slate-700 cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                isChecked
                                  ? "bg-blue-600 border-blue-500 text-white"
                                  : "border-slate-700 bg-[#0b1017]"
                              }`}
                            >
                              {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span className="text-slate-200 font-medium">{t.name}</span>
                          </div>
                          <span className="font-mono text-[10px] text-slate-500">{t.code}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {/* FOOTER */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800/60 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20"
                >
                  {modalMode === "create" ? "Save User" : "Update User"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}