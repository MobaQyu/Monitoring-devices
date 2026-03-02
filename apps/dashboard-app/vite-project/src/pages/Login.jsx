import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, RefreshCcw } from "lucide-react";
import {  authApi } from "../services/apiService";
import { connectSocket } from "../services/socket";
import "../styles/Login.css";

/* ================= CAPTCHA HELPER ================= */
function generateCaptcha() {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

export default function Login() {
  const navigate = useNavigate();

  /* ================= STATE ================= */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaValue, setCaptchaValue] = useState(generateCaptcha());

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // rate limit frontend
  const [attempts, setAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState(null);

  /* ================= CAPTCHA ================= */
  const refreshCaptcha = () => {
    setCaptchaValue(generateCaptcha());
    setCaptchaInput("");
  };

  /* ================= SUBMIT ================= */
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // 🔒 rate limit frontend
    if (lockUntil && Date.now() < lockUntil) {
      setError("Terlalu banyak percobaan login. Coba lagi nanti.");
      return;
    }

    // 🔴 validasi kosong
    if (!email || !password) {
      setError("Email dan password tidak boleh kosong.");
      return;
    }

    // 🔴 captcha salah
    if (captchaInput.toUpperCase() !== captchaValue) {
      setError("Captcha salah.");
      refreshCaptcha();
      return;
    }

    try {
      setLoading(true);

      // 🔐 login ke backend (SESUAI STRUKTUR KAMU)
      const res = await authApi.login( {
        email,
        password,
      });

      // simpan auth
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));

      // connect socket SETELAH login
      connectSocket();

      // 🔥 replace history (anti back ke dashboard setelah logout)
      navigate("/", { replace: true });
    } catch (err) {
      const next = attempts + 1;
      setAttempts(next);

      if (next >= 5) {
        setLockUntil(Date.now() + 60_000); // 1 menit
        setError("Terlalu banyak percobaan. Login dikunci 1 menit.");
        setAttempts(0);
        setLockUntil(null);
      } else {
        setError("Email atau password salah.");
      }

      refreshCaptcha();
    } finally {
      setLoading(false);
    }
  }

  /* ================= UI ================= */
  return (
    <div className="login-container">
      <form className="login-card" onSubmit={handleSubmit}>
        <div style={{ textAlign: "center", marginBottom: 12 }}>
  <div
    style={{
      width: 48,
      height: 48,
      borderRadius: 12,
      background: "#0F172A",
      color: "white",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 700,
      margin: "0 auto 8px",
    }}
  >
    NM
  </div>
  <div style={{ fontSize: 13, color: "#64748B" }}>
    Network Monitor
  </div>
</div>

        <h2>Login</h2>

        {error && <div className="error-box">{error}</div>}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* PASSWORD + ICON 👁 */}
        <div className="password-field">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <span onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </span>
        </div>

        {/* CAPTCHA */}
        <div className="captcha-row">
          <div className="captcha-box">{captchaValue}</div>
          <button
            type="button"
            className="captcha-refresh"
            onClick={refreshCaptcha}
          >
            <RefreshCcw size={16} />
          </button>
        </div>

        <input
          type="text"
          placeholder="Masukkan captcha"
          value={captchaInput}
          onChange={(e) =>
            setCaptchaInput(e.target.value.toUpperCase())
          }
        />

        <button disabled={loading}>
          {loading ? "Loading..." : "Login"}
        </button>

        <div className="login-footer">
          <button
            type="button"
            className="link"
            onClick={() =>
              alert("Silakan hubungi admin untuk reset password.")
            }
          >
            Lupa kata sandi?
          </button>
        </div>
      </form>
    </div>
  );
}
