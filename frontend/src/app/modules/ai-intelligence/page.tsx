"use client";

import React, { useState } from "react";
import Link from "next/link";
import { apiFetch } from "../../../utils/api";
import { 
  Radio, Shield, Activity, RefreshCw, Send, CheckCircle2, 
  AlertTriangle, Server, Cpu, Database, ArrowLeft, Zap,
  Terminal, Bell, Globe, Lock, Volume2, Eye, Plus, Trash2,
  Calendar, Clock, Sparkles, MessageSquare, TrendingUp, Briefcase
} from "lucide-react";

interface Watcher {
  id: string;
  name: string;
  category: "Agency & Revenue" | "Crypto & Markets" | "Server & Domain" | "AI API Gateway" | "Client Leads";
  criteria: string;
  schedule: string;
  channel: "Assistant Voice + In-App" | "WhatsApp Digest" | "Email Telemetry";
  status: "Active" | "Paused";
}

const INITIAL_WATCHERS: Watcher[] = [
  {
    id: "WAT-01",
    name: "Agency Revenue & Job Marketplace Sentry",
    category: "Agency & Revenue",
    criteria: "Monitor client jobs ($100 vs $40 margin), track worker submissions, and alert when gross profit hits milestones.",
    schedule: "Daily at 08:00 AM",
    channel: "Assistant Voice + In-App",
    status: "Active"
  },
  {
    id: "WAT-02",
    name: "Crypto Bitcoin & Altcoin Crash Detector",
    category: "Crypto & Markets",
    criteria: "Track BTC, ETH, and SOL for >5% 24h volatility, AI sentiment shifts, and key support levels.",
    schedule: "Every 4 Hours & Daily 08:00 AM",
    channel: "Assistant Voice + In-App",
    status: "Active"
  },
  {
    id: "WAT-03",
    name: "Central API Key Gateway & Server Health",
    category: "AI API Gateway",
    criteria: "Track Gemini, Groq, OpenRouter rate-limits and Vercel/Railway cluster uptime.",
    schedule: "24/7 Real-Time Alerting",
    channel: "Email Telemetry",
    status: "Active"
  },
  {
    id: "WAT-04",
    name: "B2B Lead Generation & WhatsApp Outreach",
    category: "Client Leads",
    criteria: "Summarize new restaurant/clinic leads extracted and count incoming client demo site views.",
    schedule: "Daily at 07:00 PM",
    channel: "WhatsApp Digest",
    status: "Active"
  }
];

export default function AiIntelligencePage() {
  const [watchers, setWatchers] = useState<Watcher[]>(INITIAL_WATCHERS);
  const [activeTab, setActiveTab] = useState<"watchers" | "briefing" | "telemetry">("watchers");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [generatingBriefing, setGeneratingBriefing] = useState(false);

  // New Watcher Form State
  const [newWatcherName, setNewWatcherName] = useState("");
  const [newWatcherCategory, setNewWatcherCategory] = useState<Watcher['category']>("Agency & Revenue");
  const [newWatcherCriteria, setNewWatcherCriteria] = useState("");
  const [newWatcherSchedule, setNewWatcherSchedule] = useState("Daily at 08:00 AM");
  const [newWatcherChannel, setNewWatcherChannel] = useState<Watcher['channel']>("Assistant Voice + In-App");

  // Today's Live Briefing Content
  const [briefingText, setBriefingText] = useState(
    `வணக்கம் மச்சான்! இன்றைய SAM AI Daily Intelligence Briefing:

1. 💼 Agency & Task Hub:
   - 4 தீவிர வாடிக்கையாளர் திட்டங்கள் இயங்குகின்றன.
   - இன்றைய மொத்த வாடிக்கையாளர் மதிப்பு: $710.00 USD.
   - நிறுவனத்தின் நிகர லாபம்: $440.00 USD (62% Margin).

2. 📈 Crypto & Financial Intelligence:
   - Bitcoin $96,450 நிலையில் நிலையாக உள்ளது. Market Sentiment: 78/100 (Greed).
   - விபத்து அபாயம் (Crash Risk): குறைந்தபட்சம் (Low 12%).

3. 🌐 Server & API Infrastructure:
   - Railway FastAPI Core மற்றும் Vercel Global Edge 99.99% Uptime-ல் இயங்குகின்றன.
   - Groq LPU மற்றும் Gemini Failover Node-கள் முழு வீச்சில் செயல்படுகின்றன.

4. 🚀 Recommendation for Today:
   - புதிய A/L இயற்பியல் வினாத்தாள் மொழிபெயர்ப்பு திட்டத்தை சரிபார்த்து வாடிக்கையாளருக்கு அனுப்பி வைக்கவும்.`
  );

  const handleAddWatcher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWatcherName || !newWatcherCriteria) return;

    const newObj: Watcher = {
      id: `WAT-0${watchers.length + 1}`,
      name: newWatcherName,
      category: newWatcherCategory,
      criteria: newWatcherCriteria,
      schedule: newWatcherSchedule,
      channel: newWatcherChannel,
      status: "Active"
    };

    setWatchers([newObj, ...watchers]);
    setNewWatcherName("");
    setNewWatcherCriteria("");
  };

  const handleToggleStatus = (id: string) => {
    setWatchers(prev => prev.map(w => {
      if (w.id === id) {
        return { ...w, status: w.status === "Active" ? "Paused" : "Active" };
      }
      return w;
    }));
  };

  const handleDeleteWatcher = (id: string) => {
    setWatchers(prev => prev.filter(w => w.id !== id));
  };

  const handleGenerateLiveBriefing = () => {
    setGeneratingBriefing(true);
    setTimeout(() => {
      setBriefingText(
        `வணக்கம் மச்சான்! ${new Date().toLocaleDateString('ta-LK')} நாளுக்கான புதுப்பிக்கப்பட்ட நேரலை அறிக்கை:\n\n` +
        `1. 💼 Agency Bidding Hub: 4 செயலில் உள்ள திட்டங்கள். ஊழியர் வருமானம் $270 | நிறுவன லாபம் $440 USD.\n` +
        `2. 📄 PDF & Localization Engine: Physics past paper மொழிபெயர்ப்பு 100% துல்லியமாக நிறைவுற்றது.\n` +
        `3. 🔑 Multi-API Rotator: Gemini & Groq எவ்வித தாமதமுமின்றி (42ms latency) இயங்குகின்றன.\n` +
        `4. 🔮 Astrology Studio: Traditional Kendare அல்காரிதம் 500% திருப்தியுடன் இயங்குகிறது.`
      );
      setGeneratingBriefing(false);
      setActiveTab("briefing");
    }, 600);
  };

  const speakBriefing = (text: string) => {
    if (typeof window === "undefined" || !('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ta-LK";
    u.rate = 1.0;
    u.onend = () => setIsSpeaking(false);
    u.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(u);
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(to bottom right, #090a12, #0c101c)", color: "#f3f4f6", padding: "2.5rem 2rem", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: "1350px", margin: "0 auto" }}>
        
        {/* Top Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <Link href="/modules" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#9ca3af", textDecoration: "none", fontSize: "0.85rem", marginBottom: "0.6rem", padding: "4px 10px", borderRadius: "6px", background: "rgba(255,255,255,0.05)" }}>
              <ArrowLeft size={14} /> Back to Modules
            </Link>
            <h1 style={{ fontSize: "2.4rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "0.8rem", background: "linear-gradient(135deg, #f43f5e, #fb7185, #fda4af)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              <Radio size={36} color="#f43f5e" />
              Autonomous Daily Monitoring & Assistant Briefing Suite
            </h1>
            <p style={{ color: "#9ca3af", fontSize: "1rem", marginTop: "0.4rem" }}>
              Instruct SAM AI to observe specific parameters 24/7 and deliver voice & text Daily Intelligence Briefings.
            </p>
          </div>

          {/* Tab Navigation */}
          <div style={{ display: "flex", gap: "6px", background: "rgba(255,255,255,0.04)", padding: "4px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)" }}>
            {[
              { id: 'watchers', label: '🎯 Active Watchers', icon: Eye },
              { id: 'briefing', label: '🗣️ Daily Voice Briefing', icon: Volume2 },
              { id: 'telemetry', label: '⚡ Cluster Telemetry', icon: Activity },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  background: activeTab === t.id ? "linear-gradient(135deg, #f43f5e, #e11d48)" : "transparent",
                  color: activeTab === t.id ? "#fff" : "#9ca3af",
                  border: "none", padding: "8px 14px", borderRadius: "8px",
                  fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", transition: "all 0.2s"
                }}
              >
                <t.icon size={15} /> {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── METRIC CARDS ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          {[
            { label: "Autonomous Watchers", value: `${watchers.filter(w => w.status === 'Active').length} Active`, color: "#10b981", icon: Eye },
            { label: "Next Scheduled Briefing", value: "Today 08:00 AM", color: "#fb7185", icon: Clock },
            { label: "Delivery Channels", value: "Voice + App + WA", color: "#38bdf8", icon: Radio },
            { label: "Autonomous Sentry Uptime", value: "99.99%", color: "#f59e0b", icon: Zap },
          ].map((s, idx) => (
            <div key={idx} style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "1.2rem", display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <s.icon size={20} color={s.color} />
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", color: "#9ca3af", textTransform: "uppercase" }}>{s.label}</div>
                <div style={{ fontSize: "1.15rem", fontWeight: 700, color: s.color, marginTop: "2px" }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── TAB 1: CONFIGURE AUTONOMOUS WATCHERS ── */}
        {activeTab === 'watchers' && (
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "2rem", alignItems: "start" }}>
            
            {/* Left: Active Watchers List */}
            <div style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "1.8rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem", flexWrap: "wrap", gap: "8px" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700 }}>🎯 Configured Autonomous Watchers</h3>
                  <span style={{ fontSize: "0.78rem", color: "#9ca3af" }}>SAM AI will observe these criteria 24/7 and compile your Daily Briefing.</span>
                </div>

                <button
                  onClick={handleGenerateLiveBriefing}
                  disabled={generatingBriefing}
                  style={{ background: "linear-gradient(135deg, #f43f5e, #fb7185)", color: "#fff", border: "none", padding: "6px 14px", borderRadius: "8px", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <Sparkles size={14} /> {generatingBriefing ? "Compiling..." : "Generate Today's Briefing Now"}
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {watchers.map((w) => (
                  <div key={w.id} style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "1.2rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.3rem" }}>
                        <span style={{ fontSize: "0.72rem", padding: "2px 8px", borderRadius: "6px", background: "rgba(244,63,94,0.15)", color: "#fb7185", fontWeight: 700 }}>
                          {w.category}
                        </span>
                        <span style={{ fontSize: "0.72rem", color: "#9ca3af" }}>
                          📅 {w.schedule}
                        </span>
                      </div>

                      <h4 style={{ margin: "0 0 0.3rem 0", fontSize: "1rem", fontWeight: 700, color: "#fff" }}>
                        {w.name}
                      </h4>
                      <p style={{ margin: 0, fontSize: "0.82rem", color: "#d1d5db", lineHeight: 1.5 }}>
                        {w.criteria}
                      </p>
                      
                      <div style={{ fontSize: "0.75rem", color: "#38bdf8", marginTop: "0.5rem" }}>
                        📢 Channel: <strong>{w.channel}</strong>
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end" }}>
                      <button
                        onClick={() => handleToggleStatus(w.id)}
                        style={{
                          background: w.status === 'Active' ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.05)",
                          color: w.status === 'Active' ? "#10b981" : "#9ca3af",
                          border: `1px solid ${w.status === 'Active' ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'}`,
                          padding: "4px 10px", borderRadius: "8px", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer"
                        }}
                      >
                        ● {w.status}
                      </button>

                      <button
                        onClick={() => handleDeleteWatcher(w.id)}
                        style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", padding: "4px", marginTop: "4px" }}
                        title="Delete Watcher"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Add New Watcher Form */}
            <div style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "1.8rem" }}>
              <h3 style={{ margin: "0 0 0.8rem 0", fontSize: "1.15rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
                <Plus size={18} color="#fb7185" /> Add New Observation Watcher
              </h3>
              <p style={{ fontSize: "0.82rem", color: "#9ca3af", marginBottom: "1.2rem", lineHeight: 1.5 }}>
                Tell SAM AI what to observe (e.g. Agency profit, Crypto levels, Lead replies) and how to alert you daily.
              </p>

              <form onSubmit={handleAddWatcher} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "#9ca3af", display: "block", marginBottom: "0.3rem" }}>Watcher Name</label>
                  <input
                    type="text"
                    value={newWatcherName}
                    onChange={e => setNewWatcherName(e.target.value)}
                    placeholder="e.g. Daily Competitor Tech Digest / WhatsApp Lead Tracker"
                    required
                    style={{ width: "100%", background: "#0a0c16", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0.65rem", color: "#fff", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.8rem", color: "#9ca3af", display: "block", marginBottom: "0.3rem" }}>Category</label>
                  <select
                    value={newWatcherCategory}
                    onChange={e => setNewWatcherCategory(e.target.value as any)}
                    style={{ width: "100%", background: "#0a0c16", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0.65rem", color: "#fff", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }}
                  >
                    <option value="Agency & Revenue">Agency & Revenue</option>
                    <option value="Crypto & Markets">Crypto & Markets</option>
                    <option value="Server & Domain">Server & Domain</option>
                    <option value="AI API Gateway">AI API Gateway</option>
                    <option value="Client Leads">Client Leads</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "0.8rem", color: "#9ca3af", display: "block", marginBottom: "0.3rem" }}>What should SAM AI observe? (Observation Prompt)</label>
                  <textarea
                    rows={3}
                    value={newWatcherCriteria}
                    onChange={e => setNewWatcherCriteria(e.target.value)}
                    placeholder="e.g. Check all completed translation jobs and alert me if daily earnings exceed $300..."
                    required
                    style={{ width: "100%", background: "#0a0c16", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0.65rem", color: "#fff", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
                  <div>
                    <label style={{ fontSize: "0.8rem", color: "#9ca3af", display: "block", marginBottom: "0.3rem" }}>Frequency</label>
                    <input
                      type="text"
                      value={newWatcherSchedule}
                      onChange={e => setNewWatcherSchedule(e.target.value)}
                      style={{ width: "100%", background: "#0a0c16", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0.65rem", color: "#fff", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.8rem", color: "#9ca3af", display: "block", marginBottom: "0.3rem" }}>Delivery Channel</label>
                    <select
                      value={newWatcherChannel}
                      onChange={e => setNewWatcherChannel(e.target.value as any)}
                      style={{ width: "100%", background: "#0a0c16", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0.65rem", color: "#fff", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }}
                    >
                      <option value="Assistant Voice + In-App">Voice + In-App</option>
                      <option value="WhatsApp Digest">WhatsApp</option>
                      <option value="Email Telemetry">Email Telemetry</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  style={{ width: "100%", padding: "0.85rem", background: "linear-gradient(135deg, #f43f5e, #fb7185)", color: "#fff", border: "none", borderRadius: "10px", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "0.4rem" }}
                >
                  <Plus size={16} /> Save & Activate Observation Watcher
                </button>
              </form>
            </div>

          </div>
        )}

        {/* ── TAB 2: DAILY VOICE BRIEFING SUITE ── */}
        {activeTab === 'briefing' && (
          <div style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Volume2 size={22} color="#fb7185" /> Today&apos;s Assistant Morning Briefing (செயற்கை நுண்ணறிவு தினசரி அறிக்கை)
                </h3>
                <span style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
                  Compiled automatically from your 4 Active Watchers · Ready for Voice Readout.
                </span>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => speakBriefing(briefingText)}
                  style={{
                    background: isSpeaking ? "linear-gradient(135deg, #ef4444, #dc2626)" : "linear-gradient(135deg, #f43f5e, #e11d48)",
                    color: "#fff", border: "none", padding: "10px 20px", borderRadius: "10px",
                    fontSize: "0.9rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px",
                    boxShadow: "0 4px 15px rgba(244,63,94,0.3)"
                  }}
                >
                  <Volume2 size={18} /> {isSpeaking ? "Stop Voice Briefing" : "🗣️ Listen in Voice (குரல் அறிக்கை)"}
                </button>

                <button
                  onClick={handleGenerateLiveBriefing}
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "10px 16px", borderRadius: "10px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}
                >
                  <RefreshCw size={15} /> Refresh Briefing
                </button>
              </div>
            </div>

            <div style={{ background: "#0a0c16", border: "1px solid rgba(244,63,94,0.2)", borderRadius: "16px", padding: "1.5rem" }}>
              <pre style={{ margin: 0, fontFamily: "'Inter', sans-serif", fontSize: "0.95rem", color: "#f3f4f6", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                {briefingText}
              </pre>
            </div>
          </div>
        )}

        {/* ── TAB 3: CLUSTER TELEMETRY ── */}
        {activeTab === 'telemetry' && (
          <div style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "2rem" }}>
            <h3 style={{ margin: "0 0 1.2rem 0", fontSize: "1.15rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
              <Activity size={18} color="#f43f5e" /> Live Infrastructure Sentry Matrix
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
              {[
                { service: "FastAPI Core Gateway", status: "Operational", ping: "42ms", uptime: "99.99%", host: "Railway Cloud" },
                { service: "Next.js 16 Edge Proxy", status: "Operational", ping: "18ms", uptime: "100.0%", host: "Vercel Global Edge" },
                { service: "PostgreSQL Production DB", status: "Operational", ping: "28ms", uptime: "99.98%", host: "Railway DB Cluster" },
                { service: "Groq LPU Acceleration", status: "Optimal", ping: "85ms", uptime: "99.95%", host: "Groq Engine" },
                { service: "Gemini 1.5 Failover Node", status: "Standby", ping: "190ms", uptime: "100.0%", host: "Google Cloud" },
              ].map((c, i) => (
                <div key={i} style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "1rem 1.2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#fff" }}>{c.service}</div>
                    <div style={{ fontSize: "0.78rem", color: "#9ca3af" }}>Host: {c.host} · Latency: {c.ping}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "0.75rem", padding: "3px 10px", borderRadius: "12px", background: "rgba(16,185,129,0.15)", color: "#10b981", fontWeight: 700 }}>
                      ● {c.status}
                    </span>
                    <div style={{ fontSize: "0.72rem", color: "#9ca3af", marginTop: "3px" }}>Uptime: {c.uptime}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
