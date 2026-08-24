"use client";
import React, { useState } from 'react';
import { Play, Code, Smartphone, Terminal, LayoutPanelLeft, FileCode, CheckCircle, Database, Server } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function FlutterStudioPage() {
  const [activeTab, setActiveTab] = useState('editor');
  const [prompt, setPrompt] = useState("");
  const [chatLog, setChatLog] = useState<{role: string, content: string}[]>([
    { role: "system", content: "Welcome to Flutter AI Studio. I am ready to analyze, reconstruct, and edit your authorized Flutter project." }
  ]);
  
  // Dummy code state
  const [code, setCode] = useState(`import 'package:flutter/material.dart';

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
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        useMaterial3: true,
      ),
      home: const MyHomePage(title: 'Compliance-First Reconstruction'),
    );
  }
}
`);

  const handleSend = () => {
    if (!prompt.trim()) return;
    setChatLog([...chatLog, { role: "user", content: prompt }]);
    
    // Simulate AI response
    setTimeout(() => {
      setChatLog(prev => [...prev, { role: "assistant", content: "I have analyzed your request. I will update the primary theme color to match modern Material 3 guidelines and rebuild the Widget tree." }]);
    }, 1000);
    setPrompt("");
  };

  return (
    <div className="h-screen flex flex-col bg-[#0d1117] text-gray-200 overflow-hidden font-sans">
      
      {/* Top Navbar */}
      <div className="h-14 border-b border-gray-800 flex items-center justify-between px-4 bg-[#161b22]">
        <div className="flex items-center gap-2 text-blue-400 font-semibold">
          <Smartphone size={20} />
          <span>Flutter AI Studio</span>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 rounded-md flex items-center gap-1">
            <CheckCircle size={14} /> Run Analyzer
          </button>
          <button className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 rounded-md flex items-center gap-1">
            <Play size={14} /> Live Preview
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar - File Explorer */}
        <div className="w-64 border-r border-gray-800 bg-[#161b22] flex flex-col">
          <div className="p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-800">
            Project Explorer
          </div>
          <div className="flex-1 p-2 overflow-y-auto text-sm">
            <div className="flex items-center gap-2 p-1.5 hover:bg-gray-800 rounded cursor-pointer text-gray-300">
              <Database size={16} className="text-gray-500" /> /workspace
            </div>
            <div className="pl-4">
              <div className="flex items-center gap-2 p-1.5 hover:bg-gray-800 rounded cursor-pointer text-gray-300">
                <FileCode size={16} className="text-yellow-500" /> pubspec.yaml
              </div>
              <div className="flex items-center gap-2 p-1.5 hover:bg-gray-800 rounded cursor-pointer text-gray-300">
                <LayoutPanelLeft size={16} className="text-blue-500" /> lib/
              </div>
              <div className="pl-4">
                <div className="flex items-center gap-2 p-1.5 bg-blue-900/30 text-blue-400 rounded cursor-pointer border-l-2 border-blue-500">
                  <FileCode size={14} /> main.dart
                </div>
                <div className="flex items-center gap-2 p-1.5 hover:bg-gray-800 rounded cursor-pointer text-gray-400">
                  <FileCode size={14} /> home_screen.dart
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center - Monaco/Code Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex border-b border-gray-800 bg-[#0d1117]">
            <button className={\`px-4 py-2 text-sm border-r border-gray-800 \${activeTab === 'editor' ? 'bg-[#1e1e1e] text-blue-400 border-t-2 border-t-blue-500' : 'text-gray-400 hover:bg-gray-800'}\`} onClick={() => setActiveTab('editor')}>
              main.dart
            </button>
            <button className={\`px-4 py-2 text-sm border-r border-gray-800 \${activeTab === 'preview' ? 'bg-[#1e1e1e] text-blue-400 border-t-2 border-t-blue-500' : 'text-gray-400 hover:bg-gray-800'}\`} onClick={() => setActiveTab('preview')}>
              UI Preview
            </button>
          </div>
          
          <div className="flex-1 bg-[#1e1e1e] p-4 overflow-auto font-mono text-sm leading-relaxed">
            {activeTab === 'editor' ? (
              <pre className="text-gray-300">{code}</pre>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="w-[375px] h-[812px] border-8 border-gray-800 rounded-[3rem] bg-white flex items-center justify-center shadow-2xl">
                   <span className="text-gray-400">Flutter Web Canvas Loading...</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Bottom Terminal */}
          <div className="h-48 border-t border-gray-800 bg-[#0d1117] flex flex-col">
            <div className="px-3 py-1.5 border-b border-gray-800 text-xs font-semibold text-gray-400 flex items-center gap-2">
              <Terminal size={14} /> Terminal Pipeline
            </div>
            <div className="p-3 font-mono text-xs text-green-400 overflow-y-auto">
              <div>$ flutter analyze</div>
              <div className="text-gray-400">Analyzing samai_flutter_workspace...</div>
              <div>No issues found! (ran in 1.2s)</div>
              <div className="mt-2 text-gray-500">Waiting for commands...</div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - AI Assistant */}
        <div className="w-80 border-l border-gray-800 bg-[#161b22] flex flex-col">
          <div className="p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-800 flex items-center gap-2">
            <Server size={14} /> AI Natural-Language Editor
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 text-sm">
            {chatLog.map((msg, idx) => (
              <div key={idx} className={\`p-3 rounded-lg \${msg.role === 'user' ? 'bg-blue-600/20 border border-blue-500/30 ml-4' : 'bg-gray-800/50 border border-gray-700 mr-4'}\`}>
                <ReactMarkdown className="prose prose-invert max-w-none text-xs">{msg.content}</ReactMarkdown>
              </div>
            ))}
          </div>
          
          <div className="p-3 border-t border-gray-800">
            <textarea 
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="e.g., 'Make the home page modern' or 'Change primary color to blue'..."
              className="w-full bg-[#0d1117] border border-gray-700 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
              rows={3}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            />
            <button 
              onClick={handleSend}
              className="mt-2 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-semibold transition-colors"
            >
              Ask AI Agent
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
}
