import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Play, Pause, RotateCcw, TriangleAlert as AlertTriangle, ExternalLink, ArrowLeft, Eye, CircleCheck as CheckCircle, Check, Clock, Trophy } from 'lucide-react';
import Badge from '../components/ui/Badge';

const COLORS = {
  easy: '#4ade80',
  medium: '#fb923c',
  hard: '#f87171',
  frost: '#38bdf8',
  frostDim: 'rgba(56, 189, 248, 0.12)',
  ember: '#fb923c',
  emberDim: 'rgba(251, 146, 60, 0.12)',
  signal: '#4ade80',
  danger: '#f87171',
};

const CONF_LABEL = { 1: 'Blanked', 2: 'Shaky', 3: 'Okay', 4: 'Solid', 5: 'Nailed it' };
const CONF_COLOR = { 1: COLORS.danger, 2: COLORS.danger, 3: COLORS.ember, 4: COLORS.signal, 5: COLORS.signal };

// The 1-3-7 rule: every problem gets exactly 3 revisions, on Day 1, Day 3,
// and Day 7 after it was first logged.
const STAGE_LABELS = ['Day 1', 'Day 3', 'Day 7'];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a, b) {
  const d1 = new Date(a + 'T00:00:00');
  const d2 = new Date(b + 'T00:00:00');
  return Math.round((d2 - d1) / 86400000);
}

function DifficultyBadge({ level }) {
  const variant = level ? level.toLowerCase() : 'medium';
  return <Badge variant={variant} type="dim">{level}</Badge>;
}

// Small visual tracker showing progress through the 1-3-7 rule:
// Day 1 -> Day 3 -> Day 7, each either done / due-now / upcoming.
function StageTracker({ revisionStage = 0, isOverdueStage, compact }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: compact ? 4 : 6 }}>
      {STAGE_LABELS.map((label, i) => {
        const done = revisionStage > i;
        const current = revisionStage === i;
        let bg = 'var(--surface-hover)';
        let color = 'var(--text-faint)';
        let border = '1px solid var(--border)';
        if (done) {
          bg = 'rgba(74, 222, 128, 0.12)';
          color = 'var(--signal)';
          border = '1px solid rgba(74, 222, 128, 0.3)';
        } else if (current) {
          bg = isOverdueStage ? 'rgba(248, 113, 113, 0.12)' : 'rgba(56, 189, 248, 0.12)';
          color = isOverdueStage ? 'var(--danger)' : 'var(--frost)';
          border = `1px solid ${isOverdueStage ? 'rgba(248, 113, 113, 0.35)' : 'rgba(56, 189, 248, 0.35)'}`;
        }
        return (
          <React.Fragment key={label}>
            <div
              title={`${label}: ${done ? 'Completed' : current ? 'Due now' : 'Upcoming'}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: compact ? '3px 7px' : '4px 9px',
                borderRadius: 'var(--radius-full)',
                background: bg,
                color,
                border,
                fontSize: compact ? 10 : 11,
                fontWeight: 700,
                whiteSpace: 'nowrap'
              }}
              className="mono"
            >
              {done ? <Check size={compact ? 10 : 11} /> : current ? <Clock size={compact ? 10 : 11} /> : null}
              {label}
            </div>
            {i < STAGE_LABELS.length - 1 && (
              <div style={{ width: compact ? 8 : 12, height: 1, background: 'var(--border-strong)' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function RevisionQueue({ problems, onRate, activeProblemId, onBack }) {
  const today = todayStr();

  // Local state for which problem is being actively reviewed (via flip-card).
  // Initialized from the parent's activeProblemId (used when "Review" is
  // clicked from the Problems Log page), but can also be set by clicking a
  // card in the board below.
  const [localReviewId, setLocalReviewId] = useState(activeProblemId || null);

  useEffect(() => {
    setLocalReviewId(activeProblemId || null);
  }, [activeProblemId]);

  // ---- Group problems by the 1-3-7 rule status ----
  const grouped = useMemo(() => {
    const overdue = [];
    const dueToday = [];
    const upcoming = [];
    const mastered = [];

    problems.forEach(p => {
      if (p.mastered || !p.nextReview) {
        if (p.revisionStage >= 3 || p.mastered) mastered.push(p);
        return;
      }
      if (p.nextReview < today) overdue.push(p);
      else if (p.nextReview === today) dueToday.push(p);
      else upcoming.push(p);
    });

    overdue.sort((a, b) => (a.nextReview || '').localeCompare(b.nextReview || ''));
    dueToday.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    upcoming.sort((a, b) => (a.nextReview || '').localeCompare(b.nextReview || ''));
    mastered.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    return { overdue, dueToday, upcoming, mastered };
  }, [problems, today]);

  const dueQueue = useMemo(
    () => [...grouped.overdue, ...grouped.dueToday],
    [grouped]
  );

  // ---- Flip-card review flow for a single active problem ----
  const activeProblem = localReviewId ? problems.find(p => p.id === localReviewId) : null;

  const [isFlipped, setIsFlipped] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerInterval = useRef(null);
  const [revTimeSpent, setRevTimeSpent] = useState(1);

  useEffect(() => {
    setSeconds(0);
    setTimerRunning(!!activeProblem);
    setIsFlipped(false);
    setRevTimeSpent(1);
  }, [localReviewId]);

  useEffect(() => {
    if (timerRunning) {
      timerInterval.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else {
      clearInterval(timerInterval.current);
    }
    return () => clearInterval(timerInterval.current);
  }, [timerRunning]);

  const formatTime = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startReview = (id) => {
    setLocalReviewId(id);
  };

  const exitReview = () => {
    setLocalReviewId(null);
    if (activeProblemId && onBack) onBack();
  };

  const handleRate = (confidence) => {
    onRate(activeProblem.id, confidence, revTimeSpent);
    setIsFlipped(false);

    // Move to the next due item in queue automatically, if any remain
    const remaining = dueQueue.filter(p => p.id !== activeProblem.id);
    if (activeProblemId) {
      // Came here via a direct single-problem review link -> exit after rating
      exitReview();
      return;
    }
    if (remaining.length > 0) {
      setLocalReviewId(remaining[0].id);
    } else {
      setLocalReviewId(null);
    }
  };

  // ==================== FLIP-CARD REVIEW VIEW ====================
  if (activeProblem) {
    const stageIdx = activeProblem.revisionStage || 0;
    const stageLabel = STAGE_LABELS[stageIdx] || 'Final';
    return (
      <div className="sb-fade-in" style={{ maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Top Header Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button className="btn-ghost" onClick={exitReview} style={{ display: 'flex', gap: 6, fontSize: 13 }}>
            <ArrowLeft size={14} /> Back to Queue
          </button>
          <div className="mono" style={{ fontSize: 12, color: 'var(--frost)', background: 'var(--frost-dim)', padding: '4px 10px', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>
            {stageLabel} Revision
          </div>
        </div>

        {/* Stage progress for this specific problem */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <StageTracker revisionStage={stageIdx} isOverdueStage={activeProblem.nextReview < today} />
        </div>

        {/* Timer Capsule widget */}
        <div style={{
          alignSelf: 'center',
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(var(--glass-blur))',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-full)',
          padding: '7px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          boxShadow: timerRunning ? '0 0 20px rgba(56, 189, 248, 0.08), var(--shadow-sm)' : 'var(--shadow-sm)',
          transition: 'box-shadow 0.3s var(--ease-out)'
        }}>
          <span className="mono" style={{ fontSize: 14, fontWeight: 700, color: timerRunning ? 'var(--frost)' : 'var(--text-muted)', textShadow: timerRunning ? '0 0 12px rgba(56, 189, 248, 0.3)' : 'none' }}>
            {formatTime(seconds)}
          </span>
          <div style={{ display: 'flex', gap: 6, borderLeft: '1px solid var(--border)', paddingLeft: 10 }}>
            <button
              onClick={() => setTimerRunning(!timerRunning)}
              style={{ padding: 2, color: 'var(--text-muted)', transition: 'color 0.2s' }}
              title={timerRunning ? 'Pause timer' : 'Start timer'}
            >
              {timerRunning ? <Pause size={13} /> : <Play size={13} />}
            </button>
            <button
              onClick={() => setSeconds(0)}
              style={{ padding: 2, color: 'var(--text-muted)', transition: 'color 0.2s' }}
              title="Reset timer"
            >
              <RotateCcw size={13} />
            </button>
          </div>
        </div>

        {/* Flipped Card Component */}
        <div className={`flip-card ${isFlipped ? 'flipped' : ''}`} style={{ height: '420px' }}>
          <div className="flip-card-inner">

            {/* Front layout */}
            <div className="flip-card-front">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <DifficultyBadge level={activeProblem.difficulty} />
                  <Badge color="var(--frost)" bg="var(--frost-dim)">{activeProblem.pattern}</Badge>
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1.3, letterSpacing: '-0.01em' }}>{activeProblem.title}</h2>
                {activeProblem.link && (
                  <a
                    href={activeProblem.link}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: 'var(--frost)', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 5, transition: 'color 0.2s' }}
                    onClick={e => e.stopPropagation()}
                  >
                    Solve on external platform <ExternalLink size={12} />
                  </a>
                )}
                {activeProblem.summary && (
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.01)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: 16,
                    marginTop: 10
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-faint)', letterSpacing: 0.5, marginBottom: 8 }} className="mono">
                      Problem Summary
                    </div>
                    <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.55 }}>
                      {activeProblem.summary.summary}
                    </p>
                  </div>
                )}
              </div>

              <button
                className="btn-primary"
                onClick={() => {
                  setIsFlipped(true);
                  setRevTimeSpent(Math.max(1, Math.round(seconds / 60)));
                }}
                style={{ width: '100%', padding: '12px 0', display: 'flex', gap: 8 }}
              >
                <Eye size={15} /> Reveal Notes & rate confidence
              </button>
            </div>

            {/* Back layout */}
            <div className="flip-card-back">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1, minHeight: 0 }}>
                <div className="mono" style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--frost)', letterSpacing: 0.4, textTransform: 'uppercase' }}>
                  Your solution notes
                </div>
                <div style={{
                  fontSize: 13.5,
                  lineHeight: 1.6,
                  color: 'var(--text-muted)',
                  whiteSpace: 'pre-wrap',
                  overflowY: 'auto',
                  flex: 1,
                  paddingRight: 6
                }}>
                  {activeProblem.notes || 'No solution notes saved for this problem.'}
                </div>

                {activeProblem.mistakes && (
                  <div style={{
                    background: 'var(--ember-dim)',
                    border: '1px solid rgba(251, 146, 60, 0.15)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 12px',
                    fontSize: 12.5,
                    lineHeight: 1.55,
                    display: 'flex',
                    gap: 8,
                    alignItems: 'flex-start'
                  }}>
                    <AlertTriangle size={14} color="var(--ember)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <span style={{ fontWeight: 700, color: 'var(--ember)' }}>Mistake Log:</span> {activeProblem.mistakes}
                    </div>
                  </div>
                )}

                {activeProblem.summary && (
                  <div className="mono" style={{ display: 'flex', gap: 16, fontSize: 11.5, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                    <span>Time: <strong style={{ color: 'var(--ember)' }}>{activeProblem.summary.timeComplexity}</strong></span>
                    <span>Space: <strong style={{ color: 'var(--ember)' }}>{activeProblem.summary.spaceComplexity}</strong></span>
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                    Time Spent (Minutes):
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={revTimeSpent}
                    onChange={e => setRevTimeSpent(Number(e.target.value) || 1)}
                    style={{ width: '70px', padding: '4px 8px', fontSize: 12, textAlign: 'center' }}
                  />
                </div>

                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>
                  Rate your recall confidence:
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      onClick={() => handleRate(n)}
                      style={{
                        flex: 1,
                        padding: '9px 0',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 11.5,
                        fontWeight: 700,
                        border: '1px solid var(--border)',
                        background: `${CONF_COLOR[n]}15`,
                        color: CONF_COLOR[n],
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 2,
                        transition: 'all 0.25s var(--ease-out)'
                      }}
                    >
                      <span className="mono" style={{ fontSize: 14 }}>{n}</span>
                      <span style={{ fontSize: 9, fontWeight: 500, opacity: 0.8 }}>{CONF_LABEL[n]}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    );
  }

  // ==================== BOARD VIEW ====================
  const totalActive = grouped.overdue.length + grouped.dueToday.length + grouped.upcoming.length;

  if (problems.length === 0) {
    return (
      <div className="sb-fade-in" style={{
        textAlign: 'center', padding: '80px 24px', border: `1px dashed var(--border-strong)`,
        borderRadius: 'var(--radius-xl)', background: 'var(--surface)', margin: '40px auto', maxWidth: 600,
        boxShadow: 'var(--shadow-md)'
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16, background: 'var(--frost-dim)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
          border: '1px solid rgba(56, 189, 248, 0.15)'
        }}>
          <Clock size={32} color="var(--frost)" />
        </div>
        <h3 className="mono" style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No Problems Logged Yet</h3>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 420, margin: '0 auto', lineHeight: 1.6 }}>
          Log your first problem and Study Buddy will automatically schedule its 1-3-7 rule
          revisions: Day 1, Day 3, and Day 7 after you solve it.
        </p>
      </div>
    );
  }

  return (
    <div className="sb-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* Header */}
      <div>
        <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', color: '#fff', marginBottom: 4 }}>
          Revision Queue
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Every problem follows the <strong style={{ color: 'var(--frost)' }}>1-3-7 rule</strong>: revised on Day 1, Day 3, and Day 7 after you first log it.
        </p>
      </div>

      {/* Counter badges */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <CountBadge label="Overdue" count={grouped.overdue.length} color={COLORS.danger} bg="rgba(248, 113, 113, 0.1)" />
        <CountBadge label="Due Today" count={grouped.dueToday.length} color={COLORS.frost} bg="var(--frost-dim)" />
        <CountBadge label="Upcoming" count={grouped.upcoming.length} color={COLORS.ember} bg="var(--ember-dim)" />
        <CountBadge label="Mastered" count={grouped.mastered.length} color={COLORS.signal} bg="var(--signal-dim)" />
      </div>

      {totalActive === 0 && grouped.mastered.length > 0 && (
        <div className="sb-fade-in" style={{
          textAlign: 'center', padding: '48px 24px', border: `1px dashed var(--border-strong)`,
          borderRadius: 'var(--radius-xl)', background: 'var(--surface)', boxShadow: 'var(--shadow-md)'
        }}>
          <CheckCircle size={32} color="var(--signal)" style={{ marginBottom: 12 }} />
          <h3 className="mono" style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Revision Queue Cleared!</h3>
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>Nothing due right now. Check back tomorrow, or log a new problem.</p>
        </div>
      )}

      {/* Board: three columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        <QueueColumn
          title="Overdue"
          icon={<AlertTriangle size={15} />}
          color={COLORS.danger}
          items={grouped.overdue}
          today={today}
          emptyText="Nothing overdue. Great job staying on schedule."
          onStart={startReview}
        />
        <QueueColumn
          title="Due Today"
          icon={<Clock size={15} />}
          color={COLORS.frost}
          items={grouped.dueToday}
          today={today}
          emptyText="No revisions due today."
          onStart={startReview}
        />
        <QueueColumn
          title="Upcoming"
          icon={<Play size={15} />}
          color={COLORS.ember}
          items={grouped.upcoming}
          today={today}
          emptyText="No upcoming revisions scheduled."
          onStart={startReview}
          upcoming
        />
      </div>

      {/* Mastered problems */}
      {grouped.mastered.length > 0 && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--signal)' }}>
            <Trophy size={16} />
            <span className="mono" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Mastered ({grouped.mastered.length}) — completed all 3 revisions
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {grouped.mastered.map(p => (
              <div key={p.id} className="mono" style={{
                fontSize: 11.5, padding: '5px 11px', borderRadius: 'var(--radius-sm)',
                background: 'var(--signal-dim)', border: '1px solid rgba(74, 222, 128, 0.2)', color: 'var(--signal)'
              }}>
                {p.title}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CountBadge({ label, count, color, bg }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
      borderRadius: 'var(--radius-full)', background: bg, border: `1px solid ${color}33`
    }}>
      <span className="mono" style={{ fontSize: 15, fontWeight: 800, color }}>{count}</span>
      <span style={{ fontSize: 12.5, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
    </div>
  );
}

function QueueColumn({ title, icon, color, items, today, emptyText, onStart, upcoming }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
        {icon}
        <span className="mono" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {title}
        </span>
        <span className="mono" style={{ marginLeft: 'auto', fontSize: 11, opacity: 0.7 }}>{items.length}</span>
      </div>

      {items.length === 0 ? (
        <div style={{ fontSize: 12.5, color: 'var(--text-faint)', padding: '12px 4px', textAlign: 'center' }}>
          {emptyText}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map(p => (
            <RevisionCard key={p.id} problem={p} today={today} color={color} onStart={onStart} upcoming={upcoming} />
          ))}
        </div>
      )}
    </div>
  );
}

function RevisionCard({ problem, today, color, onStart, upcoming }) {
  const stageIdx = problem.revisionStage || 0;
  const stageLabel = STAGE_LABELS[stageIdx] || 'Final';
  const daysAway = problem.nextReview ? daysBetween(today, problem.nextReview) : null;

  return (
    <div
      onClick={() => onStart(problem.id)}
      className="card-hover"
      style={{
        background: 'var(--surface-hover)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        padding: '12px 14px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        transition: 'all 0.2s var(--ease-out)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {problem.title}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 5, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="mono" style={{ fontSize: 10, color: 'var(--frost)', background: 'var(--frost-dim)', padding: '2px 7px', borderRadius: 4 }}>
              {problem.pattern}
            </span>
            <DifficultyTag level={problem.difficulty} />
          </div>
        </div>
      </div>

      <StageTracker revisionStage={stageIdx} isOverdueStage={!upcoming && problem.nextReview < today} compact />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--text-faint)' }}>
        <span>
          {upcoming
            ? `${stageLabel} in ${daysAway} day${daysAway === 1 ? '' : 's'}`
            : problem.nextReview < today
              ? `${stageLabel} overdue by ${Math.abs(daysAway)} day${Math.abs(daysAway) === 1 ? '' : 's'}`
              : `${stageLabel} due today`}
        </span>
      </div>

      {!upcoming && (
        <button
          className="btn-primary"
          onClick={(e) => { e.stopPropagation(); onStart(problem.id); }}
          style={{ width: '100%', padding: '8px 0', fontSize: 12.5, display: 'flex', justifyContent: 'center', gap: 6 }}
        >
          <Play size={12} /> Mark as Revised
        </button>
      )}
    </div>
  );
}

function DifficultyTag({ level }) {
  const c = level === 'Easy' ? COLORS.easy : level === 'Hard' ? COLORS.hard : COLORS.medium;
  return (
    <span className="mono" style={{ fontSize: 10, color: c, background: `${c}18`, padding: '2px 7px', borderRadius: 4 }}>
      {level}
    </span>
  );
}
