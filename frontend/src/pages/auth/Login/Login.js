// src/pages/Login.js

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import { saveSession, getRolePrefix, API_BASE } from "../../../utils/api";

// ── Inline SVG eye icons (no external dependency) ──
function Eye() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOff() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

// ── Generates a random 6-char alphanumeric CAPTCHA string ──
function generateCaptcha() {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

const FALLBACK_KURALS = [
  {
    number: 1,
    chapter: "கடவுள் வாழ்த்து",
    section: "அறத்துப்பால்",
    kural: ["அகர முதல எழுத்தெல்லாம் ஆதி", "பகவன் முதற்றே உலகு."],
    meaning: {
      ta_mu_va: "எழுத்துக்கள் எல்லாம் அகரத்தை அடிப்படையாக கொண்டிருக்கின்றன. அதுபோல உலகம் கடவுளை அடிப்படையாக கொண்டிருக்கிறது.",
      ta_salamon: "எழுத்துக்கள் எல்லாம் அகரத்தில் தொடங்குகின்றன; (அது போல) உலகம் கடவுளில் தொடங்குகிறது.",
      ta_kalaignar: "அகரம் எழுத்துக்களுக்கு முதன்மை; ஆதிபகவன், உலகில் வாழும் உயிர்களுக்கு முதன்மை",
      en: "As the letter A is the first of all letters, so the eternal God is first in the world."
    }
  },
  {
    number: 391,
    chapter: "கல்வி",
    section: "பொருட்பால்",
    kural: ["கற்க கசடறக் கற்பவை கற்றபின்", "நிற்க அதற்குத் தக."],
    meaning: {
      ta_mu_va: "கற்கத் தகுந்த நூல்களைக் குற்றம் இல்லாமல் கற்க வேண்டும்; அவ்வாறு கற்ற பிறகு கற்ற கல்விக்குத் தக்கவாறு நெறியில் நிற்க வேண்டும்.",
      ta_salamon: "கற்க வேண்டியவைகளைக் குற்றம் இல்லாமல் கற்க வேண்டும்; கற்ற பிறகு, கற்ற கல்விக்கு ஏற்ப நல்ல வழிகளில் நடக்க வேண்டும்.",
      ta_kalaignar: "படிக்க வேண்டியவைகளைத் தங்கு தடையின்றிக் கற்றுக்கொள்ள வேண்டும்; கற்ற பிறகு அதன்படி நடக்கவும் வேண்டும்",
      en: "Let a man learn thoroughly those things which he ought to learn, and let him afterwards stand in his way."
    }
  }
];

function renderKuralMeaning(kural, translationMode) {
  if (!kural || !kural.meaning) return null;
  switch (translationMode) {
    case 'en':
      return <p className="kural-meaning-text">{kural.meaning.en}</p>;
    case 'ta_mu_va':
      return <p className="kural-meaning-text">{kural.meaning.ta_mu_va}</p>;
    case 'ta_salamon':
      return <p className="kural-meaning-text">{kural.meaning.ta_salamon}</p>;
    case 'ta_kalaignar':
      return <p className="kural-meaning-text">{kural.meaning.ta_kalaignar}</p>;
    case 'all':
    default:
      const ta = kural.meaning.ta_mu_va || kural.meaning.ta_salamon || kural.meaning.ta_kalaignar || "";
      const en = kural.meaning.en || "";
      return (
        <div className="kural-meaning-dual">
          <p className="kural-meaning-text tamil">{ta}</p>
          <div className="kural-meaning-divider" />
          <p className="kural-meaning-text english">{en}</p>
        </div>
      );
  }
}

function renderCompanyName(companyName) {
  if (!companyName) {
    return (
      <>
        <span className="arrow">ARROW</span>
        <span className="data"> DATA </span>
        <span className="tech">TECH</span>
      </>
    );
  }
  const nameUpper = companyName.toUpperCase();
  if (nameUpper === "ARROWDATATECH") {
    return (
      <>
        <span className="arrow">ARROW</span>
        <span className="data">DATA</span>
        <span className="tech">TECH</span>
      </>
    );
  }
  const parts = companyName.split(/[\s-]+/);
  if (parts.length === 3) {
    return (
      <>
        <span className="arrow">{parts[0].toUpperCase()}</span>
        <span className="data"> {parts[1].toUpperCase()} </span>
        <span className="tech">{parts[2].toUpperCase()}</span>
      </>
    );
  } else if (parts.length === 2) {
    return (
      <>
        <span className="arrow">{parts[0].toUpperCase()}</span>
        <span className="tech"> {parts[1].toUpperCase()}</span>
      </>
    );
  } else {
    return <span className="arrow">{companyName.toUpperCase()}</span>;
  }
}

function Login() {

  const [captchaText, setCaptchaText] = useState("");
  const [userCaptcha, setUserCaptcha] = useState("");
  const [captchaError, setCaptchaError] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [portalSettings, setPortalSettings] = useState(null);
  const [quote, setQuote] = useState("");
  const [thirukkural, setThirukkural] = useState(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  // ── Draw CAPTCHA on canvas ──
  const drawCaptcha = (text) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;

    // Background
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "rgba(19,198,223,0.08)");
    bg.addColorStop(1, "rgba(255,59,92,0.08)");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Noise lines
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * W, Math.random() * H);
      ctx.lineTo(Math.random() * W, Math.random() * H);
      ctx.strokeStyle = `rgba(${Math.random() > 0.5 ? "19,198,223" : "255,59,92"},0.25)`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Noise dots
    for (let i = 0; i < 30; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * W, Math.random() * H, 1, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.fill();
    }

    // Draw each character with slight rotation & offset
    const colors = ["#13c6df", "#ff3b5c", "#ffffff", "#9b9b9b", "#4de7ff", "#ff7a9a"];
    const fonts = ["bold 22px 'Courier New'", "bold 20px 'Arial Black'", "bold 21px monospace"];
    text.split("").forEach((char, i) => {
      ctx.save();
      const x = 14 + i * 26;
      const y = H / 2 + 7;
      ctx.translate(x, y);
      ctx.rotate(((Math.random() - 0.5) * Math.PI) / 6);
      ctx.font = fonts[i % fonts.length];
      ctx.fillStyle = colors[i % colors.length];
      ctx.shadowColor = colors[i % colors.length];
      ctx.shadowBlur = 4;
      ctx.fillText(char, 0, 0);
      ctx.restore();
    });
  };

  const refreshCaptcha = () => {
    const text = generateCaptcha();
    setCaptchaText(text);
    setUserCaptcha("");
    setCaptchaError("");
    setTimeout(() => drawCaptcha(text), 0);
  };

  // Generate on mount
  useEffect(() => {
    refreshCaptcha();

    fetch(`${API_BASE}/settings/public`)
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          setPortalSettings(json.data);

          if (json.data.enableThirukkural) {
            fetch("https://tamil-kural-api.vercel.app/api/daily")
              .then(res => res.json())
              .then(kuralData => {
                if (kuralData && kuralData.number) {
                  setThirukkural(kuralData);
                } else {
                  throw new Error("Invalid kural data");
                }
              })
              .catch(err => {
                console.warn("Failed to load daily Thirukkural, using fallback:", err);
                const today = new Date();
                const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
                const fallbackIndex = dayOfYear % FALLBACK_KURALS.length;
                setThirukkural(FALLBACK_KURALS[fallbackIndex]);
              });
          } else {
            const quotes = json.data.loginQuotes;
            if (quotes && quotes.length > 0) {
              const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
              setQuote(randomQuote);
            }
          }
        }
      })
      .catch(err => console.warn("Failed to load settings from server:", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redraw whenever captchaText changes
  useEffect(() => {
    if (captchaText) drawCaptcha(captchaText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [captchaText]);

  const handleLogin = async (e) => {
    e.preventDefault();

    // CAPTCHA validation
    if (userCaptcha.trim().toLowerCase() !== captchaText.toLowerCase()) {
      setCaptchaError("Incorrect CAPTCHA. Please try again.");
      refreshCaptcha();
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: identifier,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || "Login failed");
        refreshCaptcha();
        return;
      }

      // Store tokens in sessionStorage (per-tab, so multiple users
      // can be logged in simultaneously in different browser tabs)
      saveSession(data.data);

      // Navigate based on user roles
      const roles = data.data.roles || [];
      const prefix = getRolePrefix(roles);
      navigate(`/${prefix}/dashboard`);
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="overlay">
        <div className="login-container">

          <div className="login-card">

            <div className="login-header">
              <h3>
                {renderCompanyName(portalSettings?.companyName)}
              </h3>
              <p className="portal-text">
                {portalSettings?.welcomeMessage ? (
                  <span>{portalSettings.welcomeMessage}</span>
                ) : (
                  <>
                    🤝 Welcome Back to
                    <span className="portal-highlight"> Production Portal </span>📝
                  </>
                )}
              </p>
              {portalSettings?.portalName && (
                <div className="portal-name-subtitle">
                  {portalSettings.portalName}
                </div>
              )}
            </div>

            <form onSubmit={handleLogin}>
              {error && <div className="login-error">{error}</div>}

              <div className="input-group">
                <label>Email / User ID</label>
                <input
                  type="text"
                  placeholder="Enter your email or user ID"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>

              <div className="input-group password-input-group">
                <label>Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: "42px" }}
                />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </span>
              </div>

              {/* ── CAPTCHA SECTION ── */}
              <div className="captcha-group">
                <label className="captcha-label">Verification Code</label>

                <div className="captcha-display">
                  <canvas
                    ref={canvasRef}
                    width={170}
                    height={48}
                    className="captcha-canvas"
                  />
                  <button
                    type="button"
                    className="captcha-refresh"
                    onClick={refreshCaptcha}
                    title="Refresh CAPTCHA"
                  >
                    ↻
                  </button>
                </div>

                <input
                  type="text"
                  className="captcha-input"
                  placeholder="Enter the code above"
                  value={userCaptcha}
                  onChange={(e) => {
                    setUserCaptcha(e.target.value);
                    setCaptchaError("");
                  }}
                  maxLength={6}
                  autoComplete="off"
                  spellCheck={false}
                />

                {captchaError && (
                  <span className="captcha-error">{captchaError}</span>
                )}
              </div>
              {/* ── END CAPTCHA ── */}

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? "Logging in…" : "Login"}
              </button>
            </form>

          </div>

          {portalSettings?.enableThirukkural && thirukkural ? (
            <div className="login-kural-box">
              <div className="login-kural-header">
                <span className="login-kural-number">குறள் / Kural {thirukkural.number}</span>
                <span className="login-kural-chapter">{thirukkural.chapter} • {thirukkural.section}</span>
              </div>
              <div className="login-kural-lines">
                <p className="login-kural-line">{thirukkural.kural[0]}</p>
                <p className="login-kural-line">{thirukkural.kural[1]}</p>
              </div>
              <div className="login-kural-meaning">
                {renderKuralMeaning(thirukkural, portalSettings.thirukkuralTranslation)}
              </div>
            </div>
          ) : quote ? (
            <div className="login-quote-box">
              <div className="login-quote-content">
                "{quote}"
              </div>
              <span className="login-quote-author">— Arrow Motivation</span>
            </div>
          ) : null}

        </div>
      </div>
    </div>
  );
}

export default Login;