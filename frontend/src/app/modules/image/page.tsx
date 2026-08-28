"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../utils/api";
import { 
  Sparkles, Image as ImageIcon, Wand2, Download, Copy, Check, 
  ArrowLeft, RefreshCw, Sliders, Maximize2, Layers, Zap, 
  Eye, Filter, Crop, Type, Share2, Compass, Shield, Palette,
  Camera, Sun, Moon, Film, Terminal, Flame, Star
} from "lucide-react";

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  style: string;
  model: string;
  aspectRatio: string;
  timestamp: string;
}

const STYLE_PRESETS = [
  { id: "photorealistic", name: "Photorealism 8K", icon: "📸", promptAdd: "hyperrealistic 8k photo, highly detailed, raw photography, 85mm f/1.4 lens, natural lighting, masterpiece" },
  { id: "cinematic", name: "Cinematic Film", icon: "🎬", promptAdd: "cinematic still, 35mm film, anamorphic lighting, blockbuster movie color grading, dramatic depth of field" },
  { id: "anime", name: "Anime & Manga", icon: "🌸", promptAdd: "Makoto Shinkai aesthetic, studio ghibli anime style, vibrant colors, clean linework, atmospheric clouds" },
  { id: "cyberpunk", name: "Cyberpunk Neon", icon: "🌆", promptAdd: "cyberpunk city, neon glow, wet reflections, holographic advertisements, futuristic octane render" },
  { id: "3d-pixar", name: "3D Animation", icon: "🧸", promptAdd: "Pixar style 3d render, clay render, subsurface scattering, Disney animation character, Unreal Engine 5" },
  { id: "concept-art", name: "Digital Art", icon: "🖌️", promptAdd: "trending on Artstation, epic digital painting, dynamic composition, master brush strokes, fantasy concept" },
  { id: "isometric", name: "3D Isometric", icon: "📐", promptAdd: "isometric 3d diorama, blender 3d render, miniature tilt-shift, vibrant pastel palette, soft lighting" },
  { id: "vintage-oil", name: "Oil Painting", icon: "🏛️", promptAdd: "classical renaissance oil painting, textured canvas, chiaroscuro lighting, Rembrandt masterpiece" },
];

const ASPECT_RATIOS = [
  { id: "1:1", label: "Square (1:1)", width: 1024, height: 1024, desc: "Feed / Profile" },
  { id: "9:16", label: "Portrait (9:16)", width: 720, height: 1280, desc: "Story / Reels" },
  { id: "16:9", label: "Landscape (16:9)", width: 1280, height: 720, desc: "YouTube / Wallpaper" },
  { id: "4:5", label: "Social (4:5)", width: 896, height: 1120, desc: "Instagram Post" },
];

const SAMPLE_INSPIRATIONS = [
  "A majestic cybernetic lion roaring on a neon rooftop in futuristic Neo-Tokyo, rain reflections, volumetric lights",
  "An ethereal floating island with ancient Greek temple and glowing waterfall cascading into galaxy stars",
  "Close-up portrait of a fantasy elven princess with bioluminescent freckles and diamond crown, 85mm portrait",
  "Cozy cyberpunk coffee shop inside a giant retro robot head, warm volumetric lighting, rain outside",
  "A mystical crystal tree glowing with golden liquid energy in a foggy enchanted forest at twilight"
];

export default function ImagePage() {
  const [activeTab, setActiveTab] = useState<"studio" | "prompt-lab" | "editor">("studio");
  
  // Generation States
  const [prompt, setPrompt] = useState("A majestic cybernetic lion with glowing neon circuits on a rainy Tokyo rooftop at night, 8k masterpiece");
  const [negativePrompt, setNegativePrompt] = useState("blurry, low quality, distorted, extra limbs, bad anatomy, watermark");
  const [selectedStyle, setSelectedStyle] = useState("photorealistic");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [selectedModel, setSelectedModel] = useState("flux");
  const [loading, setLoading] = useState(false);
  const [currentImage, setCurrentImage] = useState<string>("https://image.pollinations.ai/prompt/majestic%20cybernetic%20lion%20glowing%20neon%20circuits%20rainy%20tokyo%20rooftop%20at%20night%20photorealistic%208k?width=1024&height=1024&model=flux");
  const [gallery, setGallery] = useState<GeneratedImage[]>([]);
  const [copied, setCopied] = useState(false);
  const [magicPrompting, setMagicPrompting] = useState(false);
  const [lightbox, setLightbox] = useState(false);

  // Editor states
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editPreview, setEditPreview] = useState<string>("");
  const [editInstruction, setEditInstruction] = useState("");
  const [editOutput, setEditOutput] = useState<string>("");
  const [editLoading, setEditLoading] = useState(false);

  // Prompt Lab state
  const [simpleIdea, setSimpleIdea] = useState("");
  const [expandedPrompt, setExpandedPrompt] = useState("");
  const [promptLabLoading, setPromptLabLoading] = useState(false);

  const getActiveDimensions = () => {
    const found = ASPECT_RATIOS.find(a => a.id === aspectRatio);
    return found ? { width: found.width, height: found.height } : { width: 1024, height: 1024 };
  };

  const handleGenerate = async (customPrompt?: string) => {
    const finalPrompt = customPrompt || prompt;
    if (!finalPrompt.trim()) return;

    setLoading(true);
    const { width, height } = getActiveDimensions();
    const styleObj = STYLE_PRESETS.find(s => s.id === selectedStyle);
    const enrichedPrompt = styleObj ? `${finalPrompt}, ${styleObj.promptAdd}` : finalPrompt;

    try {
      const formData = new FormData();
      formData.append("prompt", enrichedPrompt);
      formData.append("width", String(width));
      formData.append("height", String(height));
      formData.append("model", selectedModel);

      const data = await apiFetch("/image/generate", {
        method: "POST",
        body: formData
      });

      const imgUrl = data.url || data.image_url;
      if (imgUrl) {
        setCurrentImage(imgUrl);
        const newImg: GeneratedImage = {
          id: String(Date.now()),
          url: imgUrl,
          prompt: finalPrompt,
          style: selectedStyle,
          model: selectedModel,
          aspectRatio,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setGallery(prev => [newImg, ...prev.slice(0, 15)]);
      }
    } catch {
      // Direct Pollinations fallback
      const encoded = encodeURIComponent(enrichedPrompt.substring(0, 180));
      const fallbackUrl = `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&model=${selectedModel}&nologo=true`;
      setCurrentImage(fallbackUrl);
      setGallery(prev => [{
        id: String(Date.now()),
        url: fallbackUrl,
        prompt: finalPrompt,
        style: selectedStyle,
        model: selectedModel,
        aspectRatio,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }, ...prev.slice(0, 15)]);
    } finally {
      setLoading(false);
    }
  };

  const handleMagicEnhancePrompt = async () => {
    if (!prompt.trim()) return;
    setMagicPrompting(true);
    try {
      const formData = new FormData();
      formData.append("description", prompt);
      formData.append("style", selectedStyle);
      const res = await apiFetch("/image/generate-prompt", {
        method: "POST",
        body: formData
      });
      if (res && res.prompt) {
        setPrompt(res.prompt);
      }
    } catch {
      // Local enhancement
      setPrompt(`${prompt}, ultra-detailed, cinematic lighting, volumetric shadows, octane render 8k, masterpiece, unreal engine 5`);
    } finally {
      setMagicPrompting(false);
    }
  };

  const handlePromptLabGenerate = async () => {
    if (!simpleIdea.trim()) return;
    setPromptLabLoading(true);
    try {
      const formData = new FormData();
      formData.append("description", simpleIdea);
      formData.append("style", selectedStyle);
      const res = await apiFetch("/image/generate-prompt", {
        method: "POST",
        body: formData
      });
      if (res && res.prompt) {
        setExpandedPrompt(res.prompt);
      }
    } catch {
      setExpandedPrompt(`${simpleIdea}, intricate details, award-winning photography, photorealistic 8k, volumetric rays, dramatic depth of field`);
    } finally {
      setPromptLabLoading(false);
    }
  };

  const handleDownload = async (urlToDownload?: string) => {
    const targetUrl = urlToDownload || currentImage;
    if (!targetUrl) return;
    try {
      const res = await fetch(targetUrl);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `sam-ai-image-${Date.now()}.png`;
      a.click();
    } catch {
      window.open(targetUrl, "_blank");
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(to bottom right, #090a12, #0d101a)", color: "#f3f4f6", padding: "2rem", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: "1350px", margin: "0 auto" }}>
        
        {/* ── Top Header Navigation ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.8rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <Link href="/modules" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#9ca3af", textDecoration: "none", fontSize: "0.85rem", marginBottom: "0.5rem", padding: "4px 10px", borderRadius: "6px", background: "rgba(255,255,255,0.05)" }}>
              <ArrowLeft size={14} /> Back to Modules
            </Link>
            <h1 style={{ fontSize: "2.3rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "0.8rem", background: "linear-gradient(135deg, #a855f7, #ec4899, #f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              <Sparkles size={34} color="#c084fc" />
              SAM AI Image Studio Pro
            </h1>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: "flex", gap: "6px", background: "rgba(255,255,255,0.04)", padding: "4px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)" }}>
            {[
              { id: 'studio', label: 'AI Generation Studio', icon: Palette },
              { id: 'prompt-lab', label: 'Prompt Engineer Lab', icon: Wand2 },
              { id: 'editor', label: 'AI Image Tools', icon: Sliders }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  background: activeTab === t.id ? "linear-gradient(135deg, #a855f7, #7c3aed)" : "transparent",
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

        {/* ── TAB 1: MAIN STUDIO WORKSPACE ── */}
        {activeTab === 'studio' && (
          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.2fr", gap: "2rem", alignItems: "start" }}>
            
            {/* Left Column: Controls & Prompting */}
            <div style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)", borderRadius: "20px", padding: "1.8rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              
              {/* Prompt Input Box */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <label style={{ fontSize: "0.88rem", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Sparkles size={15} color="#c084fc" /> Master Prompt Description
                  </label>
                  <button
                    onClick={handleMagicEnhancePrompt}
                    disabled={magicPrompting}
                    style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)", color: "#c084fc", padding: "3px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                  >
                    <Wand2 size={12} /> {magicPrompting ? "Enhancing..." : "Magic Enhance"}
                  </button>
                </div>
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  rows={4}
                  placeholder="Describe anything you can imagine in high detail..."
                  style={{ width: "100%", background: "#0a0c16", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", padding: "0.9rem", color: "#fff", fontSize: "0.92rem", lineHeight: 1.5, resize: "vertical", outline: "none", boxSizing: "border-box" }}
                />

                {/* Quick Inspiration Chips */}
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "0.6rem" }}>
                  {SAMPLE_INSPIRATIONS.slice(0, 3).map((insp, i) => (
                    <button
                      key={i}
                      onClick={() => setPrompt(insp)}
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#9ca3af", padding: "3px 8px", borderRadius: "6px", fontSize: "0.72rem", cursor: "pointer", maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                      title={insp}
                    >
                      💡 {insp}
                    </button>
                  ))}
                </div>
              </div>

              {/* Art Styles Grid */}
              <div>
                <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff", display: "block", marginBottom: "0.6rem" }}>
                  🎨 Artistic Style & Aesthetic
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(135px, 1fr))", gap: "8px" }}>
                  {STYLE_PRESETS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedStyle(s.id)}
                      style={{
                        background: selectedStyle === s.id ? "rgba(168,85,247,0.2)" : "rgba(255,255,255,0.03)",
                        border: selectedStyle === s.id ? "1px solid #a855f7" : "1px solid rgba(255,255,255,0.06)",
                        color: selectedStyle === s.id ? "#fff" : "#9ca3af",
                        padding: "8px", borderRadius: "10px", textAlign: "left", cursor: "pointer", transition: "all 0.15s"
                      }}
                    >
                      <div style={{ fontSize: "1.1rem", marginBottom: "2px" }}>{s.icon}</div>
                      <div style={{ fontSize: "0.78rem", fontWeight: 600 }}>{s.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Aspect Ratio & Model Engine */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.82rem", color: "#9ca3af", display: "block", marginBottom: "0.4rem" }}>Aspect Ratio</label>
                  <select
                    value={aspectRatio}
                    onChange={e => setAspectRatio(e.target.value)}
                    style={{ width: "100%", background: "#0a0c16", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0.6rem", color: "#fff", fontSize: "0.85rem", outline: "none" }}
                  >
                    {ASPECT_RATIOS.map(a => (
                      <option key={a.id} value={a.id}>{a.label} · {a.desc}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "0.82rem", color: "#9ca3af", display: "block", marginBottom: "0.4rem" }}>AI Model Engine</label>
                  <select
                    value={selectedModel}
                    onChange={e => setSelectedModel(e.target.value)}
                    style={{ width: "100%", background: "#0a0c16", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0.6rem", color: "#fff", fontSize: "0.85rem", outline: "none" }}
                  >
                    <option value="flux">Flux.1 Pro (Ultra Realistic)</option>
                    <option value="flux-realism">Flux Realism (Cinematic)</option>
                    <option value="turbo">Turbo Fast (Instant Engine)</option>
                  </select>
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={() => handleGenerate()}
                disabled={loading || !prompt.trim()}
                style={{
                  width: "100%", padding: "1rem",
                  background: "linear-gradient(135deg, #a855f7, #ec4899, #f59e0b)",
                  color: "#fff", border: "none", borderRadius: "12px",
                  fontSize: "1.05rem", fontWeight: 800, cursor: (loading || !prompt.trim()) ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  boxShadow: "0 6px 20px rgba(168,85,247,0.35)", transition: "transform 0.15s"
                }}
              >
                {loading ? <><RefreshCw className="animate-spin" size={20} /> Synthesizing Masterpiece...</> : <><Sparkles size={20} /> Generate AI Image</>}
              </button>

            </div>

            {/* Right Column: Live Masterpiece Canvas & History */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              
              {/* Main Canvas Card */}
              <div style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)", borderRadius: "20px", padding: "1.5rem", position: "relative" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Eye size={16} color="#a855f7" /> 4K Ultra Canvas Render
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      onClick={handleCopyPrompt}
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "6px 10px", borderRadius: "6px", fontSize: "0.78rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                    >
                      {copied ? <Check size={13} color="#22c55e" /> : <Copy size={13} />}
                      {copied ? "Copied" : "Copy Prompt"}
                    </button>
                    <button
                      onClick={() => handleDownload()}
                      style={{ background: "#a855f7", color: "#fff", border: "none", padding: "6px 14px", borderRadius: "6px", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                    >
                      <Download size={14} /> Download HD
                    </button>
                    <button
                      onClick={() => setLightbox(true)}
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "6px 8px", borderRadius: "6px", cursor: "pointer" }}
                      title="Fullscreen Lightbox"
                    >
                      <Maximize2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Canvas Display */}
                <div style={{ width: "100%", aspectRatio: aspectRatio === "16:9" ? "16/9" : aspectRatio === "9:16" ? "9/16" : "1/1", maxHeight: "480px", background: "#05060a", borderRadius: "14px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", border: "1px solid rgba(255,255,255,0.05)" }}>
                  {loading && (
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 10 }}>
                      <RefreshCw className="animate-spin" size={36} color="#c084fc" />
                      <div style={{ marginTop: "1rem", fontWeight: 600, color: "#fff", fontSize: "0.95rem" }}>Rendering Neural Artwork...</div>
                    </div>
                  )}
                  {currentImage ? (
                    <img 
                      src={currentImage} 
                      alt={prompt} 
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  ) : (
                    <div style={{ color: "#4b5563", fontSize: "0.9rem" }}>No image rendered yet.</div>
                  )}
                </div>
              </div>

              {/* Generation History Gallery */}
              {gallery.length > 0 && (
                <div style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "1.2rem" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#9ca3af", marginBottom: "0.8rem", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Layers size={14} /> Session Artwork Gallery ({gallery.length})
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: "8px" }}>
                    {gallery.map(item => (
                      <div
                        key={item.id}
                        onClick={() => { setCurrentImage(item.url); setPrompt(item.prompt); }}
                        style={{
                          aspectRatio: "1/1", borderRadius: "8px", overflow: "hidden", cursor: "pointer",
                          border: currentImage === item.url ? "2px solid #a855f7" : "1px solid rgba(255,255,255,0.1)",
                          position: "relative"
                        }}
                      >
                        <img src={item.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

        {/* ── TAB 2: PROMPT ENGINEER LAB ── */}
        {activeTab === 'prompt-lab' && (
          <div style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "2rem" }}>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "8px" }}>
              <Wand2 size={22} color="#c084fc" /> AI Prompt Engineer & Master Styler
            </h2>
            <p style={{ color: "#9ca3af", fontSize: "0.9rem", marginBottom: "2rem" }}>
              Turn simple keywords into studio-grade Midjourney & Flux.1 master prompts with professional lighting, camera lens parameters, and artistic composition.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem", maxWidth: "800px" }}>
              <div>
                <label style={{ fontSize: "0.85rem", color: "#e5e7eb", fontWeight: 600, display: "block", marginBottom: "0.4rem" }}>Your Simple Idea</label>
                <input
                  type="text"
                  value={simpleIdea}
                  onChange={e => setSimpleIdea(e.target.value)}
                  placeholder="e.g. A samurai cat in cherry blossom forest"
                  style={{ width: "100%", background: "#0a0c16", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "0.9rem", color: "#fff", fontSize: "0.95rem", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <button
                onClick={handlePromptLabGenerate}
                disabled={promptLabLoading || !simpleIdea.trim()}
                style={{ alignSelf: "flex-start", background: "linear-gradient(135deg, #a855f7, #ec4899)", color: "#fff", border: "none", padding: "10px 22px", borderRadius: "10px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
              >
                <Sparkles size={16} /> {promptLabLoading ? "Engineering Prompt..." : "Synthesize Master Prompt"}
              </button>

              {expandedPrompt && (
                <div style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: "12px", padding: "1.2rem", marginTop: "1rem" }}>
                  <div style={{ fontSize: "0.8rem", color: "#a78bfa", fontWeight: 700, marginBottom: "0.4rem" }}>Generated Master Prompt:</div>
                  <p style={{ color: "#fff", fontSize: "0.95rem", lineHeight: 1.6, margin: "0 0 1rem 0" }}>{expandedPrompt}</p>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => { setPrompt(expandedPrompt); setActiveTab("studio"); handleGenerate(expandedPrompt); }}
                      style={{ background: "#a855f7", color: "#fff", border: "none", padding: "6px 14px", borderRadius: "6px", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}
                    >
                      Use & Generate Image →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 3: IMAGE EDITING TOOLS ── */}
        {activeTab === 'editor' && (
          <div style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "2rem" }}>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "8px" }}>
              <Sliders size={22} color="#ec4899" /> AI Image Analysis & Editing Suite
            </h2>
            <p style={{ color: "#9ca3af", fontSize: "0.9rem", marginBottom: "2rem" }}>
              Upload any photo for AI visual inspection, enhancement guidance, and creative filters.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
              <div>
                <label style={{ fontSize: "0.85rem", color: "#e5e7eb", display: "block", marginBottom: "0.4rem" }}>Upload Reference Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setEditFile(e.target.files[0]);
                      setEditPreview(URL.createObjectURL(e.target.files[0]));
                    }
                  }}
                  style={{ background: "#0a0c16", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0.6rem", color: "#9ca3af", width: "100%", boxSizing: "border-box" }}
                />

                {editPreview && (
                  <div style={{ marginTop: "1rem", width: "100%", maxHeight: "280px", borderRadius: "10px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <img src={editPreview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: "0.85rem", color: "#e5e7eb", display: "block", marginBottom: "0.4rem" }}>Editing Request / Transformation Goal</label>
                <textarea
                  value={editInstruction}
                  onChange={e => setEditInstruction(e.target.value)}
                  rows={4}
                  placeholder="e.g. Increase vibrancy, turn daylight into golden sunset, add cyberpunk lights..."
                  style={{ width: "100%", background: "#0a0c16", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "0.8rem", color: "#fff", fontSize: "0.9rem", outline: "none", boxSizing: "border-box", marginBottom: "1rem" }}
                />

                <button
                  onClick={async () => {
                    if (!editFile || !editInstruction) return;
                    setEditLoading(true);
                    try {
                      const formData = new FormData();
                      formData.append("image", editFile);
                      formData.append("instruction", editInstruction);
                      const res = await apiFetch("/image/analyze", { method: "POST", body: formData });
                      setEditOutput(res.instructions || "Analysis complete.");
                    } catch (e: any) {
                      setEditOutput(`Editing instruction generated: ${editInstruction}`);
                    } finally {
                      setEditLoading(false);
                    }
                  }}
                  disabled={editLoading || !editFile}
                  style={{ background: "#ec4899", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: 700, cursor: (editLoading || !editFile) ? "not-allowed" : "pointer" }}
                >
                  {editLoading ? "Analyzing Image..." : "Analyze & Process"}
                </button>

                {editOutput && (
                  <div style={{ marginTop: "1.2rem", background: "rgba(0,0,0,0.3)", padding: "1rem", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)", fontSize: "0.88rem", color: "#e5e7eb", lineHeight: 1.6, maxHeight: "200px", overflowY: "auto", whiteSpace: "pre-wrap" }}>
                    {editOutput}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Fullscreen Lightbox Modal */}
        {lightbox && (
          <div 
            onClick={() => setLightbox(false)}
            style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.92)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", zIndex: 1000, cursor: "zoom-out" }}
          >
            <img src={currentImage} alt="" style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: "16px", boxShadow: "0 10px 40px rgba(0,0,0,0.8)" }} />
          </div>
        )}

      </div>
    </div>
  );
}
