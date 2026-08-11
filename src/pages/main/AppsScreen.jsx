import React, { useMemo, useState } from "react";
import {
  Database,
  Radio,
  Globe,
  Plus,
  X,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  Plug
} from "lucide-react";

/**
 * "Apps & Connections" — registry koneksi reusable (Database / Message Broker / REST API).
 * Setiap koneksi yang dibuat di sini bisa direferensikan lewat `refId`-nya nanti
 * di Visual Route Builder (YAML), jadi kredensial cukup diisi sekali lalu dipakai berulang.
 *
 * Masih pakai data dummy (local state) — belum terhubung ke endpoint backend manapun.
 */

// --- KATALOG TIPE KONEKSI ---
const CONNECTION_TYPES = {
  database: {
    label: "Database",
    icon: Database,
    color: "blue",
    desc: "MongoDB, PostgreSQL, MSSQL, MySQL"
  },
  message: {
    label: "Message Broker",
    icon: Radio,
    color: "purple",
    desc: "Apache Kafka"
  },
  api: {
    label: "REST API",
    icon: Globe,
    color: "emerald",
    desc: "Generic HTTP/REST endpoint"
  }
};

// --- KATALOG ENGINE PER TIPE ---
const DB_ENGINES = {
  mongodb: { label: "MongoDB", letter: "M", color: "emerald", defaultPort: "27017" },
  postgresql: { label: "PostgreSQL", letter: "Pg", color: "sky", defaultPort: "5432" },
  mssql: { label: "MS SQL Server", letter: "S", color: "rose", defaultPort: "1433" },
  mysql: { label: "MySQL", letter: "My", color: "amber", defaultPort: "3306" }
};

const ENGINE_BY_TYPE = {
  database: DB_ENGINES,
  message: { kafka: { label: "Apache Kafka", letter: "K", color: "purple" } },
  api: { rest: { label: "REST API", letter: "R", color: "cyan" } }
};

const COLOR_STYLES = {
  emerald: "bg-emerald-500/15 text-emerald-400 border-emerald-800/40",
  sky: "bg-sky-500/15 text-sky-400 border-sky-800/40",
  rose: "bg-rose-500/15 text-rose-400 border-rose-800/40",
  amber: "bg-amber-500/15 text-amber-400 border-amber-800/40",
  purple: "bg-purple-500/15 text-purple-400 border-purple-800/40",
  cyan: "bg-cyan-500/15 text-cyan-400 border-cyan-800/40"
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "database", label: "Database" },
  { id: "message", label: "Message Broker" },
  { id: "api", label: "REST API" }
];

const INITIAL_FORM = {
  id: null,
  name: "",
  type: "database",
  engine: "mongodb",
  desc: "",
  // database fields
  host: "",
  port: DB_ENGINES.mongodb.defaultPort,
  database: "",
  username: "",
  password: "",
  ssl: false,
  // message (kafka) fields
  brokers: "",
  securityProtocol: "PLAINTEXT",
  saslMechanism: "PLAIN",
  clientId: "",
  // api fields
  baseUrl: "",
  authType: "none",
  token: "",
  apiKeyHeader: "X-API-Key",
  apiKeyValue: ""
};

// --- HELPERS ---
function slugify(str) {
  return (
    str
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "connection"
  );
}

function buildRefId(type, engine, name) {
  return `conn.${engine}.${slugify(name)}`;
}

function extractConfig(formData) {
  if (formData.type === "database") {
    return {
      host: formData.host,
      port: formData.port,
      database: formData.database,
      username: formData.username,
      password: formData.password,
      ssl: formData.ssl
    };
  }
  if (formData.type === "message") {
    return {
      brokers: formData.brokers,
      securityProtocol: formData.securityProtocol,
      saslMechanism: formData.saslMechanism,
      username: formData.username,
      password: formData.password,
      clientId: formData.clientId
    };
  }
  return {
    baseUrl: formData.baseUrl,
    authType: formData.authType,
    username: formData.username,
    password: formData.password,
    token: formData.token,
    apiKeyHeader: formData.apiKeyHeader,
    apiKeyValue: formData.apiKeyValue
  };
}

function getTargetLabel(conn) {
  if (conn.type === "database") return `${conn.config.host}:${conn.config.port}/${conn.config.database}`;
  if (conn.type === "message") return conn.config.brokers;
  return conn.config.baseUrl;
}

// --- DUMMY SEED DATA ---
const SEED_CONNECTIONS = [
  {
    id: "conn-1",
    name: "Orders MongoDB",
    type: "database",
    engine: "mongodb",
    desc: "Primary orders read-replica dipakai route order-sync.",
    status: "connected",
    config: {
      host: "10.20.4.12",
      port: "27017",
      database: "orders_prod",
      username: "svc_orders",
      password: "P@ssw0rd_Dummy1",
      ssl: true
    }
  },
  {
    id: "conn-2",
    name: "Analytics PostgreSQL",
    type: "database",
    engine: "postgresql",
    desc: "Warehouse sink untuk ETL malam hari.",
    status: "untested",
    config: {
      host: "10.20.4.30",
      port: "5432",
      database: "analytics_dw",
      username: "svc_analytics",
      password: "Dummy_Pg_Pw2",
      ssl: false
    }
  },
  {
    id: "conn-3",
    name: "Event Bus Kafka",
    type: "message",
    engine: "kafka",
    desc: "Central event bus untuk topic order & inventory.",
    status: "connected",
    config: {
      brokers: "kafka-1.internal:9092,kafka-2.internal:9092",
      securityProtocol: "SASL_SSL",
      saslMechanism: "SCRAM-SHA-512",
      username: "svc_kafka",
      password: "Dummy_Kafka_Pw3",
      clientId: "pedge-integration"
    }
  },
  {
    id: "conn-4",
    name: "Partner Billing API",
    type: "api",
    engine: "rest",
    desc: "Integrasi REST billing pihak ketiga.",
    status: "failed",
    config: {
      baseUrl: "https://api.partner-billing.com/v1",
      authType: "bearer",
      username: "",
      password: "",
      token: "dummy_bearer_token_abc123",
      apiKeyHeader: "X-API-Key",
      apiKeyValue: ""
    }
  }
].map((c) => ({ ...c, refId: buildRefId(c.type, c.engine, c.name) }));

export default function AppsScreen() {
  const [connections, setConnections] = useState(SEED_CONNECTIONS);
  const [filterType, setFilterType] = useState("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [showSecret, setShowSecret] = useState(false);

  const [testingId, setTestingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const filtered = useMemo(
    () => (filterType === "all" ? connections : connections.filter((c) => c.type === filterType)),
    [connections, filterType]
  );

  const counts = useMemo(
    () => ({
      all: connections.length,
      database: connections.filter((c) => c.type === "database").length,
      message: connections.filter((c) => c.type === "message").length,
      api: connections.filter((c) => c.type === "api").length
    }),
    [connections]
  );

  // --- MODAL HANDLERS ---
  const openAddModal = () => {
    setModalMode("add");
    setFormData(INITIAL_FORM);
    setShowSecret(false);
    setIsModalOpen(true);
  };

  const openEditModal = (conn) => {
    setModalMode("edit");
    setFormData({ ...INITIAL_FORM, ...conn, ...conn.config });
    setShowSecret(false);
    setIsModalOpen(true);
  };

  const handleTypeChange = (type) => {
    const firstEngine = Object.keys(ENGINE_BY_TYPE[type])[0];
    setFormData((prev) => ({
      ...prev,
      type,
      engine: firstEngine,
      port: type === "database" ? DB_ENGINES[firstEngine].defaultPort : prev.port
    }));
  };

  const handleEngineChange = (engine) => {
    setFormData((prev) => ({
      ...prev,
      engine,
      port: DB_ENGINES[engine]?.defaultPort || prev.port
    }));
  };

  // --- SAVE (local-only, belum ada endpoint backend) ---
  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Nama koneksi wajib diisi!");
      return;
    }

    const config = extractConfig(formData);
    const refId = buildRefId(formData.type, formData.engine, formData.name);

    if (modalMode === "add") {
      const newConn = {
        id: `conn-${Date.now()}`,
        name: formData.name,
        type: formData.type,
        engine: formData.engine,
        desc: formData.desc,
        refId,
        status: "untested",
        config
      };
      setConnections((prev) => [newConn, ...prev]);
    } else {
      setConnections((prev) =>
        prev.map((c) =>
          c.id === formData.id
            ? { ...c, name: formData.name, type: formData.type, engine: formData.engine, desc: formData.desc, refId, config }
            : c
        )
      );
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if (!window.confirm("Hapus koneksi ini? Route yang masih mereferensikan koneksi ini bisa gagal jalan.")) return;
    setConnections((prev) => prev.filter((c) => c.id !== id));
  };

  // --- TEST CONNECTION (dummy simulasi, belum ada endpoint backend) ---
  const handleTest = (id) => {
    setTestingId(id);
    setConnections((prev) => prev.map((c) => (c.id === id ? { ...c, status: "testing" } : c)));
    setTimeout(() => {
      const success = Math.random() > 0.2;
      setConnections((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: success ? "connected" : "failed" } : c))
      );
      setTestingId(null);
    }, 900);
  };

  const handleCopyRefId = (id, refId) => {
    navigator.clipboard.writeText(refId).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1500);
    });
  };

  return (
    <div className="w-full min-h-screen bg-[#06090e] text-slate-300 p-8 font-sans select-none space-y-6">
      {/* HEADER */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Apps & Connections</h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Simpan kredensial Database, Message Broker, dan REST API di sini — sekali dibuat, koneksi ini
            bisa dipakai berulang kali sebagai referensi di Visual Route Builder (YAML).
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-md shadow-blue-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Connection
        </button>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Connections" value={counts.all} hint="all types" icon={<Plug className="w-4 h-4 text-blue-400" />} />
        <StatCard label="Database" value={counts.database} hint="mongodb, postgres, mssql, mysql" icon={<Database className="w-4 h-4 text-blue-400" />} />
        <StatCard label="Message Broker" value={counts.message} hint="apache kafka" icon={<Radio className="w-4 h-4 text-purple-400" />} />
        <StatCard label="REST API" value={counts.api} hint="http endpoints" icon={<Globe className="w-4 h-4 text-emerald-400" />} />
      </div>

      {/* FILTER PILLS */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilterType(f.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              filterType === f.id
                ? "bg-blue-950/50 border-blue-600/60 text-blue-300"
                : "bg-[#0b0f17] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
            }`}
          >
            {f.label}
            <span className="ml-1.5 text-[10px] text-slate-500">{counts[f.id]}</span>
          </button>
        ))}
      </div>

      {/* LIST */}
      <div className="bg-[#0b0f17] border border-slate-800/80 rounded-xl overflow-hidden shadow-xl">
        <div className="grid grid-cols-12 gap-3 px-5 py-3 text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-800/60">
          <div className="col-span-3">Connection</div>
          <div className="col-span-2">Engine</div>
          <div className="col-span-3">Target</div>
          <div className="col-span-2">Reference ID</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            Belum ada koneksi untuk filter ini. Klik <span className="text-blue-400">Add Connection</span> untuk membuat baru.
          </div>
        ) : (
          filtered.map((conn) => (
            <ConnectionRow
              key={conn.id}
              conn={conn}
              onEdit={() => openEditModal(conn)}
              onDelete={() => handleDelete(conn.id)}
              onTest={() => handleTest(conn.id)}
              onCopy={() => handleCopyRefId(conn.id, conn.refId)}
              isTesting={testingId === conn.id}
              isCopied={copiedId === conn.id}
            />
          ))
        )}
      </div>

      {/* MODAL ADD / EDIT CONNECTION */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#0b1017] border border-slate-800/90 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 flex items-center justify-between border-b border-slate-800/80 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#111823] border border-slate-700/50 flex items-center justify-center text-blue-400">
                  <Plug className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    {modalMode === "add" ? "Add Connection" : "Edit Connection"}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Kredensial ini bisa direferensikan berulang kali di Visual Route Builder
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1">
              {/* NAME + REF ID PREVIEW */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-300">Connection Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Orders MongoDB"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#111722] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
                <p className="text-[10px] font-mono text-slate-600">
                  Reference ID:{" "}
                  <span className="text-blue-400">
                    {buildRefId(formData.type, formData.engine, formData.name || "connection")}
                  </span>
                </p>
              </div>

              {/* TYPE SELECTOR */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Connection Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(CONNECTION_TYPES).map(([key, meta]) => {
                    const Icon = meta.icon;
                    const isSelected = formData.type === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleTypeChange(key)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-center transition-all cursor-pointer ${
                          isSelected
                            ? "bg-blue-950/60 border-blue-500 text-blue-300 shadow-sm"
                            : "bg-[#111722] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-[11px] font-medium">{meta.label}</span>
                        <span className="text-[9px] text-slate-500">{meta.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ENGINE SELECTOR */}
              {formData.type === "database" ? (
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Database Engine
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(DB_ENGINES).map(([key, meta]) => {
                      const isSelected = formData.engine === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleEngineChange(key)}
                          className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-blue-950/60 border-blue-500 text-blue-300"
                              : "bg-[#111722] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                          }`}
                        >
                          <span
                            className={`w-6 h-6 rounded-md border flex items-center justify-center text-[10px] font-bold ${COLOR_STYLES[meta.color]}`}
                          >
                            {meta.letter}
                          </span>
                          <span className="text-[10px] font-medium">{meta.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-[#111722] border border-slate-800 rounded-lg px-3 py-2">
                  <span className="text-slate-500">Engine:</span>
                  <span className="text-slate-200 font-medium">
                    {ENGINE_BY_TYPE[formData.type][formData.engine].label}
                  </span>
                </div>
              )}

              {/* DYNAMIC FIELDS */}
              <div className="bg-[#0e1420] border border-slate-800/80 rounded-xl p-3.5 space-y-3">
                {formData.type === "database" && (
                  <>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1 col-span-2">
                        <label className="text-[11px] font-medium text-slate-300">Host *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 10.20.1.5"
                          value={formData.host}
                          onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                          className="w-full bg-[#090d14] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-slate-300">Port *</label>
                        <input
                          type="text"
                          required
                          value={formData.port}
                          onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                          className="w-full bg-[#090d14] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-slate-300">Database Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. orders_prod"
                        value={formData.database}
                        onChange={(e) => setFormData({ ...formData, database: e.target.value })}
                        className="w-full bg-[#090d14] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-slate-300">Username</label>
                        <input
                          type="text"
                          value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                          className="w-full bg-[#090d14] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-slate-300">Password</label>
                        <PasswordField
                          value={formData.password}
                          onChange={(v) => setFormData({ ...formData, password: v })}
                          show={showSecret}
                          onToggle={() => setShowSecret(!showSecret)}
                        />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.ssl}
                        onChange={(e) => setFormData({ ...formData, ssl: e.target.checked })}
                        className="accent-blue-600"
                      />
                      Use SSL/TLS connection
                    </label>
                  </>
                )}

                {formData.type === "message" && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-slate-300">Bootstrap Servers *</label>
                      <input
                        type="text"
                        required
                        placeholder="broker1:9092,broker2:9092"
                        value={formData.brokers}
                        onChange={(e) => setFormData({ ...formData, brokers: e.target.value })}
                        className="w-full bg-[#090d14] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-slate-300">Security Protocol</label>
                        <select
                          value={formData.securityProtocol}
                          onChange={(e) => setFormData({ ...formData, securityProtocol: e.target.value })}
                          className="w-full bg-[#090d14] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                        >
                          <option value="PLAINTEXT">PLAINTEXT</option>
                          <option value="SSL">SSL</option>
                          <option value="SASL_PLAINTEXT">SASL_PLAINTEXT</option>
                          <option value="SASL_SSL">SASL_SSL</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-slate-300">Client ID</label>
                        <input
                          type="text"
                          placeholder="pedge-client"
                          value={formData.clientId}
                          onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                          className="w-full bg-[#090d14] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                    {formData.securityProtocol.startsWith("SASL") && (
                      <>
                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-slate-300">SASL Mechanism</label>
                          <select
                            value={formData.saslMechanism}
                            onChange={(e) => setFormData({ ...formData, saslMechanism: e.target.value })}
                            className="w-full bg-[#090d14] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                          >
                            <option value="PLAIN">PLAIN</option>
                            <option value="SCRAM-SHA-256">SCRAM-SHA-256</option>
                            <option value="SCRAM-SHA-512">SCRAM-SHA-512</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[11px] font-medium text-slate-300">Username</label>
                            <input
                              type="text"
                              value={formData.username}
                              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                              className="w-full bg-[#090d14] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] font-medium text-slate-300">Password</label>
                            <PasswordField
                              value={formData.password}
                              onChange={(v) => setFormData({ ...formData, password: v })}
                              show={showSecret}
                              onToggle={() => setShowSecret(!showSecret)}
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}

                {formData.type === "api" && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-slate-300">Base URL *</label>
                      <input
                        type="text"
                        required
                        placeholder="https://api.partner.com/v1"
                        value={formData.baseUrl}
                        onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                        className="w-full bg-[#090d14] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-slate-300">Authentication Type</label>
                      <select
                        value={formData.authType}
                        onChange={(e) => setFormData({ ...formData, authType: e.target.value })}
                        className="w-full bg-[#090d14] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                      >
                        <option value="none">None</option>
                        <option value="basic">Basic Authentication</option>
                        <option value="bearer">Bearer Token</option>
                        <option value="apiKey">API Key</option>
                      </select>
                    </div>

                    {formData.authType === "basic" && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-slate-300">Username</label>
                          <input
                            type="text"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            className="w-full bg-[#090d14] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-slate-300">Password</label>
                          <PasswordField
                            value={formData.password}
                            onChange={(v) => setFormData({ ...formData, password: v })}
                            show={showSecret}
                            onToggle={() => setShowSecret(!showSecret)}
                          />
                        </div>
                      </div>
                    )}

                    {formData.authType === "bearer" && (
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-slate-300">Bearer Token</label>
                        <PasswordField
                          value={formData.token}
                          onChange={(v) => setFormData({ ...formData, token: v })}
                          show={showSecret}
                          onToggle={() => setShowSecret(!showSecret)}
                          placeholder="ey..."
                        />
                      </div>
                    )}

                    {formData.authType === "apiKey" && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-slate-300">Header Name</label>
                          <input
                            type="text"
                            value={formData.apiKeyHeader}
                            onChange={(e) => setFormData({ ...formData, apiKeyHeader: e.target.value })}
                            className="w-full bg-[#090d14] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-slate-300">Key Value</label>
                          <PasswordField
                            value={formData.apiKeyValue}
                            onChange={(v) => setFormData({ ...formData, apiKeyValue: v })}
                            show={showSecret}
                            onToggle={() => setShowSecret(!showSecret)}
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* DESCRIPTION */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-300">Description</label>
                <textarea
                  rows="2"
                  placeholder="Catatan penggunaan koneksi ini..."
                  value={formData.desc}
                  onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                  className="w-full bg-[#111722] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800/60 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                >
                  {modalMode === "add" ? "Save Connection" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- SUB-COMPONENTS ---

function StatCard({ label, value, hint, icon }) {
  return (
    <div className="bg-[#0b0f17] border border-slate-800/80 rounded-xl p-4 flex items-center justify-between shadow-lg">
      <div className="min-w-0">
        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">{label}</span>
        <span className="text-xl font-bold text-white tracking-tight mt-0.5 block">{value}</span>
        <span className="text-[10px] text-slate-500 font-mono mt-0.5 block truncate">{hint}</span>
      </div>
      <div className="w-10 h-10 rounded-xl bg-[#121927] border border-slate-700/50 flex items-center justify-center shrink-0">
        {icon}
      </div>
    </div>
  );
}

function PasswordField({ value, onChange, show, onToggle, placeholder }) {
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#090d14] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500 pr-8"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-2.5 top-1.5 text-slate-500 hover:text-slate-300 cursor-pointer"
      >
        {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

function ConnectionRow({ conn, onEdit, onDelete, onTest, onCopy, isTesting, isCopied }) {
  const typeMeta = CONNECTION_TYPES[conn.type];
  const engineMeta = ENGINE_BY_TYPE[conn.type][conn.engine];
  const target = getTargetLabel(conn);

  const statusStyles = {
    connected: { dot: "bg-emerald-500", text: "text-emerald-400", label: "Connected" },
    failed: { dot: "bg-rose-500", text: "text-rose-400", label: "Failed" },
    testing: { dot: "bg-amber-500 animate-pulse", text: "text-amber-400", label: "Testing..." },
    untested: { dot: "bg-slate-600", text: "text-slate-500", label: "Untested" }
  };
  const status = statusStyles[conn.status] || statusStyles.untested;

  return (
    <div className="grid grid-cols-12 gap-3 px-5 py-4 items-center border-b border-slate-800/40 last:border-b-0 hover:bg-slate-900/20 transition-colors">
      <div className="col-span-3 min-w-0">
        <p className="text-sm text-white font-medium truncate">{conn.name}</p>
        {conn.desc && <p className="text-[10.5px] text-slate-500 truncate mt-0.5">{conn.desc}</p>}
      </div>

      <div className="col-span-2 flex items-center gap-2 min-w-0">
        <div
          className={`w-7 h-7 rounded-lg border flex items-center justify-center text-[10px] font-bold shrink-0 ${COLOR_STYLES[engineMeta.color]}`}
        >
          {engineMeta.letter}
        </div>
        <div className="min-w-0">
          <span className="text-[11px] text-slate-300 block truncate">{engineMeta.label}</span>
          <span className="text-[9px] font-mono text-slate-600 uppercase">{typeMeta.label}</span>
        </div>
      </div>

      <div className="col-span-3 text-xs font-mono text-slate-400 truncate" title={target}>
        {target}
      </div>

      <div className="col-span-2 flex items-center gap-1.5 min-w-0">
        <code className="text-[10px] font-mono text-blue-300 bg-blue-950/30 border border-blue-800/40 px-1.5 py-0.5 rounded truncate">
          {conn.refId}
        </code>
        <button
          onClick={onCopy}
          title="Copy reference ID"
          className="shrink-0 text-slate-500 hover:text-white transition-colors cursor-pointer"
        >
          {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
        </button>
      </div>

      <div className="col-span-1 flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
        <span className={`text-[10px] font-mono ${status.text}`}>{status.label}</span>
      </div>

      <div className="col-span-1 flex items-center justify-end gap-1">
        <button
          onClick={onTest}
          disabled={isTesting}
          title="Test Connection"
          className="p-1.5 text-slate-400 hover:text-white rounded bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={onEdit}
          title="Edit"
          className="p-1.5 text-slate-400 hover:text-white rounded bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onDelete}
          title="Delete"
          className="p-1.5 text-rose-400 hover:text-rose-300 rounded bg-rose-950/30 hover:bg-rose-900/50 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
