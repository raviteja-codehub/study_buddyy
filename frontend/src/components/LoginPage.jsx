import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Brain, Sparkles, Building, Clock, Lock, User, TriangleAlert as AlertTriangle } from 'lucide-react';

const MOTIVATIONS = [
  "Consistency beats intensity. One problem a day keeps the rejection away.",
  "Struggling with a hard problem is where the real learning happens. Keep pushing!",
  "Do not just memorize solutions. Understand the underlying patterns.",
  "An hour of deep thinking is worth more than ten hours of copying code.",
  "Your brain is a neural network. Train it daily with diverse patterns."
];

export default function LoginPage() {
  const { login, register, error: authError } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const [hoursGoal, setHoursGoal] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [motivation, setMotivation] = useState('');

  useEffect(() => {
    const idx = Math.floor(Math.random() * MOTIVATIONS.length);
    setMotivation(MOTIVATIONS[idx]);
  }, [isLogin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please fill in all credentials.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(username.trim(), password.trim());
      } else {
        await register(username.trim(), password.trim(), targetCompany.trim(), hoursGoal);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated aurora background accents */}
      <div style={{
        position: 'absolute',
        top: '15%',
        left: '8%',
        width: '360px',
        height: '360px',
        background: 'rgba(56, 189, 248, 0.04)',
        borderRadius: '50%',
        filter: 'blur(90px)',
        pointerEvents: 'none',
        animation: 'aurora-shift 12s ease-in-out infinite'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '15%',
        right: '8%',
        width: '400px',
        height: '400px',
        background: 'rgba(251, 146, 60, 0.03)',
        borderRadius: '50%',
        filter: 'blur(90px)',
        pointerEvents: 'none',
        animation: 'aurora-shift 15s ease-in-out infinite reverse'
      }} />
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(56, 189, 248, 0.02), transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />

      <div className="sb-fade-in" style={{
        width: '100%',
        maxWidth: '440px',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(var(--glass-blur))',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        padding: '40px 36px',
        boxShadow: 'var(--shadow-xl), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
        zIndex: 5,
        position: 'relative'
      }}>
        {/* Header App Brand */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
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
          <h2 className="mono" style={{ fontSize: 23, fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(to right, #ffffff, #a1a1aa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            STUDY BUDDY
          </h2>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, fontWeight: 500 }}>
            DSA Spaced-Repetition Revision Hub
          </span>
        </div>

        {/* Tab Selection */}
        <div style={{
          display: 'flex',
          background: 'rgba(0, 0, 0, 0.25)',
          borderRadius: 'var(--radius-sm)',
          padding: 4,
          marginBottom: 24,
          border: '1px solid var(--border)',
          position: 'relative'
        }}>
          <button
            onClick={() => { setIsLogin(true); setError(''); }}
            style={{
              flex: 1,
              padding: '9px 0',
              borderRadius: 6,
              fontSize: 13.5,
              fontWeight: 600,
              background: isLogin ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
              color: isLogin ? 'var(--frost-bright)' : 'var(--text-muted)',
              transition: 'all 0.25s var(--ease-out)',
              boxShadow: isLogin ? 'inset 0 0 0 1px rgba(56, 189, 248, 0.2)' : 'none'
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(''); }}
            style={{
              flex: 1,
              padding: '9px 0',
              borderRadius: 6,
              fontSize: 13.5,
              fontWeight: 600,
              background: !isLogin ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
              color: !isLogin ? 'var(--frost-bright)' : 'var(--text-muted)',
              transition: 'all 0.25s var(--ease-out)',
              boxShadow: !isLogin ? 'inset 0 0 0 1px rgba(56, 189, 248, 0.2)' : 'none'
            }}
          >
            Create Account
          </button>
        </div>

        {/* Errors display */}
        {(error || authError) && (
          <div className="sb-fade-in-fast" style={{
            background: 'var(--danger-dim)',
            border: '1px solid rgba(248, 113, 113, 0.2)',
            borderRadius: 'var(--radius-sm)',
            padding: '11px 14px',
            marginBottom: 18,
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            boxShadow: '0 0 16px rgba(248, 113, 113, 0.06)'
          }}>
            <AlertTriangle size={15} color="var(--danger)" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 12.5, color: 'var(--danger)', lineHeight: 1.4 }}>
              {error || authError}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Username */}
          <div>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.02em' }}>
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <User size={14} color="var(--text-faint)" style={{ position: 'absolute', left: 12, top: 13 }} />
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="e.g. algomaster"
                style={{ paddingLeft: 34 }}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.02em' }}>
              Password
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

          {/* Additional details for Register */}
          {!isLogin && (
            <div className="sb-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.02em' }}>
                  Target Company
                </label>
                <div style={{ position: 'relative' }}>
                  <Building size={14} color="var(--text-faint)" style={{ position: 'absolute', left: 12, top: 13 }} />
                  <input
                    type="text"
                    value={targetCompany}
                    onChange={e => setTargetCompany(e.target.value)}
                    placeholder="e.g. Google, Meta"
                    style={{ paddingLeft: 34 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.02em' }}>
                  Weekly Prep Goal (Hours)
                </label>
                <div style={{ position: 'relative' }}>
                  <Clock size={14} color="var(--text-faint)" style={{ position: 'absolute', left: 12, top: 13 }} />
                  <input
                    type="number"
                    min="1"
                    max="80"
                    value={hoursGoal}
                    onChange={e => setHoursGoal(e.target.value)}
                    style={{ paddingLeft: 34 }}
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '13px 0', marginTop: 10, fontSize: 14 }}
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Motivation line decoration */}
        <div style={{
          marginTop: 30,
          paddingTop: 20,
          borderTop: '1px solid var(--border)',
          textAlign: 'center'
        }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--ember)', marginBottom: 8 }}>
            <Sparkles size={12} />
            <span className="mono" style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase' }}>
              Daily Motivation
            </span>
          </div>
          <p style={{
            fontSize: 12.5,
            color: 'var(--text-muted)',
            lineHeight: 1.55,
            fontStyle: 'italic',
            maxWidth: 340,
            margin: '0 auto'
          }}>
            "{motivation}"
          </p>
        </div>
      </div>
    </div>
  );
}
