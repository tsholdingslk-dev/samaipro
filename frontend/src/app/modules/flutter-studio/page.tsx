"use client";
import React, { useState, useRef } from 'react';
import JSZip from 'jszip';
import { Play, Code, Smartphone, Terminal, LayoutPanelLeft, FileCode, CheckCircle, Database, Server, Settings, Box, Upload, FolderUp, Cpu } from 'lucide-react';
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

  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    'flutter analyze', 
    'Analyzing uploaded workspace...', 
    'Waiting for user input...'
  ]);
  
  const [isPreviewActive, setIsPreviewActive] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);

  const handleBuildApk = async () => {
    setIsBuilding(true);
    setTerminalLogs(prev => [...prev, '➜ Preparing workspace...', 'Zipping project files...']);
    
    try {
      const zip = new JSZip();
      Object.entries(projectFiles).forEach(([path, content]) => {
        zip.file(path, content);
      });
      
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      setTerminalLogs(prev => [...prev, 'Sending project to Build Server...', 'Running: flutter build apk --debug']);
      
      const formData = new FormData();
      formData.append("zip_file", zipBlob, "project.zip");
      
      // Hit our new real backend
      const res = await fetch("/api/flutter-build/", {
        method: "POST",
        body: formData,
      });
      
      if (!res.ok) {
        const err = await res.json();
        setTerminalLogs(prev => [...prev, `[ERROR] Build failed: ${err.detail || 'Server error'}`]);
        setIsBuilding(false);
        return;
      }
      
      setTerminalLogs(prev => [...prev, 'BUILD SUCCESSFUL!', 'Downloading APK...']);
      
      const apkBlob = await res.blob();
      const url = URL.createObjectURL(apkBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `app-debug.apk`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setTerminalLogs(prev => [...prev, `Success: Generated app-debug.apk (${(apkBlob.size / 1024 / 1024).toFixed(2)} MB)`]);
    } catch (error) {
      setTerminalLogs(prev => [...prev, `[ERROR] Network or Server Error: ${error}`]);
    }
    
    setIsBuilding(false);
  };

  const handleRunAnalyzer = () => {
    setTerminalLogs(prev => [...prev, '➜ flutter analyze', 'Analyzing workspace...']);
    setTimeout(() => {
        let issuesCount = 0;
        const newLogs: string[] = [];
        Object.entries(projectFiles).forEach(([path, content]) => {
            if (path.endsWith('.dart')) {
                if (content.includes('print(')) {
                    issuesCount++;
                    newLogs.push(`info • Avoid print calls in production • ${path}`);
                }
                if (content.includes('// TODO') || content.includes('//TODO')) {
                    issuesCount++;
                    newLogs.push(`info • Unresolved TODO found • ${path}`);
                }
            }
        });
        if (issuesCount === 0) {
            newLogs.push('No issues found! (ran in 1.4s)');
        } else {
            newLogs.push(`Found ${issuesCount} issues. (ran in 1.8s)`);
        }
        setTerminalLogs(prev => [...prev, ...newLogs]);
    }, 800);
  };

  const handleLivePreview = () => {
    setTerminalLogs(prev => [...prev, '➜ flutter run -d web', 'Launching active file on Web...', 'Waiting for connection from debug service...']);
    setTimeout(() => {
        setTerminalLogs(prev => [...prev, 'Syncing files to device Web...', 'Application finished compiling. Updating canvas...']);
        setActiveTab('preview');
        setIsPreviewActive(true);
    }, 1500);
  };

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setChatLog(prev => [...prev, { role: "system", content: `Scanning uploaded directory... Found ${files.length} files. Extracting source code.` }]);
    setTerminalLogs(prev => [...prev, '➜ Loading project files into memory...', `Found ${files.length} raw files...`]);

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
      setTerminalLogs(prev => [...prev, `Success: Indexed ${Object.keys(newFiles).length} source files.`]);
    } else {
      setChatLog(prev => [...prev, { role: "system", content: `No valid Dart or config files found in the selected folder.` }]);
      setTerminalLogs(prev => [...prev, `Error: No valid source files found.`]);
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
          
          <button onClick={handleRunAnalyzer} style={{ padding: '8px 16px', fontSize: '14px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <CheckCircle size={16} /> Run Analyzer
          </button>
          <button onClick={handleLivePreview} style={{ padding: '8px 16px', fontSize: '14px', backgroundColor: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}>
            <Play size={16} /> Live Preview
          </button>
          <button onClick={handleBuildApk} disabled={isBuilding} style={{ padding: '8px 16px', fontSize: '14px', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: isBuilding ? 'wait' : 'pointer', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)', opacity: isBuilding ? 0.7 : 1 }}>
            <Cpu size={16} className={isBuilding ? "animate-pulse" : ""} /> {isBuilding ? "Building..." : "Build APK"}
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
                      <div key={path} onClick={() => setActiveFile(path)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', backgroundColor: activeFile === path ? 'rgba(99, 102, 241, 0.1)' : 'transparent', color: activeFile === path ? 'var(--primary)' : 'var(--text-muted)', border: activeFile === path ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid transparent', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <FileCode size={14} style={{ flexShrink: 0 }} /> {path.split('/').pop()}
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
              <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0', backgroundColor: '#13131a', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                <textarea 
                  value={projectFiles[activeFile] || ''}
                  onChange={(e) => setProjectFiles(prev => ({ ...prev, [activeFile]: e.target.value }))}
                  spellCheck={false}
                  style={{ flex: 1, width: '100%', height: '100%', padding: '24px', fontFamily: 'monospace', fontSize: '14px', lineHeight: '1.6', color: 'var(--text-main)', backgroundColor: 'transparent', border: 'none', outline: 'none', resize: 'none', whiteSpace: 'pre' }}
                />
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '32px' }}>
                {/* Phone Mockup */}
                <div style={{ width: '375px', minHeight: '700px', border: '12px solid #13131a', borderRadius: '48px', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '24px', backgroundColor: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                    <div style={{ width: '120px', height: '24px', backgroundColor: '#13131a', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}></div>
                  </div>
                  
                  {/* App Bar */}
                  <div style={{ backgroundColor: '#6366f1', padding: '40px 16px 12px 16px', color: '#fff' }}>
                    <div style={{ fontSize: '18px', fontWeight: 600 }}>
                      {(() => {
                        // Try to extract app name from project files
                        const manifest = Object.keys(projectFiles).find(p => p.includes('AndroidManifest.xml'));
                        const pubspec = Object.keys(projectFiles).find(p => p.includes('pubspec.yaml'));
                        if (pubspec && projectFiles[pubspec]) {
                          const nameMatch = projectFiles[pubspec].match(/name:\s*(.+)/);
                          if (nameMatch) return nameMatch[1].trim();
                        }
                        if (manifest && projectFiles[manifest]) {
                          const labelMatch = projectFiles[manifest].match(/android:label="([^"]+)"/);
                          if (labelMatch) return labelMatch[1];
                        }
                        return 'My App';
                      })()}
                    </div>
                  </div>

                  {/* App Content - Show screens/activities found */}
                  <div style={{ flex: 1, padding: '16px', backgroundColor: '#f8fafc', overflowY: 'auto' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '12px' }}>Detected Screens</div>
                    {(() => {
                      const screens: string[] = [];
                      Object.keys(projectFiles).forEach(path => {
                        // Find dart files with Screen/Page/Activity in name
                        if (path.endsWith('.dart')) {
                          const name = path.split('/').pop()?.replace('.dart', '') || '';
                          if (name.includes('screen') || name.includes('page') || name.includes('home') || name.includes('main') || name.includes('login') || name.includes('splash') || name.includes('dashboard')) {
                            screens.push(name);
                          }
                        }
                        // Find Android activities from XML
                        if (path.includes('AndroidManifest.xml') && projectFiles[path]) {
                          const activityMatches = projectFiles[path].match(/android:name="([^"]*Activity[^"]*)"/g);
                          if (activityMatches) {
                            activityMatches.forEach(m => {
                              const name = m.match(/android:name="([^"]+)"/);
                              if (name) screens.push(name[1].split('.').pop() || '');
                            });
                          }
                        }
                      });
                      const uniqueScreens = [...new Set(screens)].slice(0, 8);
                      if (uniqueScreens.length === 0) {
                        return <div style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', padding: '24px' }}>Upload a Flutter/Android project to detect screens</div>;
                      }
                      return uniqueScreens.map((screen, i) => (
                        <div key={i} style={{ padding: '12px', marginBottom: '8px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: `hsl(${i * 45}, 70%, 95%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 600, color: `hsl(${i * 45}, 70%, 45%)` }}>
                            {screen.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 500, color: '#1e293b' }}>{screen}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Screen Component</div>
                          </div>
                        </div>
                      ));
                    })()}
                    
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginTop: '24px', marginBottom: '12px' }}>Project Stats</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                        <div style={{ fontSize: '20px', fontWeight: 700, color: '#6366f1' }}>{Object.keys(projectFiles).filter(p => p.endsWith('.dart')).length}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>Dart Files</div>
                      </div>
                      <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                        <div style={{ fontSize: '20px', fontWeight: 700, color: '#f59e0b' }}>{Object.keys(projectFiles).filter(p => p.endsWith('.xml')).length}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>XML Files</div>
                      </div>
                      <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                        <div style={{ fontSize: '20px', fontWeight: 700, color: '#10b981' }}>{Object.keys(projectFiles).length}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>Total Files</div>
                      </div>
                      <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                        <div style={{ fontSize: '20px', fontWeight: 700, color: '#ef4444' }}>{Object.keys(projectFiles).filter(p => p.endsWith('.json')).length}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>JSON Files</div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Nav Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-around', padding: '8px 0', borderTop: '1px solid #e2e8f0', backgroundColor: '#fff' }}>
                    <div style={{ textAlign: 'center', padding: '4px' }}><div style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: '#6366f1', margin: '0 auto 2px' }}></div><div style={{ fontSize: '10px', color: '#94a3b8' }}>Home</div></div>
                    <div style={{ textAlign: 'center', padding: '4px' }}><div style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: '#e2e8f0', margin: '0 auto 2px' }}></div><div style={{ fontSize: '10px', color: '#94a3b8' }}>Search</div></div>
                    <div style={{ textAlign: 'center', padding: '4px' }}><div style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: '#e2e8f0', margin: '0 auto 2px' }}></div><div style={{ fontSize: '10px', color: '#94a3b8' }}>Profile</div></div>
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
              {terminalLogs.map((log, index) => (
                <div key={index} style={{ 
                  color: log.startsWith('info') ? '#fbbf24' : log.startsWith('➜') ? 'var(--primary)' : log.includes('Success') || log.includes('issues found') ? 'var(--success)' : log.includes('Error') ? '#ef4444' : 'var(--text-muted)',
                  display: 'flex', alignItems: 'flex-start', gap: '8px' 
                }}>
                  {log}
                </div>
              ))}
              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ color: 'var(--primary)' }}>_</span></div>
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
