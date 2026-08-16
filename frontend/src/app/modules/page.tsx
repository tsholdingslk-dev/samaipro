"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type Module = {
  id: string;
  title: string;
  description: string;
  icon: string;
  href: string;
  color: string;
};

const modules: Module[] = [
  {
    id: "chat",
    title: "AI Chat Workspace",
    description: "Core conversational AI workspace with multi-file analysis, project memory, and turbo responses.",
    icon: "💬",
    href: "/chat",
    color: "#3b82f6"
  },
  {
    id: "lead-gen",
    title: "Lead Generation & Demo Web Studio",
    description: "Extract local business leads, missing websites, auto-create demo sites & WhatsApp proposals.",
    icon: "🎯",
    href: "/modules/lead-gen",
    color: "#ec4899"
  },
  {
    id: "crypto",
    title: "Crypto Market Live Research",
    description: "Real-time prices, 24h gainers/losers, global crypto news, crash risk prediction & AI coin research.",
    icon: "🪙",
    href: "/modules/crypto",
    color: "#f59e0b"
  },
  {
    id: "agents",
    title: "Autonomous AI Agents",
    description: "Plan, research, code, and execute multi-step tasks automatically with specialized AI agents.",
    icon: "🤖",
    href: "/modules/agents",
    color: "#8b5cf6"
  },
  {
    id: "coding",
    title: "Coding Assistant & Fixer",
    description: "Generate code, explain code, fix bugs, API connect guides, deployment help.",
    icon: "💻",
    href: "/modules/coding",
    color: "#10b981"
  },
  {
    id: "image",
    title: "AI Image Studio",
    description: "Generate prompts, edit images, resize, apply filters, add text overlays.",
    icon: "🖼️",
    href: "/modules/image",
    color: "#a855f7"
  },
  {
    id: "voice",
    title: "Voice Workspace",
    description: "Transcribe audio files, voice commands, text-to-speech support.",
    icon: "🎙️",
    href: "/modules/voice",
    color: "#f97316"
  },
  {
    id: "pdf-translate",
    title: "PDF & Translation Engine",
    description: "Extract text from PDFs, DOCX, TXT. Translate between Tamil, Sinhala, English.",
    icon: "📄",
    href: "/modules/pdf-translate",
    color: "#06b6d4"
  },
  {
    id: "media",
    title: "Media & Content Studio",
    description: "Social media prompts, image/video generation prompts, resize guides.",
    icon: "🎬",
    href: "/modules/media",
    color: "#ef4444"
  },
  {
    id: "learning",
    title: "Self Learning AI Brain",
    description: "SAM AI learns from your feedback and adapts to your personal style.",
    icon: "🧠",
    href: "/modules/learning",
    color: "#10b981"
  },
  {
    id: "social-news",
    title: "NewsFlash Elite Editor",
    description: "Create viral, fact-checked Facebook posts and analyze reference images.",
    icon: "📰",
    href: "/modules/social-news",
    color: "#3b82f6"
  },
  {
    id: "docs",
    title: "Interactive API Documentation",
    description: "Complete API reference with endpoints, SDK examples, and live Try-It runner.",
    icon: "📚",
    href: "/docs",
    color: "#6366f1"
  },
  {
    id: "demo",
    title: "Instant Web Preview Studio",
    description: "Instant client website preview studio with live appointment booking and custom themes.",
    icon: "🌐",
    href: "/demo/default",
    color: "#14b8a6"
  },
  {
    id: "api-hub",
    title: "Multi-API Provider Hub",
    description: "Auto-failover AI model rotator across Gemini, Groq, OpenRouter & Pollinations.",
    icon: "🔄",
    href: "/modules/api-hub",
    color: "#3b82f6"
  },
  {
    id: "auto-integrator",
    title: "Auto API Integrator",
    description: "Dynamically test and register new AI API keys without touching backend code.",
    icon: "⚡",
    href: "/modules/auto-integrator",
    color: "#eab308"
  },
  {
    id: "project-memory",
    title: "Project Memory Storage",
    description: "Persistent workspace memory for files, code snippets, and structured conversation logs.",
    icon: "📂",
    href: "/modules/project-memory",
    color: "#64748b"
  },
  {
    id: "ai-intelligence",
    title: "24/7 System Intelligence",
    description: "AI market monitoring, performance diagnostics, and automated admin digests.",
    icon: "🛰️",
    href: "/modules/ai-intelligence",
    color: "#f43f5e"
  }

];

export default function ModulesPage() {
  const router = useRouter();

  return (
    <div className="page-container">
      <div className="glass-panel animate-fade-in" style={{ width: "100%", maxWidth: "1200px" }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>SAM AI 16 Core Modules</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>
            Explore all 16 intelligent AI modules powering your workflow
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "1.5rem"
        }}>
          {modules.map((mod) => (
            <Link href={mod.href} key={mod.id} style={{ textDecoration: "none" }}>
              <div
                className="glass-panel animate-fade-in"
                style={{
                  padding: "1.8rem",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  border: "1px solid var(--border)",
                  background: "var(--glass-bg)"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = `0 8px 32px ${mod.color}33`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.2)";
                }}
              >
                <div>
                  <div style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "14px",
                    background: `${mod.color}22`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.8rem",
                    marginBottom: "1rem"
                  }}>
                    {mod.icon}
                  </div>
                  <h3 style={{
                    fontSize: "1.2rem",
                    marginBottom: "0.5rem",
                    color: "var(--text-main)",
                    fontWeight: "600"
                  }}>
                    {mod.title}
                  </h3>
                  <p style={{
                    color: "var(--text-muted)",
                    fontSize: "0.9rem",
                    lineHeight: "1.5"
                  }}>
                    {mod.description}
                  </p>
                </div>

                <div style={{
                  marginTop: "1.5rem",
                  padding: "0.5rem 1rem",
                  background: `${mod.color}22`,
                  color: mod.color,
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  textAlign: "center",
                  display: "inline-block",
                  width: "fit-content"
                }}>
                  Open Module →
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div style={{ marginTop: "3rem", textAlign: "center" }}>
          <Link href="/chat" className="btn btn-secondary">
            ← Back to Chat Workspace
          </Link>
        </div>
      </div>
    </div>
  );
}
