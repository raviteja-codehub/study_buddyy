import React, { useEffect, useState, useRef } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Timer, Play, Pause, RotateCcw } from 'lucide-react';

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function FocusTimer() {
  const [focusDuration, setFocusDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);

  const [focusSecondsLeft, setFocusSecondsLeft] = useState(25 * 60);
  const [breakSecondsLeft, setBreakSecondsLeft] = useState(5 * 60);

  // States: 'idle', 'running', 'completed'
  const [focusStatus, setFocusStatus] = useState('idle');
  const [breakStatus, setBreakStatus] = useState('idle');

  const [alarmActive, setAlarmActive] = useState(false);
  const [alarmTimerType, setAlarmTimerType] = useState(null); // 'work' or 'break'

  const alarmIntervalRef = useRef(null);
  const alarmTimeoutRef = useRef(null);
  const audioCtxRef = useRef(null);

  // Sound Alarm Logic
  const startAlarmSound = () => {
    stopAlarmSound();
    setAlarmActive(true);

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      const playBeep = () => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // High A5 note
        
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      };

      // Play immediately and repeat every 0.8 seconds
      playBeep();
      alarmIntervalRef.current = window.setInterval(playBeep, 800);

      // Auto stop after 30 seconds
      alarmTimeoutRef.current = window.setTimeout(() => {
        stopAlarmSound();
      }, 30000);

    } catch (e) {
      console.warn('Audio synthesis failed:', e);
    }
  };

  const stopAlarmSound = () => {
    setAlarmActive(false);

    if (alarmIntervalRef.current) {
      window.clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
    if (alarmTimeoutRef.current) {
      window.clearTimeout(alarmTimeoutRef.current);
      alarmTimeoutRef.current = null;
    }
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch (e) {}
      audioCtxRef.current = null;
    }
  };

  const triggerAlarm = (type) => {
    setAlarmTimerType(type);
    startAlarmSound();
  };

  // Focus Slider change
  const handleFocusDurationChange = (val) => {
    setFocusDuration(val);
    if (focusStatus === 'idle') {
      setFocusSecondsLeft(val * 60);
    }
  };

  // Break Slider change
  const handleBreakDurationChange = (val) => {
    setBreakDuration(val);
    if (breakStatus === 'idle') {
      setBreakSecondsLeft(val * 60);
    }
  };

  // Focus Countdown Effect
  useEffect(() => {
    if (focusStatus !== 'running') return undefined;
    if (focusSecondsLeft <= 0) return undefined;

    const intervalId = window.setInterval(() => {
      setFocusSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [focusStatus, focusSecondsLeft]);

  // Focus Completion Trigger
  useEffect(() => {
    if (focusSecondsLeft !== 0 || focusStatus !== 'running') return;
    
    setFocusStatus('completed');
    triggerAlarm('work');

    // Automatically transition break timer status to idle so it displays initial duration
    setBreakStatus('idle');
    setBreakSecondsLeft(breakDuration * 60);

    // Save Focus Session to localStorage
    try {
      const stored = localStorage.getItem('studybuddy-focus-sessions');
      const sessions = stored ? JSON.parse(stored) : [];
      sessions.push({
        date: new Date().toISOString().slice(0, 10),
        minutes: focusDuration
      });
      localStorage.setItem('studybuddy-focus-sessions', JSON.stringify(sessions));
    } catch (e) {
      console.error(e);
    }
  }, [focusSecondsLeft, focusStatus, focusDuration, breakDuration]);

  // Break Countdown Effect
  useEffect(() => {
    if (breakStatus !== 'running') return undefined;
    if (breakSecondsLeft <= 0) return undefined;

    const intervalId = window.setInterval(() => {
      setBreakSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [breakStatus, breakSecondsLeft]);

  // Break Completion Trigger
  useEffect(() => {
    if (breakSecondsLeft !== 0 || breakStatus !== 'running') return;
    
    setBreakStatus('completed');
    triggerAlarm('break');

    // Automatically transition focus timer status back to idle
    setFocusStatus('idle');
    setFocusSecondsLeft(focusDuration * 60);
  }, [breakSecondsLeft, breakStatus, focusDuration]);

  // Focus Control Handlers
  const handleToggleFocus = () => {
    stopAlarmSound();
    if (focusStatus === 'running') {
      setFocusStatus('idle');
    } else {
      // Pause break if running
      if (breakStatus === 'running') {
        setBreakStatus('idle');
      }
      if (focusStatus === 'completed') {
        setFocusSecondsLeft(focusDuration * 60);
      }
      setFocusStatus('running');
    }
  };

  const handleResetFocus = () => {
    stopAlarmSound();
    setFocusSecondsLeft(focusDuration * 60);
    setFocusStatus('idle');
  };

  // Break Control Handlers
  const handleToggleBreak = () => {
    stopAlarmSound();
    if (breakStatus === 'running') {
      setBreakStatus('idle');
    } else {
      // Pause focus if running
      if (focusStatus === 'running') {
        setFocusStatus('idle');
      }
      if (breakStatus === 'completed') {
        setBreakSecondsLeft(breakDuration * 60);
      }
      setBreakStatus('running');
    }
  };

  const handleResetBreak = () => {
    stopAlarmSound();
    setBreakSecondsLeft(breakDuration * 60);
    setBreakStatus('idle');
  };

  // Cleanup alarms on unmount
  useEffect(() => {
    return () => stopAlarmSound();
  }, []);

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
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
                <span>Focus Duration</span>
                <span className="mono" style={{ color: 'var(--frost)' }}>{focusDuration} {focusDuration === 1 ? 'min' : 'mins'}</span>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
                <span>Break Duration</span>
                <span className="mono" style={{ color: 'var(--frost)' }}>{breakDuration} {breakDuration === 1 ? 'min' : 'mins'}</span>
              </div>
              <input
                type="range"
                min="1"
                max="15"
                value={breakDuration}
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
                <span>15 min</span>
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
