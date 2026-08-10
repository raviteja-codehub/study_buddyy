import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';

const FocusTimerContext = createContext(null);

export function FocusTimerProvider({ children }) {
  const [focusDuration, setFocusDuration] = useState(25); // minutes
  const [breakDuration, setBreakDuration] = useState(5); // minutes

  const [focusSecondsLeft, setFocusSecondsLeft] = useState(25 * 60);
  const [breakSecondsLeft, setBreakSecondsLeft] = useState(5 * 60);

  // 'idle' | 'running' | 'completed'
  const [focusStatus, setFocusStatus] = useState('idle');
  const [breakStatus, setBreakStatus] = useState('idle');

  const [alarmActive, setAlarmActive] = useState(false);
  const [alarmTimerType, setAlarmTimerType] = useState(null); // 'work' or 'break'

  // Timestamp (ms) the currently-running timer should hit zero at.
  // Using a target timestamp instead of "tick by 1 every second" means the
  // countdown stays correct even if the tab is backgrounded/throttled, and
  // survives the FocusTimer page unmounting since all this state now lives
  // in this provider (mounted once, above the page router) rather than
  // inside the page component itself.
  const focusTargetRef = useRef(null);
  const breakTargetRef = useRef(null);

  const alarmIntervalRef = useRef(null);
  const alarmTimeoutRef = useRef(null);
  const audioCtxRef = useRef(null);

  // ---- Alarm sound ----
  const stopAlarmSound = useCallback(() => {
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
      try { audioCtxRef.current.close(); } catch (e) {}
      audioCtxRef.current = null;
    }
  }, []);

  const startAlarmSound = useCallback(() => {
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
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      };

      playBeep();
      alarmIntervalRef.current = window.setInterval(playBeep, 800);
      alarmTimeoutRef.current = window.setTimeout(() => stopAlarmSound(), 30000);
    } catch (e) {
      console.warn('Audio synthesis failed:', e);
    }
  }, [stopAlarmSound]);

  const triggerAlarm = useCallback((type) => {
    setAlarmTimerType(type);
    startAlarmSound();
  }, [startAlarmSound]);

  // ---- Duration change handlers (only allowed while idle) ----
  const handleFocusDurationChange = (val) => {
    const clamped = Math.max(1, Math.min(300, Math.round(val) || 1));
    setFocusDuration(clamped);
    if (focusStatus === 'idle') {
      setFocusSecondsLeft(clamped * 60);
    }
  };

  const handleBreakDurationChange = (val) => {
    const clamped = Math.max(1, Math.min(180, Math.round(val) || 1));
    setBreakDuration(clamped);
    if (breakStatus === 'idle') {
      setBreakSecondsLeft(clamped * 60);
    }
  };

  // ---- Focus countdown (timestamp-based) ----
  useEffect(() => {
    if (focusStatus !== 'running') return undefined;

    const tick = () => {
      const remainingMs = focusTargetRef.current - Date.now();
      const remaining = Math.max(0, Math.round(remainingMs / 1000));
      setFocusSecondsLeft(remaining);
      if (remaining <= 0) {
        setFocusStatus('completed');
        triggerAlarm('work');
        setBreakStatus('idle');
        setBreakSecondsLeft(breakDuration * 60);
        try {
          const stored = localStorage.getItem('studybuddy-focus-sessions');
          const sessions = stored ? JSON.parse(stored) : [];
          sessions.push({ date: new Date().toISOString().slice(0, 10), minutes: focusDuration });
          localStorage.setItem('studybuddy-focus-sessions', JSON.stringify(sessions));
        } catch (e) { console.error(e); }
      }
    };

    tick(); // run immediately so UI is accurate right when resumed
    const intervalId = window.setInterval(tick, 1000);
    return () => window.clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusStatus]);

  // ---- Break countdown (timestamp-based) ----
  useEffect(() => {
    if (breakStatus !== 'running') return undefined;

    const tick = () => {
      const remainingMs = breakTargetRef.current - Date.now();
      const remaining = Math.max(0, Math.round(remainingMs / 1000));
      setBreakSecondsLeft(remaining);
      if (remaining <= 0) {
        setBreakStatus('completed');
        triggerAlarm('break');
        setFocusStatus('idle');
        setFocusSecondsLeft(focusDuration * 60);
      }
    };

    tick();
    const intervalId = window.setInterval(tick, 1000);
    return () => window.clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breakStatus]);

  // ---- Focus controls ----
  const handleToggleFocus = () => {
    stopAlarmSound();
    if (focusStatus === 'running') {
      // Pause: freeze remaining seconds from the target timestamp
      const remainingMs = focusTargetRef.current - Date.now();
      setFocusSecondsLeft(Math.max(0, Math.round(remainingMs / 1000)));
      setFocusStatus('idle');
    } else {
      if (breakStatus === 'running') {
        const remMs = breakTargetRef.current - Date.now();
        setBreakSecondsLeft(Math.max(0, Math.round(remMs / 1000)));
        setBreakStatus('idle');
      }
      const startFrom = focusStatus === 'completed' ? focusDuration * 60 : focusSecondsLeft;
      focusTargetRef.current = Date.now() + startFrom * 1000;
      setFocusSecondsLeft(startFrom);
      setFocusStatus('running');
    }
  };

  const handleResetFocus = () => {
    stopAlarmSound();
    setFocusSecondsLeft(focusDuration * 60);
    setFocusStatus('idle');
  };

  // ---- Break controls ----
  const handleToggleBreak = () => {
    stopAlarmSound();
    if (breakStatus === 'running') {
      const remainingMs = breakTargetRef.current - Date.now();
      setBreakSecondsLeft(Math.max(0, Math.round(remainingMs / 1000)));
      setBreakStatus('idle');
    } else {
      if (focusStatus === 'running') {
        const remMs = focusTargetRef.current - Date.now();
        setFocusSecondsLeft(Math.max(0, Math.round(remMs / 1000)));
        setFocusStatus('idle');
      }
      const startFrom = breakStatus === 'completed' ? breakDuration * 60 : breakSecondsLeft;
      breakTargetRef.current = Date.now() + startFrom * 1000;
      setBreakSecondsLeft(startFrom);
      setBreakStatus('running');
    }
  };

  const handleResetBreak = () => {
    stopAlarmSound();
    setBreakSecondsLeft(breakDuration * 60);
    setBreakStatus('idle');
  };

  useEffect(() => () => stopAlarmSound(), [stopAlarmSound]);

  return (
    <FocusTimerContext.Provider value={{
      focusDuration, breakDuration,
      focusSecondsLeft, breakSecondsLeft,
      focusStatus, breakStatus,
      alarmActive, alarmTimerType,
      handleFocusDurationChange, handleBreakDurationChange,
      handleToggleFocus, handleResetFocus,
      handleToggleBreak, handleResetBreak,
      stopAlarmSound,
    }}>
      {children}
    </FocusTimerContext.Provider>
  );
}

export function useFocusTimer() {
  const ctx = useContext(FocusTimerContext);
  if (!ctx) {
    throw new Error('useFocusTimer must be used within a FocusTimerProvider');
  }
  return ctx;
}
