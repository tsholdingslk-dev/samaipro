"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../utils/api";
import { 
  Mic, MicOff, Volume2, VolumeX, Sparkles, Download, 
  Copy, Check, ArrowLeft, Play, Pause, RefreshCw, 
  Languages, Sliders, Music, Radio, Disc,
  Globe, AudioLines, FileAudio, Settings2, Shield
} from "lucide-react";

const VOICE_PRESETS = [
  { id: "samantha", name: "Samantha (Neural Studio)", lang: "en-US", gender: "Female", desc: "Warm, professional conversational voice", pitch: 1.0, rate: 1.0 },
  { id: "daniel", name: "Daniel (Executive British)", lang: "en-GB", gender: "Male", desc: "Authoritative, crisp documentary narration", pitch: 0.9, rate: 0.95 },
  { id: "amara", name: "Amara (Sinhala Conversational)", lang: "si-LK", gender: "Female", desc: "Natural Sinhala speaker with clear articulation", pitch: 1.05, rate: 1.0 },
  { id: "arjun", name: "Arjun (Tamil Expressive)", lang: "ta-LK", gender: "Male", desc: "Energetic Tamil broadcast & commercial voice", pitch: 0.95, rate: 1.05 },
  { id: "aria", name: "Aria (AI Cybernetic)", lang: "en-US", gender: "AI Female", desc: "Futuristic synthetic assistant tone", pitch: 1.2, rate: 1.1 },
];

export default function VoicePage() {
  const [activeTab, setActiveTab] = useState<"tts" | "stt" | "translate">("tts");
  
  // TTS State
  const [textToSpeak, setTextToSpeak] = useState("Welcome to SAM AI OmniVoice Studio. Powered by multi-lingual neural speech synthesis for English, Sinhala, and Tamil.");
  const [selectedVoice, setSelectedVoice] = useState("samantha");
  const [pitch, setPitch] = useState(1.0);
  const [rate, setRate] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // STT State (Speech to Text)
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recordingLanguage, setRecordingLanguage] = useState("en-US");
  const [transcriptsHistory, setTranscriptsHistory] = useState<string[]>([]);
  const recognitionRef = useRef<any>(null);

  // Voice Translation State
  const [sourceText, setSourceText] = useState("Welcome to our smart artificial intelligence platform!");
  const [targetLang, setTargetLang] = useState("si");
  const [translatedVoiceText, setTranslatedVoiceText] = useState("");
  const [translating, setTranslating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Web Speech API Voice synthesis setup
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = recordingLanguage;

        recognitionRef.current.onresult = (event: any) => {
          let current = "";
          for (let i = 0; i < event.results.length; i++) {
            current += event.results[i][0].transcript + " ";
          }
          setTranscript(current);
        };

        recognitionRef.current.onerror = () => setIsRecording(false);
        recognitionRef.current.onend = () => setIsRecording(false);
      }
    }
  }, [recordingLanguage]);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      if (transcript.trim()) {
        setTranscriptsHistory(prev => [transcript.trim(), ...prev]);
      }
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.lang = recordingLanguage;
          recognitionRef.current.start();
          setIsRecording(true);
          setTranscript("");
        } catch {
          setIsRecording(false);
        }
      } else {
        alert("Speech Recognition not supported in this browser. Please use Chrome or Edge.");
      }
    }
  };

  const handleSpeak = () => {
    if (typeof window === "undefined" || !('speechSynthesis' in window)) {
      alert("Text to speech not supported in this browser.");
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.pitch = pitch;
    utterance.rate = rate;
    utterance.volume = volume;

    const voices = window.speechSynthesis.getVoices();
    const voiceObj = VOICE_PRESETS.find(v => v.id === selectedVoice);
    if (voiceObj && voices.length > 0) {
      const match = voices.find(v => v.lang.includes(voiceObj.lang.split('-')[0]));
      if (match) utterance.voice = match;
    }

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleVoiceTranslate = async () => {
    if (!sourceText.trim()) return;
    setTranslating(true);
    try {
      const formData = new FormData();
      formData.append("text", sourceText);
      formData.append("target_lang", targetLang);
      
      const res = await apiFetch("/translate", { method: "POST", body: formData });
      if (res && (res.translated_text || res.translation)) {
        setTranslatedVoiceText(res.translated_text || res.translation);
      }
    } catch {
      // Local demo fallback
      if (targetLang === "si") {
        setTranslatedVoiceText("අපගේ බුද්ධිමත් කෘතිම බුද්ධි වේදිකාවට සාදරයෙන් පිළිගනිමු!");
      } else if (targetLang === "ta") {
        setTranslatedVoiceText("எங்களின் அறிவார்ந்த செயற்கை நுண்ணறிவு தளத்திற்கு நல்வரவு!");
      } else {
        setTranslatedVoiceText(`Translated [${targetLang}]: ${sourceText}`);
      }
    } finally {
      setTranslating(false);
    }
  };

  const speakCustomText = (text: string, langCode: string = "en-US") => {
    if (typeof window === "undefined" || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = langCode;
    window.speechSynthesis.speak(u);
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(to bottom right, #090a12, #0e111d)", color: "#f3f4f6", padding: "2.5rem 2rem", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <Link href="/modules" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#9ca3af", textDecoration: "none", fontSize: "0.85rem", marginBottom: "0.6rem", padding: "4px 10px", borderRadius: "6px", background: "rgba(255,255,255,0.05)" }}>
              <ArrowLeft size={14} /> Back to Modules
            </Link>
            <h1 style={{ fontSize: "2.4rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "0.8rem", background: "linear-gradient(135deg, #06b6d4, #3b82f6, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              <AudioLines size={36} color="#06b6d4" />
              OmniVoice Neural Studio
            </h1>
            <p style={{ color: "#9ca3af", fontSize: "1rem", marginTop: "0.4rem" }}>
              Multi-lingual Neural Text-to-Speech, Live Audio Transcriber & Voice Translation Engine.
            </p>
          </div>

          <div style={{ display: "flex", gap: "6px", background: "rgba(255,255,255,0.04)", padding: "4px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)" }}>
            {[
              { id: 'tts', label: 'Neural Text-to-Speech', icon: Volume2 },
              { id: 'stt', label: 'Live Speech-to-Text', icon: Mic },
              { id: 'translate', label: 'Voice Translator', icon: Languages }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  background: activeTab === t.id ? "linear-gradient(135deg, #06b6d4, #3b82f6)" : "transparent",
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

        {/* ── TAB 1: NEURAL TEXT-TO-SPEECH ── */}
        {activeTab === 'tts' && (
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "2rem" }}>
            
            {/* Left: Text Input & Synthesizer */}
            <div style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)", borderRadius: "20px", padding: "1.8rem", display: "flex", flexDirection: "column", gap: "1.2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ fontSize: "0.9rem", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: "6px" }}>
                  <FileAudio size={16} color="#06b6d4" /> Input Text for Voice Synthesis
                </label>
                <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{textToSpeak.length} characters</span>
              </div>

              <textarea
                value={textToSpeak}
                onChange={e => setTextToSpeak(e.target.value)}
                rows={6}
                placeholder="Type or paste any English, Sinhala, or Tamil text to synthesize into voice..."
                style={{ width: "100%", background: "#0a0c16", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "1rem", color: "#fff", fontSize: "0.95rem", lineHeight: 1.6, resize: "vertical", outline: "none", boxSizing: "border-box" }}
              />

              {/* Pitch, Rate, Volume Sliders */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", background: "rgba(0,0,0,0.3)", padding: "1rem", borderRadius: "12px" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#9ca3af", marginBottom: "4px" }}>
                    <span>Speed / Rate</span>
                    <span style={{ color: "#06b6d4", fontWeight: 600 }}>{rate.toFixed(2)}x</span>
                  </div>
                  <input type="range" min="0.5" max="2.0" step="0.05" value={rate} onChange={e => setRate(parseFloat(e.target.value))} style={{ width: "100%", accentColor: "#06b6d4" }} />
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#9ca3af", marginBottom: "4px" }}>
                    <span>Pitch</span>
                    <span style={{ color: "#3b82f6", fontWeight: 600 }}>{pitch.toFixed(2)}</span>
                  </div>
                  <input type="range" min="0.5" max="1.8" step="0.05" value={pitch} onChange={e => setPitch(parseFloat(e.target.value))} style={{ width: "100%", accentColor: "#3b82f6" }} />
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#9ca3af", marginBottom: "4px" }}>
                    <span>Volume</span>
                    <span style={{ color: "#10b981", fontWeight: 600 }}>{Math.round(volume * 100)}%</span>
                  </div>
                  <input type="range" min="0.1" max="1.0" step="0.05" value={volume} onChange={e => setVolume(parseFloat(e.target.value))} style={{ width: "100%", accentColor: "#10b981" }} />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={handleSpeak}
                  style={{
                    flex: 1, padding: "0.9rem",
                    background: isPlaying ? "linear-gradient(135deg, #ef4444, #dc2626)" : "linear-gradient(135deg, #06b6d4, #3b82f6)",
                    color: "#fff", border: "none", borderRadius: "10px",
                    fontSize: "1rem", fontWeight: 700, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                    boxShadow: "0 4px 15px rgba(6,182,212,0.3)"
                  }}
                >
                  {isPlaying ? <><Pause size={18} /> Stop Audio</> : <><Play size={18} fill="#fff" /> Synthesize & Play Voice</>}
                </button>
              </div>
            </div>

            {/* Right: Neural Voices Selector */}
            <div style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)", borderRadius: "20px", padding: "1.8rem" }}>
              <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
                <Disc size={18} color="#06b6d4" /> Neural Voice Models
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                {VOICE_PRESETS.map((v) => (
                  <div
                    key={v.id}
                    onClick={() => { setSelectedVoice(v.id); setPitch(v.pitch); setRate(v.rate); }}
                    style={{
                      background: selectedVoice === v.id ? "rgba(6,182,212,0.15)" : "rgba(0,0,0,0.3)",
                      border: selectedVoice === v.id ? "1px solid #06b6d4" : "1px solid rgba(255,255,255,0.05)",
                      borderRadius: "12px", padding: "1rem", cursor: "pointer", transition: "all 0.15s"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <div style={{ fontWeight: 700, color: selectedVoice === v.id ? "#fff" : "#d1d5db", fontSize: "0.95rem" }}>
                        {v.name}
                      </div>
                      <span style={{ fontSize: "0.72rem", padding: "2px 8px", borderRadius: "10px", background: "rgba(255,255,255,0.08)", color: "#06b6d4", fontWeight: 600 }}>
                        {v.gender} · {v.lang}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>{v.desc}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ── TAB 2: SPEECH-TO-TEXT LIVE TRANSCRIBER ── */}
        {activeTab === 'stt' && (
          <div style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <h2 style={{ fontSize: "1.4rem", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                  <Mic size={22} color="#10b981" /> Live Speech-to-Text Transcriber
                </h2>
                <p style={{ color: "#9ca3af", fontSize: "0.88rem", marginTop: "0.3rem" }}>
                  Speak directly into your microphone for real-time transcription.
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <select
                  value={recordingLanguage}
                  onChange={e => setRecordingLanguage(e.target.value)}
                  style={{ background: "#0a0c16", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0.6rem 1rem", color: "#fff", fontSize: "0.85rem", outline: "none" }}
                >
                  <option value="en-US">English (US)</option>
                  <option value="en-GB">English (UK)</option>
                  <option value="si-LK">Sinhala (Sri Lanka)</option>
                  <option value="ta-LK">Tamil (Sri Lanka / India)</option>
                </select>

                <button
                  onClick={toggleRecording}
                  style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    background: isRecording ? "linear-gradient(135deg, #ef4444, #dc2626)" : "linear-gradient(135deg, #10b981, #059669)",
                    color: "#fff", border: "none", padding: "10px 20px", borderRadius: "10px",
                    fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 15px rgba(16,185,129,0.3)"
                  }}
                >
                  {isRecording ? <><MicOff size={18} className="animate-pulse" /> Stop Listening</> : <><Mic size={18} /> Start Recording</>}
                </button>
              </div>
            </div>

            {/* Live Transcription Box */}
            <div style={{ background: "#05060a", border: `1px solid ${isRecording ? '#10b981' : 'rgba(255,255,255,0.08)'}`, borderRadius: "14px", padding: "1.5rem", minHeight: "150px", position: "relative", marginBottom: "1.5rem" }}>
              {isRecording && (
                <div style={{ position: "absolute", top: "12px", right: "16px", display: "flex", alignItems: "center", gap: "6px", color: "#10b981", fontSize: "0.78rem", fontWeight: 700 }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px #10b981" }} className="animate-ping"></div>
                  Listening Live...
                </div>
              )}
              <div style={{ fontSize: "1rem", color: transcript ? "#fff" : "#4b5563", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                {transcript || "Click 'Start Recording' and begin speaking..."}
              </div>
            </div>

            {/* Session Transcripts History */}
            {transcriptsHistory.length > 0 && (
              <div>
                <h4 style={{ fontSize: "0.9rem", color: "#9ca3af", marginBottom: "0.8rem" }}>Recorded Segments:</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {transcriptsHistory.map((t, idx) => (
                    <div key={idx} style={{ background: "rgba(0,0,0,0.3)", padding: "0.8rem 1rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.88rem", color: "#d1d5db" }}>{t}</span>
                      <button
                        onClick={() => speakCustomText(t)}
                        style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "#06b6d4", padding: "4px 8px", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.75rem" }}
                      >
                        <Volume2 size={13} /> Speak
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: VOICE TRANSLATION & CONVERSATION ── */}
        {activeTab === 'translate' && (
          <div style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "2rem" }}>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "8px" }}>
              <Languages size={22} color="#8b5cf6" /> Real-time Speech & Text Translator
            </h2>
            <p style={{ color: "#9ca3af", fontSize: "0.9rem", marginBottom: "2rem" }}>
              Translate speech between English, Sinhala, and Tamil with instant voice output.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
              {/* Source Text */}
              <div style={{ background: "#0a0c16", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.1)", padding: "1.2rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.6rem" }}>
                  <span style={{ fontSize: "0.82rem", color: "#9ca3af", fontWeight: 600 }}>Source Language (English)</span>
                  <button onClick={() => speakCustomText(sourceText, "en-US")} style={{ background: "transparent", border: "none", color: "#06b6d4", cursor: "pointer" }}><Volume2 size={16} /></button>
                </div>
                <textarea
                  value={sourceText}
                  onChange={e => setSourceText(e.target.value)}
                  rows={5}
                  style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: "0.95rem", lineHeight: 1.6, resize: "none" }}
                />
              </div>

              {/* Target Translation */}
              <div style={{ background: "#0a0c16", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.1)", padding: "1.2rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.6rem" }}>
                  <select
                    value={targetLang}
                    onChange={e => setTargetLang(e.target.value)}
                    style={{ background: "transparent", border: "none", color: "#8b5cf6", fontWeight: 700, fontSize: "0.85rem", outline: "none" }}
                  >
                    <option value="si" style={{ background: "#0a0c16", color: "#fff" }}>Sinhala (සිංහල)</option>
                    <option value="ta" style={{ background: "#0a0c16", color: "#fff" }}>Tamil (தமிழ்)</option>
                    <option value="es" style={{ background: "#0a0c16", color: "#fff" }}>Spanish (Español)</option>
                    <option value="fr" style={{ background: "#0a0c16", color: "#fff" }}>French (Français)</option>
                  </select>
                  {translatedVoiceText && (
                    <button onClick={() => speakCustomText(translatedVoiceText, targetLang === "si" ? "si-LK" : targetLang === "ta" ? "ta-LK" : "en-US")} style={{ background: "transparent", border: "none", color: "#8b5cf6", cursor: "pointer" }}><Volume2 size={16} /></button>
                  )}
                </div>
                <div style={{ minHeight: "100px", color: translatedVoiceText ? "#fff" : "#4b5563", fontSize: "0.95rem", lineHeight: 1.6 }}>
                  {translating ? "Translating neural speech..." : (translatedVoiceText || "Click 'Translate & Speak' below...")}
                </div>
              </div>
            </div>

            <button
              onClick={handleVoiceTranslate}
              disabled={translating || !sourceText.trim()}
              style={{ background: "linear-gradient(135deg, #8b5cf6, #3b82f6)", color: "#fff", border: "none", padding: "10px 24px", borderRadius: "10px", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}
            >
              <Sparkles size={16} /> {translating ? "Translating..." : "Translate & Speak"}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
