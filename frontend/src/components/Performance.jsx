import React from 'react';
import Card from './ui/Card';
import { TrendingUp, BarChart2, Award, Zap } from 'lucide-react';

export default function Performance() {
  return (
    <div className="sb-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.02em', color: '#fff', marginBottom: '4px' }}>
          Performance Analytics
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          Deep-dive analysis of your revision history, confidence trends, and goals.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        {/* Confidence Trend Placeholder */}
        <Card title="Confidence Trend" subtitle="Average confidence rating over time">
          <div style={{
            height: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px dashed var(--border)',
            borderRadius: '8px',
            background: 'rgba(255,255,255,0.01)',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <TrendingUp size={28} color="var(--frost)" style={{ opacity: 0.5 }} />
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Trend chart will render here (Recharts)</span>
          </div>
        </Card>

        {/* Weak Patterns Placeholder */}
        <Card title="Weakest Patterns" subtitle="Topics with the lowest average confidence">
          <div style={{
            height: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px dashed var(--border)',
            borderRadius: '8px',
            background: 'rgba(255,255,255,0.01)',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <BarChart2 size={28} color="var(--ember)" style={{ opacity: 0.5 }} />
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Low confidence analysis will render here</span>
          </div>
        </Card>
      </div>

      {/* Goal Progress Placeholder */}
      <Card title="Weekly Goal Tracking" subtitle="DSA practice hours goal progress">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '10px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Weekly Goal Progress</span>
            <span className="mono" style={{ fontWeight: '600' }}>0.0 hrs / 10.0 hrs (0%)</span>
          </div>
          <div style={{
            height: '10px',
            background: 'var(--border)',
            borderRadius: '5px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: '0%',
              height: '100%',
              background: 'linear-gradient(90deg, var(--frost), var(--ember))',
              borderRadius: '5px'
            }} />
          </div>
          <div style={{
            background: 'var(--ember-dim)',
            border: '1px solid rgba(251, 146, 60, 0.15)',
            borderRadius: '10px',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            marginTop: '10px'
          }}>
            <Zap size={18} color="var(--ember)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <p style={{ fontSize: '13px', color: 'var(--ember)', fontWeight: '600' }}>
                ⚡ Phase 3 Preview
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: '1.5' }}>
                In Phase 3, we will render beautiful line charts, bar graphs, and scatter plots correlating time spent vs. problems solved. Weekly progress will sync with focus timer sessions automatically.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
