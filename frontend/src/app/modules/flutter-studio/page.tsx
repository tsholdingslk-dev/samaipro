"use client";
import React, { useState, useRef } from 'react';
import { Play, Code, Smartphone, Terminal, LayoutPanelLeft, FileCode, CheckCircle, Database, Server, Settings, Box, Upload, FolderUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function FlutterStudioPage() {
  const [activeTab, setActiveTab] = useState('editor');
  const [activeFile, setActiveFile] = useState('lib/main.dart');
  const [prompt, setPrompt] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [chatLog, setChatLog] = useState<{role: string, content: string}[]>([
    { role: "system", content: "Welcome to Flutter AI Studio. Upload your project folder to begin analysis. I am connected to the backend AI and ready to reconstruct or edit your Flutter app." }
  ]);
  
  const defaultCode = `import 'package:flutter/material.dart';

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

  const [projectFiles, setProjectFiles] = useState<{ [path: string]: string }>({
    'lib/main.dart': defaultCode,
    'pubspec.yaml': 'name: samai_flutter_workspace\ndescription: A new Flutter project.\nversion: 1.0.0+1\n'
  });

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setChatLog(prev => [...prev, { role: "system", content: `Scanning uploaded directory... Found ${files.length} files. Extracting source code.` }]);

    const newFiles: { [path: string]: string } = {};
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Limit to text/code files to prevent browser memory crash on massive assets/build folders
      if (file.name.endsWith('.dart') || file.name.endsWith('.yaml') || file.name.endsWith('.txt') || file.name.endsWith('.json') || file.name.endsWith('.xml') || file.name.endsWith('.gradle') || file.name.endsWith('.md')) {
        try {
          const text = await file.text();
          // Remove the top level folder name from the path
          const pathParts = file.webkitRelativePath.split('/');
          pathParts.shift(); 
          const path = pathParts.join('/');
          newFiles[path] = text;
        } catch (err) {
          console.error("Failed to read", file.name);
        }
      }
    }
    
    if (Object.keys(newFiles).length > 0) {
      setProjectFiles(newFiles);
      const firstDart = Object.keys(newFiles).find(p => p.endsWith('main.dart')) || Object.keys(newFiles).find(p => p.endsWith('.dart'));
      if (firstDart) setActiveFile(firstDart);
      setChatLog(prev => [...prev, { role: "system", content: `Successfully loaded ${Object.keys(newFiles).length} source files into the AI Workspace.` }]);
    } else {
      setChatLog(prev => [...prev, { role: "system", content: `No valid Dart or config files found in the selected folder.` }]);
    }
  };

  const handleSend = async () => {
    if (!prompt.trim()) return;
    const userMessage = prompt;
    setPrompt("");
    
    setChatLog(prev => [...prev, { role: "user", content: userMessage }]);
    setChatLog(prev => [...prev, { role: "assistant", content: "Analyzing workspace and thinking..." }]);

    try {
      const formData = new FormData();
      // Send the prompt along with the current active file's code as context
      const context = `[SYSTEM CONTEXT - Active File: ${activeFile}]\n\`\`\`dart\n${projectFiles[activeFile]}\n\`\`\`\n\nUser Request: ${userMessage}`;
      formData.append("content", context);
      formData.append("mode", "flutter_studio");
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch("/api/chat/default", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      });
      
      const data = await res.json();
      const reply = data.content || data.message || "I've processed your request.";
      
      setChatLog(prev => {
        const newLog = [...prev];
        newLog[newLog.length - 1] = { role: "assistant", content: reply };
        return newLog;
      });
    } catch (error) {
      setChatLog(prev => {
        const newLog = [...prev];
        newLog[newLog.length - 1] = { role: "assistant", content: "Error connecting to AI Backend." };
        return newLog;
      });
    }
  };

  // Group files by top-level directory for the sidebar
  const getFileTree = () => {
    const tree: { [dir: string]: string[] } = { '/': [] };
    Object.keys(projectFiles).forEach(path => {
      if (path.includes('/')) {
        const dir = path.split('/')[0];
        if (!tree[dir]) tree[dir] = [];
        tree[dir].push(path);
      } else {
        tree['/'].push(path);
      }
    });
    return tree;
  };
  const fileTree = getFileTree();

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
          {/* Hidden File Input for Folder Upload */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFolderUpload} 
            style={{ display: 'none' }} 
            {...({ webkitdirectory: "true", directory: "true", multiple: true } as any)} 
          />
          <button onClick={() => fileInputRef.current?.click()} style={{ padding: '8px 16px', fontSize: '14px', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#fff', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <FolderUp size={16} /> Import Project
          </button>
          
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-main)', marginBottom: '4px', backgroundColor: 'rgba(255,255,255,0.02)' }}>
              <Database size={16} style={{ color: 'var(--text-muted)' }} /> /workspace
            </div>
            
            {/* Dynamic File Tree */}
            <div style={{ paddingLeft: '12px', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
              
              {/* Root level files */}
              {fileTree['/'].map(path => (
                 <div key={path} onClick={() => setActiveFile(path)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', backgroundColor: activeFile === path ? 'rgba(99, 102, 241, 0.1)' : 'transparent', color: activeFile === path ? 'var(--primary)' : 'var(--text-main)', border: activeFile === path ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid transparent' }}>
                   <FileCode size={14} style={{ color: path.endsWith('.yaml') ? '#fbbf24' : 'inherit' }} /> {path}
                 </div>
              ))}

              {/* Directories */}
              {Object.keys(fileTree).filter(k => k !== '/').map(dir => (
                <div key={dir}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', color: 'var(--text-muted)' }}>
                    <LayoutPanelLeft size={14} style={{ color: 'var(--primary)' }} /> {dir}/
                  </div>
                  <div style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {fileTree[dir].map(path => (
                      <div key={path} onClick={() => setActiveFile(path)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', backgroundColor: activeFile === path ? 'rgba(99, 102, 241, 0.1)' : 'transparent', color: activeFile === path ? 'var(--primary)' : 'var(--text-muted)', border: activeFile === path ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid transparent', fontSize: '13px' }}>
                        <FileCode size={14} /> {path.split('/').pop()}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
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
              <Code size={16} /> {activeFile.split('/').pop()}
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
              <div className="glass-panel" style={{ minHeight: '100%', padding: '24px', backgroundColor: '#13131a', border: '1px solid var(--border)', borderRadius: '12px' }}>
                <pre style={{ fontFamily: 'monospace', fontSize: '14px', lineHeight: '1.6', color: 'var(--text-main)', margin: 0, whiteSpace: 'pre-wrap' }}>
                  {projectFiles[activeFile]}
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
              <div style={{ color: 'var(--text-muted)' }}>Analyzing uploaded workspace...</div>
              <div style={{ color: 'var(--success)' }}>Loaded {Object.keys(projectFiles).length} files into memory successfully.</div>
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
                <div style={{ padding: '16px', borderRadius: '16px', maxWidth: '90%', backgroundColor: msg.role === 'user' ? 'var(--primary)' : 'var(--bg-card)', color: msg.role === 'user' ? '#fff' : 'var(--text-main)', borderTopRightRadius: msg.role === 'user' ? '4px' : '16px', borderTopLeftRadius: msg.role === 'user' ? '16px' : '4px', border: msg.role === 'user' ? 'none' : '1px solid var(--border)', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
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
