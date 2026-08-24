"use client";
import React, { useState } from 'react';
import { Play, Code, Smartphone, Terminal, LayoutPanelLeft, FileCode, CheckCircle, Database, Server, Settings, Box } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function FlutterStudioPage() {
  const [activeTab, setActiveTab] = useState('editor');
  const [prompt, setPrompt] = useState("");
  const [chatLog, setChatLog] = useState<{role: string, content: string}[]>([
    { role: "system", content: "Welcome to Flutter AI Studio. I am ready to analyze, reconstruct, and edit your authorized Flutter project. What would you like to build today?" }
  ]);
  
  const code = `import 'package:flutter/material.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter Reconstruction',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.indigo),
        useMaterial3: true,
      ),
      home: const MyHomePage(title: 'Compliance-First IDE'),
    );
  }
}`;

  const handleSend = () => {
    if (!prompt.trim()) return;
    setChatLog([...chatLog, { role: "user", content: prompt }]);
    setTimeout(() => {
      setChatLog(prev => [...prev, { role: "assistant", content: "I have analyzed your request. I will update the primary theme color to match modern Material 3 guidelines, restructure the Widget tree, and run the Dart formatter." }]);
    }, 1000);
    setPrompt("");
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--bg-dark)', color: 'var(--text-main)', fontFamily: 'var(--font-family, "Outfit", sans-serif)', overflow: 'hidden' }}>
      
      {/* Top Navbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', backgroundColor: 'var(--bg-sidebar)', borderBottom: '1px solid var(--border)', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '8px', backgroundColor: 'rgba(99, 102, 241, 0.15)', borderRadius: '8px' }}>
            <Smartphone size={22} style={{ color: 'var(--primary)' }} />
          </div>
          <span style={{ fontSize: '18px', fontWeight: 'bold', letterSpacing: '0.5px' }}>Flutter AI Studio</span>
          <span style={{ padding: '2px 8px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', color: 'var(--text-muted)' }}>Beta</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button style={{ padding: '8px 16px', fontSize: '14px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <CheckCircle size={16} /> Run Analyzer
          </button>
          <button style={{ padding: '8px 16px', fontSize: '14px', backgroundColor: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}>
            <Play size={16} /> Live Preview
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Left Sidebar - File Explorer */}
        <div style={{ width: '280px', borderRight: '1px solid var(--border)', backgroundColor: 'var(--bg-sidebar)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            Project Explorer
            <Settings size={14} style={{ cursor: 'pointer' }} />
          </div>
          <div style={{ flex: 1, padding: '12px', overflowY: 'auto', fontSize: '14px', fontWeight: 500 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-main)', marginBottom: '4px' }}>
              <Database size={16} style={{ color: 'var(--text-muted)' }} /> /workspace
            </div>
            <div style={{ paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-main)' }}>
                <FileCode size={16} style={{ color: '#fbbf24' }} /> pubspec.yaml
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-main)' }}>
                <LayoutPanelLeft size={16} style={{ color: 'var(--primary)' }} /> lib/
              </div>
              <div style={{ paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', borderRadius: '8px', cursor: 'pointer', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                  <FileCode size={16} /> main.dart
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <FileCode size={16} /> home_screen.dart
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <FileCode size={16} /> api_service.dart
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center - Monaco/Code Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, backgroundColor: '#0a0a0f' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-sidebar)', overflowX: 'auto' }}>
            <button 
              onClick={() => setActiveTab('editor')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontSize: '14px', fontWeight: 500, borderRight: '1px solid var(--border)', borderTop: activeTab === 'editor' ? '2px solid var(--primary)' : '2px solid transparent', backgroundColor: activeTab === 'editor' ? '#0a0a0f' : 'transparent', color: activeTab === 'editor' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', outline: 'none' }}
            >
              <Code size={16} /> main.dart
            </button>
            <button 
              onClick={() => setActiveTab('preview')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontSize: '14px', fontWeight: 500, borderRight: '1px solid var(--border)', borderTop: activeTab === 'preview' ? '2px solid var(--primary)' : '2px solid transparent', backgroundColor: activeTab === 'preview' ? '#0a0a0f' : 'transparent', color: activeTab === 'preview' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', outline: 'none' }}
            >
              <LayoutPanelLeft size={16} /> UI Preview
            </button>
          </div>
          
          {/* Code / Preview Area */}
          <div style={{ flex: 1, padding: '24px', overflow: 'auto' }}>
            {activeTab === 'editor' ? (
              <div className="glass-panel" style={{ height: '100%', padding: '24px', overflow: 'auto', backgroundColor: '#13131a', border: '1px solid var(--border)', borderRadius: '12px' }}>
                <pre style={{ fontFamily: 'monospace', fontSize: '14px', lineHeight: '1.6', color: 'var(--text-main)', margin: 0 }}>
                  <span style={{ color: '#c586c0' }}>import</span> <span style={{ color: '#ce9178' }}>'package:flutter/material.dart'</span>;<br/><br/>
                  <span style={{ color: '#c586c0' }}>void</span> <span style={{ color: '#dcdcaa' }}>main</span>() {'{\n'}
                  {'  '}<span style={{ color: '#dcdcaa' }}>runApp</span>(<span style={{ color: '#569cd6' }}>const</span> <span style={{ color: '#4ec9b0' }}>MyApp</span>());<br/>
                  {'}'}<br/><br/>
                  <span style={{ color: '#c586c0' }}>class</span> <span style={{ color: '#4ec9b0' }}>MyApp</span> <span style={{ color: '#c586c0' }}>extends</span> <span style={{ color: '#4ec9b0' }}>StatelessWidget</span> {'{\n'}
                  {'  '}<span style={{ color: '#569cd6' }}>const</span> <span style={{ color: '#dcdcaa' }}>MyApp</span>({'{super.key}'});<br/><br/>
                  {'  '}<span style={{ color: '#c586c0' }}>@override</span><br/>
                  {'  '}<span style={{ color: '#4ec9b0' }}>Widget</span> <span style={{ color: '#dcdcaa' }}>build</span>(<span style={{ color: '#4ec9b0' }}>BuildContext</span> context) {'{\n'}
                  {'    '}<span style={{ color: '#c586c0' }}>return</span> <span style={{ color: '#4ec9b0' }}>MaterialApp</span>(<br/>
                  {'      '}title: <span style={{ color: '#ce9178' }}>'Flutter Reconstruction'</span>,<br/>
                  {'      '}theme: <span style={{ color: '#4ec9b0' }}>ThemeData</span>(<br/>
                  {'        '}colorScheme: <span style={{ color: '#4ec9b0' }}>ColorScheme</span>.<span style={{ color: '#dcdcaa' }}>fromSeed</span>(seedColor: <span style={{ color: '#4ec9b0' }}>Colors</span>.indigo),<br/>
                  {'      '}),<br/>
                  {'      '}home: <span style={{ color: '#569cd6' }}>const</span> <span style={{ color: '#4ec9b0' }}>MyHomePage</span>(title: <span style={{ color: '#ce9178' }}>'Compliance-First IDE'</span>),<br/>
                  {'    '});<br/>
                  {'  }'}<br/>
                  {'}'}
                </pre>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <div style={{ width: '375px', height: '812px', border: '12px solid #13131a', borderRadius: '48px', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '24px', backgroundColor: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '120px', height: '24px', backgroundColor: '#13131a', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}></div>
                  </div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', backgroundColor: '#f8fafc' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '16px', backgroundColor: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Box size={32} style={{ color: 'var(--primary)' }} />
                    </div>
                    <span style={{ color: '#64748b', fontWeight: 500 }}>Flutter Web Canvas Active</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Bottom Terminal */}
          <div style={{ height: '220px', borderTop: '1px solid var(--border)', backgroundColor: 'var(--bg-sidebar)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Terminal size={14} /> Terminal & Build Pipeline
            </div>
            <div style={{ padding: '16px', fontFamily: 'monospace', fontSize: '14px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ color: 'var(--primary)' }}>➜</span> <span style={{ color: '#fff' }}>flutter analyze</span></div>
              <div style={{ color: 'var(--text-muted)' }}>Analyzing samai_flutter_workspace...</div>
              <div style={{ color: 'var(--success)' }}>No issues found! (ran in 1.2s)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}><span style={{ color: 'var(--primary)' }}>➜</span> <span style={{ color: '#fff' }}>dart format .</span></div>
              <div style={{ color: 'var(--success)' }}>Formatted 12 files (0.8s)</div>
              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ color: 'var(--primary)' }}>_</span></div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - AI Assistant */}
        <div style={{ width: '380px', borderLeft: '1px solid var(--border)', backgroundColor: 'var(--bg-sidebar)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 'bold', color: 'var(--text-main)' }}>
              <Server size={18} style={{ color: 'var(--primary)' }} /> AI Natural-Language Editor
            </div>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--success)', boxShadow: '0 0 8px var(--success)' }}></div>
          </div>
          
          <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px', backgroundColor: 'rgba(0,0,0,0.2)' }}>
            {chatLog.map((msg, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{ padding: '16px', borderRadius: '16px', maxWidth: '85%', backgroundColor: msg.role === 'user' ? 'var(--primary)' : 'var(--bg-card)', color: msg.role === 'user' ? '#fff' : 'var(--text-main)', borderTopRightRadius: msg.role === 'user' ? '4px' : '16px', borderTopLeftRadius: msg.role === 'user' ? '16px' : '4px', border: msg.role === 'user' ? 'none' : '1px solid var(--border)', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                  <div style={{ fontSize: '14px', lineHeight: '1.6' }}><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                </div>
              </div>
            ))}
          </div>
          
          <div style={{ padding: '16px', borderTop: '1px solid var(--border)', backgroundColor: 'var(--bg-sidebar)' }}>
            <div style={{ position: 'relative' }}>
              <textarea 
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="e.g., 'Make the home page modern'..."
                style={{ width: '100%', backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', paddingRight: '48px', fontSize: '14px', color: '#fff', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
                rows={3}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              />
              <button 
                onClick={handleSend}
                style={{ position: 'absolute', bottom: '12px', right: '12px', padding: '8px', backgroundColor: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Play size={16} />
              </button>
            </div>
            <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
              AI can modify files, run commands, and rebuild previews.
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
