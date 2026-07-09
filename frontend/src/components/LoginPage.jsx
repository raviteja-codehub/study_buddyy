import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Brain, Sparkles, Building, Clock, Lock, User, AlertTriangle } from 'lucide-react';

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
    // Select a random quote on mount
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
      background: 'radial-gradient(circle at top right, rgba(56, 189, 248, 0.08), transparent 40%), radial-gradient(circle at bottom left, rgba(251, 146, 60, 0.05), transparent 45%), #09090b',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Cyber Glowing Accents */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '10%',
        width: '300px',
        height: '300px',
        background: 'rgba(56, 189, 248, 0.03)',
        borderRadius: '50%',
        filter: 'blur(80px)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '20%',
        right: '10%',
        width: '320px',
        height: '320px',
        background: 'rgba(251, 146, 60, 0.03)',
        borderRadius: '50%',
        filter: 'blur(80px)',
        pointerEvents: 'none'
      }} />

      <div className="sb-fade-in" style={{
        width: '100%',
        maxWidth: '440px',
        background: 'rgba(14, 14, 17, 0.75)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '36px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        zIndex: 5
      }}>
        {/* Header App Brand */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 30 }}>
          <div style={{
            width: 50,
            height: 50,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #38bdf8, #0369a1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(56, 189, 248, 0.3)',
            marginBottom: 14
          }}>
            <Brain size={26} color="#09090b" />
          </div>
          <h2 className="mono" style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(to right, #ffffff, #a1a1aa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            STUDY BUDDY
          </h2>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>DSA Space-Repetition Revision Hub</span>
        </div>

        {/* Tab Selection */}
        <div style={{
          display: 'flex',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: 8,
          padding: 3,
          marginBottom: 24,
          border: '1px solid var(--border)'
        }}>
          <button
            onClick={() => { setIsLogin(true); setError(''); }}
            style={{
              flex: 1,
              padding: '8px 0',
              borderRadius: 6,
              fontSize: 13.5,
              fontWeight: 600,
              background: isLogin ? 'var(--border)' : 'transparent',
              color: isLogin ? '#fff' : 'var(--text-muted)'
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(''); }}
            style={{
              flex: 1,
              padding: '8px 0',
              borderRadius: 6,
              fontSize: 13.5,
              fontWeight: 600,
              background: !isLogin ? 'var(--border)' : 'transparent',
              color: !isLogin ? '#fff' : 'var(--text-muted)'
            }}
          >
            Create Account
          </button>
        </div>

        {/* Errors display */}
        {(error || authError) && (
          <div style={{
            background: 'var(--danger-dim)',
            border: '1px solid rgba(248, 113, 113, 0.15)',
            borderRadius: 8,
            padding: '10px 14px',
            marginBottom: 18,
            display: 'flex',
            gap: 8,
            alignItems: 'center'
          }}>
            <AlertTriangle size={15} color="var(--danger)" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 12.5, color: 'var(--danger)', lineHeight: 1.4 }}>
              {error || authError}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Username */}
          <div style={{ position: 'relative' }}>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
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
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
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
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
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
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
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
            style={{ width: '100%', padding: '12px 0', marginTop: 8, fontSize: 14 }}
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Motivation line decoration */}
        <div style={{
          marginTop: 28,
          paddingTop: 18,
          borderTop: '1px solid var(--border)',
          textAlign: 'center'
        }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--ember)', marginBottom: 6 }}>
            <Sparkles size={12} />
            <span className="mono" style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase' }}>
              Daily Motivation
            </span>
          </div>
          <p style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            lineHeight: 1.5,
            fontStyle: 'italic',
            maxWidth: 320,
            margin: '0 auto'
          }}>
            "{motivation}"
          </p>
        </div>
      </div>
    </div>
  );
}
