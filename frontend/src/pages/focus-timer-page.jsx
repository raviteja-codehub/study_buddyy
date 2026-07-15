import React, { useEffect, useMemo, useState } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import { Timer, Play, Pause, RotateCcw } from 'lucide-react';

const SESSION_CONFIG = {
  work: { label: 'Work Session', duration: 25 * 60, description: 'Focus time for study and problem solving.' },
  shortBreak: { label: 'Short Break', duration: 5 * 60, description: 'A quick reset to recharge your focus.' },
  longBreak: { label: 'Long Break', duration: 15 * 60, description: 'A longer rest after multiple work cycles.' }
};

const SESSION_ORDER = ['work', 'shortBreak', 'work', 'shortBreak', 'work', 'longBreak'];

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function FocusTimer() {
  const [sessionType, setSessionType] = useState('work');
  const [secondsLeft, setSecondsLeft] = useState(SESSION_CONFIG.work.duration);
  const [timerRunning, setTimerRunning] = useState(false);
  const [cycleIndex, setCycleIndex] = useState(0);

  useEffect(() => {
    setSecondsLeft(SESSION_CONFIG[sessionType].duration);
  }, [sessionType]);

  useEffect(() => {
    if (!timerRunning) return undefined;
    if (secondsLeft <= 0) return undefined;

    const intervalId = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [timerRunning, secondsLeft]);

  useEffect(() => {
    if (secondsLeft !== 0 || !timerRunning) return;

    const nextIndex = (cycleIndex + 1) % SESSION_ORDER.length;
    const nextSession = SESSION_ORDER[nextIndex];

    setCycleIndex(nextIndex);
    setSessionType(nextSession);
    setTimerRunning(true);
  }, [secondsLeft, timerRunning, cycleIndex]);

  const currentSession = SESSION_CONFIG[sessionType];

  const nextSession = useMemo(() => {
    const nextIndex = (cycleIndex + 1) % SESSION_ORDER.length;
    return SESSION_CONFIG[SESSION_ORDER[nextIndex]].label;
  }, [cycleIndex]);

  const handleSessionChange = (type) => {
    setSessionType(type);
    setSecondsLeft(SESSION_CONFIG[type].duration);
    setTimerRunning(false);
    const newIndex = SESSION_ORDER.findIndex((value) => value === type);
    setCycleIndex(newIndex === -1 ? 0 : newIndex);
  };

  const handleReset = () => {
    setSecondsLeft(SESSION_CONFIG[sessionType].duration);
    setTimerRunning(false);
  };

  return (
    <div className="sb-fade-in" style={{ maxWidth: 660, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Card
        title="Focus Timer"
        subtitle="Pomodoro-style interval tracking for your DSA practice."
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 20px', gap: '28px' }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            {Object.entries(SESSION_CONFIG).map(([type, config]) => (
              <Button
                key={type}
                variant={type === sessionType ? 'primary' : 'outline'}
                onClick={() => handleSessionChange(type)}
                style={{ minWidth: 110, padding: '10px 14px' }}
              >
                {config.label}
              </Button>
            ))}
          </div>

          <div style={{
            width: '240px',
            height: '240px',
            borderRadius: '50%',
            border: '4px solid var(--border-strong)',
            borderTopColor: 'var(--frost)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: timerRunning ? '0 0 35px rgba(56, 189, 248, 0.15), inset 0 0 30px rgba(56, 189, 248, 0.03)' : 'var(--shadow-lg)',
            position: 'relative',
            transition: 'box-shadow 0.4s var(--ease-out)'
          }}>
            {timerRunning && (
              <div style={{
                position: 'absolute',
                inset: -4,
                borderRadius: '50%',
                border: '4px solid transparent',
                borderTopColor: 'var(--frost)',
                animation: 'spin 2s linear infinite',
                opacity: 0.3
              }} />
            )}
            <Timer size={36} color="var(--frost)" style={{ opacity: 0.9, marginBottom: 10 }} />
            <span className="mono" style={{ fontSize: '46px', fontWeight: 800, letterSpacing: '-0.04em', textShadow: '0 0 20px rgba(56, 189, 248, 0.2)' }}>
              {formatTime(secondsLeft)}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 6 }}>
              {currentSession.label}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button
              variant="primary"
              icon={timerRunning ? Pause : Play}
              onClick={() => setTimerRunning((current) => !current)}
            >
              {timerRunning ? 'Pause' : sessionType === 'work' ? 'Start Focus' : 'Start Break'}
            </Button>
            <Button
              variant="outline"
              icon={RotateCcw}
              onClick={handleReset}
            >
              Reset
            </Button>
          </div>

          <div style={{
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.15)',
            borderRadius: 12,
            padding: '14px 18px',
            textAlign: 'center',
            maxWidth: 480
          }}>
            <p style={{ fontSize: '13px', color: 'var(--frost)', fontWeight: 600, marginBottom: 6 }}>
              ⚡ Built-in cycle support
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
              The timer now runs as a real Pomodoro cycle. Choose work, short break, or long break; start, pause, or reset; and the next session is queued automatically.
            </p>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 10 }}>
              Next session:&nbsp;<strong style={{ color: '#fff' }}>{nextSession}</strong>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
