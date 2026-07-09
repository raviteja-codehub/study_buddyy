import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, AlertTriangle, ExternalLink, ArrowLeft, ArrowRight, Eye, CheckCircle } from 'lucide-react';

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

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function Badge({ children, color, bg }) {
  return (
    <span className="mono" style={{
      fontSize: 10.5, fontWeight: 700, letterSpacing: 0.3, textTransform: 'uppercase',
      color, background: bg, padding: '3px 8px', borderRadius: 4, whiteSpace: 'nowrap',
    }}>{children}</span>
  );
}

function DifficultyBadge({ level }) {
  const map = { Easy: [COLORS.easy, 'rgba(74, 222, 128, 0.12)'], Medium: [COLORS.medium, 'rgba(251, 146, 60, 0.12)'], Hard: [COLORS.hard, 'rgba(248, 113, 113, 0.12)'] };
  const [c, bg] = map[level] || map.Medium;
  return <Badge color={c} bg={bg}>{level}</Badge>;
}

export default function RevisionQueue({ problems, onRate, activeProblemId, onBack }) {
  const today = todayStr();
  
  // Resolve due items
  const dueProblems = useMemoProblems();

  function useMemoProblems() {
    // If activeProblemId is specified, review just that single problem.
    if (activeProblemId) {
      const p = problems.find(item => item.id === activeProblemId);
      return p ? [p] : [];
    }
    // Otherwise review all due items
    return problems
      .filter(p => p.nextReview && p.nextReview <= today)
      .sort((a, b) => (a.nextReview || '').localeCompare(b.nextReview || ''));
  }

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Timer States
  const [seconds, setSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerInterval = useRef(null);

  const activeProblem = dueProblems[Math.min(currentIndex, dueProblems.length - 1)];

  // Start timer automatically when a card mounts
  useEffect(() => {
    setSeconds(0);
    setTimerRunning(true);
    setIsFlipped(false);
  }, [currentIndex, activeProblemId]);

  useEffect(() => {
    if (timerRunning) {
      timerInterval.current = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    } else {
      clearInterval(timerInterval.current);
    }
    return () => clearInterval(timerInterval.current);
  }, [timerRunning]);

  if (dueProblems.length === 0) {
    return (
      <div style={{
        textAlign: 'center', padding: '80px 24px', border: `1px dashed var(--border)`,
        borderRadius: 16, background: 'var(--surface)', margin: '40px auto', maxWidth: 600
      }}>
        <CheckCircle size={48} color="var(--signal)" style={{ marginBottom: 18, filter: 'drop-shadow(0 0 10px rgba(74,222,128,0.2))' }} />
        <h3 className="mono" style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Revision Queue Cleared!</h3>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 385, margin: '0 auto 24px', lineHeight: 1.6 }}>
          You've revised all overdue problems. Take a break, check your dashboard metrics, or add new challenges to your pipeline.
        </p>
        {onBack && (
          <button className="btn-secondary" onClick={onBack}>
            Return to Dashboard
          </button>
        )}
      </div>
    );
  }

  const handleRate = (confidence) => {
    onRate(activeProblem.id, confidence);
    setIsFlipped(false);
    
    // If reviewing single problem, exit on rate
    if (activeProblemId && onBack) {
      onBack();
      return;
    }

    if (currentIndex < dueProblems.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Completed the queue!
      setCurrentIndex(dueProblems.length);
    }
  };

  const formatTime = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="sb-fade-in" style={{ maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      
      {/* Top Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {onBack && (
          <button className="btn-ghost" onClick={onBack} style={{ display: 'flex', gap: 6, fontSize: 13 }}>
            <ArrowLeft size={14} /> Back
          </button>
        )}
        <div className="mono" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Problem <span style={{ color: '#fff', fontWeight: 700 }}>{Math.min(currentIndex + 1, dueProblems.length)}</span> of {dueProblems.length}
        </div>
        <div style={{ width: 60 }} /> {/* balance layout spacing */}
      </div>

      {/* Timer Capsule widget */}
      <div style={{
        alignSelf: 'center',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: '6px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: timerRunning ? '0 0 15px rgba(56, 189, 248, 0.05)' : 'none'
      }}>
        <span className="mono" style={{ fontSize: 14, fontWeight: 700, color: timerRunning ? 'var(--frost)' : 'var(--text-muted)' }}>
          {formatTime(seconds)}
        </span>
        <div style={{ display: 'flex', gap: 6, borderLeft: '1px solid var(--border)', paddingLeft: 10 }}>
          <button 
            onClick={() => setTimerRunning(!timerRunning)} 
            style={{ padding: 2, color: 'var(--text-muted)' }}
            title={timerRunning ? 'Pause timer' : 'Start timer'}
          >
            {timerRunning ? <Pause size={13} /> : <Play size={13} />}
          </button>
          <button 
            onClick={() => setSeconds(0)} 
            style={{ padding: 2, color: 'var(--text-muted)' }}
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
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1.3 }}>{activeProblem.title}</h2>
              {activeProblem.link && (
                <a 
                  href={activeProblem.link} 
                  target="_blank" 
                  rel="noreferrer" 
                  style={{ color: 'var(--frost)', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 5 }}
                  onClick={e => e.stopPropagation()}
                >
                  Solve on external platform <ExternalLink size={12} />
                </a>
              )}
              {activeProblem.summary && (
                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.01)', 
                  border: '1px solid var(--border)', 
                  borderRadius: 10, 
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
              onClick={() => setIsFlipped(true)}
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
                  borderRadius: 8, 
                  padding: '8px 12px', 
                  fontSize: 12.5, 
                  lineHeight: 1.5,
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
                      padding: '8px 0', 
                      borderRadius: 8, 
                      fontSize: 11.5, 
                      fontWeight: 700,
                      border: '1px solid var(--border)', 
                      background: `${CONF_COLOR[n]}15`, 
                      color: CONF_COLOR[n],
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 2
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
