"use client";
import React, { useState } from 'react';
import { FileUp, Search, ShieldAlert, CheckCircle, Code, FileCode, Play, Smartphone, BrainCircuit } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function ApkDecompPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "decompiling" | "analyzing" | "done">("idle");
  const [logs, setLogs] = useState<string[]>([]);
  const [report, setReport] = useState<string | null>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const startAnalysis = async () => {
    if (!file) return;
    setStatus("uploading");
    addLog(`[INFO] Uploading ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)...`);
    
    // Simulate API delay
    await new Promise(r => setTimeout(r, 2000));
    setStatus("decompiling");
    addLog(`[EXEC] Running apktool d ${file.name}...`);
    await new Promise(r => setTimeout(r, 1500));
    addLog(`[INFO] Extracting AndroidManifest.xml and resources...`);
    await new Promise(r => setTimeout(r, 1500));
    addLog(`[EXEC] Running dex2jar and CFR for logic recovery...`);
    await new Promise(r => setTimeout(r, 2000));
    
    setStatus("analyzing");
    addLog(`[SCAN] Parsing smali and Java source trees...`);
    await new Promise(r => setTimeout(r, 1500));
    addLog(`[AI] Handing off decompiled payload to AtoZ-DecompEngine LLM...`);
    
    // Simulate hitting our backend chat endpoint with the apk_decomp mode
    await new Promise(r => setTimeout(r, 3000));
    
    setReport(`
# 🚀 AUTOMATED APK ANALYSIS REPORT

## 1. 📋 Application Metadata & Tech Stack
- **App Name:** ${file.name.replace('.apk', '')}
- **Package Name:** com.example.analyzedapp
- **Core Framework:** React Native / Expo
- **Target SDK:** 34
- **Key SDKs Detected:** Firebase Analytics, Stripe SDK, Google Maps

## 2. 🛡️ Critical Security Findings & Leaked Secrets
| Risk Level | Finding Type | File Location | Snippet / Key Value |
| :--- | :--- | :--- | :--- |
| **CRITICAL** | Hardcoded API Key | \`res/values/strings.xml\` | \`AIzaSyB-xxxxx...\` |
| **HIGH** | Insecure Exported Activity | \`AndroidManifest.xml\` | \`.DebugAdminActivity\` |
| **MEDIUM** | Cleartext Traffic Enabled | \`AndroidManifest.xml\` | \`android:usesCleartextTraffic="true"\` |

## 3. 🏗️ Architecture & Entry Points
- **Launch Activity:** \`com.example.analyzedapp.MainActivity\`
- **Exported Services:** \`com.example.analyzedapp.BackgroundLocationService\`
- **Network Endpoints:** 
  - \`https://api.staging.example.com/v1/\` (Found in \`NetworkConfig.java\`)

## 4. 💡 Refactoring & Security Recommendations
1. **Remove Hardcoded Secrets:** Migrate the Google Maps API key from \`strings.xml\` to a backend proxy or use Android Secrets Gradle Plugin.
2. **Fix Manifest Security:** Set \`android:exported="false"\` on \`.DebugAdminActivity\`.
3. **Disable Cleartext:** Remove \`usesCleartextTraffic="true"\` to enforce HTTPS everywhere.
    `);
    
    setStatus("done");
    addLog(`[SUCCESS] Analysis complete.`);
  };

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, msg]);
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <BrainCircuit className="w-8 h-8 text-red-500" />
        <h1 className="text-3xl font-bold">AtoZ-DecompEngine UI</h1>
      </div>
      <p className="text-gray-400 mb-8 max-w-2xl">
        Upload an APK file. The system will automatically run Apktool, Dex2Jar, and feed the decompiled source tree into the AI Security Engine to hunt for API keys, hardcoded passwords, and architectural vulnerabilities.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Upload & Logs Column */}
        <div className="flex flex-col gap-6">
          <div className="glass-panel p-6 border-2 border-dashed border-gray-700 bg-black/20 rounded-xl">
            <h3 className="text-lg font-semibold mb-4">1. Upload APK File</h3>
            <input 
              type="file" 
              accept=".apk"
              onChange={handleUpload}
              className="block w-full text-sm text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-red-500/10 file:text-red-500
                hover:file:bg-red-500/20"
            />
            {file && status === "idle" && (
              <button 
                onClick={startAnalysis}
                className="mt-6 w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Play size={18} /> Start Autonomous Decompilation
              </button>
            )}
          </div>

          <div className="glass-panel p-6 rounded-xl min-h-[300px] flex flex-col">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Terminal size={18} /> Pipeline Execution Logs
            </h3>
            <div className="flex-1 bg-black/50 p-4 rounded-lg font-mono text-xs text-green-400 overflow-y-auto">
              {logs.length === 0 ? (
                <span className="text-gray-600">Waiting for input...</span>
              ) : (
                logs.map((l, i) => (
                  <div key={i} className="mb-1">{l}</div>
                ))
              )}
              {status !== "idle" && status !== "done" && (
                <div className="animate-pulse mt-2">_</div>
              )}
            </div>
          </div>
        </div>

        {/* Report Column */}
        <div className="glass-panel p-6 rounded-xl h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <ShieldAlert size={18} className="text-red-500" /> Security Audit Report
            </h3>
            {status === "done" && (
              <button 
                onClick={() => alert("Backend integration required to bundle zip. For now, the source is simulated.")} 
                className="flex items-center gap-2 text-sm bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-md border border-gray-600 transition-colors"
              >
                <Code size={16} /> Download Decompiled Source (.zip)
              </button>
            )}
          </div>
          <div className="flex-1 bg-gray-900/50 p-4 rounded-lg overflow-y-auto whitespace-pre-wrap prose prose-invert max-w-none text-sm">
            {report ? (
              <ReactMarkdown>{report}</ReactMarkdown>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-600 italic">
                Report will appear here after analysis.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// Temporary terminal icon component for inline use
const Terminal = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 17 10 11 4 5"></polyline>
    <line x1="12" y1="19" x2="20" y2="19"></line>
  </svg>
);
