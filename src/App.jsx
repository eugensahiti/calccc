import React, { useState, useEffect, useRef, useCallback } from "react";

// Star Field Component – full viewport, no boundaries
const STARS = Array.from({ length: 300 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  r: Math.random() * 2 + 0.3,
  op: Math.random() * 0.7 + 0.2,
  dur: Math.random() * 6 + 2,
  pink: Math.random() > 0.55,
}));

function StarField() {
  return (
    <svg style={{ position: "fixed", inset: 0, width: "100vw", height: "100dvh", pointerEvents: "none", zIndex: 0 }}>
      {STARS.map(s => (
        <circle key={s.id} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r}
          fill={s.pink ? "#ffb3d9" : "#ffffff"}
          style={{ opacity: s.op, animation: `twinkle ${s.dur}s ease-in-out infinite alternate` }} />
      ))}
    </svg>
  );
}

// Balanced sizes – big but clean, nothing gets cut
const BTN_SIZE = "clamp(56px, min(17vw, 95px), 95px)";
const BTN_FS = "clamp(20px, min(7.5vw, 34px), 34px)";
const GRID_GAP = "clamp(6px, min(2vw, 14px), 14px)";
const DISP_FS = "clamp(48px, min(22vw, 110px), 110px)";
const SIDE_PAD = "clamp(14px, min(4vw, 32px), 32px)";

function Btn({ label, onPress, variant = "num", wide = false }) {
  const [down, setDown] = useState(false);

  const bg = {
    num:    down ? "rgba(255,130,190,0.28)" : "rgba(255,255,255,0.10)",
    top:    down ? "rgba(255,180,220,0.55)" : "rgba(255,255,255,0.20)",
    accent: down ? "rgba(255,90,160,1)"     : "rgba(230,60,140,0.88)",
  }[variant];

  const color = variant === "top" ? (down ? "#fff" : "#100018") : "#fff";

  return (
    <button
      onPointerDown={() => { setDown(true); onPress?.(); }}
      onPointerUp={() => setDown(false)}
      onPointerLeave={() => setDown(false)}
      style={{
        background: bg,
        color,
        border: `1px solid ${variant === "accent" ? "rgba(255,130,180,0.4)" : "rgba(255,255,255,0.06)"}`,
        borderRadius: "50%",
        width: wide ? "100%" : BTN_SIZE,
        height: BTN_SIZE,
        minHeight: "52px",
        aspectRatio: wide ? "unset" : "1/1",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        fontSize: BTN_FS,
        fontWeight: "300",
        cursor: "pointer",
        transform: down ? "scale(0.92)" : "scale(1)",
        transition: "transform 0.07s ease, background 0.09s ease",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: variant === "accent" ? "0 4px 20px rgba(220,60,130,0.4)" : "none",
        userSelect: "none",
        WebkitUserSelect: "none",
        fontFamily: "inherit",
        padding: 0,
      }}>
      {label}
    </button>
  );
}

const WEB3FORMS_ACCESS_KEY = "47521ab4-d765-44e7-a06d-082f37c2dd15";

export default function App() {
  const [year, setYear]   = useState("");
  const [phase, setPhase] = useState("calc");
  const [shaking, setShaking] = useState(false);
  const [insta, setInsta] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const lastAccel = useRef({ x: 0, y: 0, z: 0 });
  const lastShake = useRef(0);
  const shakeTimeout = useRef(null);
  const phaseTimeout = useRef(null);
  const inputRef = useRef(null);

  const submitInstagramHandle = async (handle) => {
    if (!WEB3FORMS_ACCESS_KEY || WEB3FORMS_ACCESS_KEY === "YOUR_WEB3FORMS_ACCESS_KEY") {
      console.warn("Web3Forms key missing");
      return true;
    }
    try {
      const formData = new FormData();
      formData.append("access_key", WEB3FORMS_ACCESS_KEY);
      formData.append("subject", "✨ New Instagram lead from Verifikimi App");
      formData.append("instagram_handle", handle);
      formData.append("message", `Instagram username: @${handle}`);
      const response = await fetch("https://api.web3forms.com/submit", { method: "POST", body: formData });
      const result = await response.json();
      return result.success;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const verify = useCallback(async () => {
    if (phase !== "calc") return;
    if (!year || year.length < 4) { setError("Shkruani vitin e lindjes më parë"); return; }
    if (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function") {
      try { await DeviceMotionEvent.requestPermission(); } catch(e) {}
    }
    const age = new Date().getFullYear() - parseInt(year, 10);
    if (shakeTimeout.current) clearTimeout(shakeTimeout.current);
    if (phaseTimeout.current) clearTimeout(phaseTimeout.current);
    setShaking(true);
    setError("");
    shakeTimeout.current = setTimeout(() => setShaking(false), 550);
    phaseTimeout.current = setTimeout(() => setPhase(age < 18 ? "under" : "insta"), 250);
  }, [phase, year]);

  const handleInstaConfirm = async () => {
    const trimmed = insta.trim();
    if (!trimmed) return;
    setIsSubmitting(true);
    setSubmitError("");
    const sent = await submitInstagramHandle(trimmed);
    setIsSubmitting(false);
    if (sent) setPhase("success");
    else setSubmitError("Nuk mund të dërgohej. Provo përsëri.");
  };

  useEffect(() => {
    if (phase === "insta" && inputRef.current) setTimeout(() => inputRef.current.focus(), 150);
  }, [phase]);

  useEffect(() => {
    const THRESH = 20;
    const onMotion = e => {
      const a = e.accelerationIncludingGravity;
      if (!a) return;
      const dx = Math.abs((a.x || 0) - lastAccel.current.x);
      const dy = Math.abs((a.y || 0) - lastAccel.current.y);
      const dz = Math.abs((a.z || 0) - lastAccel.current.z);
      lastAccel.current = { x: a.x || 0, y: a.y || 0, z: a.z || 0 };
      const now = Date.now();
      if ((dx > THRESH || dy > THRESH || dz > THRESH) && now - lastShake.current > 1200) {
        lastShake.current = now;
        verify();
      }
    };
    window.addEventListener("devicemotion", onMotion);
    return () => window.removeEventListener("devicemotion", onMotion);
  }, [verify]);

  useEffect(() => {
    const onKey = e => { if (e.key === "Enter") verify(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [verify]);

  const digit = d => { if (year.length < 4) { setYear(p => p + d); setError(""); } };
  const reset = () => { setYear(""); setPhase("calc"); setInsta(""); setError(""); setSubmitError(""); setIsSubmitting(false); };

  return (
    <div style={{
      position: "relative",
      minHeight: "100dvh",
      width: "100%",
      display: "flex",
      flexDirection: "column",
      background: "linear-gradient(175deg,#1a0020 0%,#120018 35%,#1e0028 65%,#100015 100%)",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif",
      overflow: "hidden",
      animation: shaking ? "shake 0.55s ease" : "none",
    }}>
      <StarField />

      {/* Glow layers */}
      <div style={{ position: "fixed", top: "-20%", left: "-30%", width: "100%", height: "70%", background: "radial-gradient(ellipse, rgba(200,40,120,0.2) 0%, transparent 60%)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: "-10%", right: "-20%", width: "80%", height: "60%", background: "radial-gradient(ellipse, rgba(180,30,130,0.12) 0%, transparent 60%)", pointerEvents: "none", zIndex: 0 }} />

      <style>{`
        @keyframes twinkle { from{opacity:.15} to{opacity:1} }
        @keyframes shake { 0%,100%{transform:translateX(0)} 15%{transform:translateX(-10px)} 30%{transform:translateX(9px)} 50%{transform:translateX(-7px)} 70%{transform:translateX(6px)} 85%{transform:translateX(-3px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
        @keyframes orbit { from{transform:rotate(0deg) translateX(46px) rotate(0deg)} to{transform:rotate(360deg) translateX(46px) rotate(-360deg)} }
        * { box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
        input::placeholder{color:rgba(255,180,215,0.3)}
        input:focus{outline:none}
      `}</style>

      {phase === "calc" && (
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: `${SIDE_PAD} ${SIDE_PAD} max(env(safe-area-inset-bottom, 6px), 20px)`,
          zIndex: 1,
        }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", paddingBottom: "clamp(10px, min(4vw, 22px), 22px)" }}>
            <p style={{ color: "rgba(255,160,210,0.45)", fontSize: "clamp(11px, min(3.5vw, 16px), 16px)", letterSpacing: "0.14em", textTransform: "uppercase", textAlign: "right", marginBottom: "clamp(4px, min(1.5vw, 8px), 8px)", fontWeight: "400" }}>Viti i Lindjes</p>
            <div style={{
              textAlign: "right",
              fontSize: year ? DISP_FS : DISP_FS,
              fontWeight: "200",
              color: year ? "#fff" : "rgba(255,255,255,0.06)",
              letterSpacing: "clamp(-2px, min(-1.5vw, -6px), -6px)",
              lineHeight: "1",
              wordBreak: "break-all",
              minHeight: "1em",
            }}>{year || ""}</div>
            {error
              ? <p style={{ color: "rgba(255,110,140,0.9)", fontSize: "clamp(11px, min(3vw, 14px), 14px)", textAlign: "right", marginTop: "clamp(8px, min(3vw, 14px), 14px)" }}>{error}</p>
              : year.length === 4 && <p style={{ color: "rgba(255,150,200,0.4)", fontSize: "clamp(10px, min(2.5vw, 13px), 13px)", textAlign: "right", marginTop: "clamp(6px, min(2.5vw, 12px), 12px)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Dridheni telefonin ose shtypni butonin poshtë</p>
            }
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: GRID_GAP }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: GRID_GAP }}>
              <Btn label="AC" variant="top" onPress={() => { setYear(""); setError(""); }} />
              <Btn label="+/-" variant="top" onPress={() => {}} />
              <Btn label="%" variant="top" onPress={() => {}} />
              <Btn label="⌫" variant="accent" onPress={() => { setYear(p => p.slice(0,-1)); setError(""); }} />
            </div>
            {[["7","8","9"],["4","5","6"],["1","2","3"]].map((row, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: GRID_GAP }}>
                {row.map(d => <Btn key={d} label={d} onPress={() => digit(d)} />)}
                <div/>
              </div>
            ))}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: GRID_GAP, marginBottom: "clamp(4px, min(2vw, 12px), 12px)" }}>
              <Btn label="0" wide onPress={() => digit("0")} />
              <Btn label="·" onPress={() => {}} />
              <div/>
            </div>
            {year.length === 4 && (
              <button onClick={verify} style={{
                width: "100%",
                padding: "clamp(14px, min(4vw, 24px), 24px)",
                background: "linear-gradient(135deg, rgba(255,100,180,0.3), rgba(230,60,140,0.5))",
                border: "1px solid rgba(255,150,200,0.35)",
                borderRadius: "clamp(16px, min(5vw, 32px), 32px)",
                color: "#fff",
                fontSize: "clamp(16px, min(4.5vw, 22px), 22px)",
                fontWeight: "400",
                cursor: "pointer",
                letterSpacing: "0.05em",
                animation: "fadeUp 0.3s ease-out",
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
              }}>Vazhdo / Verifiko ✦</button>
            )}
          </div>
        </div>
      )}

      {phase === "under" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "clamp(16px, min(4vw, 26px), 26px)", padding: SIDE_PAD, zIndex: 1, animation: "fadeUp .5s ease" }}>
          <div style={{ fontSize: "clamp(56px, min(16vw, 80px), 80px)" }}>🚫</div>
          <p style={{ color: "#fff", fontSize: "clamp(24px, min(7vw, 34px), 34px)", fontWeight: "300" }}>Shumë i ri</p>
          <p style={{ color: "rgba(255,160,210,0.5)", fontSize: "clamp(14px, min(4vw, 18px), 18px)", fontWeight: "300", textAlign: "center", lineHeight: "1.7" }}>Duhet të jeni të paktën 18 vjeç ose më shumë për të vazhduar më tej.</p>
          <button onPointerDown={reset} style={{ marginTop: "14px", padding: "clamp(14px, min(3.5vw, 18px), 18px) clamp(32px, min(8vw, 48px), 48px)", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,120,180,0.2)", borderRadius: "50px", color: "rgba(255,200,230,0.7)", fontSize: "clamp(14px, min(4vw, 18px), 18px)", cursor: "pointer" }}>Provo Përsëri</button>
        </div>
      )}

      {phase === "insta" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: SIDE_PAD, gap: GRID_GAP, zIndex: 1, animation: "fadeUp .45s ease" }}>
          <div style={{ width: "clamp(72px, min(20vw, 110px), 110px)", height: "clamp(72px, min(20vw, 110px), 110px)", borderRadius: "clamp(18px, min(5vw, 32px), 32px)", background: "linear-gradient(135deg,#833ab4,#fd1d1d 50%,#fcb045)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 40px rgba(200,60,100,0.4)" }}>
            <svg width="clamp(34px, min(9vw, 50px), 50px)" height="clamp(34px, min(9vw, 50px), 50px)" viewBox="0 0 24 24" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "#fff", fontSize: "clamp(22px, min(6vw, 30px), 30px)", fontWeight: "300", marginBottom: "clamp(4px, min(2vw, 10px), 10px)" }}>Verifikimi u Krye ✦</p>
            <p style={{ color: "rgba(255,160,210,0.5)", fontSize: "clamp(13px, min(3.5vw, 17px), 17px)", fontWeight: "300", lineHeight: "1.7" }}>Shkruani Instagram-in tuaj – do të marr njoftim menjëherë.</p>
          </div>
          <div style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,120,180,0.2)", borderRadius: "clamp(14px, min(3.5vw, 20px), 20px)", padding: "clamp(14px, min(3.5vw, 20px), 20px)", display: "flex", alignItems: "center", gap: "clamp(8px, min(2vw, 12px), 12px)", backdropFilter: "blur(24px)" }}>
            <span style={{ color: "rgba(255,160,210,0.45)", fontSize: "clamp(20px, min(6vw, 26px), 26px)", fontWeight: "200" }}>@</span>
            <input ref={inputRef} value={insta} onChange={e => setInsta(e.target.value.replace("@", ""))} onKeyDown={e => { if (e.key === "Enter" && insta.trim() && !isSubmitting) handleInstaConfirm(); }} placeholder="emri_juaj" style={{ background: "transparent", border: "none", color: "#fff", fontSize: "clamp(16px, min(4.5vw, 20px), 20px)", fontWeight: "300", flex: 1, fontFamily: "inherit", minWidth: 0 }} />
          </div>
          {submitError && <p style={{ color: "#ff8a9f", fontSize: "clamp(11px, min(3vw, 14px), 14px)", marginTop: "-8px", textAlign: "center" }}>{submitError}</p>}
          <div style={{ display: "flex", gap: "clamp(10px, min(2.5vw, 14px), 14px)", width: "100%" }}>
            <button onPointerDown={reset} style={{ flex: 1, padding: "clamp(14px, min(3.5vw, 20px), 20px)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "50px", color: "rgba(255,200,230,0.5)", fontSize: "clamp(14px, min(4vw, 18px), 18px)", cursor: "pointer" }}>Kthehu</button>
            <button onPointerDown={handleInstaConfirm} disabled={isSubmitting} style={{ flex: 2, padding: "clamp(14px, min(3.5vw, 20px), 20px)", background: "linear-gradient(135deg,rgba(220,60,130,0.9),rgba(180,30,100,0.9))", border: "none", borderRadius: "50px", color: "#fff", fontSize: "clamp(15px, min(4.5vw, 20px), 20px)", cursor: isSubmitting ? "wait" : "pointer", fontWeight: "500", boxShadow: "0 8px 28px rgba(200,40,110,0.4)", opacity: isSubmitting ? 0.6 : 1 }}>{isSubmitting ? "Duke dërguar ..." : "Vazhdo →"}</button>
          </div>
        </div>
      )}

      {phase === "success" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "clamp(16px, min(4vw, 26px), 26px)", padding: SIDE_PAD, zIndex: 1, animation: "fadeUp .5s ease" }}>
          <div style={{ position: "relative", width: "clamp(80px, min(22vw, 120px), 120px)", height: "clamp(80px, min(22vw, 120px), 120px)", marginBottom: "8px" }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "radial-gradient(circle,rgba(230,60,140,0.25) 0%,transparent 70%)", animation: "glowIn 2.5s ease-in-out infinite" }}/>
            <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "linear-gradient(135deg,rgba(220,60,130,0.2),rgba(150,20,100,0.1))", border: "1px solid rgba(230,80,150,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "clamp(32px, min(9vw, 48px), 48px)" }}>✦</div>
            <div style={{ position: "absolute", top: "50%", left: "50%", width: "10px", height: "10px", borderRadius: "50%", background: "rgba(255,160,210,0.95)", marginTop: "-5px", marginLeft: "-5px", animation: "orbit 3s linear infinite", boxShadow: "0 0 8px rgba(255,140,200,0.9)" }}/>
          </div>
          <p style={{ color: "#fff", fontSize: "clamp(24px, min(7vw, 34px), 34px)", fontWeight: "300" }}>Mirë se vini ✦</p>
          <p style={{ color: "rgba(255,160,210,0.55)", fontSize: "clamp(14px, min(4vw, 20px), 20px)", fontWeight: "300" }}>@{insta}</p>
          <button onPointerDown={reset} style={{ marginTop: "14px", padding: "clamp(14px, min(3.5vw, 18px), 18px) clamp(32px, min(8vw, 48px), 48px)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,120,180,0.18)", borderRadius: "50px", color: "rgba(255,200,230,0.6)", fontSize: "clamp(14px, min(4vw, 18px), 18px)", cursor: "pointer" }}>Fillo Nga Fillimi</button>
        </div>
      )}
    </div>
  );
}