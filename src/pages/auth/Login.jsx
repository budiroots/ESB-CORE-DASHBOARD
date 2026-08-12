import React, { useEffect, useRef, useState } from "react";
import api from "../../api/axios"; // 🔥 pakai axios instance
import logo from "../../assets/logo.png";

// Palet warna (di-flatten dari tema oklch versi CSS ke hex/rgba supaya
// gampang dipakai di inline style object tanpa custom property CSS).
const COLORS = {
  text: "#f2f4f6",
  muted: "#aab6c0",
  mutedB: "#7c8a96",
  line: "#33414d",
  lineSoft: "#44525f",
  panel: "rgba(33,43,52,0.78)",
  panelSoft: "#2a3540",
  bgInput: "rgba(23,31,38,0.7)",
  bgInputFocus: "rgba(23,31,38,0.85)",
  accent: "#5b9bef",
  accent2: "#79b3ec",
  accentSoft: "rgba(91,155,239,0.18)",
  error: "#e0604f",
  errorBg: "rgba(224,96,79,0.14)",
  errorBorder: "rgba(224,96,79,0.4)",
};

const FIELD_H = 44;

const Login = () => {
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Inline style tidak punya :hover/:focus, jadi state-kan manual.
  const [emailFocused, setEmailFocused] = useState(false);
  const [pinFocused, setPinFocused] = useState(false);
  const [revealHover, setRevealHover] = useState(false);
  const [submitHover, setSubmitHover] = useState(false);
  const [forgotHover, setForgotHover] = useState(false);

  const sectionRef = useRef(null);
  const canvasRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/login", {
        email: email,
        pin: pin,
      });

      if (res.data.code === 200) {
        // 🔥 simpan token
        localStorage.setItem("accessToken", res.data.accessToken);
        localStorage.setItem("userId", res.data.id);

        // redirect
        window.location.href = "/dashboard";
      } else {
        setError("Opps! Login gagal, periksa kembali akun Anda.");
      }
    } catch (err) {
      console.error(err);

      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Email atau PIN yang Anda masukkan salah.");
      }
    } finally {
      setLoading(false);
    }
  };

  // --- Background: live integration mesh (sources -> routes -> topics -> sinks) ---
  useEffect(() => {
    const section = sectionRef.current;
    const cvs = canvasRef.current;
    if (!section || !cvs) return;

    const ctx = cvs.getContext("2d");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const C = {
      acc: COLORS.accent,
      acc2: COLORS.accent2,
      dlq: COLORS.accent,
      line: COLORS.lineSoft,
    };

    const NODES = [
      { id: "fms", c: 0, y: 0.2, kind: "src" },
      { id: "mqtt", c: 0, y: 0.42, kind: "src" },
      { id: "wb", c: 0, y: 0.64, kind: "src" },
      { id: "fuel", c: 0, y: 0.84, kind: "src" },
      { id: "r1", c: 1, y: 0.26, kind: "route" },
      { id: "r2", c: 1, y: 0.52, kind: "route" },
      { id: "r3", c: 1, y: 0.78, kind: "route" },
      { id: "t1", c: 2, y: 0.2, kind: "topic" },
      { id: "t2", c: 2, y: 0.42, kind: "topic" },
      { id: "t3", c: 2, y: 0.64, kind: "topic" },
      { id: "dlq", c: 2, y: 0.88, kind: "dlq" },
      { id: "sap", c: 3, y: 0.3, kind: "sink" },
      { id: "idoc", c: 3, y: 0.54, kind: "sink" },
      { id: "lake", c: 3, y: 0.76, kind: "sink" },
    ];
    const EDGES = [
      ["fms", "r1"], ["mqtt", "r2"], ["wb", "r3"], ["fuel", "r3"],
      ["r1", "t1"], ["r2", "t2"], ["r3", "t3"], ["r2", "t1"],
      ["t1", "sap"], ["t2", "lake"], ["t3", "idoc"], ["t1", "idoc"],
      ["r3", "dlq"], ["dlq", "lake"],
    ];
    const COLX = [0.075, 0.3, 0.565, 0.865];
    const byId = Object.fromEntries(NODES.map((n) => [n.id, n]));

    let w, h, dpr;
    let packets = [];
    let t0 = performance.now();
    let rafId;
    const mouse = { x: -9e3, y: -9e3 };

    function layout() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = cvs.clientWidth;
      h = cvs.clientHeight;
      cvs.width = w * dpr;
      cvs.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      NODES.forEach((n) => {
        n.x = COLX[n.c] * w;
        n.py = n.y * h;
      });
    }

    function edgeColor(e) {
      const a = byId[e[0]], b = byId[e[1]];
      if (b.kind === "dlq" || a.kind === "dlq") return C.dlq;
      if (b.kind === "topic" || a.kind === "topic") return C.acc2;
      return C.acc;
    }

    function spawn() {
      if (packets.length > 90) return;
      const i = Math.floor(Math.random() * EDGES.length);
      const e = EDGES[i];
      const dlq = byId[e[0]].kind === "dlq" || byId[e[1]].kind === "dlq";
      if (dlq && Math.random() > 0.18) return;
      packets.push({
        e: i,
        t: 0,
        v: 0.0022 + Math.random() * 0.0035,
        col: edgeColor(e),
        r: dlq ? 2.4 : 1.9,
      });
    }

    function draw(now) {
      const dt = Math.min(40, now - t0);
      t0 = now;
      ctx.clearRect(0, 0, w, h);

      for (const e of EDGES) {
        const a = byId[e[0]], b = byId[e[1]];
        const near = Math.min(
          Math.hypot(mouse.x - a.x, mouse.y - a.py),
          Math.hypot(mouse.x - b.x, mouse.y - b.py)
        );
        const hot = Math.max(0, 1 - near / 170);
        ctx.strokeStyle = edgeColor(e);
        ctx.globalAlpha = 0.1 + hot * 0.38;
        ctx.lineWidth = 1 + hot * 0.8;
        ctx.beginPath();
        ctx.moveTo(a.x, a.py);
        ctx.bezierCurveTo((a.x + b.x) / 2, a.py, (a.x + b.x) / 2, b.py, b.x, b.py);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      for (const p of packets) {
        p.t += p.v * (dt / 16.7);
        const e = EDGES[p.e], a = byId[e[0]], b = byId[e[1]], t = p.t;
        const mx = (a.x + b.x) / 2, u = 1 - t;
        const x = u * u * u * a.x + 3 * u * u * t * mx + 3 * u * t * t * mx + t * t * t * b.x;
        const y = u * u * u * a.py + 3 * u * u * t * a.py + 3 * u * t * t * b.py + t * t * t * b.py;
        ctx.globalAlpha = 0.85 * Math.sin(Math.PI * Math.min(1, t));
        ctx.fillStyle = p.col;
        ctx.beginPath();
        ctx.arc(x, y, p.r, 0, 6.284);
        ctx.fill();
        ctx.globalAlpha *= 0.18;
        ctx.beginPath();
        ctx.arc(x, y, p.r * 3.4, 0, 6.284);
        ctx.fill();
      }
      packets = packets.filter((p) => p.t < 1);
      ctx.globalAlpha = 1;

      for (const n of NODES) {
        const col =
          n.kind === "dlq" ? C.dlq : n.kind === "topic" ? C.acc2 : n.kind === "route" ? C.acc : C.line;
        const hot = Math.max(0, 1 - Math.hypot(mouse.x - n.x, mouse.y - n.py) / 150);
        if (n.kind === "route") {
          ctx.globalAlpha = 0.5 + hot * 0.5;
          ctx.strokeStyle = col;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.rect(n.x - 5, n.py - 5, 10, 10);
          ctx.stroke();
          ctx.globalAlpha = 0.16 + hot * 0.3;
          ctx.fillStyle = col;
          ctx.fill();
        } else if (n.kind === "topic" || n.kind === "dlq") {
          ctx.globalAlpha = 0.55 + hot * 0.45;
          ctx.fillStyle = col;
          for (let i = 0; i < 3; i++) ctx.fillRect(n.x - 6 + i * 5, n.py - 5 + i, 3, 10 - i * 2);
        } else {
          ctx.globalAlpha = 0.45 + hot * 0.5;
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(n.x, n.py, 3, 0, 6.284);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      if (!reduce) {
        if (Math.random() < 0.5) spawn();
        rafId = requestAnimationFrame(draw);
      }
    }

    layout();
    if (reduce) {
      rafId = requestAnimationFrame(draw);
    } else {
      for (let i = 0; i < 25; i++) spawn();
      rafId = requestAnimationFrame(draw);
    }

    const handlePointerMove = (e) => {
      const r = cvs.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    const handlePointerLeave = () => {
      mouse.x = mouse.y = -9e3;
    };

    section.addEventListener("pointermove", handlePointerMove);
    section.addEventListener("pointerleave", handlePointerLeave);
    window.addEventListener("resize", layout);

    return () => {
      cancelAnimationFrame(rafId);
      section.removeEventListener("pointermove", handlePointerMove);
      section.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("resize", layout);
    };
  }, []);

  return (
    <section ref={sectionRef} style={styles.screen}>
      <div style={styles.grid} aria-hidden="true" />
      <canvas ref={canvasRef} style={styles.mesh} aria-hidden="true" />
      <div style={styles.veil} aria-hidden="true" />

      <form onSubmit={handleSubmit} noValidate autoComplete="on" style={styles.card}>
        <div style={styles.brand}>
          <div style={styles.logoRow}>
              <img src={logo} alt="Logo" style={{ height: "36px", width: "auto", maxWidth: "100%", objectFit: "contain" }} />
          </div>
          <h1 style={styles.title}>Log in to your account</h1>
          <p style={styles.subtitle}>
            Silahkan masuk ke <b style={styles.subtitleBold}>Dashboard Monitoring</b> Anda.
          </p>
        </div>

        {error && (
          <div style={styles.errorBox} role="alert">
            ⚠ {error}
          </div>
        )}

        <div style={styles.fields}>
          <label style={styles.field}>
            <span style={styles.fieldLabel}>Alamat Email</span>
            <span style={styles.inputWrap}>
              <svg viewBox="0 0 24 24" fill="none" stroke={COLORS.mutedB} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={styles.inputIcon}>
                <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
                <path d="m3 7 9 6 9-6" />
              </svg>
              <input
                id="email"
                type="email"
                name="email"
                autoComplete="username"
                placeholder="nama@perusahaan.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                style={{ ...styles.input, ...(emailFocused ? styles.inputFocused : {}) }}
              />
            </span>
          </label>

          <label style={styles.field}>
            {/* <span style={styles.fieldLabelRow}>
              <span style={styles.fieldLabel}>Password</span>
              <a
                href="#forgot"
                tabIndex={-1}
                onClick={(e) => e.preventDefault()}
                onMouseEnter={() => setForgotHover(true)}
                onMouseLeave={() => setForgotHover(false)}
                style={{ ...styles.forgotLink, ...(forgotHover ? styles.forgotLinkHover : {}) }}
              >
                Forgot?
              </a>
            </span> */}
            <span style={styles.inputWrap}>
              <svg viewBox="0 0 24 24" fill="none" stroke={COLORS.mutedB} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={styles.inputIcon}>
                <rect x="4" y="10.5" width="16" height="10.5" rx="2.5" />
                <path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" />
              </svg>
              <input
                id="pw"
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                placeholder="••••••••••"
                required
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                onFocus={() => setPinFocused(true)}
                onBlur={() => setPinFocused(false)}
                style={{
                  ...styles.input,
                  ...styles.inputWithReveal,
                  ...(pinFocused ? styles.inputFocused : {}),
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                onMouseEnter={() => setRevealHover(true)}
                onMouseLeave={() => setRevealHover(false)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                style={{ ...styles.reveal, ...(revealHover ? styles.revealHover : {}) }}
              >
                {showPassword ? "HIDE" : "SHOW"}
              </button>
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          onMouseEnter={() => setSubmitHover(true)}
          onMouseLeave={() => setSubmitHover(false)}
          style={{
            ...styles.submit,
            ...(loading ? styles.submitDisabled : submitHover ? styles.submitHover : {}),
          }}
        >
          {loading ? "Memproses..." : "Log in"}
          {!loading && (
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={styles.submitIcon}>
              <path d="M5 12h13" />
              <path d="m12.5 6 6 6-6 6" />
            </svg>
          )}
        </button>

        <p style={styles.footer}>
          &copy; 2026 PrimaSphere. <br /> All rights reserved.
        </p>
      </form>
    </section>
  );
};

// ============ INLINE STYLE OBJECTS (pengganti Login.css) ============
const styles = {
  screen: {
    position: "relative",
    overflow: "hidden",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
    color: COLORS.text,
    WebkitFontSmoothing: "antialiased",
    backgroundImage:
      "radial-gradient(120% 90% at 50% 12%, #24344f 0%, #171f26 55%, #10161b 100%)",
    boxSizing: "border-box",
  },
  grid: {
    position: "absolute",
    inset: 0,
    zIndex: 0,
    pointerEvents: "none",
    opacity: 0.5,
    backgroundImage: `radial-gradient(${COLORS.line} 1px, transparent 1px)`,
    backgroundSize: "22px 22px",
  },
  mesh: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    zIndex: 1,
  },
  veil: {
    position: "absolute",
    inset: 0,
    zIndex: 2,
    pointerEvents: "none",
    backgroundImage:
      "radial-gradient(closest-side at 50% 50%, rgba(18,23,28,0.92) 0%, rgba(18,23,28,0.72) 42%, rgba(18,23,28,0) 74%)",
  },

  card: {
    position: "relative",
    zIndex: 10,
    width: "min(392px, 100%)",
    boxSizing: "border-box",
    borderRadius: 16,
    padding: "28px 28px 24px",
    display: "flex",
    flexDirection: "column",
    gap: 16,
    backgroundColor: COLORS.panel,
    backdropFilter: "blur(16px) saturate(140%)",
    WebkitBackdropFilter: "blur(16px) saturate(140%)",
    border: `1px solid ${COLORS.line}`,
    boxShadow: "0 40px 90px -50px #000, 0 0 0 1px rgba(91,155,239,0.06)",
  },

  brand: { display: "flex", flexDirection: "column", gap: 12 },
  logoRow: { display: "flex", alignItems: "center", gap: 8 },
  logoIcon: { width: 20, height: 20, flexShrink: 0 },
  logoText: {
    color: COLORS.accent2,
    fontSize: 12.5,
    fontWeight: 600,
    letterSpacing: "0.01em",
  },
  title: { fontSize: 20, fontWeight: 600, letterSpacing: "-0.01em", margin: 0 },
  subtitle: { fontSize: 12.5, lineHeight: 1.5, color: COLORS.muted, margin: 0 },
  subtitleBold: { color: COLORS.text, fontWeight: 500 },

  errorBox: {
    fontSize: 12.5,
    lineHeight: 1.5,
    color: COLORS.error,
    backgroundColor: COLORS.errorBg,
    border: `1px solid ${COLORS.errorBorder}`,
    borderRadius: 9,
    padding: "10px 12px",
  },

  fields: { display: "flex", flexDirection: "column", gap: 12 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  fieldLabelRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fieldLabel: {
    fontSize: 11.5,
    fontWeight: 500,
    color: COLORS.muted,
    letterSpacing: "0.02em",
  },
  forgotLink: {
    fontSize: 11.5,
    fontWeight: 500,
    color: COLORS.accent2,
    textDecoration: "none",
  },
  forgotLinkHover: {
    color: COLORS.accent,
    textDecoration: "underline",
  },

  inputWrap: { position: "relative", display: "flex", alignItems: "center" },
  inputIcon: {
    position: "absolute",
    left: 12,
    width: 15,
    height: 15,
    color: COLORS.mutedB,
    pointerEvents: "none",
  },
  input: {
    width: "100%",
    height: FIELD_H,
    boxSizing: "border-box",
    border: `1px solid ${COLORS.line}`,
    borderRadius: 9,
    padding: "0 12px 0 34px",
    font: '400 14px/1 "IBM Plex Sans", system-ui, sans-serif',
    color: COLORS.text,
    backgroundColor: COLORS.bgInput,
    outline: "none",
    transition: "border-color .16s, box-shadow .16s, background .16s",
  },
  inputFocused: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.bgInputFocus,
    boxShadow: `0 0 0 3px ${COLORS.accentSoft}`,
  },
  inputWithReveal: { paddingRight: 56 },

  reveal: {
    position: "absolute",
    right: 6,
    height: 32,
    padding: "0 8px",
    border: 0,
    background: "transparent",
    color: COLORS.mutedB,
    font: '500 11px/1 "JetBrains Mono", monospace',
    cursor: "pointer",
    borderRadius: 6,
  },
  revealHover: {
    background: COLORS.panelSoft,
    color: COLORS.muted,
  },

  submit: {
    marginTop: 2,
    height: FIELD_H,
    border: 0,
    borderRadius: 9,
    cursor: "pointer",
    color: "#fff",
    font: '600 14px/1 "IBM Plex Sans", system-ui, sans-serif',
    backgroundImage: "linear-gradient(180deg, rgb(34,127,207), #1c48cf)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    transition: "filter .16s, transform .1s",
  },
  submitHover: { filter: "brightness(1.07)" },
  submitDisabled: { cursor: "not-allowed", opacity: 0.7 },
  submitIcon: { width: 15, height: 15 },

  footer: {
    textAlign: "center",
    fontSize: 11,
    lineHeight: 1.5,
    color: COLORS.mutedB,
    marginTop: 4,
  },
};

export default Login;