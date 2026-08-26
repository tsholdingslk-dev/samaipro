"use client";
import React from 'react';
import { Code, MonitorPlay, Braces } from 'lucide-react';

export default function WebEditorIDE() {
  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', color: 'var(--text-main)', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Code size={36} color="#14b8a6" />
        Web Editor & IDE
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '3rem', fontSize: '1.1rem' }}>
        Cloud-based development environments for SAM Editor and Flutter Reconstruction.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
        
        {/* SAM Editor */}
        <div style={{ 
          background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', 
          borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
            <div style={{ padding: '10px', background: 'rgba(20, 184, 166, 0.1)', borderRadius: '12px', color: '#14b8a6' }}>
              <Braces size={24} />
            </div>
            <h2 style={{ fontSize: '1.3rem', margin: 0 }}>SAM Editor</h2>
          </div>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', flex: 1 }}>
            Full-stack web editor interface for editing HTML, JS, and backend templates.
          </p>
          <button 
            className="btn-primary" 
            style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px', background: '#14b8a6' }}
            onClick={() => window.open('http://localhost/samai/super_app_projects/sameditor/index.php', '_blank')}
          >
            <MonitorPlay size={16} /> Open Editor
          </button>
        </div>

        {/* Flutter Reconstruction IDE */}
        <div style={{ 
          background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', 
          borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
            <div style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', color: '#3b82f6' }}>
              <MonitorPlay size={24} />
            </div>
            <h2 style={{ fontSize: '1.3rem', margin: 0 }}>Flutter VS IDE</h2>
          </div>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', flex: 1 }}>
            Advanced IDE environment for Flutter Reconstruction (samvs project).
          </p>
          <button 
            className="btn-primary" 
            style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px', background: 'transparent', border: '1px solid var(--border)' }}
            onClick={() => window.open('http://localhost/samai/super_app_projects/samvs/index.php', '_blank')}
          >
            <MonitorPlay size={16} /> Open IDE
          </button>
        </div>

      </div>
    </div>
  );
}
