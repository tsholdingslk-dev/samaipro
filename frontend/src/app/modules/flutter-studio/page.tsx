"use client";
import React, { useState } from 'react';
import { Play, Code, Smartphone, Terminal, LayoutPanelLeft, FileCode, CheckCircle, Database, Server, Settings, Search, Box } from 'lucide-react';
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
    <div className="flex flex-col h-screen bg-slate-950 text-slate-300 font-sans overflow-hidden">
      
      {/* Top Navbar */}
      <div className="flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-800 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Smartphone size={22} className="text-blue-400" />
          </div>
          <span className="text-lg font-bold text-white tracking-wide">Flutter AI Studio</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] uppercase font-bold tracking-wider text-slate-400 ml-2">Beta</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 text-sm bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg flex items-center gap-2 transition-all">
            <CheckCircle size={16} /> Run Analyzer
          </button>
          <button className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 rounded-lg flex items-center gap-2 transition-all">
            <Play size={16} /> Live Preview
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar - File Explorer */}
        <div className="w-72 border-r border-slate-800 bg-slate-900/50 flex flex-col">
          <div className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 flex items-center justify-between">
            Project Explorer
            <Settings size={14} className="text-slate-600 hover:text-slate-400 cursor-pointer" />
          </div>
          <div className="flex-1 p-3 overflow-y-auto text-sm font-medium">
            <div className="flex items-center gap-2 px-3 py-2 hover:bg-slate-800/50 rounded-lg cursor-pointer text-slate-300 transition-colors">
              <Database size={16} className="text-slate-500" /> /workspace
            </div>
            <div className="pl-6 mt-1 flex flex-col gap-1">
              <div className="flex items-center gap-2 px-3 py-2 hover:bg-slate-800/50 rounded-lg cursor-pointer text-slate-300 transition-colors">
                <FileCode size={16} className="text-amber-400" /> pubspec.yaml
              </div>
              <div className="flex items-center gap-2 px-3 py-2 hover:bg-slate-800/50 rounded-lg cursor-pointer text-slate-300 transition-colors">
                <LayoutPanelLeft size={16} className="text-blue-400" /> lib/
              </div>
              <div className="pl-6 flex flex-col gap-1">
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 text-blue-400 rounded-lg cursor-pointer border border-blue-500/20 shadow-sm">
                  <FileCode size={16} /> main.dart
                </div>
                <div className="flex items-center gap-2 px-3 py-2 hover:bg-slate-800/50 rounded-lg cursor-pointer text-slate-400 transition-colors">
                  <FileCode size={16} /> home_screen.dart
                </div>
                <div className="flex items-center gap-2 px-3 py-2 hover:bg-slate-800/50 rounded-lg cursor-pointer text-slate-400 transition-colors">
                  <FileCode size={16} /> api_service.dart
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center - Monaco/Code Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#0f172a]">
          {/* Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-900 overflow-x-auto">
            <button 
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-r border-slate-800 transition-colors ${activeTab === 'editor' ? 'bg-[#0f172a] text-blue-400 border-t-2 border-t-blue-500 shadow-inner' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`} 
              onClick={() => setActiveTab('editor')}
            >
              <Code size={16} /> main.dart
            </button>
            <button 
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-r border-slate-800 transition-colors ${activeTab === 'preview' ? 'bg-[#0f172a] text-blue-400 border-t-2 border-t-blue-500 shadow-inner' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`} 
              onClick={() => setActiveTab('preview')}
            >
              <LayoutPanelLeft size={16} /> UI Preview
            </button>
          </div>
          
          {/* Code / Preview Area */}
          <div className="flex-1 p-6 overflow-auto">
            {activeTab === 'editor' ? (
              <div className="h-full bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-xl">
                <pre className="font-mono text-sm leading-loose text-slate-300">
                  <span className="text-purple-400">import</span> <span className="text-green-400">'package:flutter/material.dart'</span>;<br/><br/>
                  <span className="text-purple-400">void</span> <span className="text-blue-400">main</span>() {'{\n'}
                  {'  '}<span className="text-blue-400">runApp</span>(<span className="text-purple-400">const</span> <span className="text-yellow-200">MyApp</span>());<br/>
                  {'}'}<br/><br/>
                  <span className="text-purple-400">class</span> <span className="text-yellow-200">MyApp</span> <span className="text-purple-400">extends</span> <span className="text-yellow-200">StatelessWidget</span> {'{\n'}
                  {'  '}<span className="text-purple-400">const</span> <span className="text-blue-400">MyApp</span>({'{super.key}'});<br/><br/>
                  {'  '}<span className="text-purple-400">@override</span><br/>
                  {'  '}<span className="text-yellow-200">Widget</span> <span className="text-blue-400">build</span>(<span className="text-yellow-200">BuildContext</span> context) {'{\n'}
                  {'    '}<span className="text-purple-400">return</span> <span className="text-yellow-200">MaterialApp</span>(<br/>
                  {'      '}title: <span className="text-green-400">'Flutter Reconstruction'</span>,<br/>
                  {'      '}theme: <span className="text-yellow-200">ThemeData</span>(<br/>
                  {'        '}colorScheme: <span className="text-yellow-200">ColorScheme</span>.<span className="text-blue-400">fromSeed</span>(seedColor: <span className="text-yellow-200">Colors</span>.indigo),<br/>
                  {'      '}),<br/>
                  {'      '}home: <span className="text-purple-400">const</span> <span className="text-yellow-200">MyHomePage</span>(title: <span className="text-green-400">'Compliance-First IDE'</span>),<br/>
                  {'    '});<br/>
                  {'  }'}<br/>
                  {'}'}
                </pre>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="w-[375px] h-[812px] border-[12px] border-slate-900 rounded-[3rem] bg-white flex flex-col overflow-hidden shadow-2xl relative">
                  <div className="absolute top-0 inset-x-0 h-6 bg-black/5 flex items-center justify-center">
                    <div className="w-32 h-6 bg-slate-900 rounded-b-3xl"></div>
                  </div>
                  <div className="flex-1 flex items-center justify-center flex-col gap-4 bg-slate-50">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center animate-pulse">
                      <Box size={32} className="text-indigo-600" />
                    </div>
                    <span className="text-slate-500 font-medium">Flutter Web Canvas Active</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Bottom Terminal */}
          <div className="h-56 border-t border-slate-800 bg-slate-900 flex flex-col shadow-inner">
            <div className="px-4 py-2 border-b border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 bg-slate-900/80">
              <Terminal size={14} /> Terminal & Build Pipeline
            </div>
            <div className="p-4 font-mono text-sm overflow-y-auto space-y-2">
              <div className="flex items-center gap-2"><span className="text-blue-400">➜</span> <span className="text-white">flutter analyze</span></div>
              <div className="text-slate-400">Analyzing samai_flutter_workspace...</div>
              <div className="text-emerald-400">No issues found! (ran in 1.2s)</div>
              <div className="flex items-center gap-2 mt-4"><span className="text-blue-400">➜</span> <span className="text-white">dart format .</span></div>
              <div className="text-emerald-400">Formatted 12 files (0.8s)</div>
              <div className="mt-4 flex items-center gap-2"><span className="text-blue-400 animate-pulse">_</span></div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - AI Assistant */}
        <div className="w-[380px] border-l border-slate-800 bg-slate-900 flex flex-col shadow-xl z-20">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-300">
              <Server size={18} className="text-blue-400" /> AI Natural-Language Editor
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></div>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-6 text-sm bg-slate-900/50">
            {chatLog.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-4 rounded-2xl max-w-[85%] shadow-md ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700'}`}>
                  <div className="prose prose-invert max-w-none text-sm leading-relaxed"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-4 border-t border-slate-800 bg-slate-900">
            <div className="relative">
              <textarea 
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="e.g., 'Make the home page modern'..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 pr-12 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none shadow-inner placeholder:text-slate-600 transition-all"
                rows={3}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              />
              <button 
                onClick={handleSend}
                className="absolute bottom-3 right-3 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-md transition-all"
              >
                <Play size={16} className="ml-0.5" />
              </button>
            </div>
            <div className="mt-3 text-center text-xs text-slate-600 font-medium">
              AI can modify files, run commands, and rebuild previews.
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
