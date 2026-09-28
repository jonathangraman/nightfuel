import { useState } from "react";
import "./Auth.css";

export default function Auth({ supabase, recovery = false, onRecovered, initialError = "" }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError);
  const [message, setMessage] = useState("");
  const [showPass, setShowPass] = useState(false);
  const reset = !recovery && mode === "reset";
  const submit = async event => {
    event.preventDefault();
    if (loading) return;
    setError(""); setMessage("");
    if (recovery && (password.length < 8 || password !== confirmation)) {
      setError("Use at least 8 characters and enter the same password twice."); return;
    }
    setLoading(true);
    try {
      if (recovery) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        onRecovered();
      } else if (reset) {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/?recovery=1` });
        if (error) throw error;
        setMessage("Password reset email sent — check your inbox.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      }
    } catch (err) { setError(err.message || "Could not connect. Please try again."); }
    finally { setLoading(false); }
  };
  return <div className="auth-screen"><div className="auth-card">
    <div className="auth-logo"><span className="auth-logo-mark">◈</span><div className="auth-logo-title">NightFuel</div><div className="auth-logo-sub">weeknight meals that don't suck</div></div>
    <h2>{recovery ? "Choose a new password" : reset ? "Reset your password" : "Sign in"}</h2>
    <form className="auth-form" onSubmit={submit}>
      {!recovery && <div className="auth-input-group"><label htmlFor="email" className="key-label">Email</label><input id="email" type="email" autoComplete="email" className="key-input" required value={email} onChange={e => setEmail(e.target.value)} /></div>}
      {!reset && <div className="auth-input-group"><label htmlFor="password" className="key-label">{recovery ? "New password" : "Password"}</label><div className="key-input-row">
        <input id="password" type={showPass ? "text" : "password"} autoComplete={recovery ? "new-password" : "current-password"} className="key-input" required minLength={recovery ? 8 : undefined} value={password} onChange={e => setPassword(e.target.value)} />
        <button type="button" className="key-toggle" onClick={() => setShowPass(v => !v)}>{showPass ? "Hide" : "Show"}</button>
      </div></div>}
      {recovery && <div className="auth-input-group"><label htmlFor="confirm-password" className="key-label">Confirm new password</label><input id="confirm-password" className="key-input" type="password" autoComplete="new-password" required value={confirmation} onChange={e => setConfirmation(e.target.value)} /></div>}
      {error && <div className="auth-error" role="alert">{error}</div>}
      {message && <div className="auth-message" role="status">{message}</div>}
      <button className="btn btn-primary" style={{ width: "100%", marginTop: 14 }} disabled={loading}>{loading ? "Please wait…" : recovery ? "Save new password" : reset ? "Send reset link" : "Sign in"}</button>
      {!recovery && <button type="button" className="auth-link" onClick={() => { setMode(reset ? "login" : "reset"); setError(""); setMessage(""); }}>{reset ? "← Back to sign in" : "Forgot password?"}</button>}
    </form>
  </div></div>;
}
