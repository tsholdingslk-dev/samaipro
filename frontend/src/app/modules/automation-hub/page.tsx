"use client";
import React, { useState } from 'react';
import { Bot, Terminal, Play, Settings, Zap, Brain, Shield, Users, Building, Activity, CheckCircle2, Circle } from 'lucide-react';

export default function AutomationHub() {
  const [mode, setMode] = useState('autonomous');
  const [goal, setGoal] = useState('');
  const [context, setContext] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  // Mock progress for UI demonstration
  const [progress, setProgress] = useState(0);

  const startAutonomousTask = async () => {
    if (!goal) return;
    setIsRunning(true);
    setProgress(0);
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/api/autonomous/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, context })
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.replace('data: ', ''));
              setProgress(data.progress);
              
              if (data.status === 'COMPLETE' || data.progress >= 100 && data.agent === 'system') {
                setIsRunning(false);
              }
            } catch (e) {
              console.error("Parse error", e);
            }
          }
        }
      }
    } catch (e) {
      console.error(e);
      setIsRunning(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', color: '#fff', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Bot size={40} color="#8b5cf6" />
          SAM AI Autonomous Agent Hub
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(139, 92, 246, 0.1)', padding: '8px 16px', borderRadius: '20px', border: '1px solid rgba(139, 92, 246, 0.3)', color: '#8b5cf6', fontWeight: 'bold' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8b5cf6', boxShadow: '0 0 8px #8b5cf6' }}></div>
          Autonomous Engine Online
        </div>
      </div>

      {/* Mission Modes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { id: 'quick', icon: <Zap size={18} />, title: 'Quick Mode', desc: 'Fast answer/task' },
          { id: 'deep', icon: <Brain size={18} />, title: 'Deep Mode', desc: 'Research + planning' },
          { id: 'autonomous', icon: <Bot size={18} />, title: 'Autonomous', desc: 'End-to-end execution' },
          { id: 'team', icon: <Users size={18} />, title: 'Team Mode', desc: 'Multiple agents' },
          { id: 'enterprise', icon: <Building size={18} />, title: 'Enterprise', desc: 'Approval gates' },
        ].map(m => (
          <div 
            key={m.id} 
            onClick={() => setMode(m.id)}
            style={{ 
              background: mode === m.id ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255,255,255,0.03)', 
              border: `1px solid ${mode === m.id ? '#8b5cf6' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '12px', padding: '1rem', cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: mode === m.id ? '#8b5cf6' : '#a1a1aa', fontWeight: 'bold', marginBottom: '4px' }}>
              {m.icon} {m.title}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>{m.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        {/* Left Column: Input & Activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Goal Input Section */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}><Terminal size={18} /> Define Mission Goal</h3>
            <textarea 
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Build a professional AI PDF Editor SaaS, write the frontend in Next.js, and deploy it."
              style={{ width: '100%', height: '100px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '1rem', color: '#fff', fontSize: '1rem', resize: 'none', marginBottom: '1rem' }}
            />
            
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem' }}>Context / Preferences (Optional)</h3>
            <input 
              type="text"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="e.g. React + Supabase + Tailwind CSS"
              style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.8rem', color: '#fff', marginBottom: '1.5rem' }}
            />

            <button 
              onClick={startAutonomousTask}
              disabled={isRunning || !goal}
              style={{ width: '100%', padding: '1rem', background: isRunning ? '#4c1d95' : '#8b5cf6', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold', cursor: (isRunning || !goal) ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
            >
              {isRunning ? <><Activity className="animate-spin" /> Agents Executing...</> : <><Play size={20} /> Run Autonomous Task</>}
            </button>
          </div>

          {/* Live Agent Activity */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}><Activity size={18} color="#10b981" /> LIVE AGENT ACTIVITY</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { name: '🧠 Planner Agent', progress: progress > 10 ? 100 : progress * 10, status: progress > 10 ? 'Done' : (progress > 0 ? 'Planning...' : 'Pending') },
                { name: '🔎 Research Agent', progress: progress > 30 ? 100 : (progress > 10 ? (progress - 10) * 5 : 0), status: progress > 30 ? 'Done' : (progress > 10 ? 'Researching API docs...' : 'Pending') },
                { name: '🎨 UI/UX Agent', progress: progress > 50 ? 100 : (progress > 30 ? (progress - 30) * 5 : 0), status: progress > 50 ? 'Done' : (progress > 30 ? 'Designing Layout...' : 'Pending') },
                { name: '💻 Developer Agent', progress: progress > 80 ? 100 : (progress > 50 ? (progress - 50) * 3.3 : 0), status: progress > 80 ? 'Done' : (progress > 50 ? 'Writing React Code...' : 'Waiting') },
                { name: '🧪 QA Agent', progress: progress > 90 ? 100 : (progress > 80 ? (progress - 80) * 10 : 0), status: progress > 90 ? 'Done' : (progress > 80 ? 'Running Tests...' : 'Pending') },
                { name: '🚀 Deployment Agent', progress: progress >= 100 ? 100 : (progress > 90 ? (progress - 90) * 10 : 0), status: progress >= 100 ? 'Deployed' : (progress > 90 ? 'Deploying to Vercel...' : 'Pending') }
              ].map(agent => (
                <div key={agent.name} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '180px', fontSize: '0.9rem', color: agent.progress > 0 ? '#fff' : 'rgba(255,255,255,0.4)' }}>{agent.name}</div>
                  <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{ width: `${agent.progress}%`, height: '100%', background: agent.progress === 100 ? '#10b981' : '#8b5cf6', transition: 'width 0.3s' }}></div>
                  </div>
                  <div style={{ width: '140px', fontSize: '0.8rem', color: agent.progress === 100 ? '#10b981' : 'rgba(255,255,255,0.6)', textAlign: 'right' }}>
                    {agent.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Execution Plan */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#eab308' }}>
            <Settings size={18} /> ORCHESTRATION PLAN
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
            {[
              { text: 'Analyze requirements & parse intent', state: progress > 10 ? 'done' : (progress > 0 ? 'active' : 'pending') },
              { text: 'Research technology stack & API costs', state: progress > 30 ? 'done' : (progress > 10 ? 'active' : 'pending') },
              { text: 'Design UI layout & wireframes', state: progress > 50 ? 'done' : (progress > 30 ? 'active' : 'pending') },
              { text: 'Implement frontend code & logic', state: progress > 80 ? 'done' : (progress > 50 ? 'active' : 'pending') },
              { text: 'Run automated QA checks & fix errors', state: progress > 90 ? 'done' : (progress > 80 ? 'active' : 'pending') },
              { text: 'Deploy to production environment', state: progress >= 100 ? 'done' : (progress > 90 ? 'active' : 'pending') },
            ].map((step, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', opacity: step.state === 'pending' ? 0.4 : 1 }}>
                <div style={{ marginTop: '2px' }}>
                  {step.state === 'done' ? <CheckCircle2 size={18} color="#10b981" /> : (step.state === 'active' ? <Circle size={18} color="#8b5cf6" className="animate-pulse" /> : <Circle size={18} />)}
                </div>
                <div style={{ fontSize: '0.95rem', color: step.state === 'done' ? '#a1a1aa' : '#fff', textDecoration: step.state === 'done' ? 'line-through' : 'none' }}>
                  {step.text}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px dashed rgba(16, 185, 129, 0.3)', borderRadius: '8px', color: '#10b981', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={16} /> Memory & Self-Healing Enabled
          </div>
        </div>
      </div>
    </div>
  );
}
