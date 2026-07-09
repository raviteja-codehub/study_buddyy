import React, { useMemo } from 'react';
import { Flame, Brain, Target, AlertTriangle, Play, Calendar, Star, BookOpen } from 'lucide-react';

const COLORS = {
  bg: '#09090b',
  surface: '#0e0e11',
  border: 'rgba(255,255,255,0.08)',
  text: '#f4f4f5',
  textMuted: '#a1a1aa',
  textFaint: '#52525b',
  frost: '#38bdf8',
  ember: '#fb923c',
  signal: '#4ade80',
  danger: '#f87171',
};

const CONF_COLOR = { 1: COLORS.danger, 2: COLORS.danger, 3: COLORS.ember, 4: COLORS.signal, 5: COLORS.signal };

function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// Custom motivational quote based on streak size
function getStreakMessage(count) {
  if (count === 0) return "The hardest step is the first one. Solve a problem to begin your streak!";
  if (count <= 2) return "Off to a solid start! Keep the momentum going tomorrow.";
  if (count <= 5) return "Impressive consistency! Your neural pathways are strengthening.";
  return "You are in the zone! Google/Meta recruiters are sensing your energy.";
}

export default function Dashboard({ problems, streak, onGoQueue, onGoAdd }) {
  const today = todayStr();
  const dueToday = problems.filter(p => p.nextReview && p.nextReview <= today);
  const overdue = dueToday.filter(p => p.nextReview < today);

  // Group by pattern
  const byPattern = useMemo(() => {
    const map = {};
    problems.forEach(p => {
      if (!map[p.pattern]) map[p.pattern] = { count: 0, confSum: 0, confN: 0 };
      map[p.pattern].count++;
      const last = p.reviewHistory && p.reviewHistory.length 
        ? p.reviewHistory[p.reviewHistory.length - 1].confidence 
        : null;
      if (last) {
        map[p.pattern].confSum += last;
        map[p.pattern].confN++;
      }
    });
    return Object.entries(map)
      .map(([pattern, v]) => ({ 
        pattern, 
        count: v.count, 
        avgConf: v.confN ? v.confSum / v.confN : null 
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [problems]);

  const maxCount = Math.max(1, ...byPattern.map(p => p.count));
  const weak = byPattern.filter(p => p.avgConf !== null && p.avgConf < 3);

  // Heatmap review activity
  const activity = useMemo(() => {
    const map = {};
    problems.forEach(p => {
      (p.reviewHistory || []).forEach(r => {
        map[r.date] = (map[r.date] || 0) + 1;
      });
      if (p.createdAt) {
        map[p.createdAt] = (map[p.createdAt] || 0) + 1;
      }
    });
    return map;
  }, [problems]);

  const heatmapDays = useMemo(() => {
    const days = [];
    for (let i = 83; i >= 0; i--) {
      days.push(addDays(today, -i));
    }
    return days;
  }, [today]);

  const heatColor = (n) => {
    if (!n) return 'var(--surface-hover)';
    if (n === 1) return 'rgba(56, 189, 248, 0.25)';
    if (n === 2) return 'rgba(56, 189, 248, 0.55)';
    return 'var(--frost)';
  };

  // Top 3 oldest overdue problems for quick check
  const topOverdue = useMemo(() => {
    return [...problems]
      .filter(p => p.nextReview && p.nextReview <= today)
      .sort((a, b) => a.nextReview.localeCompare(b.nextReview))
      .slice(0, 3);
  }, [problems, today]);

  if (problems.length === 0) {
    return (
      <div style={{
        textAlign: 'center', padding: '80px 24px', border: `1px dashed var(--border)`,
        borderRadius: 16, background: 'var(--surface)', margin: '40px auto', maxWidth: 640
      }}>
        <Brain size={48} color="var(--text-faint)" style={{ marginBottom: 18 }} />
        <h3 className="mono" style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Initialize your prep workspace</h3>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 440, margin: '0 auto 24px', lineHeight: 1.6 }}>
          Log the first DSA problem you solved. Study Buddy will auto-generate summaries, compute revision cycles, and highlight structural weaknesses.
        </p>
        <button className="btn-primary" onClick={onGoAdd}>
          Log First Problem
        </button>
      </div>
    );
  }

  return (
    <div className="sb-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* Motivation and Streak Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.08), rgba(56, 189, 248, 0.03))',
        border: '1px solid rgba(251, 146, 60, 0.15)',
        borderRadius: 14,
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'var(--ember-dim)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(251, 146, 60, 0.25)',
          }}>
            <Flame size={24} className="sb-flame-animated" color="var(--ember)" />
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              Streak: {streak.count} Day{streak.count === 1 ? '' : 's'} Active
            </h3>
            <p style={{ fontSize: 13.5, color: 'var(--text-muted)', marginTop: 4 }}>
              {getStreakMessage(streak.count)}
            </p>
          </div>
        </div>
        
        {dueToday.length > 0 ? (
          <button className="btn-primary" onClick={onGoQueue} style={{
            background: 'var(--ember)', color: '#000', boxShadow: '0 2px 10px rgba(251, 146, 60, 0.2)'
          }}>
            <Play size={14} style={{ marginRight: 6 }} /> Start Revision ({dueToday.length})
          </button>
        ) : (
          <div style={{
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--signal)',
            background: 'var(--signal-dim)',
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px solid rgba(74, 222, 128, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <Target size={14} /> Review Queue Cleared
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <StatCard
          label="Due Today"
          value={dueToday.length}
          sub={overdue.length ? `${overdue.length} overdue` : 'all caught up'}
          accent={dueToday.length ? COLORS.frost : COLORS.signal}
          onClick={dueToday.length ? onGoQueue : undefined}
          clickable={dueToday.length > 0}
        />
        <StatCard
          label="Daily Active"
          value={streak.count}
          sub={streak.lastActive ? `Last solved: ${streak.lastActive}` : 'start today'}
          accent={COLORS.ember}
          icon={Flame}
        />
        <StatCard
          label="Total Logged"
          value={problems.length}
          sub={`${new Set(problems.map(p => p.pattern)).size} patterns mapped`}
          accent="#fff"
        />
        <StatCard
          label="Weak Spots"
          value={weak.length}
          sub={weak.length ? `${weak.map(w => w.pattern).slice(0, 1).join('')} + ${weak.length - 1} more` : 'none identified'}
          accent={weak.length ? COLORS.danger : COLORS.signal}
        />
      </div>

      {/* Core Panels Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
        {/* Solved by pattern graph */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <SectionLabel>Solved by Pattern</SectionLabel>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Top Topics</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 160, paddingBottom: 4, marginTop: 10 }}>
            {byPattern.map(p => {
              const h = Math.max(8, (p.count / maxCount) * 130);
              const color = p.avgConf === null ? 'var(--text-faint)' : CONF_COLOR[Math.round(p.avgConf)];
              return (
                <div key={p.pattern} title={`${p.pattern}: ${p.count} solved`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 0 }}>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.count}</div>
                  <div style={{
                    width: '100%',
                    maxWidth: 24,
                    height: h,
                    background: `linear-gradient(to top, ${color}cc, ${color})`,
                    borderRadius: '4px 4px 0 0',
                    transition: 'all 0.4s ease',
                    boxShadow: `0 0 10px ${color}1a`
                  }} />
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {byPattern.map(p => (
              <div key={p.pattern} className="mono" style={{
                fontSize: 9.5,
                color: 'var(--text-faint)',
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
                height: 75,
                flex: 1,
                textAlign: 'right',
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {p.pattern}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, borderTop: '1px solid var(--border)', paddingTop: 12, fontSize: 11.5, color: 'var(--text-muted)' }}>
            <LegendDot color={COLORS.danger} label="Critical (<3)" />
            <LegendDot color={COLORS.ember} label="Unstable (3-4)" />
            <LegendDot color={COLORS.signal} label="Mastered (4+)" />
          </div>
        </div>

        {/* Calendar heatmap */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <SectionLabel>Recall Activity</SectionLabel>
            <span style={{ fontSize: 11.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Calendar size={13} /> Last 12 Weeks
            </span>
          </div>

          <div className="heatmap-grid" style={{ marginTop: 12 }}>
            {heatmapDays.map(d => (
              <div
                key={d}
                className="heatmap-cell"
                title={`${d}: ${activity[d] || 0} event${(activity[d] || 0) === 1 ? '' : 's'}`}
                style={{ backgroundColor: heatColor(activity[d]) }}
              />
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 12, fontSize: 11.5, color: 'var(--text-muted)' }}>
            <span>Less Active</span>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--surface-hover)' }} />
              <div style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(56, 189, 248, 0.25)' }} />
              <div style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(56, 189, 248, 0.55)' }} />
              <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--frost)' }} />
            </div>
            <span>More Active</span>
          </div>
        </div>
      </div>

      {/* Secondary Bottom row (Weakness Alerts & Quick reviews) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
        {/* Weak pattern alerts */}
        {weak.length > 0 ? (
          <div className="card" style={{
            background: 'rgba(248, 113, 113, 0.04)',
            border: '1px solid rgba(248, 113, 113, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--danger)' }}>
              <AlertTriangle size={18} />
              <SectionLabel style={{ color: 'var(--danger)' }}>Unstable Topics Flagged</SectionLabel>
            </div>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--text-muted)' }}>
              Your average confidence rating is sub-optimal (&lt; 3.0) in these topics. Focus review efforts here to rebuild your baseline:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
              {weak.map(w => (
                <div key={w.pattern} className="mono" style={{
                  fontSize: 11.5,
                  padding: '4px 10px',
                  borderRadius: 6,
                  background: 'rgba(248, 113, 113, 0.08)',
                  border: '1px solid rgba(248, 113, 113, 0.2)',
                  color: 'var(--danger)'
                }}>
                  {w.pattern} ({Number(w.avgConf).toFixed(1)} ★)
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="card" style={{
            background: 'rgba(74, 222, 128, 0.04)',
            border: '1px solid rgba(74, 222, 128, 0.12)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--signal)' }}>
              <Star size={18} />
              <SectionLabel style={{ color: 'var(--signal)' }}>Optimal Mastery Achieved</SectionLabel>
            </div>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--text-muted)' }}>
              Excellent! No structural weaknesses identified. Keep solving problems and rating them honestly to maintain this state.
            </p>
          </div>
        )}

        {/* Quick Revision Drawer */}
        {topOverdue.length > 0 && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <SectionLabel style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <BookOpen size={15} /> Immediate Revision Priority
            </SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {topOverdue.map(p => (
                <div key={p.id} onClick={onGoQueue} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'var(--surface-hover)',
                  border: '1px solid var(--border)',
                  padding: '10px 14px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  transition: 'border-color 0.2s'
                }} className="card-hover">
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.title}
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 4, alignItems: 'center' }}>
                      <span className="mono" style={{ fontSize: 10, color: 'var(--frost)', background: 'var(--frost-dim)', padding: '1px 6px', borderRadius: 4 }}>
                        {p.pattern}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                        Overdue
                      </span>
                    </div>
                  </div>
                  <Play size={12} color="var(--text-muted)" style={{ marginLeft: 8 }} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: 'inline-block' }} />
      {label}
    </span>
  );
}

function SectionLabel({ children, style }) {
  return (
    <div className="mono" style={{
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: 'var(--text-muted)',
      ...style
    }}>
      {children}
    </div>
  );
}

function StatCard({ label, value, sub, accent, icon: Icon, onClick, clickable }) {
  return (
    <div
      onClick={clickable ? onClick : undefined}
      className="card sb-card"
      style={{
        cursor: clickable ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="mono" style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>
          {label}
        </div>
        {Icon && <Icon size={14} color={accent} />}
      </div>
      <div className="mono" style={{ fontSize: 28, fontWeight: 800, color: accent, marginTop: 8, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 8 }}>
        {sub}
      </div>
      {clickable && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: 0,
          height: 0,
          borderStyle: 'solid',
          borderWidth: '0 0 10px 10px',
          borderColor: `transparent transparent ${accent} transparent`
        }} />
      )}
    </div>
  );
}
