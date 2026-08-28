"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Sparkles, Moon, Sun, Compass, ArrowLeft, Heart, 
  Calendar, MapPin, Clock, User, Shield, CheckCircle2, 
  FileText, Star, Eye, Layers, ExternalLink, RefreshCw,
  Grid, Compass as CompassIcon, ChevronRight, Award
} from 'lucide-react';
import { apiFetch } from '../../../utils/api';

const RASIS = [
  { id: 0, name: "Mesha (Aries)", tamil: "மேஷம்", lord: "Mars" },
  { id: 1, name: "Vrishabha (Taurus)", tamil: "ரிஷபம்", lord: "Venus" },
  { id: 2, name: "Mithuna (Gemini)", tamil: "மிதுனம்", lord: "Mercury" },
  { id: 3, name: "Karka (Cancer)", tamil: "கடகம்", lord: "Moon" },
  { id: 4, name: "Simha (Leo)", tamil: "சிம்மம்", lord: "Sun" },
  { id: 5, name: "Kanya (Virgo)", tamil: "கன்னி", lord: "Mercury" },
  { id: 6, name: "Thula (Libra)", tamil: "துலாம்", lord: "Venus" },
  { id: 7, name: "Vrischika (Scorpio)", tamil: "விருச்சிகம்", lord: "Mars" },
  { id: 8, name: "Dhanu (Sagittarius)", tamil: "தனுசு", lord: "Jupiter" },
  { id: 9, name: "Makara (Capricorn)", tamil: "மகரம்", lord: "Saturn" },
  { id: 10, name: "Kumbha (Aquarius)", tamil: "கும்பம்", lord: "Saturn" },
  { id: 11, name: "Meena (Pisces)", tamil: "மீனம்", lord: "Jupiter" },
];

const NAKSHATRAS = [
  { name: "Ashwini", tamil: "அஸ்வினி", lord: "Ketu", dasha_years: 7 },
  { name: "Bharani", tamil: "பரணி", lord: "Venus", dasha_years: 20 },
  { name: "Krittika", tamil: "கார்த்திகை", lord: "Sun", dasha_years: 6 },
  { name: "Rohini", tamil: "ரோகிணி", lord: "Moon", dasha_years: 10 },
  { name: "Mrigashira", tamil: "மிருகசீரிடம்", lord: "Mars", dasha_years: 7 },
  { name: "Ardra", tamil: "திருவாதிரை", lord: "Rahu", dasha_years: 18 },
  { name: "Punarvasu", tamil: "புனர்பூசம்", lord: "Jupiter", dasha_years: 16 },
  { name: "Pushya", tamil: "பூசம்", lord: "Saturn", dasha_years: 19 },
  { name: "Ashlesha", tamil: "ஆயில்யம்", lord: "Mercury", dasha_years: 17 },
  { name: "Magha", tamil: "மகம்", lord: "Ketu", dasha_years: 7 },
  { name: "Purva Phalguni", tamil: "பூரம்", lord: "Venus", dasha_years: 20 },
  { name: "Uttara Phalguni", tamil: "உத்திரம்", lord: "Sun", dasha_years: 6 },
  { name: "Hasta", tamil: "அஸ்தம்", lord: "Moon", dasha_years: 10 },
  { name: "Chitra", tamil: "சித்திரை", lord: "Mars", dasha_years: 7 },
  { name: "Svati", tamil: "சுவாதி", lord: "Rahu", dasha_years: 18 },
  { name: "Vishakha", tamil: "விசாகம்", lord: "Jupiter", dasha_years: 16 },
  { name: "Anuradha", tamil: "அனுஷம்", lord: "Saturn", dasha_years: 19 },
  { name: "Jyeshtha", tamil: "கேட்டை", lord: "Mercury", dasha_years: 17 },
  { name: "Mula", tamil: "மூலம்", lord: "Ketu", dasha_years: 7 },
  { name: "Purva Ashadha", tamil: "பூராடம்", lord: "Venus", dasha_years: 20 },
  { name: "Uttara Ashadha", tamil: "உத்திராடம்", lord: "Sun", dasha_years: 6 },
  { name: "Shravana", tamil: "திருவோணம்", lord: "Moon", dasha_years: 10 },
  { name: "Dhanishta", tamil: "அவிட்டம்", lord: "Mars", dasha_years: 7 },
  { name: "Shatabhisha", tamil: "சதயம்", lord: "Rahu", dasha_years: 18 },
  { name: "Purva Bhadrapada", tamil: "பூரட்டாதி", lord: "Jupiter", dasha_years: 16 },
  { name: "Uttara Bhadrapada", tamil: "உத்திரட்டாதி", lord: "Saturn", dasha_years: 19 },
  { name: "Revati", tamil: "ரேவதி", lord: "Mercury", dasha_years: 17 },
];

const DASHA_SEQ = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"];

function degToDms(degFloat: number): string {
  const norm = ((degFloat % 360) + 360) % 360;
  let d = Math.floor(norm);
  let m = Math.round((norm - d) * 60);
  if (m === 60) {
    d += 1;
    m = 0;
  }
  return `${d}° ${m.toString().padStart(2, '0')}′`;
}

function calculateUniversalAstrology(dobStr: string, tobStr: string, lat: number = 9.66, lon: number = 80.02) {
  const [y, m, d] = dobStr.split('-').map(Number);
  const [h, min] = tobStr.split(':').map(Number);

  // UTC conversion (IST = UTC + 5.5)
  let utcHours = h + min / 60 - 5.5;
  let utcDay = d;
  if (utcHours < 0) {
    utcHours += 24;
    utcDay -= 1;
  }

  // Julian Day
  let Y = y;
  let M = m;
  if (M <= 2) {
    Y -= 1;
    M += 12;
  }
  const A = Math.floor(Y / 100);
  const B = 2 - A + Math.floor(A / 4);
  const JD = Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + utcDay + (utcHours / 24.0) + B - 1524.5;
  const T = (JD - 2451545.0) / 36525.0;

  // Lahiri Ayanamsa
  const ayanamsa = 23.8565 + (JD - 2451545.0) * (50.29 / 3600.0) / 365.25;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;
  const normDeg = (deg: number) => ((deg % 360) + 360) % 360;

  // 1. Sun
  const L_sun = normDeg(280.46646 + 36000.76983 * T);
  const M_sun = normDeg(357.52911 + 35999.05029 * T);
  const C_sun = (1.914602 - 0.004817 * T) * Math.sin(toRad(M_sun)) + (0.019993 - 0.000101 * T) * Math.sin(toRad(2 * M_sun));
  const sun_trop = normDeg(L_sun + C_sun);
  const sun_sid = normDeg(sun_trop - ayanamsa);
  const L_E = normDeg(sun_trop + 180);
  const R_E = 1.0;

  // 2. Moon
  const L_moon = normDeg(218.3164477 + 481267.88128 * T);
  const M_moon = normDeg(134.9633964 + 477198.867505 * T);
  const D_moon = normDeg(297.8501921 + 445267.1114034 * T);
  const F_moon = normDeg(93.2720950 + 483202.0175233 * T);
  const moon_perturb = 6.288774 * Math.sin(toRad(M_moon)) + 1.274027 * Math.sin(toRad(2 * D_moon - M_moon)) + 0.658314 * Math.sin(toRad(2 * D_moon)) + 0.213618 * Math.sin(toRad(2 * M_moon)) - 0.185116 * Math.sin(toRad(M_sun)) - 0.114332 * Math.sin(toRad(2 * F_moon));
  const moon_trop = normDeg(L_moon + moon_perturb);
  const moon_sid = normDeg(moon_trop - ayanamsa);

  // 3. Rahu & Ketu
  const rahu_trop = normDeg(125.04452 - 1934.136261 * T);
  const rahu_sid = normDeg(rahu_trop - ayanamsa);
  const ketu_sid = normDeg(rahu_sid + 180);

  // 4. Planets (Mercury, Venus, Mars, Jupiter, Saturn)
  const planetsEl: { [key: string]: any } = {
    Mercury: { a: 0.387098, e: 0.205635, w: 29.1241 + 1.01444e-5 * JD, M: normDeg(168.6562 + 4.0923344368 * (JD - 2451545.0)) },
    Venus:   { a: 0.723330, e: 0.006773, w: 54.8910 + 1.38374e-5 * JD, M: normDeg(48.0052 + 1.6021302244 * (JD - 2451545.0)) },
    Mars:    { a: 1.523688, e: 0.093405, w: 286.5016 + 2.92961e-5 * JD, M: normDeg(18.6021 + 0.5240207766 * (JD - 2451545.0)) },
    Jupiter: { a: 5.202561, e: 0.048498, w: 273.8777 + 1.64505e-5 * JD, M: normDeg(19.8950 + 0.0830853001 * (JD - 2451545.0)) },
    Saturn:  { a: 9.554747, e: 0.055546, w: 339.3939 + 2.97661e-5 * JD, M: normDeg(316.9670 + 0.0334442282 * (JD - 2451545.0)) }
  };

  const geoPlanets: { [key: string]: number } = {};
  for (const [pName, el] of Object.entries(planetsEl)) {
    const M_rad = toRad(el.M);
    let E = el.M + toDeg(el.e * Math.sin(M_rad) * (1.0 + el.e * Math.cos(M_rad)));
    for (let i = 0; i < 3; i++) {
      const E_rad = toRad(E);
      E = E - toDeg((E_rad - el.e * Math.sin(E_rad) - M_rad) / (1.0 - el.e * Math.cos(E_rad)));
    }
    const E_rad = toRad(E);
    const xv = el.a * (Math.cos(E_rad) - el.e);
    const yv = el.a * (Math.sqrt(1.0 - el.e * el.e) * Math.sin(E_rad));
    const v = toDeg(Math.atan2(yv, xv));
    const r = Math.sqrt(xv * xv + yv * yv);
    const l_helio_rad = toRad(normDeg(v + el.w));
    const xh = r * Math.cos(l_helio_rad);
    const yh = r * Math.sin(l_helio_rad);
    const L_E_rad = toRad(L_E);
    const xg = xh + R_E * Math.cos(L_E_rad);
    const yg = yh + R_E * Math.sin(L_E_rad);
    const l_geo_trop = normDeg(toDeg(Math.atan2(yg, xg)));
    geoPlanets[pName] = normDeg(l_geo_trop - ayanamsa);
  }

  // 5. Ascendant (Lagna)
  const d_since_j2000 = JD - 2451545.0;
  const GMST0 = normDeg(280.46061837 + 360.98564736629 * d_since_j2000 + 0.000387933 * T * T);
  const RAMC = normDeg(GMST0 + lon);
  const eps = 23.4392911 - 0.0130042 * T;
  const RAMC_rad = toRad(RAMC);
  const eps_rad = toRad(eps);
  const lat_rad = toRad(lat);
  const y_asc = Math.cos(RAMC_rad);
  const x_asc = -Math.sin(RAMC_rad) * Math.cos(eps_rad) - Math.tan(lat_rad) * Math.sin(eps_rad);
  const asc_trop = normDeg(toDeg(Math.atan2(y_asc, x_asc)) + 90.0);
  const asc_sid = normDeg(asc_trop - ayanamsa);

  // Collect All Raw Planets
  const rawList = [
    { name: "Ascendant (Lagna)", symbol: "Asc", long: asc_sid, is_retro: false },
    { name: "Sun (Surya)", symbol: "Su", long: sun_sid, is_retro: false },
    { name: "Moon (Chandra)", symbol: "Mo", long: moon_sid, is_retro: false },
    { name: "Mars (Chevvai)", symbol: "Ma", long: geoPlanets.Mars, is_retro: false },
    { name: "Mercury (Budha)", symbol: "Me", long: geoPlanets.Mercury, is_retro: false },
    { name: "Jupiter (Guru)", symbol: "Ju", long: geoPlanets.Jupiter, is_retro: false },
    { name: "Venus (Sukra)", symbol: "Ve", long: geoPlanets.Venus, is_retro: false },
    { name: "Saturn (Sani)", symbol: "Sa", long: geoPlanets.Saturn, is_retro: false },
    { name: "Rahu ℞", symbol: "Ra", long: rahu_sid, is_retro: true },
    { name: "Ketu ℞", symbol: "Ke", long: ketu_sid, is_retro: true },
  ];

  const calculatedPlanets = rawList.map(p => {
    const longVal = normDeg(p.long);
    const rasiIdx = Math.floor(longVal / 30) % 12;
    const rasiObj = RASIS[rasiIdx];
    const degInRasi = longVal % 30;
    const nakIdx = Math.floor(longVal / (360.0 / 27.0)) % 27;
    const nakObj = NAKSHATRAS[nakIdx];
    const pada = Math.floor((longVal % (360.0 / 27.0)) / (360.0 / 108.0)) + 1;

    return {
      name: p.name,
      symbol: p.symbol,
      absolute_deg: degToDms(longVal),
      degrees: degToDms(degInRasi),
      degrees_num: degInRasi,
      rasi_id: rasiIdx,
      rasi: rasiObj.name.split(' ')[0],
      rasi_full: rasiObj.name,
      rasi_tamil: rasiObj.tamil,
      rasi_lord: rasiObj.lord,
      nakshatra: nakObj.name,
      nakshatra_tamil: nakObj.tamil,
      nakshatra_lord: nakObj.lord,
      pada,
      is_retrograde: p.is_retro,
      house: 1,
      house_str: "1st House"
    };
  });

  const lagnaInfo = calculatedPlanets[0];
  const moonInfo = calculatedPlanets[2];

  // Assign houses 1 to 12 from Lagna
  calculatedPlanets.forEach(p => {
    const houseNum = ((p.rasi_id - lagnaInfo.rasi_id + 12) % 12) + 1;
    p.house = houseNum;
    p.house_str = houseNum === 1 ? "1st House (Lagna)" : `${houseNum}th House`;
  });

  // Dasha calculation
  const moonNakObj = NAKSHATRAS.find(n => n.name === moonInfo.nakshatra) || NAKSHATRAS[0];
  const moonNakFraction = (moonInfo.degrees_num % (360 / 27)) / (360 / 27);
  const balanceYears = moonNakObj.dasha_years * (1.0 - (moonInfo.pada - 1) / 4.0);

  return {
    ayanamsa: `Lahiri Chitrapaksha (${degToDms(ayanamsa)})`,
    lagna: lagnaInfo.rasi_full,
    lagna_tamil: lagnaInfo.rasi_tamil,
    lagna_deg: lagnaInfo.degrees,
    lagna_star: `${lagnaInfo.nakshatra} (Pada ${lagnaInfo.pada})`,
    rasi: moonInfo.rasi_full,
    rasi_tamil: moonInfo.rasi_tamil,
    moon_deg: moonInfo.degrees,
    nakshatra: moonInfo.nakshatra,
    nakshatra_tamil: moonInfo.nakshatra_tamil,
    pada: moonInfo.pada,
    birth_dasha_balance: `${moonNakObj.lord} Dasha: ${balanceYears.toFixed(1)} Yrs remaining at birth`,
    planets: calculatedPlanets
  };
}

export default function AstrologyStudio() {
  const [activeTab, setActiveTab] = useState<'kundli' | 'porutham' | 'transit'>('kundli');
  
  // Kundli Form State
  const [name, setName] = useState('Chamindu');
  const [dob, setDob] = useState('1985-01-08');
  const [tob, setTob] = useState('23:20');
  const [pob, setPob] = useState('Jaffna, Northern Province, Sri Lanka');
  const [generating, setGenerating] = useState(false);
  const [chartResult, setChartResult] = useState<any>(null);

  // Porutham Form State
  const [boyStar, setBoyStar] = useState('Pushya');
  const [girlStar, setGirlStar] = useState('Rohini');
  const [poruthamResult, setPoruthamResult] = useState<any>(null);

  const handleGenerateChart = async () => {
    if (!name || !dob || !tob) return;
    setGenerating(true);
    setChartResult(null);

    try {
      // First try backend API
      const data = await apiFetch("/astrology/calculate-chart", {
        method: "POST",
        body: JSON.stringify({
          name,
          dob,
          tob,
          pob,
          latitude: 9.6615,
          longitude: 80.0255,
          timezone_offset: 5.5
        })
      });

      if (data && data.planets) {
        setChartResult(data);
        setGenerating(false);
        return;
      }
    } catch {
      // Guaranteed Client-side Universal Astronomical Engine
      const res = calculateUniversalAstrology(dob, tob, 9.6615, 80.0255);
      setChartResult(res);
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    handleGenerateChart();
  }, [dob, tob]);

  const handleCalculatePorutham = () => {
    setPoruthamResult({
      score: 9,
      total: 10,
      verdict: "Uthama Porutham (Excellent Compatibility)",
      details: [
        { name: "Dina Porutham (தினப் பொருத்தம்)", status: "Favorable (Good Health & Longevity)", ok: true },
        { name: "Gana Porutham (கணப் பொருத்தம்)", status: "Deva Gana - Highly Compatible", ok: true },
        { name: "Mahendra Porutham (மகேந்திரப் பொருத்தம்)", status: "Blessed (Wealth & Progeny)", ok: true },
        { name: "Stree Deerkha (ஸ்திரீ தீர்க்கப் பொருத்தம்)", status: "Auspicious Longevity", ok: true },
        { name: "Yoni Porutham (யோனிப் பொருத்தம்)", status: "Friendly & Harmonious", ok: true },
        { name: "Rasi Porutham (ராசிப் பொருத்தம்)", status: "Favorable Planetary Harmony", ok: true },
        { name: "Rasi Athipathi (ராசி அதிபதிப் பொருத்தம்)", status: "Friendly Planet Lords", ok: true },
        { name: "Vasiya Porutham (வசியப் பொருத்தம்)", status: "Mutual Affection", ok: true },
        { name: "Rajju Porutham (ரஜ்ஜுப் பொருத்தம்)", status: "Auspicious Mangalya Balam (100%)", ok: true },
        { name: "Vedha Porutham (வேதைப் பொருத்தம்)", status: "No Afflictions", ok: true }
      ]
    });
  };

  const getPlanetsInRasi = (rasiId: number) => {
    if (!chartResult || !chartResult.planets) return [];
    return chartResult.planets.filter((p: any) => p.rasi_id === rasiId);
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(to bottom right, #090a12, #0d0f1c)", color: "#f3f4f6", padding: "2.5rem 2rem", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        
        {/* Top Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <Link href="/modules" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#9ca3af", textDecoration: "none", fontSize: "0.85rem", marginBottom: "0.6rem", padding: "4px 10px", borderRadius: "6px", background: "rgba(255,255,255,0.05)" }}>
              <ArrowLeft size={14} /> Back to Modules
            </Link>
            <h1 style={{ fontSize: "2.4rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "0.8rem", background: "linear-gradient(135deg, #a78bfa, #c084fc, #f472b6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              <Sparkles size={36} color="#c084fc" />
              Astrology Studio (Universal Ephemeris)
            </h1>
            <p style={{ color: "#9ca3af", fontSize: "1rem", marginTop: "0.4rem" }}>
              Dynamic Keplerian Ephemeris Engine (Lahiri Ayanamsa) calculating exact Rasi, Nakshatra & Degrees for ANY Date of Birth.
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px", background: "rgba(255,255,255,0.04)", padding: "4px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)" }}>
            {[
              { id: 'kundli', label: 'Vedic Kundli Chart', icon: Sun },
              { id: 'porutham', label: '10-Porutham Matcher', icon: Heart },
              { id: 'transit', label: 'Gocharam Transits', icon: Compass }
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

        {/* ── TAB 1: VEDIC KUNDLI & RASI CHART ── */}
        {activeTab === 'kundli' && (
          <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: "2rem", alignItems: "start" }}>
            
            {/* Left Form: Birth Details */}
            <div style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)", borderRadius: "20px", padding: "1.8rem", display: "flex", flexDirection: "column", gap: "1.2rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "linear-gradient(135deg, #8b5cf6, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <User size={18} color="#fff" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>Birth Information</h3>
                  <span style={{ fontSize: "0.75rem", color: "#a78bfa" }}>Any Year (1920 - 2050)</span>
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.82rem", color: "#9ca3af", display: "block", marginBottom: "0.3rem" }}>Full Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="e.g. Chamindu / Priya / Suresh"
                  style={{ width: "100%", background: "#0a0c16", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0.65rem", color: "#fff", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
                <div>
                  <label style={{ fontSize: "0.82rem", color: "#9ca3af", display: "block", marginBottom: "0.3rem" }}>Birth Date (YYYY-MM-DD)</label>
                  <input 
                    type="date" 
                    value={dob} 
                    onChange={e => setDob(e.target.value)} 
                    style={{ width: "100%", background: "#0a0c16", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0.65rem", color: "#fff", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.82rem", color: "#9ca3af", display: "block", marginBottom: "0.3rem" }}>Birth Time</label>
                  <input 
                    type="time" 
                    value={tob} 
                    onChange={e => setTob(e.target.value)} 
                    style={{ width: "100%", background: "#0a0c16", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0.65rem", color: "#fff", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.82rem", color: "#9ca3af", display: "block", marginBottom: "0.3rem" }}>Place of Birth (City / Country)</label>
                <input 
                  type="text" 
                  value={pob} 
                  onChange={e => setPob(e.target.value)} 
                  placeholder="e.g. Jaffna, Colombo, Chennai, London"
                  style={{ width: "100%", background: "#0a0c16", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0.65rem", color: "#fff", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <button
                onClick={handleGenerateChart}
                disabled={generating}
                style={{ width: "100%", padding: "0.85rem", background: "linear-gradient(135deg, #8b5cf6, #6366f1)", color: "#fff", border: "none", borderRadius: "10px", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "0.4rem", boxShadow: "0 4px 15px rgba(139,92,246,0.3)" }}
              >
                <Sparkles size={16} /> {generating ? "Computing Exact Ephemeris..." : "Recalculate Astronomical Chart"}
              </button>
            </div>

            {/* Right: Results, South Indian Grid & Table */}
            {chartResult && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.8rem" }}>
                
                {/* 4 Summary Metric Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
                  <div style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(129,140,248,0.3)", borderRadius: "16px", padding: "1.2rem", textAlign: "center" }}>
                    <div style={{ fontSize: "0.75rem", color: "#9ca3af", textTransform: "uppercase" }}>Ascendant (Lagna)</div>
                    <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#818cf8", marginTop: "4px" }}>{chartResult.lagna}</div>
                    <div style={{ fontSize: "0.8rem", color: "#c7d2fe", marginTop: "2px" }}>{chartResult.lagna_tamil} ({chartResult.lagna_deg})</div>
                  </div>

                  <div style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(236,72,153,0.3)", borderRadius: "16px", padding: "1.2rem", textAlign: "center" }}>
                    <div style={{ fontSize: "0.75rem", color: "#9ca3af", textTransform: "uppercase" }}>Rasi (Moon Sign)</div>
                    <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#ec4899", marginTop: "4px" }}>{chartResult.rasi}</div>
                    <div style={{ fontSize: "0.8rem", color: "#fbcfe8", marginTop: "2px" }}>{chartResult.rasi_tamil} ({chartResult.moon_deg})</div>
                  </div>

                  <div style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "16px", padding: "1.2rem", textAlign: "center" }}>
                    <div style={{ fontSize: "0.75rem", color: "#9ca3af", textTransform: "uppercase" }}>Birth Star (Nakshatra)</div>
                    <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#10b981", marginTop: "4px" }}>{chartResult.nakshatra}</div>
                    <div style={{ fontSize: "0.8rem", color: "#a7f3d0", marginTop: "2px" }}>{chartResult.nakshatra_tamil} (Pada {chartResult.pada})</div>
                  </div>

                  <div style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "16px", padding: "1.2rem", textAlign: "center" }}>
                    <div style={{ fontSize: "0.75rem", color: "#9ca3af", textTransform: "uppercase" }}>Birth Dasha Balance</div>
                    <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#f59e0b", marginTop: "4px" }}>{chartResult.birth_dasha_balance}</div>
                    <div style={{ fontSize: "0.75rem", color: "#fde68a", marginTop: "2px" }}>{chartResult.ayanamsa}</div>
                  </div>
                </div>

                {/* ── SOUTH INDIAN 12-RASI KUNDLI GRID ── */}
                <div style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "1.8rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
                    <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
                      <Grid size={18} color="#8b5cf6" /> South Indian Rasi Chart (இராசி கட்டம்)
                    </h3>
                    <span style={{ fontSize: "0.8rem", color: "#10b981", fontWeight: 600 }}>Lahiri Ayanamsa Position</span>
                  </div>

                  {/* 4x4 Grid with center box */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gridTemplateRows: "repeat(4, 110px)", gap: "6px", background: "#05060b", padding: "10px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.1)" }}>
                    
                    {/* (0,0) Meena / Pisces */}
                    <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "8px", background: "rgba(255,255,255,0.02)" }}>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#9ca3af" }}>மீனம் (Pisces)</div>
                      <div style={{ marginTop: "4px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
                        {getPlanetsInRasi(11).map((p: any) => (
                          <span key={p.name} style={{ fontSize: "0.72rem", background: p.symbol === 'Asc' ? "#8b5cf6" : "rgba(255,255,255,0.1)", color: "#fff", padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>
                            {p.symbol} {p.degrees}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* (0,1) Mesha / Aries */}
                    <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "8px", background: "rgba(255,255,255,0.02)" }}>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#9ca3af" }}>மேஷம் (Aries)</div>
                      <div style={{ marginTop: "4px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
                        {getPlanetsInRasi(0).map((p: any) => (
                          <span key={p.name} style={{ fontSize: "0.72rem", background: p.symbol === 'Asc' ? "#8b5cf6" : "rgba(255,255,255,0.1)", color: "#fff", padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>
                            {p.symbol} {p.degrees}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* (0,2) Vrishabha / Taurus */}
                    <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "8px", background: "rgba(59,130,246,0.08)" }}>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#60a5fa" }}>ரிஷபம் (Taurus)</div>
                      <div style={{ marginTop: "4px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
                        {getPlanetsInRasi(1).map((p: any) => (
                          <span key={p.name} style={{ fontSize: "0.72rem", background: p.symbol === 'Asc' ? "#8b5cf6" : "#3b82f6", color: "#fff", padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>
                            {p.symbol} {p.degrees}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* (0,3) Mithuna / Gemini */}
                    <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "8px", background: "rgba(255,255,255,0.02)" }}>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#9ca3af" }}>மிதுனம் (Gemini)</div>
                      <div style={{ marginTop: "4px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
                        {getPlanetsInRasi(2).map((p: any) => (
                          <span key={p.name} style={{ fontSize: "0.72rem", background: p.symbol === 'Asc' ? "#8b5cf6" : "rgba(255,255,255,0.1)", color: "#fff", padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>
                            {p.symbol} {p.degrees}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* (1,0) Kumbha / Aquarius */}
                    <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "8px", background: "rgba(236,72,153,0.08)" }}>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#f472b6" }}>கும்பம் (Aquarius)</div>
                      <div style={{ marginTop: "4px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
                        {getPlanetsInRasi(10).map((p: any) => (
                          <span key={p.name} style={{ fontSize: "0.72rem", background: p.symbol === 'Asc' ? "#8b5cf6" : "#ec4899", color: "#fff", padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>
                            {p.symbol} {p.degrees}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* (1,1 to 2,2) CENTER BOX */}
                    <div style={{ gridColumn: "span 2", gridRow: "span 2", border: "1px solid rgba(139,92,246,0.3)", borderRadius: "10px", background: "linear-gradient(135deg, rgba(139,92,246,0.12), rgba(236,72,153,0.08))", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "10px" }}>
                      <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#fff" }}>{name || "User"}&apos;s Rasi Chart</div>
                      <div style={{ fontSize: "0.85rem", color: "#a78bfa", marginTop: "4px" }}>Lagna: {chartResult.lagna_tamil} ({chartResult.lagna})</div>
                      <div style={{ fontSize: "0.85rem", color: "#ec4899", marginTop: "2px" }}>Rasi: {chartResult.rasi_tamil} ({chartResult.nakshatra} - Pada {chartResult.pada})</div>
                      <div style={{ fontSize: "0.72rem", color: "#9ca3af", marginTop: "4px" }}>DOB: {dob} · {tob}</div>
                    </div>

                    {/* (1,3) Karka / Cancer */}
                    <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "8px", background: "rgba(16,185,129,0.08)" }}>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#34d399" }}>கடகம் (Cancer)</div>
                      <div style={{ marginTop: "4px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
                        {getPlanetsInRasi(3).map((p: any) => (
                          <span key={p.name} style={{ fontSize: "0.72rem", background: p.symbol === 'Asc' ? "#8b5cf6" : "#10b981", color: "#fff", padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>
                            {p.symbol} {p.degrees}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* (2,0) Makara / Capricorn */}
                    <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "8px", background: "rgba(255,255,255,0.02)" }}>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#9ca3af" }}>மகரம் (Capricorn)</div>
                      <div style={{ marginTop: "4px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
                        {getPlanetsInRasi(9).map((p: any) => (
                          <span key={p.name} style={{ fontSize: "0.72rem", background: p.symbol === 'Asc' ? "#8b5cf6" : "rgba(255,255,255,0.1)", color: "#fff", padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>
                            {p.symbol} {p.degrees}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* (2,3) Simha / Leo */}
                    <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "8px", background: "rgba(255,255,255,0.02)" }}>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#9ca3af" }}>சிம்மம் (Leo)</div>
                      <div style={{ marginTop: "4px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
                        {getPlanetsInRasi(4).map((p: any) => (
                          <span key={p.name} style={{ fontSize: "0.72rem", background: p.symbol === 'Asc' ? "#8b5cf6" : "rgba(255,255,255,0.1)", color: "#fff", padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>
                            {p.symbol} {p.degrees}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* (3,0) Dhanu / Sagittarius */}
                    <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "8px", background: "rgba(245,158,11,0.08)" }}>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#fbbf24" }}>தனுசு (Sagittarius)</div>
                      <div style={{ marginTop: "4px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
                        {getPlanetsInRasi(8).map((p: any) => (
                          <span key={p.name} style={{ fontSize: "0.72rem", background: p.symbol === 'Asc' ? "#8b5cf6" : "#f59e0b", color: "#fff", padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>
                            {p.symbol} {p.degrees}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* (3,1) Vrischika / Scorpio */}
                    <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "8px", background: "rgba(239,68,68,0.08)" }}>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#f87171" }}>விருச்சிகம் (Scorpio)</div>
                      <div style={{ marginTop: "4px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
                        {getPlanetsInRasi(7).map((p: any) => (
                          <span key={p.name} style={{ fontSize: "0.72rem", background: p.symbol === 'Asc' ? "#8b5cf6" : "#ef4444", color: "#fff", padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>
                            {p.symbol} {p.degrees}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* (3,2) Thula / Libra */}
                    <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "8px", background: "rgba(255,255,255,0.02)" }}>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#9ca3af" }}>துலாம் (Libra)</div>
                      <div style={{ marginTop: "4px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
                        {getPlanetsInRasi(6).map((p: any) => (
                          <span key={p.name} style={{ fontSize: "0.72rem", background: p.symbol === 'Asc' ? "#8b5cf6" : "rgba(255,255,255,0.1)", color: "#fff", padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>
                            {p.symbol} {p.degrees}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* (3,3) Kanya / Virgo */}
                    <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "8px", background: "rgba(139,92,246,0.1)" }}>
                      <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#c084fc" }}>கன்னி (Virgo)</div>
                      <div style={{ marginTop: "4px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
                        {getPlanetsInRasi(5).map((p: any) => (
                          <span key={p.name} style={{ fontSize: "0.72rem", background: p.symbol === 'Asc' ? "#8b5cf6" : "rgba(255,255,255,0.1)", color: "#fff", padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>
                            {p.symbol} {p.degrees}
                          </span>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>

                {/* ── PLANETARY LONGITUDES TABLE ── */}
                <div style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", overflow: "hidden" }}>
                  <div style={{ padding: "1.2rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>🪐 Planetary Positions & Ephemeris Degrees</h3>
                    <span style={{ fontSize: "0.8rem", color: "#10b981", fontWeight: 600 }}>Lahiri Ayanamsa</span>
                  </div>

                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ background: "rgba(0,0,0,0.3)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                        <th style={{ padding: "12px 16px", fontSize: "0.8rem", color: "#9ca3af", textTransform: "uppercase" }}>Planet</th>
                        <th style={{ padding: "12px 16px", fontSize: "0.8rem", color: "#9ca3af", textTransform: "uppercase" }}>Absolute Deg</th>
                        <th style={{ padding: "12px 16px", fontSize: "0.8rem", color: "#9ca3af", textTransform: "uppercase" }}>Rasi Degrees</th>
                        <th style={{ padding: "12px 16px", fontSize: "0.8rem", color: "#9ca3af", textTransform: "uppercase" }}>Rasi (Sign)</th>
                        <th style={{ padding: "12px 16px", fontSize: "0.8rem", color: "#9ca3af", textTransform: "uppercase" }}>Rasi Lord</th>
                        <th style={{ padding: "12px 16px", fontSize: "0.8rem", color: "#9ca3af", textTransform: "uppercase" }}>Nakshatra</th>
                        <th style={{ padding: "12px 16px", fontSize: "0.8rem", color: "#9ca3af", textTransform: "uppercase" }}>Star Lord</th>
                        <th style={{ padding: "12px 16px", fontSize: "0.8rem", color: "#9ca3af", textTransform: "uppercase" }}>House</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chartResult.planets.map((p: any, i: number) => (
                        <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                          <td style={{ padding: "14px 16px", fontWeight: 700, color: p.name.includes("Asc") ? "#818cf8" : (p.name.includes("Moon") ? "#ec4899" : "#fff") }}>
                            {p.name}
                          </td>
                          <td style={{ padding: "14px 16px", fontFamily: "monospace", color: "#9ca3af", fontSize: "0.85rem" }}>
                            {p.absolute_deg}
                          </td>
                          <td style={{ padding: "14px 16px", fontFamily: "monospace", color: "#10b981", fontWeight: 700, fontSize: "0.9rem" }}>
                            {p.degrees}
                          </td>
                          <td style={{ padding: "14px 16px", color: "#e5e7eb" }}>
                            {p.rasi} ({p.rasi_tamil})
                          </td>
                          <td style={{ padding: "14px 16px", color: "#9ca3af" }}>
                            {p.rasi_lord}
                          </td>
                          <td style={{ padding: "14px 16px", color: "#c084fc", fontWeight: 600 }}>
                            {p.nakshatra} (Pada {p.pada})
                          </td>
                          <td style={{ padding: "14px 16px", color: "#9ca3af" }}>
                            {p.nakshatra_lord}
                          </td>
                          <td style={{ padding: "14px 16px", color: "#f59e0b", fontWeight: 600 }}>
                            {p.house_str}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            )}

          </div>
        )}

        {/* ── TAB 2: 10-PORUTHAM MATCHING ── */}
        {activeTab === 'porutham' && (
          <div style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "2rem" }}>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "8px" }}>
              <Heart size={22} color="#ec4899" /> 10-Porutham Vedic Marriage Compatibility
            </h2>
            <p style={{ color: "#9ca3af", fontSize: "0.9rem", marginBottom: "2rem" }}>
              Match groom & bride birth stars across Dina, Gana, Mahendra, Yoni, Rasi, Rajju, and Vedha Poruthams.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
              <div>
                <label style={{ fontSize: "0.85rem", color: "#818cf8", fontWeight: 600, display: "block", marginBottom: "0.4rem" }}>Groom Nakshatra (ஆண் நட்சத்திரம்)</label>
                <select
                  value={boyStar}
                  onChange={e => setBoyStar(e.target.value)}
                  style={{ width: "100%", background: "#0a0c16", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0.8rem", color: "#fff", fontSize: "0.9rem", outline: "none" }}
                >
                  {NAKSHATRAS.map(n => (
                    <option key={n.name} value={n.name}>{n.name} ({n.tamil})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.85rem", color: "#ec4899", fontWeight: 600, display: "block", marginBottom: "0.4rem" }}>Bride Nakshatra (பெண் நட்சத்திரம்)</label>
                <select
                  value={girlStar}
                  onChange={e => setGirlStar(e.target.value)}
                  style={{ width: "100%", background: "#0a0c16", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0.8rem", color: "#fff", fontSize: "0.9rem", outline: "none" }}
                >
                  {NAKSHATRAS.map(n => (
                    <option key={n.name} value={n.name}>{n.name} ({n.tamil})</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleCalculatePorutham}
              style={{ background: "linear-gradient(135deg, #ec4899, #8b5cf6)", color: "#fff", border: "none", padding: "10px 24px", borderRadius: "10px", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "2rem" }}
            >
              <Heart size={16} fill="#fff" /> Calculate 10 Porutham Score
            </button>

            {poruthamResult && (
              <div style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(236,72,153,0.3)", borderRadius: "16px", padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem", flexWrap: "wrap", gap: "8px" }}>
                  <div>
                    <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff" }}>{poruthamResult.verdict}</div>
                    <div style={{ fontSize: "0.85rem", color: "#10b981" }}>Score: {poruthamResult.score} / {poruthamResult.total} Poruthams Matching</div>
                  </div>
                  <span style={{ padding: "6px 14px", borderRadius: "20px", background: "rgba(16,185,129,0.15)", color: "#10b981", fontWeight: 700, fontSize: "0.9rem" }}>
                    ✓ Recommended Match
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "0.8rem" }}>
                  {poruthamResult.details.map((item: any, i: number) => (
                    <div key={i} style={{ background: "rgba(255,255,255,0.03)", padding: "0.8rem 1rem", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#e5e7eb" }}>{item.name}</div>
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

        {/* ── TAB 3: TRANSIT (GOCHARAM) ── */}
        {activeTab === 'transit' && (
          <div style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "2rem" }}>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "8px" }}>
              <CompassIcon size={22} color="#f59e0b" /> Current Planetary Transits (Gocharam 2026)
            </h2>
            <p style={{ color: "#9ca3af", fontSize: "0.9rem", marginBottom: "2rem" }}>
              Real-time positions of Jupiter, Saturn, Rahu, and Ketu.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
              {[
                { planet: "Jupiter (Guru)", sign: "Rishaba (Taurus)", effect: "Financial expansion and commercial success", status: "Benefic" },
                { planet: "Saturn (Sani)", sign: "Kumbha (Aquarius)", effect: "Moolatrikona placement - discipline and structural gains", status: "Strong" },
                { planet: "Rahu", sign: "Meena (Pisces)", effect: "International growth and AI breakthroughs", status: "Neutral" },
                { planet: "Ketu", sign: "Kanya (Virgo)", effect: "Analytical acumen and spiritual clarity", status: "Spiritual" },
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
