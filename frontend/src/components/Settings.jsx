import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Key, Save, Download, Upload, LogOut, Info, ShieldCheck, Database } from 'lucide-react';

export default function Settings({ problems, onImportData }) {
  const { user, logout, updateProfile, geminiKey, setGeminiKey, useLocalOnly } = useAuth();
  
  const [targetCompany, setTargetCompany] = useState(user?.targetCompany || '');
  const [hoursGoal, setHoursGoal] = useState(user?.hoursGoal || 10);
  const [localKey, setLocalKey] = useState(geminiKey || '');
  
  const [profileMsg, setProfileMsg] = useState('');
  const [keyMsg, setKeyMsg] = useState('');
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileMsg('');
    try {
      await updateProfile(targetCompany, hoursGoal);
      setProfileMsg('Profile updated successfully.');
      setTimeout(() => setProfileMsg(''), 3000);
    } catch (err) {
      setProfileMsg('Failed to update profile.');
    }
  };

  const handleSaveKey = (e) => {
    e.preventDefault();
    setKeyMsg('');
    setGeminiKey(localKey.trim());
    setKeyMsg('API Key configuration saved.');
    setTimeout(() => setKeyMsg(''), 3000);
  };

  const handleExport = () => {
    const backup = {
      version: 'studybuddy-v2',
      exportDate: new Date().toISOString(),
      user: {
        targetCompany: user?.targetCompany,
        hoursGoal: user?.hoursGoal
      },
      problems
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `study-buddy-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    setImportError('');
    setImportSuccess('');
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        if (!parsed.problems || !Array.isArray(parsed.problems)) {
          throw new Error('Invalid backup file: Problems array missing.');
        }

        // Forward problems to parent component to import via API or direct state
        await onImportData(parsed.problems);
        setImportSuccess(`Successfully imported ${parsed.problems.length} problems!`);
        e.target.value = null; // reset input
      } catch (err) {
        console.error(err);
        setImportError(err.message || 'Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="sb-fade-in" style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      
      {/* Server Status Header banner */}
      <div className="sb-fade-in" style={{
        background: useLocalOnly ? 'var(--danger-dim)' : 'rgba(74, 222, 128, 0.04)',
        border: `1px solid ${useLocalOnly ? 'rgba(248, 113, 113, 0.15)' : 'rgba(74, 222, 128, 0.15)'}`,
        borderRadius: 'var(--radius-md)',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: useLocalOnly ? '0 0 16px rgba(248, 113, 113, 0.04)' : '0 0 16px rgba(74, 222, 128, 0.04)'
      }}>
        {useLocalOnly ? (
          <>
            <Database size={18} color="var(--danger)" />
            <div style={{ fontSize: 13, lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--danger)' }}>Offline Sandbox Mode: </strong>
              The backend server is unreachable. Operating with a browser sandbox database (`localStorage`). Start the server for database persistence.
            </div>
          </>
        ) : (
          <>
            <ShieldCheck size={18} color="var(--signal)" />
            <div style={{ fontSize: 13, lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--signal)' }}>Database Connected: </strong>
              Express & SQLite backend are active. All updates are securely persisted in real-time.
            </div>
          </>
        )}
      </div>

      {/* Profile Form */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <h4 className="mono" style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', paddingBottom: 10, letterSpacing: '0.02em' }}>
          Profile Goals
        </h4>
        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                Target Company
              </label>
              <input 
                value={targetCompany}
                onChange={e => setTargetCompany(e.target.value)}
                placeholder="e.g. Google, Meta"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                Weekly Prep Target (Hours)
              </label>
              <input 
                type="number"
                min="1"
                max="80"
                value={hoursGoal}
                onChange={e => setHoursGoal(e.target.value)}
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
            <button type="submit" className="btn-secondary" style={{ display: 'flex', gap: 6, padding: '8px 14px' }}>
              <Save size={13} /> Save Profile Settings
            </button>
            {profileMsg && <span style={{ fontSize: 12, color: 'var(--signal)' }}>{profileMsg}</span>}
          </div>
        </form>
      </div>

      {/* Custom AI Keys */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <h4 className="mono" style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', paddingBottom: 10, letterSpacing: '0.02em' }}>
          Gemini AI Configuration
        </h4>
        <div style={{
          background: 'rgba(56, 189, 248, 0.03)',
          border: '1px solid rgba(56, 189, 248, 0.1)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px 14px',
          display: 'flex',
          gap: 8,
          alignItems: 'flex-start'
        }}>
          <Info size={15} color="var(--frost)" style={{ marginTop: 2, flexShrink: 0 }} />
          <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            To auto-generate problem complexities and insights, Study Buddy uses Google Gemini. By default, it uses the server's API key. You can paste your own personal key below to use your own quotas.
          </p>
        </div>
        <form onSubmit={handleSaveKey} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
              Custom Gemini API Key
            </label>
            <div style={{ position: 'relative' }}>
              <Key size={14} color="var(--text-faint)" style={{ position: 'absolute', left: 12, top: 13 }} />
              <input 
                type="password"
                value={localKey}
                onChange={e => setLocalKey(e.target.value)}
                placeholder="AIzaSy..."
                style={{ paddingLeft: 34 }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
            <button type="submit" className="btn-secondary" style={{ display: 'flex', gap: 6, padding: '8px 14px' }}>
              <Save size={13} /> Update API Key
            </button>
            {keyMsg && <span style={{ fontSize: 12, color: 'var(--signal)' }}>{keyMsg}</span>}
          </div>
        </form>
      </div>

      {/* Portability / Backup block */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <h4 className="mono" style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', paddingBottom: 10, letterSpacing: '0.02em' }}>
          Workspace Data & Backups
        </h4>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {/* Export */}
          <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Download a full local JSON copy of your preparation logs, categories, and spaced repetition intervals.
            </p>
            <button onClick={handleExport} className="btn-secondary" style={{ display: 'flex', gap: 6, width: '100%' }}>
              <Download size={14} /> Export Backup File
            </button>
          </div>
          
          {/* Import */}
          <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Restore problems and reviews from an exported study buddy JSON file.
            </p>
            <div style={{ position: 'relative', width: '100%' }}>
              <input 
                type="file" 
                accept=".json"
                onChange={handleImport}
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: 0,
                  cursor: 'pointer',
                  width: '100%'
                }}
              />
              <button className="btn-secondary" style={{ display: 'flex', gap: 6, width: '100%', pointerEvents: 'none' }}>
                <Upload size={14} /> Upload Backup File
              </button>
            </div>
          </div>
        </div>

        {importError && <span style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>{importError}</span>}
        {importSuccess && <span style={{ fontSize: 12, color: 'var(--signal)', marginTop: 4 }}>{importSuccess}</span>}
      </div>

      {/* Account controls */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(248, 113, 113, 0.12)', transition: 'all 0.3s var(--ease-out)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: 'var(--surface-hover)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 15,
            fontWeight: 700,
            color: 'var(--frost)'
          }}>
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Logged in as: {user?.username}</h4>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Targeting: {user?.targetCompany || 'Not Specified'}</span>
          </div>
        </div>
        <button onClick={logout} className="btn-danger" style={{ display: 'flex', gap: 6, padding: '10px 18px' }}>
          <LogOut size={14} /> Log Out
        </button>
      </div>

    </div>
  );
}
