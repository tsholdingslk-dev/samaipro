"use client";
import React from 'react';
import { Mic, Video, DownloadCloud, Play, Radio } from 'lucide-react';

export default function MediaVoiceStudio() {
  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', color: 'var(--text-main)', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Mic size={36} color="#8b5cf6" />
        Media & Voice Studio
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '3rem', fontSize: '1.1rem' }}>
        Manage OmniVoice AI, Audio generation tools, and multi-platform media downloaders.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
        
        {/* Voice AI Tool */}
        <div style={{ 
          background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', 
          borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
            <div style={{ padding: '10px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '12px', color: '#8b5cf6' }}>
              <Radio size={24} />
            </div>
            <h2 style={{ fontSize: '1.3rem', margin: 0 }}>OmniVoice AI</h2>
          </div>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', flex: 1 }}>
            Advanced TTS and Audio generation engine (SAM Audio AI & SAM VOC).
          </p>
          <button 
            className="btn-primary" 
            style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px', background: '#8b5cf6' }}
            onClick={() => window.open('http://localhost/samai/super_app_projects/samvoc/index.php', '_blank')}
          >
            <Play size={16} /> Open Voice Studio
          </button>
        </div>

        {/* Media Downloader */}
        <div style={{ 
          background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', 
          borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
            <div style={{ padding: '10px', background: 'rgba(236, 72, 153, 0.1)', borderRadius: '12px', color: '#ec4899' }}>
              <DownloadCloud size={24} />
            </div>
            <h2 style={{ fontSize: '1.3rem', margin: 0 }}>Universal Downloader</h2>
          </div>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', flex: 1 }}>
            AnyLink & FB Video downloaders to extract media instantly from social networks.
          </p>
          <button 
            className="btn-primary" 
            style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px', background: 'transparent', border: '1px solid var(--border)' }}
            onClick={() => window.open('http://localhost/samai/super_app_projects/link/index.php', '_blank')}
          >
            <Play size={16} /> Launch Downloader
          </button>
        </div>

      </div>
    </div>
  );
}
