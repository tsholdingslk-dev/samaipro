"use client";
import React from 'react';
import { Bot, FileSpreadsheet, Download, Play, Terminal } from 'lucide-react';

export default function AutomationHub() {
  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', color: 'var(--text-main)', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Terminal size={36} color="#3b82f6" />
        Automation & Bot Hub
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '3rem', fontSize: '1.1rem' }}>
        Centralized dashboard to manage and execute your Python extraction scripts and MT5 trading bots.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
        
        {/* MT5 Trading Bot */}
        <div style={{ 
          background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', 
          borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
            <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', color: '#10b981' }}>
              <Bot size={24} />
            </div>
            <h2 style={{ fontSize: '1.3rem', margin: 0 }}>ORB Trading EA (MT5)</h2>
          </div>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', flex: 1 }}>
            MetaTrader 5 Expert Advisor for Opening Range Breakout strategy. Includes SMC Liquidity algorithms.
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              className="btn-primary" 
              style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
              onClick={() => window.open('http://localhost/samai/super_app_projects/orb/orb_mt5_bot.py', '_blank')}
            >
              <Download size={16} /> Source (.mq5)
            </button>
            <button 
              className="btn-primary" 
              style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '8px', background: '#10b981' }}
              onClick={() => alert('Compiled EA downloading not configured yet. Run the python script directly.')}
            >
              <Download size={16} /> Compiled (.ex5)
            </button>
          </div>
        </div>

        {/* Excel MCQ Extractor */}
        <div style={{ 
          background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', 
          borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
            <div style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', color: '#3b82f6' }}>
              <FileSpreadsheet size={24} />
            </div>
            <h2 style={{ fontSize: '1.3rem', margin: 0 }}>MCQ Excel Extractor</h2>
          </div>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', flex: 1 }}>
            Python-based Gemini AI pipeline to extract MCQ questions from PDFs into structured Excel templates.
          </p>
          <button 
            className="btn-primary" 
            style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px', background: '#3b82f6' }}
            onClick={() => window.open('http://localhost:5000', '_blank')}
          >
            <Play size={16} /> Launch Extractor Engine
          </button>
        </div>

      </div>
    </div>
  );
}
