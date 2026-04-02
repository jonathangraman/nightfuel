import { useState } from "react";
import "./Auth.css";

export default function Auth({ supabase, onAuth }) {
  const [email, setEmail]     = useState("");
  const [sent, setSent]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const sendMagicLink = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
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

        {sent ? (
          <div className="auth-sent">
            <div className="auth-sent-icon">📬</div>
            <h2>Check your email</h2>
            <p>We sent a magic link to <strong>{email}</strong>. Click it to sign in — no password needed.</p>
            <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={() => { setSent(false); setEmail(""); }}>
              Use a different email
            </button>
          </div>
        ) : (
          <div className="auth-form">
            <h2 className="auth-title">Sign in</h2>
            <p className="auth-desc">Enter your email and we'll send you a magic link — no password required.</p>

            <div className="auth-input-group">
              <label className="key-label">Email address</label>
              <input
                type="email"
                className="key-input"
                style={{ width: "100%" }}
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && email && sendMagicLink()}
                placeholder="you@example.com"
                autoFocus
              />
            </div>

            {error && <div className="auth-error">⚠ {error}</div>}

            <button
              className="btn btn-primary"
              style={{ width: "100%", marginTop: 16 }}
              onClick={sendMagicLink}
              disabled={loading || !email.trim()}
            >
              {loading ? "Sending…" : "Send magic link"}
            </button>

            <p className="auth-hint">
              Your meal plans, favorites, and history are tied to your account and sync across all your devices.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
