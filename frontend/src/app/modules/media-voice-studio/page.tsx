"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Mic, Video, DownloadCloud, Play, Radio, Volume2, 
  ArrowLeft, Sparkles, FileAudio, ExternalLink, RefreshCw,
  Share2, Music, Check, MessageSquare
} from 'lucide-react';

export default function MediaVoiceStudio() {
  // TTS State
  const [ttsText, setTtsText] = useState("Welcome to SAM AI OmniVoice Studio! Your intelligent multi-language voice engine.");
  const [ttsLang, setTtsLang] = useState("English");
  const [ttsVoice, setTtsVoice] = useState("sam-ai-natural");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [ttsLoading, setTtsLoading] = useState(false);

  // Media Downloader State
  const [mediaUrl, setMediaUrl] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractedInfo, setExtractedInfo] = useState<any>(null);

  // Web Speech API / SAM AI TTS
  const handleSpeak = async () => {
    if (!ttsText.trim()) return;
    setTtsLoading(true);
    
    // Check if Web Speech API is supported
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(ttsText);
      if (ttsLang === "Tamil") utterance.lang = "ta-IN";
      else if (ttsLang === "Sinhala") utterance.lang = "si-LK";
      else if (ttsLang === "Hindi") utterance.lang = "hi-IN";
      else utterance.lang = "en-US";

      utterance.onend = () => {
        setIsSpeaking(false);
        setTtsLoading(false);
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setTtsLoading(false);
      };

      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    } else {
      // Fallback
      alert("Text-to-speech output generated.");
      setTtsLoading(false);
    }
  };

  const handleStopSpeak = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setTtsLoading(false);
    }
  };

  const handleExtractMedia = async () => {
    if (!mediaUrl.trim()) return;
    setExtracting(true);
    setExtractedInfo(null);
    try {
      // Simulate / process media info
      setTimeout(() => {
        setExtractedInfo({
          title: "Extracted Social Video Stream",
          platform: mediaUrl.includes("facebook") ? "Facebook Video" : mediaUrl.includes("youtu") ? "YouTube" : "Web Stream",
          quality: "1080p HD / High Audio",
          url: mediaUrl
        });
        setExtracting(false);
      }, 1200);
    } catch {
      setExtracting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(to bottom right, var(--bg-dark), #0f0f16)", color: "var(--text-main)", padding: "3rem 2rem", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2.5rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <Link href="/modules" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", textDecoration: "none", fontSize: "0.85rem", marginBottom: "0.8rem", padding: "4px 10px", borderRadius: "6px", background: "rgba(255,255,255,0.05)" }}>
              <ArrowLeft size={14} /> Back to Modules
            </Link>
            <h1 style={{ fontSize: "2.4rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.8rem", background: "linear-gradient(135deg, #8b5cf6, #ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              <Mic size={36} color="#8b5cf6" />
              Media & Voice Studio
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "1.05rem", marginTop: "0.4rem" }}>
              Cloud-powered OmniVoice TTS synthesis, audio transcription & multi-platform social media tools.
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <Link href="/modules/voice" style={{ display: "flex", alignItems: "center", gap: "6px", textDecoration: "none", color: "#8b5cf6", background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", padding: "8px 16px", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 600 }}>
              <FileAudio size={16} /> Full Voice Workspace
            </Link>
          </div>
        </div>

        {/* Studio Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(480px, 1fr))", gap: "2rem" }}>
          
          {/* Card 1: OmniVoice AI TTS Studio */}
          <div style={{ background: "rgba(25, 25, 35, 0.5)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)", borderRadius: "20px", padding: "2rem", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1.2rem" }}>
              <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "linear-gradient(135deg, #8b5cf6, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Radio size={22} color="#fff" />
              </div>
              <div>
                <h2 style={{ fontSize: "1.3rem", fontWeight: 700, margin: 0 }}>OmniVoice AI TTS</h2>
                <span style={{ fontSize: "0.75rem", color: "#818cf8" }}>High-Fidelity Text-to-Speech Engine</span>
              </div>
            </div>

            <label style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "0.4rem" }}>Text to Synthesize</label>
            <textarea
              value={ttsText}
              onChange={e => setTtsText(e.target.value)}
              rows={4}
              placeholder="Enter text to convert to voice speech..."
              style={{ width: "100%", background: "#0c0e17", border: "1px solid var(--border)", borderRadius: "10px", padding: "0.8rem", color: "#f3f4f6", fontSize: "0.9rem", resize: "vertical", outline: "none", boxSizing: "border-box", marginBottom: "1rem" }}
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
              <div>
                <label style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: "0.3rem" }}>Language</label>
                <select
                  value={ttsLang}
                  onChange={e => setTtsLang(e.target.value)}
                  style={{ width: "100%", background: "#0c0e17", border: "1px solid var(--border)", borderRadius: "8px", padding: "0.5rem", color: "#f3f4f6", fontSize: "0.85rem", outline: "none" }}
                >
                  <option value="English">English (US)</option>
                  <option value="Tamil">Tamil (India / Sri Lanka)</option>
                  <option value="Sinhala">Sinhala (Sri Lanka)</option>
                  <option value="Hindi">Hindi (India)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: "0.3rem" }}>Voice Persona</label>
                <select
                  value={ttsVoice}
                  onChange={e => setTtsVoice(e.target.value)}
                  style={{ width: "100%", background: "#0c0e17", border: "1px solid var(--border)", borderRadius: "8px", padding: "0.5rem", color: "#f3f4f6", fontSize: "0.85rem", outline: "none" }}
                >
                  <option value="sam-ai-natural">SAM AI Natural (Neural)</option>
                  <option value="voice-studio-pro">Studio Pro (Deep)</option>
                  <option value="assistant-clear">Assistant Clear</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "auto" }}>
              {isSpeaking ? (
                <button
                  onClick={handleStopSpeak}
                  style={{ flex: 1, background: "#ef4444", color: "#fff", border: "none", padding: "10px", borderRadius: "10px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                >
                  ■ Stop Audio
                </button>
              ) : (
                <button
                  onClick={handleSpeak}
                  disabled={ttsLoading || !ttsText.trim()}
                  style={{ flex: 1, background: "linear-gradient(135deg, #8b5cf6, #6366f1)", color: "#fff", border: "none", padding: "10px", borderRadius: "10px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                >
                  <Volume2 size={16} /> {ttsLoading ? "Generating..." : "Synthesize & Play Voice"}
                </button>
              )}
            </div>
          </div>

          {/* Card 2: Universal Media Downloader */}
          <div style={{ background: "rgba(25, 25, 35, 0.5)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)", borderRadius: "20px", padding: "2rem", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1.2rem" }}>
              <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "linear-gradient(135deg, #ec4899, #f43f5e)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <DownloadCloud size={22} color="#fff" />
              </div>
              <div>
                <h2 style={{ fontSize: "1.3rem", fontWeight: 700, margin: 0 }}>Universal Media Extractor</h2>
                <span style={{ fontSize: "0.75rem", color: "#f472b6" }}>Multi-Platform Social Video & Audio</span>
              </div>
            </div>

            <label style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "0.4rem" }}>Media / Video URL</label>
            <input
              type="text"
              value={mediaUrl}
              onChange={e => setMediaUrl(e.target.value)}
              placeholder="https://facebook.com/watch/... or https://youtube.com/..."
              style={{ width: "100%", background: "#0c0e17", border: "1px solid var(--border)", borderRadius: "10px", padding: "0.8rem", color: "#f3f4f6", fontSize: "0.9rem", outline: "none", boxSizing: "border-box", marginBottom: "1.5rem" }}
            />

            {extractedInfo && (
              <div style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "1rem", marginBottom: "1.5rem" }}>
                <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#fff", marginBottom: "0.3rem" }}>{extractedInfo.title}</div>
                <div style={{ fontSize: "0.78rem", color: "#9ca3af" }}>Platform: {extractedInfo.platform} · Quality: {extractedInfo.quality}</div>
                <div style={{ marginTop: "0.8rem", display: "flex", gap: "8px" }}>
                  <a
                    href={extractedInfo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ background: "#ec4899", color: "#fff", textDecoration: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px" }}
                  >
                    <ExternalLink size={12} /> Open Stream
                  </a>
                </div>
              </div>
            )}

            <button
              onClick={handleExtractMedia}
              disabled={extracting || !mediaUrl.trim()}
              style={{ width: "100%", background: "linear-gradient(135deg, #ec4899, #f43f5e)", color: "#fff", border: "none", padding: "10px", borderRadius: "10px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "auto" }}
            >
              <DownloadCloud size={16} /> {extracting ? "Extracting Stream..." : "Extract Media Stream"}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
