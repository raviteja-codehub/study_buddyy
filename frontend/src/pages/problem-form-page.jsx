import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Sparkles, Loader as Loader2, TriangleAlert as AlertTriangle, Search, X, ExternalLink } from 'lucide-react';

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
  const [timeSpent, setTimeSpent] = useState(initial?.timeSpent || '');
  const [previouslySolved, setPreviouslySolved] = useState(initial?.previouslySolved || false);
  
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState('');

  const [lcLoading, setLcLoading] = useState(false);
  const [lcError, setLcError] = useState('');
  const [lcResults, setLcResults] = useState(null);

  const isEdit = !!initial;

  const searchLeetCode = async () => {
    if (!title.trim()) {
      setLcError('Type a problem title first.');
      return;
    }
    setLcLoading(true);
    setLcError('');
    setLcResults(null);
    try {
      const res = await fetch(`${backendUrl}/api/leetcode/search?q=${encodeURIComponent(title.trim())}`, {
        headers: getHeaders()
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to search LeetCode');
      }
      if (!data.results || data.results.length === 0) {
        setLcError('No matching LeetCode problems found.');
      } else {
        setLcResults(data.results);
      }
    } catch (e) {
      console.error(e);
      setLcError(e.message || 'Could not reach LeetCode. Check backend connection.');
    } finally {
      setLcLoading(false);
    }
  };

  const applyLeetCodeResult = (result) => {
    setLink(result.link);
    if (result.difficulty && DIFFICULTIES.includes(result.difficulty)) {
      setDifficulty(result.difficulty);
    }
    if (result.tags && result.tags.length) {
      const matched = PATTERNS.find(p =>
        result.tags.some(t => t.toLowerCase() === p.toLowerCase())
      );
      if (matched) setPattern(matched);
    }
    setLcResults(null);
  };

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
      confidence,
      timeSpent: Number(timeSpent) || 0,
      previouslySolved
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
        <h3 className="mono" style={{ fontSize: 16, fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: 12, letterSpacing: '-0.01em' }}>
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

        {/* Already Solved / Not currently learning */}
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            border: `1px solid ${previouslySolved ? 'rgba(74, 222, 128, 0.35)' : 'var(--border)'}`,
            background: previouslySolved ? 'rgba(74, 222, 128, 0.08)' : 'transparent',
            cursor: 'pointer',
            transition: 'all 0.2s var(--ease-out)'
          }}
        >
          <input
            type="checkbox"
            checked={previouslySolved}
            onChange={e => setPreviouslySolved(e.target.checked)}
            style={{ width: 16, height: 16, accentColor: COLORS.signal, cursor: 'pointer' }}
          />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: previouslySolved ? COLORS.signal : 'var(--text)' }}>
              Already solved before (not currently learning)
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 1 }}>
              Skips this from the revision queue — just logs it as known.
            </div>
          </div>
        </label>

        {/* Link */}
        <Field label="Problem Link (Optional)">
          <div style={{ display: 'flex', gap: 8 }}>
            <input 
              value={link} 
              onChange={e => setLink(e.target.value)} 
              placeholder="e.g. https://leetcode.com/problems/longest-substring-without-repeating-characters" 
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={searchLeetCode}
              disabled={lcLoading}
              className="btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px', whiteSpace: 'nowrap' }}
              title="Search LeetCode using the title above"
            >
              {lcLoading ? <Loader2 size={14} className="sb-spin" /> : <Search size={14} />}
              {lcLoading ? 'Searching...' : 'Fetch from LeetCode'}
            </button>
          </div>

          {lcError && (
            <span style={{ fontSize: 12.5, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
              <AlertTriangle size={13} /> {lcError}
            </span>
          )}

          {lcResults && (
            <div className="sb-fade-in" style={{
              marginTop: 8,
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              overflow: 'hidden'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                background: 'var(--surface-hover)',
                borderBottom: '1px solid var(--border)'
              }}>
                <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.4, textTransform: 'uppercase' }}>
                  Matches on LeetCode
                </span>
                <button
                  type="button"
                  onClick={() => setLcResults(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', display: 'flex' }}
                >
                  <X size={14} />
                </button>
              </div>
              <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                {lcResults.map((r, i) => (
                  <button
                    type="button"
                    key={i}
                    onClick={() => applyLeetCodeResult(r)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: i === lcResults.length - 1 ? 'none' : '1px solid var(--border)',
                      padding: '10px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                      color: 'var(--text)'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.title}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.link}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      {r.difficulty && (
                        <span className="mono" style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: 999,
                          color: r.difficulty === 'Easy' ? COLORS.easy : r.difficulty === 'Medium' ? COLORS.medium : COLORS.hard,
                          background: r.difficulty === 'Easy' ? 'rgba(74, 222, 128, 0.12)' : r.difficulty === 'Medium' ? 'rgba(251, 146, 60, 0.12)' : 'rgba(248, 113, 113, 0.12)'
                        }}>
                          {r.difficulty}
                        </span>
                      )}
                      <ExternalLink size={13} color="var(--text-faint)" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
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
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 13,
                    fontWeight: 600,
                    border: `1px solid ${difficulty === d ? 'var(--border-strong)' : 'var(--border)'}`,
                    background: difficulty === d
                      ? (d === 'Easy' ? 'rgba(74, 222, 128, 0.12)' : d === 'Medium' ? 'rgba(251, 146, 60, 0.12)' : 'rgba(248, 113, 113, 0.12)')
                      : 'transparent',
                    color: difficulty === d
                      ? (d === 'Easy' ? COLORS.easy : d === 'Medium' ? COLORS.medium : COLORS.hard)
                      : 'var(--text-muted)',
                    transition: 'all 0.25s var(--ease-out)',
                    boxShadow: difficulty === d ? `0 0 12px ${d === 'Easy' ? 'rgba(74,222,128,0.08)' : d === 'Medium' ? 'rgba(251,146,60,0.08)' : 'rgba(248,113,113,0.08)'}` : 'none'
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
            border: '1px solid rgba(56, 189, 248, 0.2)',
            borderRadius: 'var(--radius-md)',
            padding: 16,
            boxShadow: '0 0 20px rgba(56, 189, 248, 0.04)'
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

        {/* Time Spent */}
        <Field label="Time Spent (Minutes)" hint="How long did you spend solving this problem? (optional)">
          <input 
            type="number" 
            min="0"
            value={timeSpent} 
            onChange={e => setTimeSpent(e.target.value)} 
            placeholder="e.g. 45" 
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
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 12.5,
                    fontWeight: 600,
                    border: `1px solid ${confidence === n ? 'var(--border-strong)' : 'var(--border)'}`,
                    background: confidence === n ? `${CONF_COLOR[n]}15` : 'transparent',
                    color: confidence === n ? CONF_COLOR[n] : 'var(--text-muted)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                    transition: 'all 0.25s var(--ease-out)',
                    boxShadow: confidence === n ? `0 0 12px ${CONF_COLOR[n]}20` : 'none'
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
