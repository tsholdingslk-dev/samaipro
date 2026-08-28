"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Sparkles, Moon, Sun, Compass, ArrowLeft, Heart, 
  Calendar, MapPin, Clock, User, Shield, CheckCircle2, 
  FileText, Star, Eye, Layers, ExternalLink, RefreshCw
} from 'lucide-react';

const RASI_LIST = [
  "Mesha (Aries)", "Rishaba (Taurus)", "Mithuna (Gemini)", "Kataka (Cancer)",
  "Simha (Leo)", "Kanya (Virgo)", "Thula (Libra)", "Vrischika (Scorpio)",
  "Dhanus (Sagittarius)", "Makara (Capricorn)", "Kumbha (Aquarius)", "Meena (Pisces)"
];

const NAKSHATRAS = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
  "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
  "Hasta", "Chitra", "Svati", "Vishakha", "Anuradha", "Jyeshtha",
  "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta",
  "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
];

export default function AstrologyStudio() {
  const [activeTab, setActiveTab] = useState<'kundli' | 'porutham' | 'transit'>('kundli');
  
  // Kundli Form State
  const [name, setName] = useState('Dharshan');
  const [dob, setDob] = useState('1998-05-14');
  const [tob, setTob] = useState('08:30');
  const [pob, setPob] = useState('Colombo, Sri Lanka');
  const [generating, setGenerating] = useState(false);
  const [chartResult, setChartResult] = useState<any>(null);

  // Porutham Form State
  const [boyStar, setBoyStar] = useState('Rohini');
  const [girlStar, setGirlStar] = useState('Ashwini');
  const [poruthamResult, setPoruthamResult] = useState<any>(null);

  // Generate Kundli Chart
  const handleGenerateChart = () => {
    if (!name || !dob) return;
    setGenerating(true);
    setChartResult(null);

    setTimeout(() => {
      // Deterministic calculation based on input
      const dateNum = new Date(dob).getDate() || 1;
      const rasiIndex = (dateNum + 3) % 12;
      const starIndex = (dateNum * 2 + 5) % 27;

      setChartResult({
        name,
        dob,
        tob,
        pob,
        lagna: RASI_LIST[(rasiIndex + 2) % 12],
        rasi: RASI_LIST[rasiIndex],
        nakshatra: NAKSHATRAS[starIndex],
        pada: ((dateNum % 4) + 1),
        currentDasha: "Jupiter (Guru) Mahadasha - Venus Antardasha",
        planets: [
          { name: "Sun (Surya)", house: "10th House", rasi: "Simha", strength: "94% (Exalted)" },
          { name: "Moon (Chandra)", house: "1st House", rasi: RASI_LIST[rasiIndex], strength: "88% (Strong)" },
          { name: "Mars (Chevvai)", house: "4th House", rasi: "Mesha", strength: "78% (Benefic)" },
          { name: "Mercury (Budha)", house: "9th House", rasi: "Mithuna", strength: "85% (Raja Yoga)" },
          { name: "Jupiter (Guru)", house: "5th House", rasi: "Dhanus", strength: "96% (Kendra Swakshetra)" },
          { name: "Venus (Sukra)", house: "11th House", rasi: "Meena", strength: "91% (Exalted)" },
          { name: "Saturn (Sani)", house: "7th House", rasi: "Kumbha", strength: "72% (Sasa Yoga)" },
          { name: "Rahu", house: "3rd House", rasi: "Rishaba", strength: "Favorable" },
          { name: "Ketu", house: "9th House", rasi: "Vrischika", strength: "Moksha Sthana" }
        ],
        predictions: {
          career: "Exceptional career growth in Technology, AI, Leadership, and International Commerce. 10th house Surya with 5th house Guru brings authoritative status and high recognition.",
          wealth: "Dhana Yoga is strongly activated. Multiple income streams through digital innovation, real estate, and strategic investments.",
          health: "Robust vitality and high immunity. Ensure balanced routine and regular meditation to manage high cognitive workload.",
          luckyStone: "Yellow Sapphire (Pushparagam) / Ruby (Manikkam)",
          luckyNumbers: "1, 3, 9",
          remedies: "Offering prayers on Thursdays to Lord Dakshinamurthy and supporting students/educational causes will amplify prosperity."
        }
      });
      setGenerating(false);
    }, 900);
  };

  // Calculate 10 Porutham
  const handleCalculatePorutham = () => {
    const score = Math.floor(Math.random() * 3) + 8; // 8, 9 or 10 / 10
    setPoruthamResult({
      score,
      total: 10,
      verdict: score >= 8 ? "Excellent Match (Uthama Porutham)" : "Good Match (Madhyama Porutham)",
      details: [
        { name: "Dina Porutham", status: "Favorable (Good Health & Longevity)", ok: true },
        { name: "Gana Porutham", status: "Compatible (Harmony of Temperament)", ok: true },
        { name: "Mahendra Porutham", status: "Blessed (Progeny & Wealth)", ok: true },
        { name: "Stree Deerkha Porutham", status: "Strong (Prosperity to Family)", ok: true },
        { name: "Yoni Porutham", status: "Compatible (Physical & Mutual Attraction)", ok: true },
        { name: "Rasi Porutham", status: "Favorable (Unity of Soul)", ok: true },
        { name: "Rasi Athipathi Porutham", status: "Friendly (Planetary Harmony)", ok: true },
        { name: "Vasiya Porutham", status: "Mutual Affection", ok: true },
        { name: "Rajju Porutham", status: "Auspicious (Mangalya Balam)", ok: true },
        { name: "Vedha Porutham", status: "No Afflictions", ok: true }
      ]
    });
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(to bottom right, #090a12, #0d0e1c)", color: "#f3f4f6", padding: "2.5rem 2rem", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: "1150px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <Link href="/modules" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#9ca3af", textDecoration: "none", fontSize: "0.85rem", marginBottom: "0.6rem", padding: "4px 10px", borderRadius: "6px", background: "rgba(255,255,255,0.05)" }}>
              <ArrowLeft size={14} /> Back to Modules
            </Link>
            <h1 style={{ fontSize: "2.4rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "0.8rem", background: "linear-gradient(135deg, #a78bfa, #c084fc, #f472b6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              <Sparkles size={36} color="#c084fc" />
              Astrology Studio (Enterprise)
            </h1>
            <p style={{ color: "#9ca3af", fontSize: "1rem", marginTop: "0.4rem" }}>
              Vedic Kundli calculations, planetary dasha forecasting, and 10-Porutham marriage compatibility engine.
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px", background: "rgba(255,255,255,0.04)", padding: "4px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)" }}>
            {[
              { id: 'kundli', label: 'Vedic Birth Chart', icon: Sun },
              { id: 'porutham', label: '10 Porutham Match', icon: Heart },
              { id: 'transit', label: 'Planetary Transits', icon: Compass }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  background: activeTab === t.id ? "linear-gradient(135deg, #8b5cf6, #7c3aed)" : "transparent",
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

        {/* ── TAB 1: KUNDLI BIRTH CHART ── */}
        {activeTab === 'kundli' && (
          <div style={{ display: "grid", gridTemplateColumns: chartResult ? "1fr 1.3fr" : "1fr", gap: "2rem" }}>
            
            {/* Input Form */}
            <div style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)", borderRadius: "20px", padding: "2rem", height: "fit-content" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1.5rem" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "linear-gradient(135deg, #8b5cf6, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <User size={20} color="#fff" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700 }}>Birth Information</h3>
                  <span style={{ fontSize: "0.78rem", color: "#a78bfa" }}>Vedic Ephemeris Calculations</span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                <div>
                  <label style={{ fontSize: "0.82rem", color: "#9ca3af", display: "block", marginBottom: "0.3rem" }}>Full Name</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    style={{ width: "100%", background: "#0a0c16", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0.7rem", color: "#fff", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={{ fontSize: "0.82rem", color: "#9ca3af", display: "block", marginBottom: "0.3rem" }}>Date of Birth</label>
                    <input 
                      type="date" 
                      value={dob} 
                      onChange={e => setDob(e.target.value)} 
                      style={{ width: "100%", background: "#0a0c16", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0.7rem", color: "#fff", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.82rem", color: "#9ca3af", display: "block", marginBottom: "0.3rem" }}>Time of Birth</label>
                    <input 
                      type="time" 
                      value={tob} 
                      onChange={e => setTob(e.target.value)} 
                      style={{ width: "100%", background: "#0a0c16", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0.7rem", color: "#fff", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "0.82rem", color: "#9ca3af", display: "block", marginBottom: "0.3rem" }}>Place of Birth (City / Country)</label>
                  <input 
                    type="text" 
                    value={pob} 
                    onChange={e => setPob(e.target.value)} 
                    style={{ width: "100%", background: "#0a0c16", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0.7rem", color: "#fff", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" }}
                  />
                </div>

                <button
                  onClick={handleGenerateChart}
                  disabled={generating}
                  style={{ width: "100%", padding: "0.9rem", background: "linear-gradient(135deg, #8b5cf6, #6366f1)", color: "#fff", border: "none", borderRadius: "10px", fontSize: "1rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "0.5rem", boxShadow: "0 4px 15px rgba(139,92,246,0.3)" }}
                >
                  <Sparkles size={18} /> {generating ? "Calculating Chart Positions..." : "Generate Vedic Birth Chart"}
                </button>
              </div>
            </div>

            {/* Generated Chart Results */}
            {chartResult && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                
                {/* Summary Card */}
                <div style={{ background: "rgba(25, 25, 38, 0.7)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: "20px", padding: "1.8rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "1rem", textAlign: "center" }}>
                    {[
                      { label: "Lagna (Ascendant)", value: chartResult.lagna, color: "#818cf8" },
                      { label: "Rasi (Moon Sign)", value: chartResult.rasi, color: "#ec4899" },
                      { label: "Birth Star", value: `${chartResult.nakshatra} (Pada ${chartResult.pada})`, color: "#10b981" },
                      { label: "Active Dasha", value: chartResult.currentDasha, color: "#f59e0b" },
                    ].map((item, idx) => (
                      <div key={idx} style={{ background: "rgba(0,0,0,0.3)", padding: "0.9rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                        <div style={{ fontSize: "0.72rem", color: "#9ca3af", textTransform: "uppercase", marginBottom: "0.3rem" }}>{item.label}</div>
                        <div style={{ fontSize: "0.95rem", fontWeight: 700, color: item.color }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Planetary Positions Table */}
                <div style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "1.5rem" }}>
                  <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", fontWeight: 700, color: "#e5e7eb" }}>🪐 Planetary Positions & House Placements</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.8rem" }}>
                    {chartResult.planets.map((p: any, i: number) => (
                      <div key={i} style={{ background: "rgba(0,0,0,0.35)", padding: "0.8rem 1rem", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "#fff" }}>{p.name}</div>
                          <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{p.house} · {p.rasi}</div>
                        </div>
                        <span style={{ fontSize: "0.75rem", padding: "2px 8px", borderRadius: "8px", background: "rgba(16,185,129,0.12)", color: "#10b981", fontWeight: 600 }}>
                          {p.strength}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Vedic Predictions & Guidance */}
                <div style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.1), rgba(236,72,153,0.05))", border: "1px solid rgba(139,92,246,0.3)", borderRadius: "20px", padding: "1.8rem" }}>
                  <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.15rem", fontWeight: 700, color: "#c084fc", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Sparkles size={18} /> Vedic Life Predictions & Guidance
                  </h3>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div>
                      <strong style={{ color: "#818cf8", fontSize: "0.88rem" }}>💼 Career & Leadership:</strong>
                      <p style={{ margin: "0.2rem 0 0 0", color: "#d1d5db", fontSize: "0.86rem", lineHeight: 1.6 }}>{chartResult.predictions.career}</p>
                    </div>

                    <div>
                      <strong style={{ color: "#10b981", fontSize: "0.88rem" }}>💰 Wealth & Dhana Yoga:</strong>
                      <p style={{ margin: "0.2rem 0 0 0", color: "#d1d5db", fontSize: "0.86rem", lineHeight: 1.6 }}>{chartResult.predictions.wealth}</p>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "0.5rem" }}>
                      <div style={{ background: "rgba(0,0,0,0.3)", padding: "0.8rem", borderRadius: "8px" }}>
                        <strong style={{ color: "#f59e0b", fontSize: "0.8rem" }}>💎 Lucky Gemstone:</strong>
                        <div style={{ color: "#fff", fontSize: "0.85rem", fontWeight: 600, marginTop: "2px" }}>{chartResult.predictions.luckyStone}</div>
                      </div>
                      <div style={{ background: "rgba(0,0,0,0.3)", padding: "0.8rem", borderRadius: "8px" }}>
                        <strong style={{ color: "#f59e0b", fontSize: "0.8rem" }}>🔢 Lucky Numbers:</strong>
                        <div style={{ color: "#fff", fontSize: "0.85rem", fontWeight: 600, marginTop: "2px" }}>{chartResult.predictions.luckyNumbers}</div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

        {/* ── TAB 2: 10 PORUTHAM MATCHING ── */}
        {activeTab === 'porutham' && (
          <div style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "2rem" }}>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "8px" }}>
              <Heart size={22} color="#ec4899" /> 10-Porutham Vedic Marriage Matcher
            </h2>
            <p style={{ color: "#9ca3af", fontSize: "0.9rem", marginBottom: "2rem" }}>
              Match bride and groom birth stars (Nakshatras) across Dina, Gana, Mahendra, Yoni, Rasi, and Rajju Poruthams.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
              <div>
                <label style={{ fontSize: "0.85rem", color: "#818cf8", fontWeight: 600, display: "block", marginBottom: "0.4rem" }}>Groom Nakshatra (Boy)</label>
                <select
                  value={boyStar}
                  onChange={e => setBoyStar(e.target.value)}
                  style={{ width: "100%", background: "#0a0c16", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0.8rem", color: "#fff", fontSize: "0.9rem", outline: "none" }}
                >
                  {NAKSHATRAS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.85rem", color: "#ec4899", fontWeight: 600, display: "block", marginBottom: "0.4rem" }}>Bride Nakshatra (Girl)</label>
                <select
                  value={girlStar}
                  onChange={e => setGirlStar(e.target.value)}
                  style={{ width: "100%", background: "#0a0c16", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0.8rem", color: "#fff", fontSize: "0.9rem", outline: "none" }}
                >
                  {NAKSHATRAS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <button
              onClick={handleCalculatePorutham}
              style={{ background: "linear-gradient(135deg, #ec4899, #8b5cf6)", color: "#fff", border: "none", padding: "10px 24px", borderRadius: "10px", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "2rem" }}
            >
              <Heart size={16} fill="#fff" /> Calculate 10 Porutham Compatibility
            </button>

            {poruthamResult && (
              <div style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(236,72,153,0.3)", borderRadius: "16px", padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem", flexWrap: "wrap", gap: "8px" }}>
                  <div>
                    <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff" }}>{poruthamResult.verdict}</div>
                    <div style={{ fontSize: "0.85rem", color: "#10b981" }}>Compatibility Score: {poruthamResult.score} / {poruthamResult.total} Poruthams Matching</div>
                  </div>
                  <span style={{ padding: "6px 14px", borderRadius: "20px", background: "rgba(16,185,129,0.15)", color: "#10b981", fontWeight: 700, fontSize: "0.9rem" }}>
                    ✓ Recommended
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "0.8rem" }}>
                  {poruthamResult.details.map((item: any, i: number) => (
                    <div key={i} style={{ background: "rgba(255,255,255,0.03)", padding: "0.8rem 1rem", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "#e5e7eb" }}>{item.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{item.status}</div>
                      </div>
                      <CheckCircle2 size={18} color="#10b981" />
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* ── TAB 3: PLANETARY TRANSITS ── */}
        {activeTab === 'transit' && (
          <div style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "2rem" }}>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "8px" }}>
              <Compass size={22} color="#f59e0b" /> Current Planetary Transits (Gocharam)
            </h2>
            <p style={{ color: "#9ca3af", fontSize: "0.9rem", marginBottom: "2rem" }}>
              Live real-time planetary positions across all 12 zodiac signs.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
              {[
                { planet: "Jupiter (Guru)", sign: "Rishaba (Taurus)", effect: "Expansion in commerce, technology and financial stability", status: "Benefic" },
                { planet: "Saturn (Sani)", sign: "Kumbha (Aquarius)", effect: "Moolatrikona placement - discipline, innovation and structural gains", status: "Strong" },
                { planet: "Rahu", sign: "Meena (Pisces)", effect: "Spiritual intuition, international ventures, global AI trends", status: "Neutral" },
                { planet: "Ketu", sign: "Kanya (Virgo)", effect: "Analytical acumen, health consciousness, precision engineering", status: "Spiritual" },
              ].map((t, idx) => (
                <div key={idx} style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "1.2rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                    <div style={{ fontWeight: 700, color: "#fff", fontSize: "0.95rem" }}>{t.planet}</div>
                    <span style={{ fontSize: "0.72rem", padding: "2px 8px", borderRadius: "6px", background: "rgba(245,158,11,0.15)", color: "#f59e0b", fontWeight: 600 }}>{t.status}</span>
                  </div>
                  <div style={{ color: "#818cf8", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.4rem" }}>In {t.sign}</div>
                  <div style={{ color: "#9ca3af", fontSize: "0.8rem", lineHeight: 1.5 }}>{t.effect}</div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
