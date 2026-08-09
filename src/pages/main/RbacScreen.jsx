import React, { useEffect, useState } from "react";
import {
  Shield,
  Plus,
  Pencil,
  Trash2,
  X,
  Lock,
  UserCheck,
  Check,
  CheckSquare,
  Square,
} from "lucide-react";
import api from "../../api/axios";

// --- STRUCTURE TREE PERMISSION ---
const PERMISSION_TREE = [
  { id: "dashboard", label: "Dashboard" },
  { id: "traffic", label: "Traffic Monitor" },
  { id: "sites", label: "Sites", actions: ["add", "edit", "delete"] },
  {
    id: "routes",
    label: "Routes",
    actions: ["add", "edit", "delete", "deploy", "test", "builder", "history"],
  },
  { id: "apps", label: "Apps & Connections", actions: ["add", "edit", "delete"] },
  { id: "settings", label: "Settings", actions: ["api", "security", "members"] },
  { id: "tenant", label: "Tenant Management", actions: ["add", "edit", "delete"] },
  { id: "auditlog", label: "Audit", actions: ["add", "edit", "delete"] },
];

export default function RbacManagementPage() {
  const [roles, setRoles] = useState([]);

  // --- STATE MODAL ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [roleName, setRoleName] = useState("");
  const [usersCount, setUsersCount] = useState(0);
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState({});

  // --- HANDLERS BULK CHECK / UNCHECK ALL ---
  const handleSelectAll = () => {
    const allPermissions = {};
    PERMISSION_TREE.forEach((item) => {
      const featureObj = { read: true };
      if (item.actions) {
        item.actions.forEach((act) => {
          featureObj[act] = true;
        });
      }
      allPermissions[item.id] = featureObj;
    });
    setSelectedPermissions(allPermissions);
  };

  const handleUncheckAll = () => {
    setSelectedPermissions({});
  };

  // --- HANDLERS INDIVIDUAL CHECKBOX ---
  const handleParentToggle = (featureId) => {
    setSelectedPermissions((prev) => {
      const current = prev[featureId] || {};
      const isCurrentlyRead = !!current.read;

      if (isCurrentlyRead) {
        const updated = { ...prev };
        delete updated[featureId];
        return updated;
      } else {
        return {
          ...prev,
          [featureId]: { read: true },
        };
      }
    });
  };

  const handleActionToggle = (featureId, action) => {
    setSelectedPermissions((prev) => {
      const current = prev[featureId] || {};
      if (!current.read) return prev;

      return {
        ...prev,
        [featureId]: {
          ...current,
          [action]: !current[action],
        },
      };
    });
  };

  const formatPermissionSummary = (permObj) => {
    if (!permObj) return "no access";
    const keys = Object.keys(permObj).filter((k) => permObj[k]?.read);
    if (keys.length === PERMISSION_TREE.length) return "all";
    if (keys.length === 0) return "no access";
    return keys.map((k) => `${k}.read`).join(" · ");
  };

  // --- MODAL ACTIONS ---
  const handleOpenCreateModal = () => {
    setModalMode("create");
    setRoleName("");
    setUsersCount(0);
    setSelectedPermissions({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (role) => {
    setModalMode("edit");
    setSelectedRoleId(role.id);
    setRoleName(role.name);
    setUsersCount(role.usersCount);
    setSelectedPermissions(role.permissions || {});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!roleName) {
      alert("Role Name wajib diisi!");
      return;
    }

    if (modalMode === "create") {
      const newRole = {
        name: roleName,
        permissions: selectedPermissions,
        usersCount: Number(usersCount) || 0,
      };
      await api.post("/rbac", newRole);
      fetchRole();
    } else {
      await api.put(`/rbac/${selectedRoleId}`, {
        name: roleName,
        permissions: selectedPermissions,
        usersCount: Number(usersCount) || 0,
      });
      fetchRole();
    }

    handleCloseModal();
  };

  const handleDeleteRole = async (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus role ini?")) {
      await api.delete(`/rbac/${id}`);
      fetchRole();
    }
  };

  // --- API FETCHERS ---
  const fetchRole = async () => {
    try {
      const response = await api.get("/rbac");
      setRoles(response.data.data);
    } catch (error) {
      console.error("Error fetching rbac:", error);
    }
  };

  useEffect(() => {
    fetchRole();
  }, []);

  return (
    <div className="min-h-screen bg-[#06090e] text-slate-300 p-8 font-sans select-none relative space-y-8">
      {/* HEADER PAGE */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            RBAC Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Role-based access control policies
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-md shadow-blue-600/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          New role
        </button>
      </div>

      {/* SECTION: ROLES (LIST VIEW) */}
      <div className="bg-[#0b0f17] border border-slate-800/80 rounded-xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Roles Management
          </h2>
          <span className="text-[10px] text-slate-500">
            {roles.length} roles
          </span>
        </div>

        {/* LIST HEADER */}
        <div className="hidden md:flex items-center gap-4 px-3 pb-2 mb-1 border-b border-slate-800/60 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          <span className="flex-1">Role</span>
          <span className="w-56">Permissions</span>
          <span className="w-20 text-right">Users</span>
          <span className="w-16 text-right">Actions</span>
        </div>

        <div className="divide-y divide-slate-800/50">
          {roles.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              Belum ada role.
            </div>
          ) : (
            roles.map((role) => (
              <div
                key={role.id}
                className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 py-3 px-3 hover:bg-[#0e1420] group transition-colors"
              >
                {/* Role name */}
                <div className="flex items-center gap-3 flex-1 overflow-hidden">
                  <div className="w-6 h-6 rounded-md bg-[#162032] border border-slate-700/50 flex items-center justify-center shrink-0">
                    <Shield className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <h3 className="text-xs font-semibold text-white truncate">
                    {role.name}
                  </h3>
                </div>

                {/* Permissions summary */}
                <p className="w-full md:w-56 text-[11px] font-mono text-slate-500 truncate">
                  {formatPermissionSummary(role.permissions)}
                </p>

                {/* Users count */}
                <span className="w-full md:w-20 text-[11px] text-slate-400 font-medium md:text-right">
                  {role.usersCount} users
                </span>

                {/* Actions */}
                <div className="w-full md:w-16 flex items-center gap-1 md:justify-end opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleOpenEditModal(role)}
                    className="p-1 hover:text-blue-400 text-slate-500 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteRole(role.id)}
                    className="p-1 hover:text-rose-400 text-slate-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL CREATE / EDIT ROLE */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#0b1017] border border-slate-800/90 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* MODAL HEADER */}
            <div className="p-5 flex items-start justify-between border-b border-slate-800/80 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#111823] border border-slate-700/50 flex items-center justify-center text-slate-300">
                  <Lock className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    {modalMode === "create" ? "Create new role" : "Edit role"}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Configure feature access and action permissions
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
            <form
              onSubmit={handleSubmit}
              className="p-5 space-y-5 overflow-y-auto custom-scrollbar flex-1"
            >
              {/* Role Name & Users Count */}
              <div className="grid grid-cols-1 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-[11px] font-medium text-slate-300">
                    Role Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Integration Engineer"
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    className="w-full bg-[#111722] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
                {/* <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-300">
                    Assigned Users
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      value={usersCount}
                      onChange={(e) => setUsersCount(e.target.value)}
                      className="w-full bg-[#111722] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                    />
                    <UserCheck className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5 pointer-events-none" />
                  </div>
                </div> */}
              </div>

              {/* PERMISSION HEADER WITH SELECT / UNCHECK ALL */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Permissions Scope
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="flex items-center gap-1 text-[11px] font-medium text-blue-400 hover:text-blue-300 hover:bg-blue-950/40 px-2 py-1 rounded transition-colors"
                    >
                      <CheckSquare className="w-3 h-3" />
                      Select All
                    </button>
                    <span className="text-slate-700">|</span>
                    <button
                      type="button"
                      onClick={handleUncheckAll}
                      className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-slate-300 hover:bg-slate-800/40 px-2 py-1 rounded transition-colors"
                    >
                      <Square className="w-3 h-3" />
                      Uncheck All
                    </button>
                  </div>
                </div>

                {/* PERMISSION CHECKBOX LIST */}
                <div className="bg-[#0e1420] border border-slate-800/80 rounded-xl p-3 divide-y divide-slate-800/50 space-y-2">
                  {PERMISSION_TREE.map((item) => {
                    const featurePerm = selectedPermissions[item.id] || {};
                    const isParentChecked = !!featurePerm.read;

                    return (
                      <div key={item.id} className="pt-2 first:pt-0">
                        {/* Parent Feature Checkbox */}
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2.5 cursor-pointer">
                            <div
                              onClick={() => handleParentToggle(item.id)}
                              className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                isParentChecked
                                  ? "bg-blue-600 border-blue-500 text-white"
                                  : "border-slate-700 bg-[#121824] hover:border-slate-500"
                              }`}
                            >
                              {isParentChecked && (
                                <Check className="w-3 h-3 stroke-[3]" />
                              )}
                            </div>
                            <span
                              className={`text-xs font-semibold ${
                                isParentChecked
                                  ? "text-slate-100"
                                  : "text-slate-400"
                              }`}
                            >
                              {item.label}
                            </span>
                          </label>

                          {isParentChecked && (
                            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/30">
                              monitor / read
                            </span>
                          )}
                        </div>

                        {/* Child Sub-actions Checkboxes */}
                        {item.actions && (
                          <div
                            className={`ml-6 mt-2 flex flex-wrap gap-2 transition-opacity ${
                              isParentChecked
                                ? "opacity-100"
                                : "opacity-40 pointer-events-none"
                            }`}
                          >
                            {item.actions.map((act) => {
                              const isChildChecked = !!featurePerm[act];
                              const isDeleteAction = act === "delete";

                              return (
                                <label
                                  key={act}
                                  onClick={() =>
                                    handleActionToggle(item.id, act)
                                  }
                                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-mono cursor-pointer transition-all ${
                                    isChildChecked
                                      ? isDeleteAction
                                        ? "bg-rose-950/60 border-rose-500/60 text-rose-300"
                                        : "bg-blue-950/60 border-blue-500/60 text-blue-300"
                                      : "bg-[#121824] border-slate-800 text-slate-500 hover:text-slate-300"
                                  }`}
                                >
                                  <div
                                    className={`w-3 h-3 rounded-[3px] border flex items-center justify-center ${
                                      isChildChecked
                                        ? isDeleteAction
                                          ? "bg-rose-600 border-rose-400 text-white"
                                          : "bg-blue-500 border-blue-400 text-white"
                                        : "border-slate-700"
                                    }`}
                                  >
                                    {isChildChecked && (
                                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                                    )}
                                  </div>
                                  <span>{act}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* FOOTER BUTTONS */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800/60 shrink-0">
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
                  {modalMode === "create" ? "Create Role" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}