"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Flame, TrendingUp, Clock, Eye, MessageSquare, Share2, 
  Tv, Radio, Globe, Calendar, CloudSun, DollarSign, 
  ChevronRight, Volume2, Search, Menu, X, ArrowLeft
} from 'lucide-react';

export default function ChudarMediaDemo() {
  const [activeTab, setActiveTab] = useState("all");
  const [currentDate, setCurrentDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setCurrentDate(now.toLocaleDateString('ta-LK', options));
  }, []);

  const newsCategories = [
    { id: "all", label: "முகப்பு" },
    { id: "srilanka", label: "இலங்கை" },
    { id: "world", label: "சர்வதேசம்" },
    { id: "politics", label: "அரசியல்" },
    { id: "business", label: "வணிகம்" },
    { id: "cinema", label: "சினிமா" },
    { id: "sports", label: "விளையாட்டு" },
    { id: "tech", label: "தொழில்நுட்பம்" },
  ];

  const newsItems = [
    {
      id: 1,
      title: "மத்திய வங்கி அறிவித்த புதிய பணவீக்கக் கட்டுப்பாட்டு நடைமுறைகள்: வர்த்தகர்கள் வரவேற்பு",
      category: "பொருளாதாரம்",
      tagColor: "#2563eb",
      time: "1 மணி நேரத்திற்கு முன்",
      views: "2.4k",
      comments: 18,
      image: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=600&q=80"
    },
    {
      id: 2,
      title: "பாராளுமன்றத்தில் அடுத்த வார விவாதத்திற்கு வரவுள்ள புதிய தேசிய கொள்கை வரைவு",
      category: "அரசியல்",
      tagColor: "#7c3aed",
      time: "2 மணி நேரத்திற்கு முன்",
      views: "4.1k",
      comments: 24,
      image: "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=600&q=80"
    },
    {
      id: 3,
      title: "இலங்கையில் அறிமுகமாகியுள்ள அதிநவீன AI தொழில்நுட்ப செயலிகள்: புதிய டிஜிட்டல் புரட்சி",
      category: "தொழில்நுட்பம்",
      tagColor: "#059669",
      time: "3 மணி நேரத்திற்கு முன்",
      views: "5.8k",
      comments: 42,
      image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80"
    },
    {
      id: 4,
      title: "இலங்கை - அவுஸ்திரேலியா மோதும் இறுதிப் போட்டி: அணியில் அதிரடி மாற்றங்கள் அறிவிப்பு",
      category: "விளையாட்டு",
      tagColor: "#ea580c",
      time: "4 மணி நேரத்திற்கு முன்",
      views: "8.2k",
      comments: 85,
      image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=600&q=80"
    }
  ];

  const trendingNews = [
    { num: "01", title: "காலி மற்றும் கொழும்பில் விசேட பாதுகாப்பு சோதனைகள் தீவிரம்" },
    { num: "02", title: "தங்கத்தின் விலை கிராமிற்கு ரூ. 1,200 குறைவடைந்தது: நகைக்கடைகளில் கூட்டம்" },
    { num: "03", title: "வெளிநாட்டு வேலைவாய்ப்புகளுக்கான புதிய அரசு பதிவுத் திட்டம் ஆரம்பம்" },
    { num: "04", title: "பிரபல திரைப்பட இயக்குனரின் புதிய மெகா பட்ஜெட் திரைப்படம் வெளியீடு" }
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0b0f19", color: "#f8fafc", fontFamily: "'Mukta Malar', system-ui, sans-serif" }}>
      
      {/* ── TOP UTILITY BAR ── */}
      <div style={{ background: "#060911", padding: "6px 20px", fontSize: "0.82rem", color: "#94a3b8", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.06)", flexWrap: "wrap", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <span>📅 {currentDate || "சனிக்கிழமை, 29 ஆகஸ்ட் 2026"}</span>
          <span>📍 இலங்கை & சர்வதேச பதிப்பு</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <Link href="/modules/automation-hub" style={{ color: "#ec4899", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px", fontWeight: 700 }}>
            <ArrowLeft size={14} /> Back to SAM AI Automation
          </Link>
          <span>⚡ சுடர் மீடியா பிரத்யேக டிஜிட்டல் செய்தி தளம்</span>
        </div>
      </div>

      {/* ── MAIN HEADER ── */}
      <header style={{ background: "linear-gradient(180deg, #131b2e 0%, #0b0f19 100%)", padding: "16px 20px", borderBottom: "3px solid #dc2626" }}>
        <div style={{ maxWidth: "1250px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px" }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "48px", height: "48px", background: "linear-gradient(135deg, #dc2626, #f59e0b)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem", boxShadow: "0 0 20px rgba(220, 38, 38, 0.5)" }}>
              🔥
            </div>
            <div>
              <h1 style={{ fontSize: "2rem", fontWeight: 900, color: "#fff", letterSpacing: "-0.5px", margin: 0, lineHeight: 1.1 }}>
                சுடர் <span style={{ color: "#dc2626" }}>மீடியா</span>
              </h1>
              <p style={{ fontSize: "0.72rem", color: "#f59e0b", letterSpacing: "1.5px", textTransform: "uppercase", fontWeight: 700, margin: "2px 0 0 0" }}>
                CHUDAR MEDIA • 24/7 LIVE NEWS PORTAL
              </p>
            </div>
          </div>

          {/* Live Colombo Weather & Exchange Widget */}
          <div style={{ display: "flex", gap: "12px", fontSize: "0.8rem", color: "#cbd5e1" }}>
            <div style={{ background: "rgba(255,255,255,0.05)", padding: "8px 14px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: "6px" }}>
              <CloudSun size={16} color="#f59e0b" /> கொழும்பு: <strong>31°C</strong>
            </div>
            <div style={{ background: "rgba(255,255,255,0.05)", padding: "8px 14px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: "6px" }}>
              <DollarSign size={16} color="#10b981" /> USD/LKR: <strong>302.50</strong>
            </div>
          </div>

        </div>
      </header>

      {/* ── BREAKING NEWS TICKER ── */}
      <div style={{ background: "#991b1b", display: "flex", alignItems: "center", height: "40px", overflow: "hidden" }}>
        <div style={{ background: "#dc2626", color: "#fff", fontWeight: 800, padding: "0 18px", height: "100%", display: "flex", alignItems: "center", fontSize: "0.85rem", whiteSpace: "nowrap", zIndex: 2, boxShadow: "4px 0 10px rgba(0,0,0,0.3)" }}>
          🔴 முக்கிய செய்திகள்
        </div>
        <div style={{ display: "inline-block", whiteSpace: "nowrap", paddingLeft: "100%", animation: "ticker 30s linear infinite", fontSize: "0.88rem", color: "#fff", fontWeight: 600 }}>
          இலங்கையில் புதிய பொருளாதார மறுசீரமைப்பு திட்டங்களுக்கு பாராளுமன்றத்தில் அனுமதி • மத்திய வங்கியின் புதிய வட்டி விகித அறிவிப்பு வெளியானது • உலக சந்தையில் தங்கத்தின் விலையில் அதிரடி மாற்றம் • உலகக் கிண்ண கிரிக்கெட் தகுதிச் சுற்றுப் போட்டியில் இலங்கை அணி அபார வெற்றி!
        </div>
        <style>{`
          @keyframes ticker {
            0% { transform: translate3d(0, 0, 0); }
            100% { transform: translate3d(-100%, 0, 0); }
          }
        `}</style>
      </div>

      {/* ── NAVIGATION MENU BAR ── */}
      <nav style={{ background: "#131a2a", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ maxWidth: "1250px", margin: "0 auto", display: "flex", gap: "4px", overflowX: "auto", padding: "0 15px" }}>
          {newsCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              style={{
                padding: "12px 18px",
                color: activeTab === cat.id ? "#fff" : "#cbd5e1",
                background: activeTab === cat.id ? "rgba(220, 38, 38, 0.2)" : "transparent",
                border: "none",
                borderBottom: `3px solid ${activeTab === cat.id ? "#dc2626" : "transparent"}`,
                fontSize: "0.95rem",
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.2s"
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </nav>

      {/* ── MAIN CONTENT CONTAINER ── */}
      <div style={{ maxWidth: "1250px", margin: "25px auto", padding: "0 15px", display: "grid", gridTemplateColumns: "2.3fr 1fr", gap: "25px" }}>
        
        {/* Left Column: News Stream */}
        <main>
          
          {/* Lead Hero Featured News */}
          <article style={{ background: "#131b2e", borderRadius: "16px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", marginBottom: "25px", position: "relative" }}>
            <div style={{ width: "100%", height: "380px", background: "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(11,15,25,0.95) 100%), url('https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80') center/cover", display: "flex", alignItems: "flex-end", padding: "25px" }}>
              <div>
                <span style={{ background: "#dc2626", color: "#fff", padding: "4px 12px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: 800, display: "inline-block", marginBottom: "10px" }}>
                  🔴 விசேட பிரேக்கிங் செய்தி
                </span>
                <h2 style={{ fontSize: "1.7rem", fontWeight: 800, color: "#fff", lineHeight: 1.3, marginBottom: "10px", textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}>
                  இலங்கை பொருளாதார மீட்சி மற்றும் புதிய வெளிநாட்டு நேரடி முதலீடுகளுக்கான சர்வதேச ஒப்பந்தம் கையெழுத்தானது!
                </h2>
                <div style={{ fontSize: "0.82rem", color: "#cbd5e1", display: "flex", gap: "15px" }}>
                  <span>✍️ சுடர் செய்திப் பிரிவு</span>
                  <span>⏱️ 15 நிமிடங்களுக்கு முன்</span>
                  <span>👁️ 4.2k பார்வைகள்</span>
                </div>
              </div>
            </div>
          </article>

          {/* News Cards Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
            {newsItems.map(item => (
              <div key={item.id} style={{ background: "#131b2e", borderRadius: "14px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column" }}>
                <img src={item.image} alt={item.title} style={{ width: "100%", height: "170px", objectFit: "cover" }} />
                <div style={{ padding: "15px", display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
                  <div>
                    <span style={{ background: item.tagColor, color: "#fff", padding: "2px 8px", borderRadius: "6px", fontSize: "0.72rem", fontWeight: 800, display: "inline-block", marginBottom: "8px" }}>
                      {item.category}
                    </span>
                    <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#f1f5f9", lineHeight: 1.4, margin: "0 0 10px 0" }}>
                      {item.title}
                    </h3>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8", display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "8px" }}>
                    <span>⏱️ {item.time}</span>
                    <span>💬 {item.comments}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </main>

        {/* Right Column: Trending Sidebar */}
        <aside>
          
          {/* Trending News Widget */}
          <div style={{ background: "#131b2e", borderRadius: "16px", padding: "20px", border: "1px solid rgba(255,255,255,0.08)", marginBottom: "25px" }}>
            <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#fff", borderLeft: "4px solid #dc2626", paddingLeft: "10px", marginBottom: "15px" }}>
              🔥 அதிகம் பேர் படித்தவை
            </div>

            {trendingNews.map((t, idx) => (
              <div key={idx} style={{ display: "flex", gap: "12px", padding: "12px 0", borderBottom: idx !== trendingNews.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#dc2626", lineHeight: 1 }}>{t.num}</div>
                <div>
                  <h4 style={{ fontSize: "0.88rem", fontWeight: 700, color: "#e2e8f0", lineHeight: 1.3, margin: 0 }}>
                    {t.title}
                  </h4>
                </div>
              </div>
            ))}
          </div>

          {/* Live Video Widget */}
          <div style={{ background: "#131b2e", borderRadius: "16px", padding: "20px", border: "1px solid rgba(255,255,255,0.08)", marginBottom: "25px" }}>
            <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#fff", borderLeft: "4px solid #dc2626", paddingLeft: "10px", marginBottom: "15px" }}>
              📺 சுடர் நேரலை ஒளிபரப்பு
            </div>
            <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden", borderRadius: "12px", background: "#000" }}>
              <iframe 
                src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ" 
                title="Chudar Media Live" 
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }}
                allowFullScreen
              />
            </div>
          </div>

          {/* Telegram Banner */}
          <div style={{ background: "linear-gradient(135deg, rgba(220,38,38,0.25), rgba(19,27,46,0.9))", border: "1px solid rgba(220,38,38,0.3)", borderRadius: "16px", padding: "20px" }}>
            <h4 style={{ color: "#fff", fontSize: "1rem", margin: "0 0 8px 0", fontWeight: 800 }}>📲 எமது Telegram சனலில் இணையுங்கள்</h4>
            <p style={{ fontSize: "0.8rem", color: "#cbd5e1", margin: "0 0 12px 0" }}>உடனுக்குடன் முக்கிய பிரேக்கிங் செய்திகளை உங்கள் போனில் பெற சுடர் மீடியாவுடன் இணையுங்கள்.</p>
            <a href="https://t.me/SamAi_Probot" target="_blank" rel="noreferrer" style={{ display: "block", textAlign: "center", background: "#dc2626", color: "#fff", textDecoration: "none", padding: "8px 12px", borderRadius: "8px", fontWeight: 700, fontSize: "0.85rem" }}>
              இப்போதே இணையுங்கள் ➔
            </a>
          </div>

        </aside>

      </div>

      {/* ── FOOTER ── */}
      <footer style={{ background: "#060911", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "40px 20px 20px", marginTop: "40px" }}>
        <div style={{ maxWidth: "1250px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "30px", marginBottom: "30px" }}>
          <div>
            <h4 style={{ color: "#fff", fontSize: "1.1rem", marginBottom: "15px", borderLeft: "3px solid #dc2626", paddingLeft: "8px" }}>சுடர் மீடியா பற்றி</h4>
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", lineHeight: 1.6 }}>சுடர் மீடியா (Chudar Media) இலங்கையிலும் உலகெங்கிலும் வாழும் தமிழ் பேசும் மக்களுக்கான 24/7 நம்பகமான, நடுநிலையான உண்மைச் செய்தித் தளமாகும்.</p>
          </div>
          <div>
            <h4 style={{ color: "#fff", fontSize: "1.1rem", marginBottom: "15px", borderLeft: "3px solid #dc2626", paddingLeft: "8px" }}>முக்கிய பிரிவுகள்</h4>
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", lineHeight: 1.6 }}>• இலங்கை செய்திகள்<br />• சர்வதேச அரசியல்<br />• வணிகம் மற்றும் பொருளாதாரம்<br />• சினிமா மற்றும் விசேட கட்டுரைகள்</p>
          </div>
          <div>
            <h4 style={{ color: "#fff", fontSize: "1.1rem", marginBottom: "15px", borderLeft: "3px solid #dc2626", paddingLeft: "8px" }}>தொடர்புகளுக்கு</h4>
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", lineHeight: 1.6 }}>📧 news@chudarmedia.com<br />📞 +94 77 123 4567<br />📍 கொழும்பு, இலங்கை</p>
          </div>
        </div>

        <div style={{ textAlign: "center", paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: "0.8rem", color: "#94a3b8" }}>
          © 2026 சுடர் மீடியா (Chudar Media). அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை. | Powered by SAM AI Autonomous Web Engine
        </div>
      </footer>

    </div>
  );
}
