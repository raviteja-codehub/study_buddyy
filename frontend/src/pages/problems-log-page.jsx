import React, { useState, useMemo } from 'react';
import { Search, ExternalLink, TriangleAlert as AlertTriangle, Pencil, Trash2, Calendar, ClipboardCheck, ArrowRight, X, Copy, Check } from 'lucide-react';
import Badge from './ui/Badge';

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
};

function daysUntil(dateStr) {
  const today = new Date().toISOString().slice(0, 10);
  const d1 = new Date(today + 'T00:00:00');
  const d2 = new Date(dateStr + 'T00:00:00');
  return Math.round((d2 - d1) / 86400000);
}

function fmtDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function DifficultyBadge({ level }) {
  const variant = level ? level.toLowerCase() : 'medium';
  return <Badge variant={variant} type="dim">{level}</Badge>;
}

export default function ProblemList({ problems, onEdit, onDelete, onAdd, onDirectReview }) {
  const [search, setSearch] = useState('');
  const [filterPattern, setFilterPattern] = useState('All');
  const [filterDifficulty, setFilterDifficulty] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  
  // Details Side Panel State
  const [selectedId, setSelectedId] = useState(null);
  const [copied, setCopied] = useState(false);

  const selectedProblem = useMemo(() => {
    return problems.find(p => p.id === selectedId);
  }, [problems, selectedId]);

  const filteredAndSorted = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return problems
      .filter(p => {
        if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
        if (filterPattern !== 'All' && p.pattern !== filterPattern) return false;
        if (filterDifficulty !== 'All' && p.difficulty !== filterDifficulty) return false;
        
        if (filterStatus === 'Due') {
          return p.nextReview && p.nextReview <= today;
        } else if (filterStatus === 'Not Due') {
          return p.nextReview && p.nextReview > today;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return (b.createdAt || '').localeCompare(a.createdAt || '');
        if (sortBy === 'oldest') return (a.createdAt || '').localeCompare(b.createdAt || '');
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        if (sortBy === 'review') return (a.nextReview || '').localeCompare(b.nextReview || '');
        return 0;
      });
  }, [problems, search, filterPattern, filterDifficulty, filterStatus, sortBy]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRowClick = (id) => {
    setSelectedId(selectedId === id ? null : id);
  };

  return (
    <div className="sb-fade-in" style={{ display: 'flex', gap: 20, minHeight: '520px', position: 'relative' }}>
      
      {/* Problems log section */}
      <div style={{ flex: selectedId ? '2 1 60%' : '1 1 100%', transition: 'all 0.3s var(--ease-out)', minWidth: 0 }}>
        
        {/* Search, Filter, Sort Actions */}
        <div className="sb-stagger" style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <Search size={14} color="var(--text-faint)" style={{ position: 'absolute', left: 12, top: 12 }} />
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Search by title..."
              style={{ width: '100%', padding: '10px 12px 10px 34px' }} 
            />
          </div>
          <select value={filterPattern} onChange={e => setFilterPattern(e.target.value)} style={{ flex: '0 1 auto', minWidth: 120 }}>
            <option value="All">All Topics</option>
            {PATTERNS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={filterDifficulty} onChange={e => setFilterDifficulty(e.target.value)} style={{ flex: '0 1 auto', minWidth: 100 }}>
            <option value="All">All Levels</option>
            {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ flex: '0 1 auto', minWidth: 100 }}>
            <option value="All">All Status</option>
            <option value="Due">Due For Review</option>
            <option value="Not Due">Not Due Yet</option>
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ flex: '0 1 auto', minWidth: 110 }}>
            <option value="newest">Newest Logged</option>
            <option value="oldest">Oldest Logged</option>
            <option value="title">Alphabetical</option>
            <option value="review">Revision Due</option>
          </select>
        </div>

        {/* Table representation */}
        {filteredAndSorted.length === 0 ? (
          <div className="sb-fade-in" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--surface)' }}>
            No logged problems match your filter criteria.
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Problem Name</th>
                  <th>Topic</th>
                  <th>Level</th>
                  <th>Revision Window</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSorted.map(p => {
                  const due = p.nextReview ? daysUntil(p.nextReview) : null;
                  const isSelected = selectedId === p.id;
                  return (
                    <tr 
                      key={p.id} 
                      onClick={() => handleRowClick(p.id)}
                      style={{ 
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(56, 189, 248, 0.05)' : 'transparent'
                      }}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 600, color: '#fff' }}>{p.title}</span>
                          {p.link && (
                            <a 
                              href={p.link} 
                              target="_blank" 
                              rel="noreferrer" 
                              onClick={e => e.stopPropagation()} 
                              style={{ color: 'var(--frost)', display: 'inline-flex' }}
                            >
                              <ExternalLink size={12} />
                            </a>
                          )}
                          {p.mistakes && <AlertTriangle size={12} color="var(--ember)" title="Contains mistake log" />}
                        </div>
                      </td>
                      <td>
                        <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.pattern}</span>
                      </td>
                      <td>
                        <DifficultyBadge level={p.difficulty} />
                      </td>
                      <td>
                        {due !== null && (
                          <span className="mono" style={{ 
                            fontSize: 11, 
                            color: due <= 0 ? 'var(--ember)' : 'var(--text-muted)',
                            fontWeight: due <= 0 ? 700 : 500 
                          }}>
                            {due <= 0 
                              ? 'Due Now' 
                              : due === 1 
                                ? 'Due Tomorrow' 
                                : `in ${due}d`
                            }
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button 
                            className="btn-ghost" 
                            onClick={() => onEdit(p.id)} 
                            title="Edit details"
                          >
                            <Pencil size={13} />
                          </button>
                          <button 
                            className="btn-ghost" 
                            style={{ color: 'var(--danger)' }} 
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete "${p.title}"?`)) {
                                onDelete(p.id);
                                if (selectedId === p.id) setSelectedId(null);
                              }
                            }} 
                            title="Delete problem"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slide-out details side panel */}
      {selectedId && selectedProblem && (
        <div className="sb-slide-in-right" style={{
          flex: '1 1 38%',
          background: 'var(--surface)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-lg)',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          maxHeight: '660px',
          overflowY: 'auto',
          boxShadow: 'var(--shadow-xl)',
          position: 'sticky',
          top: 0
        }}>
          {/* Header Panel */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                <DifficultyBadge level={selectedProblem.difficulty} />
                <Badge color="var(--frost)" bg="var(--frost-dim)">{selectedProblem.pattern}</Badge>
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>{selectedProblem.title}</h3>
            </div>
            <button className="btn-ghost" onClick={() => setSelectedId(null)} style={{ padding: 4 }}>
              <X size={16} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Calendar size={13} /> Added: {fmtDate(selectedProblem.createdAt)}
            </span>
            <span>•</span>
            <span>Revisions: {selectedProblem.reviewHistory ? selectedProblem.reviewHistory.length - 1 : 0}</span>
          </div>

          {/* AI-Generated Summary Block */}
          {selectedProblem.summary ? (
            <div style={{
              background: 'rgba(56, 189, 248, 0.03)',
              border: '1px solid rgba(56, 189, 248, 0.15)',
              borderRadius: 'var(--radius-md)',
              padding: 14
            }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--frost)', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }} className="mono">
                AI Synthesis
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.55, marginBottom: 8, color: 'var(--text)' }}>
                {selectedProblem.summary.summary}
              </p>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 8 }}>
                <strong style={{ color: '#fff' }}>Key Trick:</strong> {selectedProblem.summary.keyInsight}
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 11.5 }} className="mono">
                <span>Time Complexity: <strong style={{ color: 'var(--ember)' }}>{selectedProblem.summary.timeComplexity}</strong></span>
                <span>Space Complexity: <strong style={{ color: 'var(--ember)' }}>{selectedProblem.summary.spaceComplexity}</strong></span>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 12, fontStyle: 'italic', color: 'var(--text-faint)', padding: '10px 0' }}>
              No AI summary generated. Edit the problem to trigger summary parsing.
            </div>
          )}

          {/* Solution Approach Notes */}
          <div>
            <div className="mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
              Approach Notes
            </div>
            <div style={{
              background: 'rgba(0, 0, 0, 0.2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: 12,
              fontSize: 13,
              lineHeight: 1.55,
              whiteSpace: 'pre-wrap',
              maxHeight: '140px',
              overflowY: 'auto'
            }}>
              {selectedProblem.notes || 'No approach notes recorded.'}
            </div>
          </div>

          {/* Mistake log */}
          {selectedProblem.mistakes && (
            <div style={{
              background: 'rgba(251, 146, 60, 0.03)',
              border: '1px solid rgba(251, 146, 60, 0.12)',
              borderRadius: 'var(--radius-sm)',
              padding: 12,
              display: 'flex',
              gap: 8,
              alignItems: 'flex-start'
            }}>
              <AlertTriangle size={15} color="var(--ember)" style={{ marginTop: 2, flexShrink: 0 }} />
              <div style={{ fontSize: 12.5, lineHeight: 1.55 }}>
                <strong style={{ color: 'var(--ember)' }} className="mono">Mistakes logged: </strong>
                {selectedProblem.mistakes}
              </div>
            </div>
          )}

          {/* Description / Code Paste */}
          {selectedProblem.description && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Statement / Source Code
                </span>
                <button 
                  className="btn-ghost" 
                  onClick={() => copyToClipboard(selectedProblem.description)}
                  style={{ padding: '2px 6px', fontSize: 11, display: 'flex', gap: 4 }}
                >
                  {copied ? <Check size={12} color="var(--signal)" /> : <Copy size={12} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="mono" style={{
                background: '#040406',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: 12,
                fontSize: 11.5,
                lineHeight: 1.55,
                overflowX: 'auto',
                maxHeight: '150px',
                color: '#d4d4d8'
              }}>
                {selectedProblem.description}
              </pre>
            </div>
          )}

          {/* Footer Actions Panel */}
          <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 14, borderTop: '1px solid var(--border)' }}>
            <button
              className="btn-primary"
              onClick={() => onDirectReview(selectedProblem.id)}
              style={{ flex: 1, padding: '10px 0', fontSize: 13 }}
            >
              Start Quick Review
            </button>
            <button
              className="btn-secondary"
              onClick={() => onEdit(selectedProblem.id)}
              style={{ flex: 1, padding: '10px 0', fontSize: 13 }}
            >
              Modify Details
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
