import { useState } from "react";
import "./Auth.css";

export default function Auth({ supabase }) {
  const [mode, setMode]           = useState("login"); // "login" | "signup" | "reset"
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [message, setMessage]     = useState(null);
  const [showPass, setShowPass]   = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || (!password.trim() && mode !== "reset")) return;
    setLoading(true);
    setError(null);
    setMessage(null);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) setError(error.message);
    } else if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email: email.trim(), password });
      if (error) setError(error.message);
      else setMessage("Account created! Check your email to confirm, then sign in.");
    } else if (mode === "reset") {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin,
      });
      if (error) setError(error.message);
      else setMessage("Password reset email sent — check your inbox.");
    }

    setLoading(false);
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="auth-logo-mark">◈</span>
          <div className="auth-logo-title">NightFuel</div>
          <div className="auth-logo-sub">weeknight meals that don't suck</div>
        </div>

        <div className="auth-tabs">
          <button className={`auth-tab ${mode === "login" ? "active" : ""}`} onClick={() => { setMode("login"); setError(null); setMessage(null); }}>Sign in</button>
          <button className={`auth-tab ${mode === "signup" ? "active" : ""}`} onClick={() => { setMode("signup"); setError(null); setMessage(null); }}>Create account</button>
        </div>

        {mode === "reset" ? (
          <div className="auth-form">
            <p className="auth-desc">Enter your email and we'll send a password reset link.</p>
            <div className="auth-input-group">
              <label className="key-label">Email</label>
              <input type="email" className="key-input" style={{ width: "100%" }} value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} placeholder="you@example.com" autoFocus />
            </div>
            {error   && <div className="auth-error">⚠ {error}</div>}
            {message && <div className="auth-message">✓ {message}</div>}
            <button className="btn btn-primary" style={{ width: "100%", marginTop: 14 }} onClick={handleSubmit} disabled={loading || !email.trim()}>
              {loading ? "Sending…" : "Send reset link"}
            </button>
            <button className="auth-link" onClick={() => { setMode("login"); setError(null); setMessage(null); }}>← Back to sign in</button>
          </div>
        ) : (
          <div className="auth-form">
            <div className="auth-input-group">
              <label className="key-label">Email</label>
              <input type="email" className="key-input" style={{ width: "100%" }} value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoFocus />
            </div>
            <div className="auth-input-group" style={{ marginTop: 10 }}>
              <label className="key-label">Password</label>
              <div className="key-input-row">
                <input
                  type={showPass ? "text" : "password"}
                  className="key-input"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  placeholder={mode === "signup" ? "Create a password" : "Your password"}
                />
                <button className="key-toggle" onClick={() => setShowPass(v => !v)}>{showPass ? "Hide" : "Show"}</button>
              </div>
            </div>
            {error   && <div className="auth-error">⚠ {error}</div>}
            {message && <div className="auth-message">✓ {message}</div>}
            <button className="btn btn-primary" style={{ width: "100%", marginTop: 14 }} onClick={handleSubmit} disabled={loading || !email.trim() || !password.trim()}>
              {loading ? (mode === "login" ? "Signing in…" : "Creating account…") : (mode === "login" ? "Sign in" : "Create account")}
            </button>
            {mode === "login" && (
              <button className="auth-link" onClick={() => { setMode("reset"); setError(null); setMessage(null); }}>
                Forgot password?
              </button>
            )}
            {mode === "signup" && (
              <p className="auth-hint">Your meal plans sync across all your devices once logged in.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
