import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import { TrendingUp, ChartBar as BarChart2 } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts';

function isThisWeek(dateStr) {
  if (!dateStr) return false;
  try {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    
    // Start of week (Monday)
    const currentDay = today.getDay();
    const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - distanceToMonday);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    
    return date >= startOfWeek && date < endOfWeek;
  } catch (e) {
    return false;
  }
}

function formatChartDate(dateStr) {
  try {
    const [year, month, day] = dateStr.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[parseInt(month, 10) - 1]} ${parseInt(day, 10)}`;
  } catch (e) {
    return dateStr;
  }
}

export default function Performance() {
  const { user, useLocalOnly, backendUrl, getHeaders } = useAuth();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProblems = async () => {
      try {
        if (useLocalOnly || user?.isOfflineMode) {
          const stored = localStorage.getItem('studybuddy-v2-local');
          if (stored) {
            setProblems(JSON.parse(stored));
          }
        } else {
          const res = await fetch(`${backendUrl}/api/problems`, {
            headers: getHeaders()
          });
          if (res.ok) {
            const data = await res.json();
            setProblems(data);
          }
        }
      } catch (e) {
        console.error('Failed to fetch problems in Performance:', e);
      } finally {
        setLoading(false);
      }
    };
    loadProblems();
  }, [user, useLocalOnly, backendUrl, getHeaders]);

  // 1. Calculate Confidence Trend Data
  const getTrendData = () => {
    const reviews = [];
    problems.forEach(p => {
      (p.reviewHistory || []).forEach(r => {
        if (r.date) {
          reviews.push({ date: r.date, confidence: r.confidence });
        }
      });
    });

    if (reviews.length === 0) return [];

    // Group by date
    const grouped = {};
    reviews.forEach(r => {
      if (!grouped[r.date]) {
        grouped[r.date] = { sum: 0, count: 0 };
      }
      grouped[r.date].sum += r.confidence;
      grouped[r.date].count += 1;
    });

    return Object.entries(grouped)
      .map(([date, val]) => ({
        date,
        formattedDate: formatChartDate(date),
        avgConfidence: parseFloat((val.sum / val.count).toFixed(2))
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  // 2. Calculate Weakest Patterns Data
  const getWeakestPatterns = () => {
    if (problems.length === 0) return [];
    
    const patternMap = {};
    problems.forEach(p => {
      const pattern = p.pattern || 'Other';
      const lastReview = p.reviewHistory && p.reviewHistory.length > 0
        ? p.reviewHistory[p.reviewHistory.length - 1].confidence
        : 5; // Default to 5 if not reviewed
        
      if (!patternMap[pattern]) {
        patternMap[pattern] = { sum: 0, count: 0 };
      }
      patternMap[pattern].sum += lastReview;
      patternMap[pattern].count += 1;
    });

    return Object.entries(patternMap)
      .map(([pattern, val]) => ({
        pattern,
        avgConfidence: parseFloat((val.sum / val.count).toFixed(2))
      }))
      .sort((a, b) => a.avgConfidence - b.avgConfidence) // sort lowest to highest
      .slice(0, 5); // top 5 weakest
  };

  // 3. Calculate Weekly Hour Goal Progress
  const getWeeklyHours = () => {
    let totalHours = 0;
    let usingTimerData = false;

    // Try Focus Timer session data from localStorage
    try {
      const stored = localStorage.getItem('studybuddy-focus-sessions');
      if (stored) {
        const sessions = JSON.parse(stored);
        const weeklySessions = sessions.filter(s => isThisWeek(s.date));
        if (weeklySessions.length > 0) {
          usingTimerData = true;
          const totalMinutes = weeklySessions.reduce((acc, s) => acc + s.minutes, 0);
          totalHours = parseFloat((totalMinutes / 60).toFixed(1));
        }
      }
    } catch (e) {
      console.error(e);
    }

    // Fallback to logged/reviewed problems this week
    if (!usingTimerData && problems.length > 0) {
      let loggedCount = 0;
      let reviewCount = 0;
      problems.forEach(p => {
        if (p.createdAt && isThisWeek(p.createdAt)) {
          loggedCount++;
        }
        (p.reviewHistory || []).forEach(r => {
          if (r.date && isThisWeek(r.date) && r.date !== p.createdAt) {
            reviewCount++;
          }
        });
      });
      totalHours = parseFloat((loggedCount * 0.5 + reviewCount * 0.25).toFixed(1));
    }

    return { hours: totalHours, usingTimerData };
  };

  const trendData = getTrendData();
  const weakestPatterns = getWeakestPatterns();
  const { hours, usingTimerData } = getWeeklyHours();
  const goal = user?.hoursGoal || 10;
  const percent = Math.min(100, Math.round((hours / goal) * 100));

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

      {loading ? (
        <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
          Loading Performance Metrics...
        </div>
      ) : (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            {/* Confidence Trend */}
            <Card title="Confidence Trend" subtitle="Average confidence rating over time">
              <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 0' }}>
                {trendData.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--frost-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <TrendingUp size={26} color="var(--frost)" style={{ opacity: 0.6 }} />
                    </div>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No revision history available yet.</span>
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
                      />
                      <Line type="monotone" dataKey="avgConfidence" stroke="var(--frost)" strokeWidth={2} activeDot={{ r: 6 }} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            {/* Weakest Patterns */}
            <Card title="Weakest Patterns" subtitle="Topics with the lowest average confidence">
              <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 0' }}>
                {weakestPatterns.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--ember-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <BarChart2 size={26} color="var(--ember)" style={{ opacity: 0.6 }} />
                    </div>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No logged problems found.</span>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weakestPatterns} layout="vertical" margin={{ left: -10, right: 10, top: 5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                      <XAxis type="number" domain={[0, 5]} stroke="var(--text-faint)" fontSize={11} ticks={[1, 2, 3, 4, 5]} />
                      <YAxis dataKey="pattern" type="category" stroke="var(--text-faint)" fontSize={11} width={90} />
                      <Tooltip 
                        contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Bar dataKey="avgConfidence" fill="var(--ember)" radius={[0, 4, 4, 0]} barSize={12} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </div>

          {/* Goal Progress */}
          <Card title="Weekly Goal Tracking" subtitle="DSA practice hours goal progress">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '10px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Weekly Goal Progress</span>
                <span className="mono" style={{ fontWeight: '600', color: '#fff' }}>{hours.toFixed(1)} hrs / {goal.toFixed(1)} hrs ({percent}%)</span>
              </div>
              <div style={{
                height: '10px',
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
                  transition: 'width 0.4s var(--ease-out)'
                }} />
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-faint)', marginTop: '4px' }}>
                {usingTimerData ? (
                  <span>🎯 Calculated from actual Focus Timer sessions completed this week.</span>
                ) : (
                  <span>ℹ️ Estimated from problems logged (0.5 hrs each) and reviewed (0.25 hrs each) this week.</span>
                )}
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
