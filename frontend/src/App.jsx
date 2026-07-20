import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/login-page';
import Dashboard from './pages/dashboard-page';
import ProblemList from './pages/problems-log-page';
import RevisionQueue from './pages/revision-queue-page';
import ProblemForm from './pages/problem-form-page';
import Settings from './pages/settings-page';
import FocusTimer from './pages/focus-timer-page';
import Performance from './pages/performance-page';
import { LayoutDashboard, ListChecks, ClipboardList, Settings as SettingsIcon, Brain, Plus, LogOut, Loader as Loader2, Target, Menu, X, TrendingUp, Timer } from 'lucide-react';

const STORAGE_KEY = 'studybuddy-v2-local';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// ---- 1-3-7 Spaced Revision Rule ----
// Every problem must be revised exactly 3 times: 1 day, 3 days, and 7 days
// after the day it was originally logged (measured from the ORIGINAL
// createdAt date, not from the previous revision - this is the classic
// definition of the 1-3-7 rule).
const REVISION_STAGES = [1, 3, 7];

// revisionStage: 0 = nothing revised yet (Day-1 due next), 1 = Day-1 done
// (Day-3 due next), 2 = Day-3 done (Day-7 due next), 3 = Day-7 done -> Mastered
function computeNextReviewDate(createdAt, revisionStage) {
  if (revisionStage >= REVISION_STAGES.length) return null;
  return addDays(createdAt, REVISION_STAGES[revisionStage]);
}

// Compute streak count from history logs
function computeStreak(problems) {
  const dates = new Set();
  problems.forEach(p => {
    if (p.createdAt) dates.add(p.createdAt);
    (p.reviewHistory || []).forEach(r => {
      if (r.date) dates.add(r.date);
    });
  });

  const sortedDates = Array.from(dates).sort((a, b) => b.localeCompare(a));
  const today = todayStr();
  const yesterday = addDays(today, -1);

  if (sortedDates.length === 0) return { count: 0, lastActive: null };

  const mostRecent = sortedDates[0];
  if (mostRecent !== today && mostRecent !== yesterday) {
    return { count: 0, lastActive: mostRecent };
  }

  let count = 0;
  let checkDate = mostRecent;

  while (dates.has(checkDate)) {
    count++;
    checkDate = addDays(checkDate, -1);
  }

  return { count, lastActive: mostRecent };
}

function AppContent() {
  const { user, token, getHeaders, useLocalOnly, backendUrl, logout } = useAuth();
  const [problems, setProblems] = useState([]);
  const [loadingProblems, setLoadingProblems] = useState(true);
  const [view, setView] = useState('dashboard');
  const [editingId, setEditingId] = useState(null);

  // Specific problem review redirection state
  const [reviewProblemId, setReviewProblemId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Floating "Log Problem" bubble - lets the user add a problem from ANY page
  // without navigating away from what they're currently looking at.
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  // Sync data fetch
  const fetchProblems = useCallback(async () => {
    setLoadingProblems(true);
    try {
      if (useLocalOnly || user?.isOfflineMode) {
        // Read local storage
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setProblems(JSON.parse(stored));
        } else {
          setProblems([]);
        }
      } else {
        const res = await fetch(`${backendUrl}/api/problems`, {
          headers: getHeaders()
        });
        if (res.ok) {
          const data = await res.json();
          setProblems(data);
        } else {
          throw new Error('Server returned error while fetching problems.');
        }
      }
    } catch (e) {
      console.warn('Fetch problems failed, falling back to local:', e.message);
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setProblems(JSON.parse(stored));
      }
    } finally {
      setLoadingProblems(false);
    }
  }, [getHeaders, useLocalOnly, user, backendUrl]);

  useEffect(() => {
    if (user) {
      fetchProblems();
    }
  }, [user, fetchProblems]);

  // Sync local cache when state changes in local mode
  const syncLocalCache = (nextProblems) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProblems));
  };

  // Streak calculations
  const streak = useMemo(() => {
    return computeStreak(problems);
  }, [problems]);

  const dueTodayCount = useMemo(() => {
    const today = todayStr();
    return problems.filter(p => p.nextReview && p.nextReview <= today).length;
  }, [problems]);

  // CRUD Implementations
  // `redirect` = true navigates to the Problems Log page after saving (used by
  // the full "form" page view). When called from the floating quick-add bubble
  // we pass redirect=false so the user stays exactly where they were.
  const handleSaveNew = async (data, redirect = true) => {
    try {
      if (useLocalOnly || user?.isOfflineMode) {
        const now = todayStr();
        const revisionStage = 0;
        const newProb = {
          id: 'p_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6),
          title: data.title,
          link: data.link || '',
          description: data.description || '',
          pattern: data.pattern,
          difficulty: data.difficulty,
          notes: data.notes || '',
          mistakes: data.mistakes || '',
          summary: data.summary || null,
          createdAt: now,
          revisionStage,
          mastered: false,
          nextReview: computeNextReviewDate(now, revisionStage),
          reviewHistory: data.confidence ? [{ date: now, confidence: data.confidence, timeSpent: Number(data.timeSpent) || 0, stage: 0 }] : [],
          timeSpent: Number(data.timeSpent) || 0
        };
        const updated = [newProb, ...problems];
        setProblems(updated);
        syncLocalCache(updated);
      } else {
        const res = await fetch(`${backendUrl}/api/problems`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to create problem on server');
        await fetchProblems();
      }
      if (redirect) setView('problems');
    } catch (e) {
      console.error(e);
      alert('Save failed: ' + e.message);
    }
  };

  // Handler used exclusively by the floating "Log Problem" bubble
  const handleQuickAdd = async (data) => {
    await handleSaveNew(data, false);
    setQuickAddOpen(false);
  };

  const handleSaveEdit = async (data) => {
    try {
      if (useLocalOnly || user?.isOfflineMode) {
        const updated = problems.map(p => p.id === editingId ? {
          ...p,
          title: data.title,
          link: data.link || '',
          description: data.description || '',
          pattern: data.pattern,
          difficulty: data.difficulty,
          notes: data.notes || '',
          mistakes: data.mistakes || '',
          summary: data.summary,
          timeSpent: Number(data.timeSpent) || p.timeSpent || 0
        } : p);
        setProblems(updated);
        syncLocalCache(updated);
      } else {
        const res = await fetch(`${backendUrl}/api/problems/${editingId}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to update problem on server');
        await fetchProblems();
      }
      setEditingId(null);
      setView('problems');
    } catch (e) {
      console.error(e);
      alert('Edit failed: ' + e.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      if (useLocalOnly || user?.isOfflineMode) {
        const updated = problems.filter(p => p.id !== id);
        setProblems(updated);
        syncLocalCache(updated);
      } else {
        const res = await fetch(`${backendUrl}/api/problems/${id}`, {
          method: 'DELETE',
          headers: getHeaders()
        });
        if (!res.ok) throw new Error('Failed to delete problem');
        await fetchProblems();
      }
    } catch (e) {
      console.error(e);
      alert('Delete failed');
    }
  };

  const handleRate = async (id, confidence, timeSpent) => {
    try {
      if (useLocalOnly || user?.isOfflineMode) {
        const today = todayStr();
        const updated = problems.map(p => {
          if (p.id !== id) return p;
          const prevStage = p.revisionStage || 0;
          const nextStage = Math.min(REVISION_STAGES.length, prevStage + 1);
          return {
            ...p,
            revisionStage: nextStage,
            mastered: nextStage >= REVISION_STAGES.length,
            nextReview: computeNextReviewDate(p.createdAt, nextStage),
            reviewHistory: [...(p.reviewHistory || []), { date: today, confidence, timeSpent: Number(timeSpent) || 0, stage: prevStage }]
          };
        });
        setProblems(updated);
        syncLocalCache(updated);
      } else {
        const res = await fetch(`${backendUrl}/api/problems/${id}/review`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ confidence, timeSpent })
        });
        if (!res.ok) throw new Error('Failed to submit review');
        await fetchProblems();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleImportBackup = async (importedProblems) => {
    if (useLocalOnly || user?.isOfflineMode) {
      // In local mode, overwrite/append
      const combined = [...importedProblems, ...problems];
      // remove duplicate ids
      const unique = [];
      const seen = new Set();
      combined.forEach(p => {
        if (!seen.has(p.id)) {
          seen.add(p.id);
          unique.push(p);
        }
      });
      setProblems(unique);
      syncLocalCache(unique);
    } else {
      // In server mode, upload each problem to database
      for (const p of importedProblems) {
        try {
          await fetch(`${backendUrl}/api/problems`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(p)
          });
        } catch (err) {
          console.warn('Failed to upload imported item:', p.title);
        }
      }
      await fetchProblems();
    }
  };

  const openEdit = (id) => {
    setEditingId(id);
    setView('form');
    setSidebarOpen(false);
  };

  const openDirectReview = (id) => {
    setReviewProblemId(id);
    setView('queue');
    setSidebarOpen(false);
  };

  const navigateTo = (nextView) => {
    setView(nextView);
    setReviewProblemId(null);
    setSidebarOpen(false);
  };

  const activeEditingProblem = editingId ? problems.find(p => p.id === editingId) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Mobile Top Header */}
      <div className="sb-mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            background: 'var(--grad-frost)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 12px rgba(56, 189, 248, 0.3)'
          }}>
            <Brain size={17} color="#09090b" />
          </div>
          <span className="mono" style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.02em', color: '#fff' }}>
            Study Buddy
          </span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="sb-menu-toggle-btn"
          aria-label="Toggle navigation menu"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1, minHeight: 0, position: 'relative' }}>
        {/* Mobile Sidebar Overlay Backdrop */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              top: '60px',
              background: 'rgba(5, 5, 7, 0.6)',
              backdropFilter: 'blur(6px)',
              zIndex: 30,
              animation: 'fadeInFast 0.2s ease forwards'
            }}
          />
        )}

        {/* Sidebar Navigation */}
        <div className={`sb-app-sidebar ${sidebarOpen ? 'open' : ''}`} style={{
          width: '240px',
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          flexShrink: 0
        }}>
          {/* Brand (Hidden on Mobile) */}
          <div className="sb-sidebar-brand" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px' }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: 'var(--grad-frost)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 12px rgba(56, 189, 248, 0.3)'
            }}>
              <Brain size={18} color="#09090b" />
            </div>
            <span className="mono" style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.02em', color: '#fff' }}>
              Study Buddy
            </span>
          </div>

          {/* Navigation list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
            <button
              onClick={() => navigateTo('dashboard')}
              className={`nav-item ${view === 'dashboard' ? 'active' : ''}`}
            >
              <LayoutDashboard size={16} />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => navigateTo('problems')}
              className={`nav-item ${view === 'problems' ? 'active' : ''}`}
            >
              <ListChecks size={16} />
              <span>Problems Log</span>
            </button>

            <button
              onClick={() => navigateTo('focus_timer')}
              className={`nav-item ${view === 'focus_timer' ? 'active' : ''}`}
            >
              <Timer size={16} />
              <span>Focus Timer</span>
            </button>

            <button
              onClick={() => navigateTo('performance')}
              className={`nav-item ${view === 'performance' ? 'active' : ''}`}
            >
              <TrendingUp size={16} />
              <span>Performance</span>
            </button>

            <button
              onClick={() => navigateTo('queue')}
              className={`nav-item ${view === 'queue' ? 'active' : ''}`}
            >
              <ClipboardList size={16} />
              <span style={{ flex: 1 }}>Revision Queue</span>
              {dueTodayCount > 0 && (
                <span className="mono" style={{
                  fontSize: 10,
                  fontWeight: 700,
                  background: 'var(--frost)',
                  color: '#09090b',
                  padding: '2px 7px',
                  borderRadius: 10,
                  boxShadow: '0 0 8px rgba(56, 189, 248, 0.4)'
                }}>
                  {dueTodayCount}
                </span>
              )}
            </button>

            <button
              onClick={() => navigateTo('settings')}
              className={`nav-item ${view === 'settings' ? 'active' : ''}`}
            >
              <SettingsIcon size={16} />
              <span>Settings</span>
            </button>
          </div>

          {/* User context footer */}
          <div style={{
            borderTop: '1px solid var(--border)',
            paddingTop: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 8
          }}>
            <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'var(--surface-hover)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--frost)'
              }}>
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.username}
                </div>
                {user.targetCompany && (
                  <div style={{ fontSize: 11, color: 'var(--text-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    Goal: {user.targetCompany}
                  </div>
                )}
              </div>
            </div>
            <button onClick={logout} className="btn-ghost" style={{ padding: 6 }} title="Log out">
              <LogOut size={14} />
            </button>
          </div>
        </div>

        {/* Main Workspace Frame */}
        <div className="sb-app-content-container" style={{ flex: 1, padding: '36px 40px', overflowY: 'auto', maxHeight: 'calc(100vh - 60px)' }}>
          {loadingProblems ? (
            <div style={{ height: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                <Loader2 size={32} className="sb-spin" color="var(--frost)" />
                <span className="mono" style={{ fontSize: 12, color: 'var(--text-faint)', letterSpacing: '0.05em' }}>LOADING WORKSPACE</span>
              </div>
            </div>
          ) : (
            <>
              {view === 'dashboard' && (
                <Dashboard
                  problems={problems}
                  streak={streak}
                  onGoQueue={() => setView('queue')}
                  onGoAdd={() => { setEditingId(null); setView('form'); }}
                />
              )}
              {view === 'problems' && (
                <ProblemList
                  problems={problems}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onAdd={() => { setEditingId(null); setView('form'); }}
                  onDirectReview={openDirectReview}
                />
              )}
              {view === 'queue' && (
                <RevisionQueue
                  problems={problems}
                  onRate={handleRate}
                  activeProblemId={reviewProblemId}
                  onBack={() => { setView('dashboard'); setReviewProblemId(null); }}
                />
              )}
              {view === 'form' && (
                <ProblemForm
                  initial={activeEditingProblem}
                  onSave={activeEditingProblem ? handleSaveEdit : handleSaveNew}
                  onCancel={() => { setEditingId(null); setView(activeEditingProblem ? 'problems' : 'dashboard'); }}
                />
              )}
              {view === 'settings' && (
                <Settings
                  problems={problems}
                  onImportData={handleImportBackup}
                />
              )}
              {view === 'focus_timer' && (
                <FocusTimer />
              )}
              {view === 'performance' && (
                <Performance problems={problems} />
              )}
            </>
          )}
        </div>
      </div>

      {/* Floating "Log Problem" bubble - visible on every page */}
      {view !== 'form' && (
        <button
          onClick={() => setQuickAddOpen(true)}
          className="sb-fab"
          title="Log a new problem"
          aria-label="Log a new problem"
          style={{
            position: 'fixed',
            bottom: 28,
            right: 28,
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'var(--grad-frost)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 6px 24px rgba(56, 189, 248, 0.35), 0 2px 8px rgba(0,0,0,0.3)',
            zIndex: 40,
            transition: 'transform 0.2s var(--ease-out), box-shadow 0.2s var(--ease-out)'
          }}
        >
          <Plus size={26} color="#09090b" strokeWidth={2.5} />
        </button>
      )}

      {/* Quick-add modal triggered by the floating bubble */}
      {quickAddOpen && (
        <div
          onClick={() => setQuickAddOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 5, 7, 0.7)',
            backdropFilter: 'blur(6px)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            animation: 'fadeInFast 0.2s ease forwards'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 640,
              maxHeight: '88vh',
              overflowY: 'auto',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xl)',
              padding: '28px 28px 8px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h3 className="mono" style={{ fontSize: 16, fontWeight: 800 }}>Quick Log Problem</h3>
              <button className="btn-ghost" onClick={() => setQuickAddOpen(false)} style={{ padding: 6 }} title="Close">
                <X size={16} />
              </button>
            </div>
            <ProblemForm
              initial={null}
              onSave={handleQuickAdd}
              onCancel={() => setQuickAddOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <Loader2 size={36} className="sb-spin" color="var(--frost)" />
          <span className="mono" style={{ fontSize: 12, color: 'var(--text-faint)', letterSpacing: '0.08em' }}>INITIALIZING</span>
        </div>
      </div>
    );
  }

  return user ? <AppContent /> : <LoginPage />;
}
