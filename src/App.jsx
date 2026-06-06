import { useState, useEffect, useRef, useCallback } from "react";

// Star Field Component
const STARS = Array.from({ length: 140 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  r: Math.random() * 1.8 + 0.2,
  op: Math.random() * 0.6 + 0.2,
  dur: Math.random() * 5 + 2,
  pink: Math.random() > 0.65,
}));

function StarField() {
  return (
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
      {STARS.map(s => (
        <circle key={s.id} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r}
          fill={s.pink ? "#ffb3d9" : "#ffffff"}
          style={{ opacity: s.op, animation: `twinkle ${s.dur}s ease-in-out infinite alternate` }} />
      ))}
    </svg>
  );
}

// Custom Button
function Btn({ label, onPress, variant = "num", wide = false }) {
  const [down, setDown] = useState(false);

  const bg = {
    num:    down ? "rgba(255,130,190,0.28)" : "rgba(255,255,255,0.09)",
    top:    down ? "rgba(255,180,220,0.55)" : "rgba(255,255,255,0.2)",
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
        border: `1px solid ${variant === "accent" ? "rgba(255,130,180,0.4)" : "rgba(255,255,255,0.07)"}`,
        borderRadius: "50%",
        width: wide ? "100%" : undefined,
        aspectRatio: wide ? "unset" : "1/1",
        height: "78px",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        fontSize: "28px",
        fontWeight: "300",
        cursor: "pointer",
        transform: down ? "scale(0.92)" : "scale(1)",
        transition: "transform 0.07s ease, background 0.09s ease",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: variant === "accent" ? "0 4px 20px rgba(220,60,130,0.4)" : "none",
        userSelect: "none",
        WebkitUserSelect: "none",
        fontFamily: "inherit",
      }}>
      {label}
    </button>
  );
}

// Web3Forms configuration – replace with your own key
const WEB3FORMS_ACCESS_KEY = "47521ab4-d765-44e7-a06d-082f37c2dd15";

function App() {
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
      console.warn("Web3Forms key missing – email not sent");
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
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0010", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif" }}>
      <style>{`
        @keyframes twinkle { from{opacity:.15} to{opacity:1} }
        @keyframes shake { 0%,100%{transform:translateX(0)} 15%{transform:translateX(-10px)} 30%{transform:translateX(9px)} 50%{transform:translateX(-7px)} 70%{transform:translateX(6px)} 85%{transform:translateX(-3px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
        @keyframes orbit { from{transform:rotate(0deg) translateX(46px) rotate(0deg)} to{transform:rotate(360deg) translateX(46px) rotate(-360deg)} }
        @keyframes glowIn { 0%,100%{opacity:.35} 50%{opacity:.75} }
        * { box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
        input::placeholder{color:rgba(255,180,215,0.3)}
        input:focus{outline:none}
      `}</style>

      <div style={{ position: "relative", width: "390px", minHeight: "780px", borderRadius: "48px", overflow: "hidden", background: "linear-gradient(170deg,#140018 0%,#0e000f 45%,#160020 100%)", border: "1px solid rgba(255,100,180,0.12)", boxShadow: "0 50px 100px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.04), inset 0 0 60px rgba(200,50,120,0.05)", animation: shaking ? "shake 0.55s ease" : "none", display: "flex", flexDirection: "column" }}>
        {/* Ambient layers */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <StarField />
          <div style={{ position: "absolute", top: "-15%", left: "-25%", width: "80%", height: "65%", background: "radial-gradient(ellipse, rgba(200,40,120,0.28) 0%, rgba(150,20,100,0.12) 40%, transparent 70%)", animation: "glowIn 9s ease-in-out infinite" }}/>
          <div style={{ position: "absolute", top: "20%", right: "-20%", width: "70%", height: "60%", background: "radial-gradient(ellipse, rgba(255,80,180,0.18) 0%, rgba(180,30,130,0.08) 40%, transparent 70%)", animation: "glowIn 12s ease-in-out infinite 3s" }}/>
        </div>

        {phase === "calc" && (
          <div style={{ padding: "40px 22px 30px", display: "flex", flexDirection: "column", flex: 1, justifyContent: "flex-end" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", paddingBottom: "15px" }}>
              <p style={{ color: "rgba(255,160,210,0.45)", fontSize: "12px", letterSpacing: "0.14em", textTransform: "uppercase", textAlign: "right", marginBottom: "5px", fontWeight: "400" }}>Viti i Lindjes</p>
              <div style={{ textAlign: "right", fontSize: year ? "88px" : "68px", fontWeight: "200", color: year ? "#fff" : "rgba(255,255,255,0.15)", letterSpacing: "-4px", lineHeight: "1" }}>{year || "VVVV"}</div>
              {error ? <p style={{ color: "rgba(255,110,140,0.9)", fontSize: "12px", textAlign: "right", marginTop: "12px" }}>{error}</p> : year.length === 4 && <p style={{ color: "rgba(255,150,200,0.4)", fontSize: "11px", textAlign: "right", marginTop: "10px", letterSpacing: "0.08em", textTransform: "uppercase" }}>Dridheni telefonin ose shtypni butonin poshtë</p>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px" }}>
                <Btn label="AC" variant="top" onPress={() => { setYear(""); setError(""); }} />
                <Btn label="+/-" variant="top" onPress={() => {}} />
                <Btn label="%" variant="top" onPress={() => {}} />
                <Btn label="⌫" variant="accent" onPress={() => { setYear(p => p.slice(0,-1)); setError(""); }} />
              </div>
              {[["7","8","9"],["4","5","6"],["1","2","3"]].map((row, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px" }}>
                  {row.map(d => <Btn key={d} label={d} onPress={() => digit(d)} />)}
                  <div/>
                </div>
              ))}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "12px", marginBottom: "10px" }}>
                <Btn label="0" wide onPress={() => digit("0")} />
                <Btn label="·" onPress={() => {}} />
                <div/>
              </div>
              {year.length === 4 && <button onClick={verify} style={{ width: "100%", padding: "16px", background: "linear-gradient(135deg, rgba(255,100,180,0.2), rgba(230,60,140,0.4))", border: "1px solid rgba(255,150,200,0.3)", borderRadius: "24px", color: "#fff", fontSize: "16px", fontWeight: "400", cursor: "pointer", letterSpacing: "0.05em", animation: "fadeUp 0.3s ease-out", backdropFilter: "blur(10px)" }}>Vazhdo / Verifiko ✦</button>}
            </div>
          </div>
        )}

        {phase === "under" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: "18px", padding: "40px", animation: "fadeUp .5s ease" }}>
            <div style={{ fontSize: "64px" }}>🚫</div>
            <p style={{ color: "#fff", fontSize: "24px", fontWeight: "300" }}>Shumë i ri</p>
            <p style={{ color: "rgba(255,160,210,0.5)", fontSize: "14px", fontWeight: "300", textAlign: "center", lineHeight: "1.7" }}>Duhet të jeni të paktën 18 vjeç ose më shumë për të vazhduar më tej.</p>
            <button onPointerDown={reset} style={{ marginTop: "14px", padding: "13px 34px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,120,180,0.2)", borderRadius: "50px", color: "rgba(255,200,230,0.7)", fontSize: "14px", cursor: "pointer" }}>Provo Përsëri</button>
          </div>
        )}

        {phase === "insta" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, padding: "48px 32px", gap: "24px", animation: "fadeUp .45s ease" }}>
            <div style={{ width: "80px", height: "80px", borderRadius: "22px", background: "linear-gradient(135deg,#833ab4,#fd1d1d 50%,#fcb045)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 40px rgba(200,60,100,0.4)" }}>
              <svg width="38" height="38" viewBox="0 0 24 24" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ color: "#fff", fontSize: "22px", fontWeight: "300", marginBottom: "8px" }}>Verifikimi u Krye ✦</p>
              <p style={{ color: "rgba(255,160,210,0.5)", fontSize: "13px", fontWeight: "300", lineHeight: "1.7" }}>Shkruani Instagram-in tuaj – do të marr njoftim menjëherë.</p>
            </div>
            <div style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,120,180,0.2)", borderRadius: "16px", padding: "16px 20px", display: "flex", alignItems: "center", gap: "10px", backdropFilter: "blur(24px)" }}>
              <span style={{ color: "rgba(255,160,210,0.45)", fontSize: "20px", fontWeight: "200" }}>@</span>
              <input ref={inputRef} value={insta} onChange={e => setInsta(e.target.value.replace("@", ""))} onKeyDown={e => { if (e.key === "Enter" && insta.trim() && !isSubmitting) handleInstaConfirm(); }} placeholder="emri_juaj" style={{ background: "transparent", border: "none", color: "#fff", fontSize: "17px", fontWeight: "300", flex: 1, fontFamily: "inherit" }} />
            </div>
            {submitError && <p style={{ color: "#ff8a9f", fontSize: "12px", marginTop: "-12px", textAlign: "center" }}>{submitError}</p>}
            <div style={{ display: "flex", gap: "10px", width: "100%" }}>
              <button onPointerDown={reset} style={{ flex: 1, padding: "16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "50px", color: "rgba(255,200,230,0.5)", fontSize: "14px", cursor: "pointer" }}>Kthehu</button>
              <button onPointerDown={handleInstaConfirm} disabled={isSubmitting} style={{ flex: 2, padding: "16px", background: "linear-gradient(135deg,rgba(220,60,130,0.9),rgba(180,30,100,0.9))", border: "none", borderRadius: "50px", color: "#fff", fontSize: "15px", cursor: isSubmitting ? "wait" : "pointer", fontWeight: "500", boxShadow: "0 8px 28px rgba(200,40,110,0.4)", opacity: isSubmitting ? 0.6 : 1 }}>{isSubmitting ? "Duke dërguar ..." : "Vazhdo →"}</button>
            </div>
          </div>
        )}

        {phase === "success" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: "18px", padding: "40px", animation: "fadeUp .5s ease" }}>
            <div style={{ position: "relative", width: "90px", height: "90px", marginBottom: "8px" }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "radial-gradient(circle,rgba(230,60,140,0.25) 0%,transparent 70%)", animation: "glowIn 2.5s ease-in-out infinite" }}/>
              <div style={{ width: "90px", height: "90px", borderRadius: "50%", background: "linear-gradient(135deg,rgba(220,60,130,0.2),rgba(150,20,100,0.1))", border: "1px solid rgba(230,80,150,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "36px" }}>✦</div>
              <div style={{ position: "absolute", top: "50%", left: "50%", width: "8px", height: "8px", borderRadius: "50%", background: "rgba(255,160,210,0.95)", marginTop: "-4px", marginLeft: "-4px", animation: "orbit 3s linear infinite", boxShadow: "0 0 8px rgba(255,140,200,0.9)" }}/>
            </div>
            <p style={{ color: "#fff", fontSize: "24px", fontWeight: "300" }}>Mirë se vini ✦</p>
            <p style={{ color: "rgba(255,160,210,0.55)", fontSize: "15px", fontWeight: "300" }}>@{insta}</p>
            <button onPointerDown={reset} style={{ marginTop: "14px", padding: "13px 34px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,120,180,0.18)", borderRadius: "50px", color: "rgba(255,200,230,0.6)", fontSize: "14px", cursor: "pointer" }}>Fillo Nga Fillimi</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;