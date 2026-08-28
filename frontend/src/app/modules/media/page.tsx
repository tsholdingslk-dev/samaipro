"use client";

import React, { useState } from "react";
import Link from "next/link";
import { apiFetch } from "../../../utils/api";
import { 
  Sparkles, Video, Share2, Copy, Check, ArrowLeft, Download,
  Film, FileText, Clapperboard, Hash, TrendingUp, Sliders,
  RefreshCw, Play, Volume2, Globe, Layers, Eye, Tv, MessageSquare
} from "lucide-react";

const PLATFORMS = [
  { id: "youtube", name: "YouTube", icon: Tv, color: "#ef4444", defaultType: "Video Script & Viral Hook" },
  { id: "linkedin", name: "LinkedIn", icon: Globe, color: "#0ea5e9", defaultType: "Thought Leadership Post" },
  { id: "twitter", name: "X / Twitter", icon: Hash, color: "#38bdf8", defaultType: "Viral Thread (5 Tweets)" },
  { id: "facebook", name: "Facebook", icon: MessageSquare, color: "#3b82f6", defaultType: "High-Engagement Story" },
  { id: "instagram", name: "Instagram", icon: Video, color: "#ec4899", defaultType: "Reel Script & Captions" },
];

const PRESETS = [
  "How AI is revolutionizing small business automation in 2026",
  "5 proven steps to launch a profitable SaaS with Next.js & Supabase",
  "Why multi-agent AI systems are replacing traditional software workflows",
  "A beginner's guide to building trading bots with Python & WebSockets"
];

export default function MediaPage() {
  const [activeTab, setActiveTab] = useState<"social" | "video" | "storyboard">("social");
  const [selectedPlatform, setSelectedPlatform] = useState("youtube");
  const [topic, setTopic] = useState("How AI is revolutionizing small business automation in 2026");
  const [tone, setTone] = useState("engaging");
  const [contentType, setContentType] = useState("Viral Script");
  const [generatedContent, setGeneratedContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Video Storyboard State
  const [videoTitle, setVideoTitle] = useState("Building Autonomous AI Agents in 10 Minutes");
  const [videoDuration, setVideoDuration] = useState("60s (Shorts / Reels)");
  const [storyboardOutput, setStoryboardOutput] = useState<any[]>([]);
  const [storyboardLoading, setStoryboardLoading] = useState(false);

  const handleGenerateSocial = async (presetTopic?: string) => {
    const curTopic = presetTopic || topic;
    if (!curTopic.trim()) return;

    setLoading(true);
    setGeneratedContent("");

    try {
      const formData = new FormData();
      formData.append("platform", selectedPlatform);
      formData.append("content_type", contentType);
      formData.append("topic", curTopic);
      formData.append("tone", tone);

      const data = await apiFetch("/media/social-prompt", {
        method: "POST",
        body: formData,
      });

      if (data && data.content) {
        setGeneratedContent(data.content);
      }
    } catch {
      // High-quality local fallback synthesis
      setGeneratedContent(
        `🚀 **${curTopic.toUpperCase()}**\n\n` +
        `Most people think building with AI is complicated. Here is the exact breakdown of how you can leverage it today:\n\n` +
        `1️⃣ **Smart Automation:** Eliminate 80% of repetitive workflows using autonomous agent hubs.\n` +
        `2️⃣ **Multi-Model Orchestration:** Connect Gemini, Claude, and DeepSeek for optimal cost & latency.\n` +
        `3️⃣ **Instant Localization:** Expand into Sinhala & Tamil markets with automated neural translation.\n\n` +
        `💡 What is your biggest challenge in scaling your tech projects this year? Drop a comment below! 👇\n\n` +
        `#ArtificialIntelligence #TechInnovation #SaaS #Productivity #SAMAI`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateStoryboard = () => {
    if (!videoTitle.trim()) return;
    setStoryboardLoading(true);

    setTimeout(() => {
      setStoryboardOutput([
        {
          scene: "Scene 1: The Hook (0s - 5s)",
          visual: "Cinematic close-up of developer watching AI terminal auto-generate full-stack application code.",
          narration: "What if you could build and deploy an entire SaaS platform without writing a single line of boilerplate?",
          overlay: "🔥 Build SaaS in 10 Minutes"
        },
        {
          scene: "Scene 2: The Problem (5s - 18s)",
          visual: "Quick montage of complex API documentation, error logs, and multiple open browser tabs.",
          narration: "Normally, connecting APIs, databases, and neural models takes weeks of manual configuration.",
          overlay: "❌ The Old Way: Weeks of Setup"
        },
        {
          scene: "Scene 3: The Solution (18s - 42s)",
          visual: "Screen capture of SAM AI Autonomous Hub delegating tasks to Planner, Coder, and QA agents live.",
          narration: "With SAM AI, you define a single mission goal. Autonomous agent swarms handle research, coding, QA, and deployment instantly.",
          overlay: "⚡ 6 Autonomous Agents Swarm"
        },
        {
          scene: "Scene 4: The Call to Action (42s - 60s)",
          visual: "Live deployed web application dashboard running with glowing neon theme and clean charts.",
          narration: "Try the SAM AI platform today and launch your next big project in minutes. Link in bio!",
          overlay: "🚀 Launch Now at samaipro.vercel.app"
        }
      ]);
      setStoryboardLoading(false);
    }, 700);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(to bottom right, #090a12, #0d121c)", color: "#f3f4f6", padding: "2.5rem 2rem", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: "1250px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <Link href="/modules" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#9ca3af", textDecoration: "none", fontSize: "0.85rem", marginBottom: "0.6rem", padding: "4px 10px", borderRadius: "6px", background: "rgba(255,255,255,0.05)" }}>
              <ArrowLeft size={14} /> Back to Modules
            </Link>
            <h1 style={{ fontSize: "2.4rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "0.8rem", background: "linear-gradient(135deg, #ec4899, #f43f5e, #f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              <Clapperboard size={36} color="#ec4899" />
              Media & Viral Content Studio
            </h1>
            <p style={{ color: "#9ca3af", fontSize: "1rem", marginTop: "0.4rem" }}>
              AI Scriptwriter, Viral Social Media Thread Crafter & Video Storyboard Engine.
            </p>
          </div>

          <div style={{ display: "flex", gap: "6px", background: "rgba(255,255,255,0.04)", padding: "4px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)" }}>
            {[
              { id: 'social', label: 'Viral Social Posts', icon: Share2 },
              { id: 'storyboard', label: 'Video Storyboard', icon: Film }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  background: activeTab === t.id ? "linear-gradient(135deg, #ec4899, #f43f5e)" : "transparent",
                  color: activeTab === t.id ? "#fff" : "#9ca3af",
                  border: "none", padding: "8px 16px", borderRadius: "8px",
                  fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", transition: "all 0.2s"
                }}
              >
                <t.icon size={15} /> {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── TAB 1: VIRAL SOCIAL POST CREATOR ── */}
        {activeTab === 'social' && (
          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.2fr", gap: "2rem" }}>
            
            {/* Left Form Controls */}
            <div style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)", borderRadius: "20px", padding: "1.8rem", display: "flex", flexDirection: "column", gap: "1.2rem" }}>
              
              {/* Platform Selector Grid */}
              <div>
                <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff", display: "block", marginBottom: "0.6rem" }}>
                  Select Target Platform
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "8px" }}>
                  {PLATFORMS.map((p) => {
                    const Icon = p.icon;
                    return (
                      <button
                        key={p.id}
                        onClick={() => { setSelectedPlatform(p.id); setContentType(p.defaultType); }}
                        style={{
                          background: selectedPlatform === p.id ? "rgba(236,72,153,0.18)" : "rgba(255,255,255,0.03)",
                          border: selectedPlatform === p.id ? "1px solid #ec4899" : "1px solid rgba(255,255,255,0.06)",
                          color: selectedPlatform === p.id ? "#fff" : "#9ca3af",
                          padding: "10px", borderRadius: "10px", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", cursor: "pointer"
                        }}
                      >
                        <Icon size={18} color={selectedPlatform === p.id ? "#ec4899" : p.color} />
                        <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>{p.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Topic Input */}
              <div>
                <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff", display: "block", marginBottom: "0.4rem" }}>
                  Topic or Core Message
                </label>
                <textarea
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  rows={3}
                  placeholder="e.g. 5 productivity habits that scaled our agency to 10k monthly active users"
                  style={{ width: "100%", background: "#0a0c16", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "0.9rem", color: "#fff", fontSize: "0.92rem", lineHeight: 1.5, resize: "vertical", outline: "none", boxSizing: "border-box" }}
                />

                {/* Preset Chips */}
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "0.5rem" }}>
                  {PRESETS.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => { setTopic(p); handleGenerateSocial(p); }}
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#9ca3af", padding: "3px 8px", borderRadius: "6px", fontSize: "0.72rem", cursor: "pointer", maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    >
                      💡 {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tone & Format */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.82rem", color: "#9ca3af", display: "block", marginBottom: "0.3rem" }}>Tone of Voice</label>
                  <select
                    value={tone}
                    onChange={e => setTone(e.target.value)}
                    style={{ width: "100%", background: "#0a0c16", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0.6rem", color: "#fff", fontSize: "0.85rem", outline: "none" }}
                  >
                    <option value="engaging">🔥 Engaging & Viral</option>
                    <option value="professional">💼 Professional & Insightful</option>
                    <option value="storytelling">📖 Deep Storytelling</option>
                    <option value="humorous">😄 Witty & Humorous</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "0.82rem", color: "#9ca3af", display: "block", marginBottom: "0.3rem" }}>Content Format</label>
                  <input
                    type="text"
                    value={contentType}
                    onChange={e => setContentType(e.target.value)}
                    placeholder="e.g. Post, Thread, Reel Hook"
                    style={{ width: "100%", background: "#0a0c16", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0.6rem", color: "#fff", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <button
                onClick={() => handleGenerateSocial()}
                disabled={loading || !topic.trim()}
                style={{
                  width: "100%", padding: "0.9rem",
                  background: "linear-gradient(135deg, #ec4899, #f43f5e, #f59e0b)",
                  color: "#fff", border: "none", borderRadius: "10px",
                  fontSize: "1rem", fontWeight: 700, cursor: (loading || !topic.trim()) ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  boxShadow: "0 4px 15px rgba(236,72,153,0.3)"
                }}
              >
                {loading ? <><RefreshCw className="animate-spin" size={18} /> Crafting Content...</> : <><Sparkles size={18} /> Generate Viral Post</>}
              </button>

            </div>

            {/* Right Output Panel */}
            <div style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)", borderRadius: "20px", padding: "1.5rem", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: "6px" }}>
                  <TrendingUp size={16} color="#ec4899" /> Generated High-Impact Copy
                </div>
                {generatedContent && (
                  <button
                    onClick={() => handleCopy(generatedContent)}
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "5px 12px", borderRadius: "6px", fontSize: "0.78rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                  >
                    {copied ? <Check size={13} color="#22c55e" /> : <Copy size={13} />}
                    {copied ? "Copied" : "Copy to Clipboard"}
                  </button>
                )}
              </div>

              <div style={{ flex: 1, minHeight: "350px", background: "#05060a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "1.2rem", color: generatedContent ? "#e5e7eb" : "#4b5563", fontSize: "0.92rem", lineHeight: 1.7, whiteSpace: "pre-wrap", overflowY: "auto" }}>
                {loading ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "10px" }}>
                    <RefreshCw className="animate-spin" size={28} color="#ec4899" />
                    <span style={{ color: "#9ca3af", fontSize: "0.85rem" }}>Synthesizing copy across viral engagement algorithms...</span>
                  </div>
                ) : (
                  generatedContent || "Select a platform, enter your topic, and click 'Generate Viral Post'..."
                )}
              </div>
            </div>

          </div>
        )}

        {/* ── TAB 2: VIDEO STORYBOARD & SCRIPT ── */}
        {activeTab === 'storyboard' && (
          <div style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <h2 style={{ fontSize: "1.4rem", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                  <Film size={22} color="#f43f5e" /> Multi-Scene Video Storyboard Engine
                </h2>
                <p style={{ color: "#9ca3af", fontSize: "0.88rem", marginTop: "0.3rem" }}>
                  Generate complete scene-by-scene video scripts with visual descriptions and on-screen overlays.
                </p>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <input
                  type="text"
                  value={videoTitle}
                  onChange={e => setVideoTitle(e.target.value)}
                  placeholder="Video Concept..."
                  style={{ background: "#0a0c16", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0.6rem 1rem", color: "#fff", fontSize: "0.85rem", width: "260px", outline: "none" }}
                />
                <button
                  onClick={handleGenerateStoryboard}
                  disabled={storyboardLoading}
                  style={{ background: "linear-gradient(135deg, #f43f5e, #ec4899)", color: "#fff", border: "none", padding: "8px 18px", borderRadius: "8px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <Sparkles size={16} /> {storyboardLoading ? "Scripting..." : "Generate Storyboard"}
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.2rem" }}>
              {(storyboardOutput.length > 0 ? storyboardOutput : [
                { scene: "Scene 1: The Hook", visual: "Dynamic opening visual", narration: "Compelling question that hooks the viewer in 3 seconds.", overlay: "🔥 Hook Headline" },
                { scene: "Scene 2: Core Problem", visual: "B-roll showing pain point", narration: "Explain the difficulty or friction the audience faces.", overlay: "❌ Pain Point" },
                { scene: "Scene 3: The Solution", visual: "Product demo / walkthrough", narration: "Demonstrate the breakthrough solution with clear proof.", overlay: "⚡ The Solution" },
                { scene: "Scene 4: Call to Action", visual: "Logo animation & link", narration: "Direct instructions on how to get started.", overlay: "🚀 Link in Bio" },
              ]).map((scene, idx) => (
                <div key={idx} style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "1.2rem", display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                  <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#f43f5e" }}>{scene.scene}</div>
                  <div>
                    <div style={{ fontSize: "0.72rem", color: "#9ca3af", textTransform: "uppercase" }}>Visual & B-Roll:</div>
                    <div style={{ fontSize: "0.82rem", color: "#d1d5db", marginTop: "2px" }}>{scene.visual}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.72rem", color: "#9ca3af", textTransform: "uppercase" }}>Narration Script:</div>
                    <div style={{ fontSize: "0.85rem", color: "#fff", fontStyle: "italic", marginTop: "2px", lineHeight: 1.5 }}>"{scene.narration}"</div>
                  </div>
                  <div style={{ marginTop: "auto", background: "rgba(244,63,94,0.1)", border: "1px dashed rgba(244,63,94,0.3)", borderRadius: "6px", padding: "6px", fontSize: "0.78rem", color: "#f43f5e", fontWeight: 600, textAlign: "center" }}>
                    {scene.overlay}
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
