import React from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Timer, Play, Pause, RotateCcw } from 'lucide-react';
import { useFocusTimer } from '../context/FocusTimerContext';

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function FocusTimer() {
  const {
    focusDuration, breakDuration,
    focusSecondsLeft, breakSecondsLeft,
    focusStatus, breakStatus,
    alarmActive, alarmTimerType,
    handleFocusDurationChange, handleBreakDurationChange,
    handleToggleFocus, handleResetFocus,
    handleToggleBreak, handleResetBreak,
    stopAlarmSound,
  } = useFocusTimer();

  return (
    <div className="sb-fade-in" style={{ maxWidth: 740, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Alarm Warning Overlay */}
      {alarmActive && (
        <div className="sb-fade-in" style={{
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: '12px',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 0 20px rgba(239, 68, 68, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px', animation: 'pulse 1s infinite' }}>🔔</span>
            <div>
              <strong style={{ color: '#fff', fontSize: '14px' }}>
                {alarmTimerType === 'work' ? 'Focus Session Finished!' : 'Break Session Finished!'}
              </strong>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                Alarm ringing (auto-stops in 30 seconds).
              </p>
            </div>
          </div>
          <Button variant="primary" style={{ background: '#f87171', borderColor: '#ef4444', color: '#09090b', fontWeight: 'bold' }} onClick={stopAlarmSound}>
            Stop Alarm
          </Button>
        </div>
      )}

      {/* Grid containing both timers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px',
        alignItems: 'start',
        width: '100%'
      }}>

        {/* FOCUS TIMER CARD */}
        <Card
          title="Focus Session"
          subtitle="Dedicated practice time to solve DSA problems."
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 8px 24px 8px', gap: '20px' }}>

            {/* Focus Duration Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '300px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
                <span>Focus Duration</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="number"
                    min="1"
                    max="300"
                    value={focusDuration}
                    onChange={(e) => handleFocusDurationChange(Number(e.target.value))}
                    disabled={focusStatus === 'running'}
                    className="mono"
                    style={{
                      width: '54px',
                      padding: '3px 6px',
                      fontSize: '12.5px',
                      textAlign: 'center',
                      color: 'var(--frost)',
                      cursor: focusStatus === 'running' ? 'not-allowed' : 'text'
                    }}
                  />
                  <span className="mono" style={{ color: 'var(--frost)' }}>{focusDuration === 1 ? 'min' : 'mins'}</span>
                </div>
              </div>
              <input
                type="range"
                min="1"
                max="300"
                value={focusDuration}
                onChange={(e) => handleFocusDurationChange(Number(e.target.value))}
                disabled={focusStatus === 'running'}
                style={{
                  width: '100%',
                  accentColor: 'var(--frost)',
                  cursor: focusStatus === 'running' ? 'not-allowed' : 'pointer'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-faint)' }}>
                <span>1 min</span>
                <span>5 hrs (300 min)</span>
              </div>
            </div>

            {/* Focus Circular Display */}
            <div style={{
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              border: '4px solid var(--border-strong)',
              borderTopColor: 'var(--frost)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: focusStatus === 'running' ? '0 0 35px rgba(56, 189, 248, 0.15), inset 0 0 30px rgba(56, 189, 248, 0.03)' : 'var(--shadow-lg)',
              position: 'relative',
              transition: 'box-shadow 0.4s var(--ease-out)'
            }}>
              {focusStatus === 'running' && (
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
              <Timer size={28} color="var(--frost)" style={{ opacity: 0.8, marginBottom: 6 }} />
              <span className="mono" style={{ fontSize: '38px', fontWeight: 800, letterSpacing: '-0.04em', textShadow: '0 0 20px rgba(56, 189, 248, 0.2)' }}>
                {formatTime(focusSecondsLeft)}
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>
                {focusStatus === 'running' ? 'Focusing' : focusStatus === 'completed' ? 'Completed' : 'Idle'}
              </span>
            </div>

            {/* Focus Control Buttons */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <Button
                variant="primary"
                icon={focusStatus === 'running' ? Pause : Play}
                onClick={handleToggleFocus}
              >
                {focusStatus === 'running' ? 'Pause' : 'Start Focus'}
              </Button>
              <Button
                variant="outline"
                icon={RotateCcw}
                onClick={handleResetFocus}
              >
                Reset
              </Button>
            </div>

          </div>
        </Card>

        {/* BREAK TIMER CARD */}
        <Card
          title="Break Session"
          subtitle="Take a short rest to recharge your focus."
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 8px 24px 8px', gap: '20px' }}>

            {/* Break Duration Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '300px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
                <span>Break Duration</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={breakDuration}
                    onChange={(e) => handleBreakDurationChange(Number(e.target.value))}
                    disabled={breakStatus === 'running'}
                    className="mono"
                    style={{
                      width: '54px',
                      padding: '3px 6px',
                      fontSize: '12.5px',
                      textAlign: 'center',
                      color: 'var(--frost)',
                      cursor: breakStatus === 'running' ? 'not-allowed' : 'text'
                    }}
                  />
                  <span className="mono" style={{ color: 'var(--frost)' }}>{breakDuration === 1 ? 'min' : 'mins'}</span>
                </div>
              </div>
              <input
                type="range"
                min="1"
                max="15"
                value={Math.min(breakDuration, 15)}
                onChange={(e) => handleBreakDurationChange(Number(e.target.value))}
                disabled={breakStatus === 'running'}
                style={{
                  width: '100%',
                  accentColor: 'var(--frost)',
                  cursor: breakStatus === 'running' ? 'not-allowed' : 'pointer'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-faint)' }}>
                <span>1 min</span>
                <span>15 min (type above for more)</span>
              </div>
            </div>

            {/* Break Circular Display */}
            <div style={{
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              border: '4px solid var(--border-strong)',
              borderTopColor: 'var(--frost)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: breakStatus === 'running' ? '0 0 35px rgba(56, 189, 248, 0.15), inset 0 0 30px rgba(56, 189, 248, 0.03)' : 'var(--shadow-lg)',
              position: 'relative',
              transition: 'box-shadow 0.4s var(--ease-out)'
            }}>
              {breakStatus === 'running' && (
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
              <Timer size={28} color="var(--frost)" style={{ opacity: 0.8, marginBottom: 6 }} />
              <span className="mono" style={{ fontSize: '38px', fontWeight: 800, letterSpacing: '-0.04em', textShadow: '0 0 20px rgba(56, 189, 248, 0.2)' }}>
                {formatTime(breakSecondsLeft)}
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>
                {breakStatus === 'running' ? 'On Break' : breakStatus === 'completed' ? 'Completed' : 'Idle'}
              </span>
            </div>

            {/* Break Control Buttons */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <Button
                variant="primary"
                icon={breakStatus === 'running' ? Pause : Play}
                onClick={handleToggleBreak}
              >
                {breakStatus === 'running' ? 'Pause' : 'Start Break'}
              </Button>
              <Button
                variant="outline"
                icon={RotateCcw}
                onClick={handleResetBreak}
              >
                Reset
              </Button>
            </div>

          </div>
        </Card>

      </div>

    </div>
  );
}
