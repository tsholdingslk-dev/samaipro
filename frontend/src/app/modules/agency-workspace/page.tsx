"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Briefcase, Users, Shield, DollarSign, Bot, BookOpen, 
  ArrowLeft, CheckCircle2, Clock, Plus, Sparkles, Globe, 
  KeyRound, Award, Send, Lock, ChevronRight, Play, FileText,
  Smartphone, Database, Mic, Terminal, TrendingUp, Layers, Eye
} from 'lucide-react';

interface Job {
  id: string;
  title: string;
  category: string;
  moduleRequired: string;
  clientBudget: number; // e.g. $100
  workerPayout: number; // e.g. $40
  companyProfit: number; // e.g. $60
  status: 'open' | 'claimed' | 'completed' | 'paid';
  claimedBy?: string;
  deadline: string;
  description: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: 'Owner' | 'Manager' | 'Worker';
  email: string;
  jobsCompleted: number;
  earnings: number;
  status: 'active' | 'idle';
  modulesAllowed: string[];
}

const INITIAL_JOBS: Job[] = [
  {
    id: "JOB-101",
    title: "GCE A/L Physics 2025 Paper Translation (Tamil & Sinhala)",
    category: "Translation & Localization",
    moduleRequired: "PDF & Neural Translation Engine (/modules/pdf-translate)",
    clientBudget: 120,
    workerPayout: 45,
    companyProfit: 75,
    status: "open",
    deadline: "Today 6:00 PM",
    description: "Translate 28 pages of advanced level physics questions into academic Tamil and Sinhala terminology with preserved mathematical formulas."
  },
  {
    id: "JOB-102",
    title: "Vedic Kendare Birth Chart & 10-Porutham Matrimonial Report",
    category: "Vedic Astrology Studio",
    moduleRequired: "Astrology Studio & Kendare Engine (/modules/astrology-studio)",
    clientBudget: 150,
    workerPayout: 50,
    companyProfit: 100,
    status: "claimed",
    claimedBy: "Dinesh K. (Worker #3)",
    deadline: "Tomorrow 12:00 PM",
    description: "Generate traditional Sri Lankan Kendare chart, Vimshottari Mahadasha roadmap, and 10-Porutham compatibility analysis for wedding matchmaking."
  },
  {
    id: "JOB-103",
    title: "Flutter E-Commerce Mobile App UI Component Reconstruction",
    category: "Mobile App Development",
    moduleRequired: "Flutter AI Studio (/modules/flutter-studio)",
    clientBudget: 350,
    workerPayout: 140,
    companyProfit: 210,
    status: "open",
    deadline: "3 Days",
    description: "Build clean Dart/Flutter responsive screens for product catalog, checkout cart, and payment gateway integration."
  },
  {
    id: "JOB-104",
    title: "Commercial Voiceover & Dubbing for Real Estate Promo (3 Dialects)",
    category: "OmniVoice Neural Studio",
    moduleRequired: "Media & Voice Studio (/modules/media-voice-studio)",
    clientBudget: 90,
    workerPayout: 35,
    companyProfit: 55,
    status: "completed",
    claimedBy: "Sarah M. (Worker #1)",
    deadline: "Completed",
    description: "Produce natural studio-quality voiceover in English, Tamil, and Sinhala for a 90-second luxury apartment promo video."
  }
];

const INITIAL_TEAM: TeamMember[] = [
  { id: "USR-01", name: "Master Admin (You)", role: "Owner", email: "admin@samai.com", jobsCompleted: 42, earnings: 4850, status: "active", modulesAllowed: ["ALL_MODULES"] },
  { id: "USR-02", name: "Kavinda Perera", role: "Manager", email: "kavinda@samai.com", jobsCompleted: 18, earnings: 1420, status: "active", modulesAllowed: ["Translation", "Astrology", "Voice", "LeadGen"] },
  { id: "USR-03", name: "Priya Ramanathan", role: "Manager", email: "priya@samai.com", jobsCompleted: 22, earnings: 1780, status: "active", modulesAllowed: ["Flutter", "Coding", "APK-Decomp", "Media"] },
  { id: "USR-04", name: "Sarah M.", role: "Worker", email: "sarah.worker@samai.com", jobsCompleted: 14, earnings: 620, status: "active", modulesAllowed: ["Voice", "Media", "NewsFlash"] },
  { id: "USR-05", name: "Dinesh K.", role: "Worker", email: "dinesh.worker@samai.com", jobsCompleted: 11, earnings: 490, status: "active", modulesAllowed: ["Astrology", "PDF-Studio", "Translation"] },
  { id: "USR-06", name: "Suresh B.", role: "Worker", email: "suresh.worker@samai.com", jobsCompleted: 8, earnings: 380, status: "idle", modulesAllowed: ["Flutter", "Coding", "Web-Editor"] },
];

const MODULE_USER_MANUALS = [
  {
    id: "pdf-translate",
    name: "PDF & Neural Document Translation Engine",
    href: "/modules/pdf-translate",
    icon: FileText,
    category: "Translation & Documents",
    shortDesc: "High-accuracy document localization supporting English, Sinhala (සිංහල), and Tamil (தமிழ்).",
    howItWorks: [
      "1. Upload PDF, DOCX, or text files directly via the Upload button.",
      "2. The engine automatically extracts embedded text layers and formulas.",
      "3. Select Source Language ('Auto-Detect') and Target Language (Tamil / Sinhala / English).",
      "4. Click 'Translate Document' to generate real-time neural translation with chunking.",
      "5. Review side-by-side comparison, listen to audio pronunciation, and download the finalized translated document."
    ],
    monetizationGuide: {
      services: "Academic past paper translation, legal contracts, business invoices, medical summaries.",
      pricing: "$10 - $25 per document (or $0.05/word). A 20-page document can net $100-$200 in 15 minutes of work.",
      deliverables: "High-accuracy translated PDF/Word document with original formatting preserved."
    }
  },
  {
    id: "astrology-studio",
    name: "Astrology Studio & Kendare Engine",
    href: "/modules/astrology-studio",
    icon: Sparkles,
    category: "Vedic AI Intelligence",
    shortDesc: "Traditional Sri Lankan Kendare (කේන්ද්‍රය), Vedic Diamond Chart & South Indian 12-Rasi Grid with 10-Porutham Matcher.",
    howItWorks: [
      "1. Enter client's Full Name, Birth Date, Birth Time, and Birth City/Country.",
      "2. The Universal Keplerian Ephemeris Engine instantly computes planetary longitudes with Lahiri Ayanamsa precision.",
      "3. Toggle between Traditional Kendare Diamond Diagram and South Indian 12-Rasi Grid.",
      "4. Switch planetary symbols between Sinhala (🇱🇰), Tamil (🇮🇳), and English (🌐).",
      "5. Click any planet, house, or star for instant deep-dive psychological & remedial insights.",
      "6. Use 10-Porutham Matcher tab to compute marriage compatibility and Vedic remedies (Pariharams)."
    ],
    monetizationGuide: {
      services: "Personalized Kendare reports, Yearly Gocharam transit roadmaps, Matrimonial Porutham analysis, Auspicious Muhurtha consultation.",
      pricing: "$30 - $150 per horoscope report. Complete marriage matching package: $75 - $200.",
      deliverables: "Comprehensive 12-house Vedic analysis PDF report with auspicious gemstones & mantras."
    }
  },
  {
    id: "flutter-studio",
    name: "Flutter AI Studio & App Reconstructor",
    href: "/modules/flutter-studio",
    icon: Smartphone,
    category: "Mobile App Development",
    shortDesc: "Compliance-First Visual Code Editor & App Reconstruction Engine.",
    howItWorks: [
      "1. Enter app requirements or paste Figma/Wireframe component ideas.",
      "2. The AI generates clean, responsive Flutter Dart code with full Material 3 compliance.",
      "3. Live Preview renders mobile screens in real time with interactive buttons.",
      "4. Inspect widget trees, state management (Bloc/Provider), and export ready-to-run `.dart` files."
    ],
    monetizationGuide: {
      services: "Custom mobile app prototyping, converting Figma designs to Flutter, creating MVP mobile apps for startups.",
      pricing: "$150 - $1,500 per mobile screen set / MVP app.",
      deliverables: "Complete Flutter project zip file ready for Android Studio / VS Code."
    }
  },
  {
    id: "media-voice-studio",
    name: "Media & OmniVoice Neural Studio",
    href: "/modules/media-voice-studio",
    icon: Mic,
    category: "Media & Voice Synthesis",
    shortDesc: "OmniVoice AI TTS and Universal video/media content generators.",
    howItWorks: [
      "1. Select target dialect (English, Tamil, Sinhala) and voice timbre (Male/Female, Professional, Storyteller).",
      "2. Input the script or generate it using built-in AI copywriting tools.",
      "3. Adjust pitch, pacing, and emotional warmth.",
      "4. Generate and download broadcast-ready MP3/WAV voiceovers."
    ],
    monetizationGuide: {
      services: "YouTube video narration, radio/TikTok commercial ads, audiobooks, e-learning courses.",
      pricing: "$50 - $250 per 5-minute audio voiceover.",
      deliverables: "Crystal-clear studio-grade 320kbps audio files."
    }
  },
  {
    id: "lead-gen",
    name: "Lead Generation & Client Outreach Hub",
    href: "/modules/lead-gen",
    icon: Briefcase,
    category: "Business & Client Acquisition",
    shortDesc: "Extract local business leads, auto-create demo sites & WhatsApp proposals.",
    howItWorks: [
      "1. Select target city (e.g. Colombo, Jaffna, London, Dubai) and business niche (Restaurants, Clinics, Real Estate).",
      "2. Extract verified WhatsApp numbers, emails, and website status.",
      "3. Auto-generate customized client pitch decks and live demo websites in 1-click.",
      "4. Send automated high-converting WhatsApp proposals to close high-ticket clients."
    ],
    monetizationGuide: {
      services: "B2B client acquisition for web design, marketing automation, digital transformation.",
      pricing: "Close 2-5 clients per week at $300 - $1,000 per website or AI automation setup.",
      deliverables: "Turnkey business websites and automation pipelines."
    }
  },
  {
    id: "apk-decomp",
    name: "AtoZ-DecompEngine & Security Audit",
    href: "/modules/apk-decomp",
    icon: Shield,
    category: "Developer & Security Tools",
    shortDesc: "Upload APKs, Auto-Decompile, Security Audit, and Generate Reverse Engineering Reports.",
    howItWorks: [
      "1. Upload any Android APK or AAB file.",
      "2. The engine parses DEX bytecode, manifests, activities, and API endpoints.",
      "3. Auto-generates comprehensive security vulnerability and architecture reports."
    ],
    monetizationGuide: {
      services: "App security auditing, bug bounty research, legacy app code recovery.",
      pricing: "$200 - $800 per security audit report.",
      deliverables: "Formal penetration test & vulnerability audit PDF."
    }
  }
];

export default function AgencyWorkspace() {
  const [activeTab, setActiveTab] = useState<'bidding' | 'team' | 'proxy' | 'manuals' | 'stealth'>('bidding');
  const [jobs, setJobs] = useState<Job[]>(INITIAL_JOBS);
  const [team, setTeam] = useState<TeamMember[]>(INITIAL_TEAM);
  const [selectedManual, setSelectedManual] = useState<any>(MODULE_USER_MANUALS[0]);
  
  // Proxy Chat Simulator State
  const [clientMsg, setClientMsg] = useState("Hi, I need a complete 2025 Physics Past Paper translated from English to Tamil and Sinhala by tonight. How much will it cost?");
  const [proxyLogs, setProxyLogs] = useState<string[]>([
    "🤖 [SAM AI Firewall]: Client connected via WhatsApp Gateway.",
    "🛡️ [Proxy Relay]: Client identity masked. Direct worker contact prevented.",
    "💰 [Escrow Engine]: Client Quote: $120 USD · Worker Task Posted: $45 Payout · Profit Locked: $75 USD."
  ]);

  const handleClaimJob = (jobId: string) => {
    setJobs(prev => prev.map(j => {
      if (j.id === jobId) {
        return { ...j, status: 'claimed', claimedBy: 'Current User (Staff)' };
      }
      return j;
    }));
  };

  const handleCompleteJob = (jobId: string) => {
    setJobs(prev => prev.map(j => {
      if (j.id === jobId) {
        return { ...j, status: 'completed' };
      }
      return j;
    }));
  };

  // Metrics Calculation
  const totalClientRevenue = jobs.reduce((acc, j) => acc + j.clientBudget, 0);
  const totalWorkerPayouts = jobs.reduce((acc, j) => acc + j.workerPayout, 0);
  const totalCompanyProfit = jobs.reduce((acc, j) => acc + j.companyProfit, 0);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(to bottom right, #090a12, #0e121f)", color: "#f3f4f6", padding: "2.5rem 2rem", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: "1350px", margin: "0 auto" }}>
        
        {/* Top Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <Link href="/modules" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#9ca3af", textDecoration: "none", fontSize: "0.85rem", marginBottom: "0.6rem", padding: "4px 10px", borderRadius: "6px", background: "rgba(255,255,255,0.05)" }}>
              <ArrowLeft size={14} /> Back to Modules
            </Link>
            <h1 style={{ fontSize: "2.3rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "0.8rem", background: "linear-gradient(135deg, #ec4899, #8b5cf6, #3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              <Briefcase size={34} color="#ec4899" />
              SAM AI Enterprise Agency & Task Marketplace
            </h1>
            <p style={{ color: "#9ca3af", fontSize: "0.95rem", marginTop: "0.4rem" }}>
              Multi-tier team management, $100 vs $40 task bidding engine, client AI proxy firewall & A-to-Z module blueprints.
            </p>
          </div>

          {/* Tab Navigation */}
          <div style={{ display: "flex", gap: "6px", background: "rgba(255,255,255,0.04)", padding: "4px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", flexWrap: "wrap" }}>
            {[
              { id: 'bidding', label: '💼 Job Marketplace', icon: DollarSign },
              { id: 'team', label: '👥 Team & RBAC', icon: Users },
              { id: 'proxy', label: '🤖 Client AI Proxy', icon: Bot },
              { id: 'manuals', label: '📚 A-to-Z User Manuals', icon: BookOpen },
              { id: 'stealth', label: '🌐 Stealth & API Gateway', icon: Globe },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  background: activeTab === t.id ? "linear-gradient(135deg, #ec4899, #8b5cf6)" : "transparent",
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

        {/* ── METRIC CARDS OVERVIEW ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          <div style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(236,72,153,0.3)", borderRadius: "16px", padding: "1.2rem" }}>
            <div style={{ fontSize: "0.75rem", color: "#9ca3af", textTransform: "uppercase" }}>Total Client Invoices ($100 Model)</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#fff", marginTop: "4px" }}>${totalClientRevenue}.00</div>
            <div style={{ fontSize: "0.75rem", color: "#10b981", marginTop: "2px" }}>4 Active Client Projects</div>
          </div>

          <div style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: "16px", padding: "1.2rem" }}>
            <div style={{ fontSize: "0.75rem", color: "#9ca3af", textTransform: "uppercase" }}>Worker Task Payouts ($40 Model)</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#60a5fa", marginTop: "4px" }}>${totalWorkerPayouts}.00</div>
            <div style={{ fontSize: "0.75rem", color: "#93c5fd", marginTop: "2px" }}>Direct Staff Remuneration</div>
          </div>

          <div style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "16px", padding: "1.2rem" }}>
            <div style={{ fontSize: "0.75rem", color: "#9ca3af", textTransform: "uppercase" }}>Net Agency Profit (Retained)</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#10b981", marginTop: "4px" }}>${totalCompanyProfit}.00</div>
            <div style={{ fontSize: "0.75rem", color: "#a7f3d0", marginTop: "2px" }}>60% Gross Margin</div>
          </div>

          <div style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: "16px", padding: "1.2rem" }}>
            <div style={{ fontSize: "0.75rem", color: "#9ca3af", textTransform: "uppercase" }}>Active Team & Workers</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#c084fc", marginTop: "4px" }}>{team.length} Members</div>
            <div style={{ fontSize: "0.75rem", color: "#ddd6fe", marginTop: "2px" }}>1 Owner · 2 Managers · 3 Workers</div>
          </div>
        </div>

        {/* ── TAB 1: TASK & JOB BIDDING MARKETPLACE ── */}
        {activeTab === 'bidding' && (
          <div style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <h2 style={{ fontSize: "1.3rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                  <DollarSign size={20} color="#10b981" /> Live Client Project Bidding Feed
                </h2>
                <p style={{ color: "#9ca3af", fontSize: "0.85rem", margin: "4px 0 0 0" }}>
                  Staff and workers can claim open jobs, execute them using built-in SAM AI studios, and submit deliverable solutions.
                </p>
              </div>
              
              <button
                onClick={() => alert("New Client Job Poster: Create client tickets with auto-split pricing ($100 client -> $40 worker payout).")}
                style={{ background: "linear-gradient(135deg, #ec4899, #8b5cf6)", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "10px", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
              >
                <Plus size={16} /> Post New Client Job
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {jobs.map(job => (
                <div key={job.id} style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", padding: "1.4rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1.2rem" }}>
                  <div style={{ flex: "1 1 500px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.4rem" }}>
                      <span style={{ fontSize: "0.75rem", padding: "2px 8px", borderRadius: "6px", background: "rgba(139,92,246,0.15)", color: "#c084fc", fontWeight: 700 }}>
                        {job.id}
                      </span>
                      <span style={{ fontSize: "0.75rem", padding: "2px 8px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", color: "#9ca3af" }}>
                        {job.category}
                      </span>
                      <span style={{ fontSize: "0.75rem", padding: "2px 8px", borderRadius: "6px", background: job.status === 'open' ? "rgba(16,185,129,0.15)" : (job.status === 'claimed' ? "rgba(245,158,11,0.15)" : "rgba(59,130,246,0.15)"), color: job.status === 'open' ? "#10b981" : (job.status === 'claimed' ? "#f59e0b" : "#60a5fa"), fontWeight: 700 }}>
                        ● {job.status.toUpperCase()}
                      </span>
                    </div>

                    <h3 style={{ margin: "0 0 0.4rem 0", fontSize: "1.1rem", fontWeight: 700, color: "#fff" }}>
                      {job.title}
                    </h3>
                    <p style={{ margin: "0 0 0.6rem 0", color: "#9ca3af", fontSize: "0.85rem", lineHeight: 1.5 }}>
                      {job.description}
                    </p>

                    <div style={{ fontSize: "0.75rem", color: "#818cf8", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Layers size={14} /> Required Studio: <strong>{job.moduleRequired}</strong>
                    </div>
                  </div>

                  {/* Financial Breakdown & Action */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                    <div style={{ display: "flex", gap: "12px", background: "rgba(255,255,255,0.03)", padding: "8px 14px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)", textAlign: "right" }}>
                      <div>
                        <div style={{ fontSize: "0.7rem", color: "#9ca3af" }}>Client Charge</div>
                        <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#fff" }}>${job.clientBudget}</div>
                      </div>
                      <div style={{ borderLeft: "1px solid rgba(255,255,255,0.1)", paddingLeft: "10px" }}>
                        <div style={{ fontSize: "0.7rem", color: "#60a5fa" }}>Worker Payout</div>
                        <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#60a5fa" }}>${job.workerPayout}</div>
                      </div>
                      <div style={{ borderLeft: "1px solid rgba(255,255,255,0.1)", paddingLeft: "10px" }}>
                        <div style={{ fontSize: "0.7rem", color: "#10b981" }}>Agency Profit</div>
                        <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#10b981" }}>+${job.companyProfit}</div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      {job.status === 'open' && (
                        <button
                          onClick={() => handleClaimJob(job.id)}
                          style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff", border: "none", padding: "6px 16px", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer" }}
                        >
                          Claim Job (${job.workerPayout})
                        </button>
                      )}

                      {job.status === 'claimed' && (
                        <button
                          onClick={() => handleCompleteJob(job.id)}
                          style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff", border: "none", padding: "6px 16px", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer" }}
                        >
                          Submit Solution ✓
                        </button>
                      )}

                      {job.status === 'completed' && (
                        <span style={{ fontSize: "0.8rem", color: "#10b981", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
                          <CheckCircle2 size={16} /> Delivered to Client
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 2: MULTI-TIER TEAM & RBAC MANAGEMENT ── */}
        {activeTab === 'team' && (
          <div style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "2rem" }}>
            <div style={{ marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <Users size={20} color="#c084fc" /> Agency Staff & Role-Based Access Control (RBAC)
              </h2>
              <p style={{ color: "#9ca3af", fontSize: "0.85rem", margin: "4px 0 0 0" }}>
                10 Staff members and 4 Managers operate inside SAM AI without external AI subscriptions. Admin controls module visibility per role.
              </p>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "rgba(0,0,0,0.4)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    <th style={{ padding: "12px 16px", fontSize: "0.8rem", color: "#9ca3af", textTransform: "uppercase" }}>Member / Email</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.8rem", color: "#9ca3af", textTransform: "uppercase" }}>Role</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.8rem", color: "#9ca3af", textTransform: "uppercase" }}>Allowed Studios</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.8rem", color: "#9ca3af", textTransform: "uppercase" }}>Jobs Done</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.8rem", color: "#9ca3af", textTransform: "uppercase" }}>Total Earnings</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.8rem", color: "#9ca3af", textTransform: "uppercase" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {team.map((member) => (
                    <tr key={member.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 700, color: "#fff" }}>{member.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{member.email}</div>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ fontSize: "0.75rem", padding: "3px 10px", borderRadius: "8px", background: member.role === 'Owner' ? "rgba(236,72,153,0.2)" : (member.role === 'Manager' ? "rgba(139,92,246,0.2)" : "rgba(59,130,246,0.2)"), color: member.role === 'Owner' ? "#f472b6" : (member.role === 'Manager' ? "#c084fc" : "#60a5fa"), fontWeight: 700 }}>
                          {member.role}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: "0.8rem", color: "#d1d5db" }}>
                        {member.modulesAllowed.join(", ")}
                      </td>
                      <td style={{ padding: "14px 16px", fontWeight: 700, color: "#fff" }}>
                        {member.jobsCompleted}
                      </td>
                      <td style={{ padding: "14px 16px", fontWeight: 800, color: "#10b981" }}>
                        ${member.earnings}.00
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ fontSize: "0.75rem", color: member.status === 'active' ? "#10b981" : "#9ca3af", fontWeight: 600 }}>
                          ● {member.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 3: CLIENT-WORKER AI PROXY FIREWALL ── */}
        {activeTab === 'proxy' && (
          <div style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "2rem" }}>
            <div style={{ marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <Bot size={20} color="#06b6d4" /> Client-Worker Anonymous AI Proxy & Firewall
              </h2>
              <p style={{ color: "#9ca3af", fontSize: "0.85rem", margin: "4px 0 0 0" }}>
                Clients interact exclusively with the SAM AI Chatbot. The Chatbot filters requirements, posts anonymous worker tickets, and delivers finished solutions back to the client.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
              {/* Left: Client Chat Window (Simulated) */}
              <div style={{ background: "#0a0c16", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", padding: "1.2rem", display: "flex", flexDirection: "column", height: "380px", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "0.6rem", marginBottom: "0.8rem" }}>
                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#10b981" }} />
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff" }}>Client Chat Interface (WhatsApp / Web)</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ background: "rgba(255,255,255,0.05)", padding: "8px 12px", borderRadius: "10px", fontSize: "0.82rem", color: "#e5e7eb", alignSelf: "flex-start", maxWidth: "85%" }}>
                      {clientMsg}
                    </div>
                    <div style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(236,72,153,0.2))", border: "1px solid rgba(139,92,246,0.3)", padding: "8px 12px", borderRadius: "10px", fontSize: "0.82rem", color: "#fff", alignSelf: "flex-end", maxWidth: "85%" }}>
                      🤖 Hello! Your request has been scheduled with priority. Estimated cost: $120 USD. Turnaround time: 4 hours.
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    value={clientMsg}
                    onChange={e => setClientMsg(e.target.value)}
                    style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "8px", color: "#fff", fontSize: "0.8rem", outline: "none" }}
                  />
                  <button style={{ background: "#8b5cf6", color: "#fff", border: "none", padding: "8px 14px", borderRadius: "8px", cursor: "pointer" }}>
                    <Send size={14} />
                  </button>
                </div>
              </div>

              {/* Right: AI Firewall & Proxy Engine Logs */}
              <div style={{ background: "#0a0c16", border: "1px solid rgba(6,182,212,0.2)", borderRadius: "16px", padding: "1.2rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "0.6rem", marginBottom: "0.8rem" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#06b6d4" }}>🛡️ Live AI Firewall Relay Stream</span>
                    <span style={{ fontSize: "0.72rem", color: "#10b981", fontWeight: 700 }}>● SECURE ACTIVE</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontFamily: "monospace", fontSize: "0.75rem", color: "#9ca3af" }}>
                    {proxyLogs.map((log, idx) => (
                      <div key={idx} style={{ background: "rgba(255,255,255,0.02)", padding: "6px 8px", borderRadius: "6px" }}>
                        {log}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", padding: "10px", borderRadius: "10px", fontSize: "0.78rem", color: "#a7f3d0" }}>
                  🔒 <strong>Client Shield Active:</strong> Worker IP and contact info are 100% anonymized. All project deliverables pass through the SAM AI Quality Inspector before client release.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: A-TO-Z INTERACTIVE MODULE USER MANUALS & MONETIZATION BLUEPRINTS ── */}
        {activeTab === 'manuals' && (
          <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "1.8rem" }}>
            
            {/* Left: Module List Selector */}
            <div style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#fff", marginBottom: "0.6rem" }}>
                📚 A-to-Z Module Blueprints
              </div>

              {MODULE_USER_MANUALS.map(m => (
                <button
                  key={m.id}
                  onClick={() => setSelectedManual(m)}
                  style={{
                    display: "flex", alignItems: "center", gap: "10px", textAlign: "left",
                    background: selectedManual.id === m.id ? "linear-gradient(135deg, rgba(236,72,153,0.15), rgba(139,92,246,0.15))" : "rgba(255,255,255,0.02)",
                    border: selectedManual.id === m.id ? "1px solid #c084fc" : "1px solid rgba(255,255,255,0.06)",
                    padding: "10px 12px", borderRadius: "12px", color: selectedManual.id === m.id ? "#fff" : "#9ca3af",
                    cursor: "pointer", transition: "all 0.2s"
                  }}
                >
                  <m.icon size={18} color={selectedManual.id === m.id ? "#ec4899" : "#a78bfa"} />
                  <div style={{ fontSize: "0.82rem", fontWeight: 700 }}>{m.name}</div>
                </button>
              ))}
            </div>

            {/* Right: Selected Manual Full Detail & Monetization Guide */}
            {selectedManual && (
              <div style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <span style={{ fontSize: "0.75rem", padding: "2px 8px", borderRadius: "6px", background: "rgba(139,92,246,0.15)", color: "#c084fc", fontWeight: 700 }}>
                      {selectedManual.category}
                    </span>
                    <h2 style={{ margin: "6px 0 4px 0", fontSize: "1.4rem", fontWeight: 800, color: "#fff" }}>
                      {selectedManual.name}
                    </h2>
                    <p style={{ margin: 0, color: "#9ca3af", fontSize: "0.88rem" }}>
                      {selectedManual.shortDesc}
                    </p>
                  </div>

                  <Link
                    href={selectedManual.href}
                    style={{ background: "linear-gradient(135deg, #8b5cf6, #ec4899)", color: "#fff", textDecoration: "none", padding: "8px 18px", borderRadius: "10px", fontSize: "0.85rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "6px" }}
                  >
                    <Play size={14} fill="#fff" /> Open Live Studio
                  </Link>
                </div>

                {/* Step-by-Step A-to-Z Instructions */}
                <div style={{ background: "rgba(0,0,0,0.35)", padding: "1.4rem", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <h3 style={{ margin: "0 0 0.8rem 0", fontSize: "1rem", fontWeight: 700, color: "#818cf8", display: "flex", alignItems: "center", gap: "6px" }}>
                    <BookOpen size={16} /> Step-by-Step A-to-Z Operational Guide
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {selectedManual.howItWorks.map((step: string, i: number) => (
                      <div key={i} style={{ fontSize: "0.85rem", color: "#d1d5db", lineHeight: 1.5, background: "rgba(255,255,255,0.02)", padding: "8px 12px", borderRadius: "8px" }}>
                        {step}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Monetization & Client Pricing Strategy */}
                <div style={{ background: "rgba(16,185,129,0.08)", padding: "1.4rem", borderRadius: "16px", border: "1px solid rgba(16,185,129,0.25)" }}>
                  <h3 style={{ margin: "0 0 0.8rem 0", fontSize: "1rem", fontWeight: 700, color: "#10b981", display: "flex", alignItems: "center", gap: "6px" }}>
                    <DollarSign size={16} /> Client Services & Monetization Strategy (How to Earn Money)
                  </h3>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "#9ca3af", textTransform: "uppercase" }}>Recommended Client Services:</div>
                      <div style={{ fontSize: "0.85rem", color: "#fff", fontWeight: 600, marginTop: "2px" }}>
                        {selectedManual.monetizationGuide.services}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: "0.75rem", color: "#9ca3af", textTransform: "uppercase" }}>Suggested Client Pricing:</div>
                      <div style={{ fontSize: "0.95rem", color: "#10b981", fontWeight: 800, marginTop: "2px" }}>
                        {selectedManual.monetizationGuide.pricing}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: "1rem", borderTop: "1px solid rgba(16,185,129,0.2)", paddingTop: "0.8rem", fontSize: "0.8rem", color: "#a7f3d0" }}>
                    📦 <strong>Deliverable Checklist:</strong> {selectedManual.monetizationGuide.deliverables}
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

        {/* ── TAB 5: STEALTH DOMAIN & CENTRAL API KEY GATEWAY ── */}
        {activeTab === 'stealth' && (
          <div style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "2rem" }}>
            <div style={{ marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <Globe size={20} color="#3b82f6" /> Custom Domain Stealth Layer & Centralized API Key Gateway
              </h2>
              <p style={{ color: "#9ca3af", fontSize: "0.85rem", margin: "4px 0 0 0" }}>
                Bind your primary domain (`samai.com`) to Vercel/Railway seamlessly without revealing backend mechanics or handling 100 API keys manually.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
              
              {/* Custom Domain Stealth Guide */}
              <div style={{ background: "#0a0c16", padding: "1.4rem", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.08)" }}>
                <h3 style={{ margin: "0 0 0.8rem 0", fontSize: "1rem", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: "6px" }}>
                  🌐 Custom Domain Binding (`samai.com`)
                </h3>
                <p style={{ color: "#9ca3af", fontSize: "0.82rem", lineHeight: 1.5 }}>
                  1. In your Domain Registrar (Namecheap, Cloudflare, GoDaddy), add a <strong>CNAME Record</strong> pointing `@` and `www` to `cname.vercel-dns.com`.
                </p>
                <p style={{ color: "#9ca3af", fontSize: "0.82rem", lineHeight: 1.5 }}>
                  2. In Vercel Project Settings ➔ <strong>Domains</strong>, enter `samai.com`. SSL and HTTPS are issued automatically.
                </p>
                <p style={{ color: "#9ca3af", fontSize: "0.82rem", lineHeight: 1.5 }}>
                  3. Customers only see `samai.com`. All Vercel serverless functions and Railway WebSocket relays execute in stealth mode.
                </p>
              </div>

              {/* Central Master API Key Gateway */}
              <div style={{ background: "#0a0c16", padding: "1.4rem", borderRadius: "16px", border: "1px solid rgba(234,179,8,0.25)" }}>
                <h3 style={{ margin: "0 0 0.8rem 0", fontSize: "1rem", fontWeight: 700, color: "#eab308", display: "flex", alignItems: "center", gap: "6px" }}>
                  🔑 Multi-Key Auto Rotator (`api-hub`)
                </h3>
                <p style={{ color: "#9ca3af", fontSize: "0.82rem", lineHeight: 1.5 }}>
                  1. Store all your backup keys in <strong>Multi-API Provider Hub</strong> (`/modules/api-hub`): 5 Gemini Keys, 5 Groq Keys, 5 OpenRouter Keys.
                </p>
                <p style={{ color: "#9ca3af", fontSize: "0.82rem", lineHeight: 1.5 }}>
                  2. The system automatically performs round-robin load balancing and instant failover whenever a provider rate-limits.
                </p>
                <p style={{ color: "#9ca3af", fontSize: "0.82rem", lineHeight: 1.5 }}>
                  3. Railway and Vercel only communicate with this single Gateway endpoint — eliminating manual key configuration hassles!
                </p>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
