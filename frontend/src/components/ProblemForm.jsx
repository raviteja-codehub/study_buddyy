import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Sparkles, Loader2, AlertTriangle } from 'lucide-react';

const PATTERNS = [
  'Two Pointers', 'Sliding Window', 'Binary Search', 'DFS', 'BFS',
  'Dynamic Programming', 'Greedy', 'Backtracking', 'Heap / Priority Queue',
  'Union Find', 'Trie', 'Graph', 'Linked List', 'Stack', 'Queue',
  'Bit Manipulation', 'Math', 'Sorting', 'Recursion', 'Prefix Sum', 'Other'
];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

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

export default function ProblemForm({ initial, onSave, onCancel }) {
  const { getHeaders, backendUrl } = useAuth();
  
  const [title, setTitle] = useState(initial?.title || '');
  const [link, setLink] = useState(initial?.link || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [pattern, setPattern] = useState(initial?.pattern || PATTERNS[0]);
  const [difficulty, setDifficulty] = useState(initial?.difficulty || 'Medium');
  const [notes, setNotes] = useState(initial?.notes || '');
  const [mistakes, setMistakes] = useState(initial?.mistakes || '');
  const [summary, setSummary] = useState(initial?.summary || null);
  const [confidence, setConfidence] = useState(5);
  
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState('');

  const isEdit = !!initial;

  const generateSummary = async () => {
    if (!description.trim() && !notes.trim()) {
      setGenError('Paste the problem statement or your solution notes first.');
      return;
    }
    setGenLoading(true);
    setGenError('');
    try {
      const res = await fetch(`${backendUrl}/api/ai/summarize`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ title, description, notes })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to auto-generate summary');
      }

      setSummary(data);
      if (data.pattern && PATTERNS.some(p => p.toLowerCase() === data.pattern.toLowerCase())) {
        const matchedPattern = PATTERNS.find(p => p.toLowerCase() === data.pattern.toLowerCase());
        setPattern(matchedPattern);
      }
    } catch (e) {
      console.error(e);
      setGenError(e.message || 'Could not generate summary. Check backend connection.');
    } finally {
      setGenLoading(false);
    }
  };

  const canSave = title.trim().length > 0;

  const handleFormSave = () => {
    if (!canSave) return;
    onSave({
      title,
      link,
      description,
      pattern,
      difficulty,
      notes,
      mistakes,
      summary,
      confidence
    });
  };

  return (
    <div className="sb-fade-in" style={{ maxWidth: 700, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header back */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <button onClick={onCancel} className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}>
          <ArrowLeft size={14} /> Back to Problems
        </button>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h3 className="mono" style={{ fontSize: 16, fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
          {isEdit ? 'Modify Solved Problem' : 'Log New Solved Problem'}
        </h3>

        {/* Title */}
        <Field label="Problem Title" required>
          <input 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
            placeholder="e.g. Longest Substring Without Repeating Characters" 
          />
        </Field>

        {/* Link */}
        <Field label="Problem Link (Optional)">
          <input 
            value={link} 
            onChange={e => setLink(e.target.value)} 
            placeholder="e.g. https://leetcode.com/problems/longest-substring-without-repeating-characters" 
          />
        </Field>

        {/* Topic & Difficulty row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Pattern Topic">
            <select value={pattern} onChange={e => setPattern(e.target.value)}>
              {PATTERNS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>

          <Field label="Difficulty">
            <div style={{ display: 'flex', gap: 6 }}>
              {DIFFICULTIES.map(d => (
                <button 
                  key={d} 
                  type="button"
                  onClick={() => setDifficulty(d)} 
                  style={{
                    flex: 1, 
                    padding: '10px 0', 
                    borderRadius: 8, 
                    fontSize: 13, 
                    fontWeight: 600,
                    border: `1px solid ${difficulty === d ? 'var(--border-strong)' : 'var(--border)'}`,
                    background: difficulty === d 
                      ? (d === 'Easy' ? 'rgba(74, 222, 128, 0.15)' : d === 'Medium' ? 'rgba(251, 146, 60, 0.15)' : 'rgba(248, 113, 113, 0.15)') 
                      : 'transparent',
                    color: difficulty === d 
                      ? (d === 'Easy' ? COLORS.easy : d === 'Medium' ? COLORS.medium : COLORS.hard) 
                      : 'var(--text-muted)',
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          </Field>
        </div>

        {/* Description / Code input */}
        <Field label="Problem Description or Code Snippet" hint="Pasted code or description helps the AI synthesize summaries.">
          <textarea 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
            rows={5} 
            placeholder="Paste code or problem details..." 
            style={{ resize: 'vertical' }} 
          />
        </Field>

        {/* Sparkles AI summary trigger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button 
            type="button"
            onClick={generateSummary} 
            disabled={genLoading} 
            className="btn-primary" 
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}
          >
            {genLoading ? <Loader2 size={14} className="sb-spin" /> : <Sparkles size={14} />}
            {genLoading ? 'Analyzing...' : 'Auto-Generate AI Summary'}
          </button>
          {genError && (
            <span style={{ fontSize: 12.5, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <AlertTriangle size={13} /> {genError}
            </span>
          )}
        </div>

        {/* AI summary results preview */}
        {summary && (
          <div className="sb-fade-in" style={{ 
            background: 'var(--frost-dim)', 
            border: '1px solid rgba(56, 189, 248, 0.25)', 
            borderRadius: 10, 
            padding: 16 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <Sparkles size={14} color="var(--frost)" />
              <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--frost)', letterSpacing: 0.4, textTransform: 'uppercase' }}>
                AI Synthesized Metrics
              </span>
            </div>
            <div style={{ fontSize: 13.5, lineHeight: 1.6, marginBottom: 10 }}>{summary.summary}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>
              <strong style={{ color: '#fff' }}>Key Insight: </strong>{summary.keyInsight}
            </div>
            <div style={{ display: 'flex', gap: 16 }} className="mono">
              <span style={{ fontSize: 12.5 }}>Time: <strong style={{ color: 'var(--ember)' }}>{summary.timeComplexity}</strong></span>
              <span style={{ fontSize: 12.5 }}>Space: <strong style={{ color: 'var(--ember)' }}>{summary.spaceComplexity}</strong></span>
            </div>
          </div>
        )}

        {/* Approach notes */}
        <Field label="My Approach & Thinking Notes">
          <textarea 
            value={notes} 
            onChange={e => setNotes(e.target.value)} 
            rows={4} 
            placeholder="How did you solve it? Write down the main algorithm mechanics..." 
            style={{ resize: 'vertical' }} 
          />
        </Field>

        {/* Mistakes */}
        <Field label="Mistake Log (Optional)" hint="Notes on off-by-ones, edge cases missed, or wrong first attempts.">
          <textarea 
            value={mistakes} 
            onChange={e => setMistakes(e.target.value)} 
            rows={3} 
            placeholder="e.g. Forgot to handle empty arrays, off-by-one in index lookup." 
            style={{ resize: 'vertical' }} 
          />
        </Field>

        {/* Confidence rating (only on additions) */}
        {!isEdit && (
          <Field label="Initial Recall Confidence" hint="Establishes your initial revision timer sequence.">
            <div style={{ display: 'flex', gap: 6 }}>
              {[1, 2, 3, 4, 5].map(n => (
                <button 
                  key={n} 
                  type="button"
                  onClick={() => setConfidence(n)} 
                  style={{
                    flex: 1, 
                    padding: '10px 0', 
                    borderRadius: 8, 
                    fontSize: 12.5, 
                    fontWeight: 600,
                    border: `1px solid ${confidence === n ? 'var(--border-strong)' : 'var(--border)'}`,
                    background: confidence === n ? `${CONF_COLOR[n]}15` : 'transparent',
                    color: confidence === n ? CONF_COLOR[n] : 'var(--text-muted)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2
                  }}
                >
                  <div className="mono" style={{ fontSize: 15, fontWeight: 800 }}>{n}</div>
                  <div style={{ fontSize: 10, marginTop: 2 }}>{CONF_LABEL[n]}</div>
                </button>
              ))}
            </div>
          </Field>
        )}

        {/* Submit */}
        <div style={{ display: 'flex', gap: 10, marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <button 
            type="button"
            disabled={!canSave} 
            onClick={handleFormSave} 
            className="btn-primary" 
            style={{ padding: '11px 24px', opacity: canSave ? 1 : 0.4 }}
          >
            {isEdit ? 'Save Changes' : 'Log Problem'}
          </button>
          <button 
            type="button"
            onClick={onCancel} 
            className="btn-secondary" 
            style={{ padding: '11px 24px' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, required, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 4 }}>
        {label} {required && <span style={{ color: 'var(--danger)' }}>*</span>}
      </label>
      {hint && <span style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>{hint}</span>}
      {children}
    </div>
  );
}
