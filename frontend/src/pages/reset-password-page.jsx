import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Brain, Lock, TriangleAlert as AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function ResetPasswordPage({ token }) {
  const { resetPassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const message = await resetPassword(token, password);
      setSuccess(message || 'Password updated successfully.');
    } catch (err) {
      setError(err.message || 'Could not reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => {
    // Strip the reset_token query param and reload back to the normal login screen.
    window.location.href = window.location.origin + window.location.pathname;
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: '24px'
    }}>
      <div className="sb-fade-in" style={{
        width: '100%',
        maxWidth: '420px',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(var(--glass-blur))',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        padding: '40px 36px',
        boxShadow: 'var(--shadow-xl), inset 0 1px 0 rgba(255, 255, 255, 0.06)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
          <div style={{
            width: 54,
            height: 54,
            borderRadius: 14,
            background: 'var(--grad-frost)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(56, 189, 248, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
            marginBottom: 16
          }}>
            <Brain size={27} color="#09090b" />
          </div>
          <h2 className="mono" style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>
            Reset Your Password
          </h2>
        </div>

        {error && (
          <div className="sb-fade-in-fast" style={{
            background: 'var(--danger-dim)',
            border: '1px solid rgba(248, 113, 113, 0.2)',
            borderRadius: 'var(--radius-sm)',
            padding: '11px 14px',
            marginBottom: 18,
            display: 'flex',
            gap: 8,
            alignItems: 'center'
          }}>
            <AlertTriangle size={15} color="var(--danger)" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 12.5, color: 'var(--danger)', lineHeight: 1.4 }}>{error}</span>
          </div>
        )}

        {success ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
            <CheckCircle2 size={34} color="var(--signal)" />
            <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>{success}</p>
            <button onClick={goToLogin} className="btn-primary" style={{ width: '100%', padding: '12px 0', marginTop: 6 }}>
              Go to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                New Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} color="var(--text-faint)" style={{ position: 'absolute', left: 12, top: 13 }} />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ paddingLeft: 34 }}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                Confirm New Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} color="var(--text-faint)" style={{ position: 'absolute', left: 12, top: 13 }} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ paddingLeft: 34 }}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '13px 0', marginTop: 10, fontSize: 14 }}
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
