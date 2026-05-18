import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../lib/api";
import useAuthStore from "../store/authStore";
import toast from "react-hot-toast";

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/login", { email, password });
      localStorage.setItem("token", res.data.token);
      setUser(res.data.user);
      toast.success("Welcome back!");
      if (res.data.user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/home");
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google/redirect`;
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

        .login-root {
          min-height: 100vh;
          display: flex;
          font-family: 'DM Sans', sans-serif;
          background: #0a0a0a;
          overflow: hidden;
        }

        .login-left {
          flex: 1;
          position: relative;
          display: none;
        }
        @media (min-width: 900px) {
          .login-left { display: block; }
        }
        .login-left-bg {
          position: absolute;
          inset: 0;
          background: #111;
        }
        .login-left-img {
          position: absolute;
          inset: 0;
          background: url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80') center/cover no-repeat;
          opacity: 0.4;
        }
        .login-left-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to right, transparent 50%, #0a0a0a 100%);
        }
        .login-left-content {
          position: absolute;
          bottom: 64px;
          left: 56px;
          right: 40px;
        }
        .login-left-tag {
          display: inline-block;
          font-size: 10px;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: #c9a96e;
          border: 1px solid #c9a96e55;
          padding: 6px 14px;
          margin-bottom: 24px;
        }
        .login-left-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 54px;
          font-weight: 300;
          line-height: 1.1;
          color: #f5f0eb;
          margin-bottom: 20px;
        }
        .login-left-title em {
          font-style: italic;
          color: #c9a96e;
        }
        .login-left-sub {
          font-size: 13px;
          color: #777;
          line-height: 1.8;
          max-width: 300px;
        }
        .login-left-dots {
          display: flex;
          gap: 8px;
          margin-top: 44px;
        }
        .dot-active {
          width: 28px;
          height: 2px;
          background: #c9a96e;
        }
        .dot-inactive {
          width: 8px;
          height: 2px;
          background: #333;
        }

        .login-right {
          width: 100%;
          max-width: 500px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 60px 48px;
          background: #0a0a0a;
          position: relative;
        }
        @media (min-width: 900px) {
          .login-right { padding: 60px 72px; }
        }

        .corner-tl {
          position: absolute;
          top: 36px;
          right: 48px;
          width: 40px;
          height: 40px;
          border-top: 1px solid #222;
          border-right: 1px solid #222;
        }

        .login-logo {
          font-family: 'Cormorant Garamond', serif;
          font-size: 20px;
          font-weight: 400;
          color: #f5f0eb;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          margin-bottom: 60px;
        }
        .login-logo-dot { color: #c9a96e; }

        .login-heading {
          font-family: 'Cormorant Garamond', serif;
          font-size: 42px;
          font-weight: 300;
          color: #f5f0eb;
          line-height: 1.1;
          margin-bottom: 10px;
        }
        .login-sub {
          font-size: 13px;
          color: #555;
          margin-bottom: 44px;
          letter-spacing: 0.01em;
        }
        .login-sub a {
          color: #c9a96e;
          text-decoration: none;
        }
        .login-sub a:hover { text-decoration: underline; }

        .google-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          background: transparent;
          border: 1px solid #222;
          color: #aaa;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          letter-spacing: 0.03em;
          padding: 14px;
          cursor: pointer;
          transition: all 0.25s;
          margin-bottom: 32px;
        }
        .google-btn:hover {
          border-color: #3a3a3a;
          color: #eee;
          background: #111;
        }

        .divider {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 32px;
        }
        .divider-line { flex: 1; height: 1px; background: #1c1c1c; }
        .divider-label {
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #3a3a3a;
        }

        .field { margin-bottom: 22px; }
        .field label {
          display: block;
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #555;
          margin-bottom: 9px;
        }
        .field-wrap { position: relative; }
        .field input {
          width: 100%;
          background: #0f0f0f;
          border: 1px solid #1e1e1e;
          color: #f0ece6;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          padding: 13px 16px;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
          box-sizing: border-box;
        }
        .field input::placeholder { color: #333; }
        .field input:focus {
          border-color: #c9a96e;
          background: #111;
        }
        .eye-btn {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #444;
          cursor: pointer;
          font-size: 13px;
          padding: 0;
          letter-spacing: 0;
          transition: color 0.2s;
        }
        .eye-btn:hover { color: #888; }

        .submit-btn {
          width: 100%;
          background: #c9a96e;
          border: none;
          color: #080808;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          padding: 16px;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
          margin-top: 6px;
        }
        .submit-btn:hover:not(:disabled) { background: #d4b87a; }
        .submit-btn:active:not(:disabled) { transform: scale(0.995); }
        .submit-btn:disabled { opacity: 0.55; cursor: not-allowed; }

        .error-box {
          font-size: 12px;
          color: #d47070;
          margin-top: 18px;
          padding: 11px 14px;
          background: #160d0d;
          border-left: 2px solid #d47070;
          letter-spacing: 0.02em;
        }

        .login-footer {
          margin-top: 36px;
          font-size: 11px;
          color: #333;
          text-align: center;
          letter-spacing: 0.03em;
          line-height: 1.7;
        }
      `}</style>

      <div className="login-root">
        {/* Left panel */}
        <div className="login-left">
          <div className="login-left-bg" />
          <div className="login-left-img" />
          <div className="login-left-overlay" />
          <div className="login-left-content">
            <div className="login-left-tag">New Collection 2026</div>
            <h2 className="login-left-title">
              Wear What<br />You <em>Feel</em>
            </h2>
            <p className="login-left-sub">
              Curated pieces for the modern wardrobe. Timeless style, exceptional craftsmanship.
            </p>
            <div className="login-left-dots">
              <div className="dot-active" />
              <div className="dot-inactive" />
              <div className="dot-inactive" />
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="login-right">
          <div className="corner-tl" />

          <div className="login-logo">
            Clothes<span className="login-logo-dot">.</span>
          </div>

          <h1 className="login-heading">Welcome<br />back.</h1>
          <p className="login-sub">
            No account?{" "}
            <Link to="/register">Create one free</Link>
          </p>

          <button className="google-btn" onClick={handleGoogleLogin}>
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              style={{ width: 15, height: 15 }}
              alt="Google"
            />
            Continue with Google
          </button>

          <div className="divider">
            <div className="divider-line" />
            <span className="divider-label">or</span>
            <div className="divider-line" />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Email address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label>Password</label>
              <div className="field-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {error && <div className="error-box">{error}</div>}

          <div className="login-footer">
            By signing in you agree to our Terms &amp; Privacy Policy
          </div>
        </div>
      </div>
    </>
  );
}