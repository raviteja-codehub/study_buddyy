import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import { 
  TrendingUp, 
  BarChart2, 
  Flame, 
  Award, 
  ArrowUpRight, 
  ArrowDownRight, 
  Edit2, 
  Check, 
  Clock, 
  Sparkles,
  BookOpen
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  BarChart, 
  Bar 
} from 'recharts';
import {
  calculateTrendData,
  calculateWeakestPatterns,
  calculateWeeklyHours,
  calculateStreak,
  calculateAdditionalStats,
  hasAnyData
} from '../utils/analytics';

export default function Performance({ problems = [] }) {
  const { user, updateProfile } = useAuth();
  const [focusSessions, setFocusSessions] = useState([]);
  
  // Hours goal editing state
  const [hoursGoalInput, setHoursGoalInput] = useState(user?.hoursGoal || 10);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [savingGoal, setSavingGoal] = useState(false);

  // Sync profile hoursGoal to input field when user changes
  useEffect(() => {
    if (user?.hoursGoal) {
      setHoursGoalInput(user.hoursGoal);
    }
  }, [user]);

  // Load Focus Timer sessions from local storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('studybuddy-focus-sessions');
      if (stored) {
        setFocusSessions(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load focus sessions in Performance:', e);
    }
  }, []);

  // Submit profile prep target goal update
  const handleSaveGoal = async (e) => {
    e.preventDefault();
    setSavingGoal(true);
    try {
      await updateProfile(user?.targetCompany || '', Number(hoursGoalInput));
      setIsEditingGoal(false);
    } catch (e) {
      console.error(e);
      alert('Failed to save prep goal');
    } finally {
      setSavingGoal(false);
    }
  };

  // Perform analytics calculations
  const { trendData, hasEnoughData: hasTrendData } = calculateTrendData(problems);
  const weakestPatterns = calculateWeakestPatterns(problems);
  const hours = calculateWeeklyHours(problems, focusSessions);
  const streakInfo = calculateStreak(problems, focusSessions);
  const stats = calculateAdditionalStats(problems, focusSessions);
  const hasData = hasAnyData(problems, focusSessions);

  const goal = user?.hoursGoal || 10;
  const percent = Math.min(100, Math.round((hours / goal) * 100));

  // Y-axis label formatter: appends the attempts count next to topic
  const formattedWeakestPatterns = weakestPatterns.map(p => ({
    ...p,
    displayName: `${p.pattern} (${p.count})`
  }));

  // Render Full Empty State if no data at all exists
  if (!hasData) {
    return (
      <div className="sb-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h2 style={{ fontSize: '26px', fontWeight: '800', letterSpacing: '-0.02em', color: '#fff', marginBottom: '4px' }}>
            Performance Analytics
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Deep-dive analysis of your revision history, confidence trends, and goals.
          </p>
        </div>
        
        <div style={{
          textAlign: 'center',
          padding: '80px 24px',
          border: '1px dashed var(--border-strong)',
          borderRadius: 'var(--radius-xl)',
          background: 'var(--surface)',
          maxWidth: 600,
          margin: '40px auto',
          boxShadow: 'var(--shadow-md)',
          animation: 'fadeIn 0.5s ease-out'
        }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: 'var(--frost-dim)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
            border: '1px solid rgba(56, 189, 248, 0.15)'
          }}>
            <TrendingUp size={32} color="var(--frost)" style={{ filter: 'drop-shadow(0 0 10px rgba(56,189,248,0.2))' }} />
          </div>
          <h3 className="mono" style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No Analytics Data Found</h3>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto 24px', lineHeight: 1.6 }}>
            You haven't logged any solved problems or completed any focus timer sessions yet. 
            Once you log problems or start studying, your confidence trends and stats will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="sb-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Title block */}
      <div>
        <h2 style={{ fontSize: '26px', fontWeight: '800', letterSpacing: '-0.02em', color: '#fff', marginBottom: '4px' }}>
          Performance Analytics
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          Deep-dive analysis of your revision history, confidence trends, and goals.
        </p>
      </div>

      {/* Grid containing Streaks and YoY stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px'
      }}>
        {/* Streak card */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{
            width: 46,
            height: 46,
            borderRadius: '12px',
            background: 'var(--ember-dim)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(251, 146, 60, 0.15)'
          }}>
            <Flame size={22} color="var(--ember)" style={{ filter: 'drop-shadow(0 0 8px rgba(251,146,60,0.3))' }} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Study Streak</div>
            <div className="mono" style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: '2px 0' }}>
              {streakInfo.count} {streakInfo.count === 1 ? 'Day' : 'Days'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
              {streakInfo.lastActive ? `Last Active: ${streakInfo.lastActive}` : 'No active study logged'}
            </div>
          </div>
        </div>

        {/* Problems Solved comparison card */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{
            width: 46,
            height: 46,
            borderRadius: '12px',
            background: 'var(--frost-dim)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(56, 189, 248, 0.15)'
          }}>
            <Award size={22} color="var(--frost)" style={{ filter: 'drop-shadow(0 0 8px rgba(56,189,248,0.3))' }} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Solved (This Week)</div>
            <div className="mono" style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: '2px 0' }}>
              {stats.solvedThisWeek} Problems
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
              vs. {stats.solvedLastWeek} last week
            </div>
          </div>
        </div>

        {/* Confidence shift card */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{
            width: 46,
            height: 46,
            borderRadius: '12px',
            background: stats.improvementRate !== null && stats.improvementRate >= 0 ? 'var(--signal-dim)' : 'var(--danger-dim)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid ${stats.improvementRate !== null && stats.improvementRate >= 0 ? 'rgba(74, 222, 128, 0.15)' : 'rgba(248, 113, 113, 0.15)'}`
          }}>
            {stats.improvementRate !== null && stats.improvementRate >= 0 ? (
              <ArrowUpRight size={22} color="var(--signal)" />
            ) : (
              <ArrowDownRight size={22} color="var(--danger)" />
            )}
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Confidence Shift (7d)</div>
            <div className="mono" style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: '2px 0' }}>
              {stats.improvementRate !== null ? `${stats.improvementRate >= 0 ? '+' : ''}${stats.improvementRate}%` : 'N/A'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
              {stats.improvementRate !== null ? 'vs. previous 7 days' : 'Need more history'}
            </div>
          </div>
        </div>
      </div>

      {/* Goal Progress Card */}
      <Card 
        title="Weekly Goal Tracking" 
        subtitle="Track active preparation hours completed in the current week."
        headerActions={
          isEditingGoal ? (
            <form onSubmit={handleSaveGoal} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input 
                type="number" 
                min="1" 
                max="80" 
                value={hoursGoalInput} 
                onChange={e => setHoursGoalInput(e.target.value)} 
                disabled={savingGoal}
                style={{
                  width: '60px',
                  padding: '5px 8px',
                  background: 'var(--surface-hover)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: 'var(--radius-xs)',
                  color: '#fff',
                  fontSize: '12px',
                  textAlign: 'center'
                }}
              />
              <button 
                type="submit" 
                className="btn-primary" 
                disabled={savingGoal} 
                style={{ padding: '6px 12px', fontSize: '11.5px', borderRadius: 'var(--radius-xs)' }}
              >
                {savingGoal ? '...' : <Check size={13} />}
              </button>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => { setIsEditingGoal(false); setHoursGoalInput(user?.hoursGoal || 10); }}
                style={{ padding: '6px 12px', fontSize: '11.5px', borderRadius: 'var(--radius-xs)' }}
              >
                Cancel
              </button>
            </form>
          ) : (
            <button 
              className="btn-ghost" 
              onClick={() => setIsEditingGoal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', padding: '6px 10px' }}
            >
              <Edit2 size={13} />
              <span>Target: {goal} hrs</span>
            </button>
          )
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Prep Target Progress</span>
            <span className="mono" style={{ fontWeight: '600', color: '#fff' }}>
              {hours.toFixed(1)} hrs / {goal.toFixed(1)} hrs ({percent}%)
            </span>
          </div>
          <div style={{
            height: '12px',
            background: 'var(--surface-hover)',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden',
            border: '1px solid var(--border)'
          }}>
            <div style={{
              width: `${percent}%`,
              height: '100%',
              background: 'linear-gradient(90deg, var(--frost), var(--ember))',
              borderRadius: 'var(--radius-full)',
              transition: 'width 0.4s var(--ease-out)',
              boxShadow: 'var(--glow-frost)'
            }} />
          </div>
          <div style={{ 
            fontSize: '11.5px', 
            color: 'var(--text-faint)', 
            marginTop: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Clock size={12} />
            <span>Calculated from real logged time (Focus Timer sessions + manual problem prep logs + active Revision Queue timers).</span>
          </div>
        </div>
      </Card>

      {/* Topic Insights Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        {/* Most Improved Topic Card */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
            <Sparkles size={16} color="var(--frost)" />
            <span className="mono" style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Most Improved Topic
            </span>
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#fff', marginBottom: '4px' }}>
              {stats.mostImprovedTopic}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              {stats.mostImprovedTopic !== 'None' 
                ? 'Topic showing the largest upward shift between initial solve confidence and latest recall ratings.'
                : 'Insufficient recall ratings history to compute improvement rates.'}
            </div>
          </div>
        </div>

        {/* Most Neglected Topic Card */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
            <BookOpen size={16} color="var(--ember)" />
            <span className="mono" style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Most Neglected Topic
            </span>
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#fff', marginBottom: '4px' }}>
              {stats.mostNeglectedTopic}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              {stats.mostNeglectedTopic !== 'None' 
                ? (stats.daysSinceNeglected === Infinity 
                    ? 'Contains solved problems that have never been revised.' 
                    : `Topic with no study activity (solve or revision) in the longest time (${stats.daysSinceNeglected} days ago).`)
                : 'No problems logged yet.'}
            </div>
          </div>
        </div>
      </div>

      {/* Main visual charts block */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px'
      }}>
        {/* Confidence Trend */}
        <Card title="Confidence Trend" subtitle="Average confidence rating over time">
          <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 0' }}>
            {!hasTrendData ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', textAlign: 'center', padding: '20px' }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--frost-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={22} color="var(--frost)" style={{ opacity: 0.6 }} />
                </div>
                <strong style={{ fontSize: '14px', color: '#fff' }}>Not enough data yet</strong>
                <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', maxWidth: '280px', lineHeight: '1.5' }}>
                  Add ratings/reviews on at least 2 distinct days to plot your confidence trajectory.
                </span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="formattedDate" stroke="var(--text-faint)" fontSize={11} />
                  <YAxis domain={[1, 5]} stroke="var(--text-faint)" fontSize={11} ticks={[1, 2, 3, 4, 5]} />
                  <Tooltip 
                    contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                    itemStyle={{ color: 'var(--frost)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="avgConfidence" 
                    name="Average Recall"
                    stroke="var(--frost)" 
                    strokeWidth={2} 
                    activeDot={{ r: 6 }} 
                    dot={{ r: 3 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Weakest Patterns */}
        <Card title="Weakest Patterns" subtitle="Topics with the lowest average confidence">
          <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 0' }}>
            {formattedWeakestPatterns.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--danger-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BarChart2 size={22} color="var(--danger)" style={{ opacity: 0.6 }} />
                </div>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No logged problems found.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formattedWeakestPatterns} layout="vertical" margin={{ left: -10, right: 10, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" domain={[0, 5]} stroke="var(--text-faint)" fontSize={11} ticks={[1, 2, 3, 4, 5]} />
                  <YAxis dataKey="displayName" type="category" stroke="var(--text-faint)" fontSize={11} width={110} />
                  <Tooltip 
                    contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                    itemStyle={{ color: 'var(--ember)' }}
                    formatter={(value) => [`${value} average`, 'Confidence']}
                  />
                  <Bar 
                    dataKey="avgConfidence" 
                    fill="var(--danger)" 
                    radius={[0, 4, 4, 0]} 
                    barSize={12} 
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
