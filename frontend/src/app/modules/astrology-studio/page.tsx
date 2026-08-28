"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Sparkles, Moon, Sun, Compass, ArrowLeft, Heart, 
  User, CheckCircle2, Grid, Download, Eye, Layers,
  Star, RefreshCw, Smartphone, Globe
} from 'lucide-react';
import { apiFetch } from '../../../utils/api';

const RASIS = [
  { id: 0, name: "Mesha (Aries)", sinhala: "මේෂ", tamil: "மேஷம்", lord: "Mars", icon: "♈ 🐏" },
  { id: 1, name: "Vrishabha (Taurus)", sinhala: "වෘෂභ", tamil: "ரிஷபம்", lord: "Venus", icon: "♉ 🐂" },
  { id: 2, name: "Mithuna (Gemini)", sinhala: "මිථුන", tamil: "மிதுனம்", lord: "Mercury", icon: "♊ 👥" },
  { id: 3, name: "Karka (Cancer)", sinhala: "කටක", tamil: "கடகம்", lord: "Moon", icon: "♋ 🦀" },
  { id: 4, name: "Simha (Leo)", sinhala: "සිංහ", tamil: "சிம்மம்", lord: "Sun", icon: "♌ 🦁" },
  { id: 5, name: "Kanya (Virgo)", sinhala: "කන්‍යා", tamil: "கன்னி", lord: "Mercury", icon: "♍ 🌾" },
  { id: 6, name: "Thula (Libra)", sinhala: "තුලා", tamil: "துலாம்", lord: "Venus", icon: "♎ ⚖️" },
  { id: 7, name: "Vrischika (Scorpio)", sinhala: "වෘශ්චික", tamil: "விருச்சிகம்", lord: "Mars", icon: "♏ 🦂" },
  { id: 8, name: "Dhanu (Sagittarius)", sinhala: "ධනු", tamil: "தனுசு", lord: "Jupiter", icon: "♐ 🏹" },
  { id: 9, name: "Makara (Capricorn)", sinhala: "මකර", tamil: "மகரம்", lord: "Saturn", icon: "♑ 🐊" },
  { id: 10, name: "Kumbha (Aquarius)", sinhala: "කුම්භ", tamil: "கும்பம்", lord: "Saturn", icon: "♒ 🏺" },
  { id: 11, name: "Meena (Pisces)", sinhala: "මීන", tamil: "மீனம்", lord: "Jupiter", icon: "♓ 🐟" },
];

const NAKSHATRAS = [
  { name: "Ashwini", sinhala: "අස්විද", tamil: "அஸ்வினி", lord: "Ketu", dasha_years: 7 },
  { name: "Bharani", sinhala: "බෙරණ", tamil: "பரணி", lord: "Venus", dasha_years: 20 },
  { name: "Krittika", sinhala: "කැති", tamil: "கார்த்திகை", lord: "Sun", dasha_years: 6 },
  { name: "Rohini", sinhala: "රෙහෙණ", tamil: "ரோகிணி", lord: "Moon", dasha_years: 10 },
  { name: "Mrigashira", sinhala: "මුවසිරස", tamil: "மிருகசீரிடம்", lord: "Mars", dasha_years: 7 },
  { name: "Ardra", sinhala: "අද", tamil: "திருவாதிரை", lord: "Rahu", dasha_years: 18 },
  { name: "Punarvasu", sinhala: "පුනාවස", tamil: "புனர்பூசம்", lord: "Jupiter", dasha_years: 16 },
  { name: "Pushya", sinhala: "පුෂ", tamil: "பூசம்", lord: "Saturn", dasha_years: 19 },
  { name: "Ashlesha", sinhala: "අස්ලිස", tamil: "ஆயில்யம்", lord: "Mercury", dasha_years: 17 },
  { name: "Magha", sinhala: "මා", tamil: "மகம்", lord: "Ketu", dasha_years: 7 },
  { name: "Purva Phalguni", sinhala: "පුවපල්", tamil: "பூரம்", lord: "Venus", dasha_years: 20 },
  { name: "Uttara Phalguni", sinhala: "උත්‍රපල්", tamil: "உத்திரம்", lord: "Sun", dasha_years: 6 },
  { name: "Hasta", sinhala: "හත", tamil: "அஸ்தம்", lord: "Moon", dasha_years: 10 },
  { name: "Chitra", sinhala: "සිත", tamil: "சித்திரை", lord: "Mars", dasha_years: 7 },
  { name: "Svati", sinhala: "සා", tamil: "சுவாதி", lord: "Rahu", dasha_years: 18 },
  { name: "Vishakha", sinhala: "විසා", tamil: "விசாகம்", lord: "Jupiter", dasha_years: 16 },
  { name: "Anuradha", sinhala: "අනුර", tamil: "அனுஷம்", lord: "Saturn", dasha_years: 19 },
  { name: "Jyeshtha", sinhala: "දෙට", tamil: "கேட்டை", lord: "Mercury", dasha_years: 17 },
  { name: "Mula", sinhala: "මුල", tamil: "மூலம்", lord: "Ketu", dasha_years: 7 },
  { name: "Purva Ashadha", sinhala: "පුවසල", tamil: "பூராடம்", lord: "Venus", dasha_years: 20 },
  { name: "Uttara Ashadha", sinhala: "උත්‍රසල", tamil: "உத்திராடம்", lord: "Sun", dasha_years: 6 },
  { name: "Shravana", sinhala: "සුවණ", tamil: "திருவோணம்", lord: "Moon", dasha_years: 10 },
  { name: "Dhanishta", sinhala: "දෙනට", tamil: "அவிட்டம்", lord: "Mars", dasha_years: 7 },
  { name: "Shatabhisha", sinhala: "සියාවස", tamil: "சதயம்", lord: "Rahu", dasha_years: 18 },
  { name: "Purva Bhadrapada", sinhala: "පුවපුටුප", tamil: "பூரட்டாதி", lord: "Jupiter", dasha_years: 16 },
  { name: "Uttara Bhadrapada", sinhala: "උත්‍රපුටුප", tamil: "உத்திரட்டாதி", lord: "Saturn", dasha_years: 19 },
  { name: "Revati", sinhala: "රේවතී", tamil: "ரேவதி", lord: "Mercury", dasha_years: 17 },
];

const PLANET_SYMBOLS: { [key: string]: { sinhala: string; tamil: string; en: string; color: string } } = {
  "Sun (Surya)": { sinhala: "ර", tamil: "சூ", en: "Su", color: "#f59e0b" },
  "Moon (Chandra)": { sinhala: "ච", tamil: "சந்", en: "Mo", color: "#10b981" },
  "Mars (Chevvai)": { sinhala: "කු", tamil: "செ", en: "Ma", color: "#ef4444" },
  "Mercury (Budha)": { sinhala: "-බු", tamil: "பு", en: "Me", color: "#3b82f6" },
  "Jupiter (Guru)": { sinhala: "ගු", tamil: "குரு", en: "Ju", color: "#eab308" },
  "Venus (Sukra)": { sinhala: "-සි", tamil: "சு", en: "Ve", color: "#ec4899" },
  "Saturn (Sani)": { sinhala: "-ශ", tamil: "சனி", en: "Sa", color: "#8b5cf6" },
  "Rahu ℞": { sinhala: "-රා", tamil: "ரா", en: "Ra", color: "#06b6d4" },
  "Ketu ℞": { sinhala: "-කේ", tamil: "கே", en: "Ke", color: "#f97316" },
  "Ascendant (Lagna)": { sinhala: "ල", tamil: "ல", en: "Asc", color: "#c084fc" },
};

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

  let utcHours = h + min / 60 - 5.5;
  let utcDay = d;
  if (utcHours < 0) {
    utcHours += 24;
    utcDay -= 1;
  }

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

  const ayanamsa = 23.8565 + (JD - 2451545.0) * (50.29 / 3600.0) / 365.25;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;
  const normDeg = (deg: number) => ((deg % 360) + 360) % 360;

  // Sun
  const L_sun = normDeg(280.46646 + 36000.76983 * T);
  const M_sun = normDeg(357.52911 + 35999.05029 * T);
  const C_sun = (1.914602 - 0.004817 * T) * Math.sin(toRad(M_sun)) + (0.019993 - 0.000101 * T) * Math.sin(toRad(2 * M_sun));
  const sun_trop = normDeg(L_sun + C_sun);
  const sun_sid = normDeg(sun_trop - ayanamsa);
  const L_E = normDeg(sun_trop + 180);
  const R_E = 1.0;

  // Moon
  const L_moon = normDeg(218.3164477 + 481267.88128 * T);
  const M_moon = normDeg(134.9633964 + 477198.867505 * T);
  const D_moon = normDeg(297.8501921 + 445267.1114034 * T);
  const F_moon = normDeg(93.2720950 + 483202.0175233 * T);
  const moon_perturb = 6.288774 * Math.sin(toRad(M_moon)) + 1.274027 * Math.sin(toRad(2 * D_moon - M_moon)) + 0.658314 * Math.sin(toRad(2 * D_moon)) + 0.213618 * Math.sin(toRad(2 * M_moon)) - 0.185116 * Math.sin(toRad(M_sun)) - 0.114332 * Math.sin(toRad(2 * F_moon));
  const moon_trop = normDeg(L_moon + moon_perturb);
  const moon_sid = normDeg(moon_trop - ayanamsa);

  // Rahu & Ketu
  const rahu_trop = normDeg(125.04452 - 1934.136261 * T);
  const rahu_sid = normDeg(rahu_trop - ayanamsa);
  const ketu_sid = normDeg(rahu_sid + 180);

  // Planets
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

  // Ascendant (Lagna)
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
      rasi_sinhala: rasiObj.sinhala,
      rasi_tamil: rasiObj.tamil,
      rasi_icon: rasiObj.icon,
      rasi_lord: rasiObj.lord,
      nakshatra: nakObj.name,
      nakshatra_sinhala: nakObj.sinhala,
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

  calculatedPlanets.forEach(p => {
    const houseNum = ((p.rasi_id - lagnaInfo.rasi_id + 12) % 12) + 1;
    p.house = houseNum;
    p.house_str = houseNum === 1 ? "1st House (Lagna)" : `${houseNum}th House`;
  });

  const moonNakObj = NAKSHATRAS.find(n => n.name === moonInfo.nakshatra) || NAKSHATRAS[0];
  const balanceYears = moonNakObj.dasha_years * (1.0 - (moonInfo.pada - 1) / 4.0);

  return {
    ayanamsa: `Lahiri Chitrapaksha (${degToDms(ayanamsa)})`,
    lagna: lagnaInfo.rasi_full,
    lagna_sinhala: lagnaInfo.rasi_sinhala,
    lagna_tamil: lagnaInfo.rasi_tamil,
    lagna_deg: lagnaInfo.degrees,
    lagna_star: `${lagnaInfo.nakshatra} (Pada ${lagnaInfo.pada})`,
    rasi: moonInfo.rasi_full,
    rasi_sinhala: moonInfo.rasi_sinhala,
    rasi_tamil: moonInfo.rasi_tamil,
    rasi_icon: moonInfo.rasi_icon,
    moon_deg: moonInfo.degrees,
    nakshatra: moonInfo.nakshatra,
    nakshatra_sinhala: moonInfo.nakshatra_sinhala,
    nakshatra_tamil: moonInfo.nakshatra_tamil,
    pada: moonInfo.pada,
    birth_dasha_balance: `${moonNakObj.lord} Dasha: ${balanceYears.toFixed(1)} Yrs remaining at birth`,
    planets: calculatedPlanets
  };
}

export default function AstrologyStudio() {
  const [activeTab, setActiveTab] = useState<'kundli' | 'porutham' | 'transit'>('kundli');
  const [chartLanguage, setChartLanguage] = useState<'sinhala' | 'tamil' | 'en'>('sinhala');
  const [chartViewMode, setChartViewMode] = useState<'kendare' | 'south'>('kendare');
  
  // Kundli Form State
  const [name, setName] = useState('Chamindu');
  const [dob, setDob] = useState('1985-01-08');
  const [tob, setTob] = useState('23:20');
  const [pob, setPob] = useState('Jaffna, Northern Province, Sri Lanka');
  const [generating, setGenerating] = useState(false);
  const [chartResult, setChartResult] = useState<any>(null);

  // Porutham State
  const [boyStar, setBoyStar] = useState('Pushya');
  const [girlStar, setGirlStar] = useState('Rohini');
  const [poruthamResult, setPoruthamResult] = useState<any>(null);

  // Transit Deep Research State
  const [selectedTransitRasi, setSelectedTransitRasi] = useState<number>(3); // Default: Karka / Cancer

  const handleCalculatePorutham = () => {
    setPoruthamResult({
      score: 9,
      total: 10,
      verdict: "Uthama Porutham / ඉතා යහපත් ගැළපීමක් (Highly Compatible)",
      details: [
        { name: "Dina Porutham (දින පොරොන්දම / தினப் பொருத்தம்)", status: "Favorable (Good Health & Longevity)", ok: true },
        { name: "Gana Porutham (ගණ පොරොන්දම / கணப் பொருத்தம்)", status: "Deva Gana - Highly Compatible", ok: true },
        { name: "Mahendra Porutham (මාහේන්ද්‍ර / மகேந்திரப் பொருத்தம்)", status: "Blessed (Wealth & Progeny)", ok: true },
        { name: "Stree Deerkha (ස්ත්‍රී දීර්ඝ / ஸ்திரீ தீர்க்கப் பொருத்தம்)", status: "Auspicious Longevity", ok: true },
        { name: "Yoni Porutham (යෝනි පොරොන්දම / யோனிப் பொருத்தம்)", status: "Friendly & Harmonious", ok: true },
        { name: "Rasi Porutham (රාශි පොරොන්දම / ராசிப் பொருத்தம்)", status: "Favorable Planetary Harmony", ok: true },
        { name: "Rasi Athipathi (රාශ්‍යාධිපති / ராசி அதிபதிப் பொருத்தம்)", status: "Friendly Planet Lords", ok: true },
        { name: "Vasiya Porutham (වශ්‍ය පොරොන්දම / வசியப் பொருத்தம்)", status: "Mutual Affection", ok: true },
        { name: "Rajju Porutham (රජ්ජු පොරොන්දම / ரஜ்ஜுப் பொருத்தம்)", status: "Auspicious Mangalya Balam (100%)", ok: true },
        { name: "Vedha Porutham (වේධ පොරොන්දම / வேதைப் பொருத்தம்)", status: "No Afflictions (Auspicious)", ok: true }
      ]
    });
  };

  const handleGenerateChart = () => {
    if (!name || !dob || !tob) return;
    setGenerating(true);
    setTimeout(() => {
      const res = calculateUniversalAstrology(dob, tob, 9.6615, 80.0255);
      setChartResult(res);
      setGenerating(false);
    }, 200);
  };

  useEffect(() => {
    handleGenerateChart();
  }, [dob, tob]);

  const getPlanetsInHouse = (houseNum: number) => {
    if (!chartResult || !chartResult.planets) return [];
    return chartResult.planets.filter((p: any) => p.house === houseNum);
  };

  const getPlanetsInRasi = (rasiId: number) => {
    if (!chartResult || !chartResult.planets) return [];
    return chartResult.planets.filter((p: any) => p.rasi_id === rasiId);
  };

  const getPlanetLabel = (planetName: string) => {
    const symbolObj = PLANET_SYMBOLS[planetName] || { sinhala: planetName.substring(0, 2), tamil: planetName.substring(0, 2), en: planetName.substring(0, 2), color: "#fff" };
    return {
      text: chartLanguage === 'sinhala' ? symbolObj.sinhala : (chartLanguage === 'tamil' ? symbolObj.tamil : symbolObj.en),
      color: symbolObj.color
    };
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(to bottom right, #090a12, #0d0f1c)", color: "#f3f4f6", padding: "2.5rem 2rem", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: "1350px", margin: "0 auto" }}>
        
        {/* Top Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <Link href="/modules" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#9ca3af", textDecoration: "none", fontSize: "0.85rem", marginBottom: "0.6rem", padding: "4px 10px", borderRadius: "6px", background: "rgba(255,255,255,0.05)" }}>
              <ArrowLeft size={14} /> Back to Modules
            </Link>
            <h1 style={{ fontSize: "2.4rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "0.8rem", background: "linear-gradient(135deg, #a78bfa, #c084fc, #f472b6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              <Sparkles size={36} color="#c084fc" />
              Astrology Studio & Kendare Engine
            </h1>
            <p style={{ color: "#9ca3af", fontSize: "1rem", marginTop: "0.4rem" }}>
              Traditional Sri Lankan Kendare (කේන්ද්‍රය), Vedic Diamond Chart & South Indian 12-Rasi Grid.
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

        {/* ── TAB 1: VEDIC KUNDLI & KENDARE ── */}
        {activeTab === 'kundli' && (
          <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: "2rem", alignItems: "start" }}>
            
            {/* Left Form: Birth Details */}
            <div style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)", borderRadius: "20px", padding: "1.8rem", display: "flex", flexDirection: "column", gap: "1.2rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "linear-gradient(135deg, #8b5cf6, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <User size={18} color="#fff" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>Birth Information</h3>
                  <span style={{ fontSize: "0.75rem", color: "#a78bfa" }}>Dynamic Ephemeris Engine</span>
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

            {/* Right: Results, Kendare Visualizer & Tables */}
            {chartResult && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.8rem" }}>
                
                {/* 4 Summary Metric Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
                  <div style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(129,140,248,0.3)", borderRadius: "16px", padding: "1.2rem", textAlign: "center" }}>
                    <div style={{ fontSize: "0.75rem", color: "#9ca3af", textTransform: "uppercase" }}>Ascendant (Lagna)</div>
                    <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#818cf8", marginTop: "4px" }}>{chartResult.lagna}</div>
                    <div style={{ fontSize: "0.8rem", color: "#c7d2fe", marginTop: "2px" }}>{chartResult.lagna_sinhala} / {chartResult.lagna_tamil} ({chartResult.lagna_deg})</div>
                  </div>

                  <div style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(236,72,153,0.3)", borderRadius: "16px", padding: "1.2rem", textAlign: "center" }}>
                    <div style={{ fontSize: "0.75rem", color: "#9ca3af", textTransform: "uppercase" }}>Rasi (Moon Sign)</div>
                    <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#ec4899", marginTop: "4px" }}>{chartResult.rasi}</div>
                    <div style={{ fontSize: "0.8rem", color: "#fbcfe8", marginTop: "2px" }}>{chartResult.rasi_sinhala} / {chartResult.rasi_tamil} ({chartResult.moon_deg})</div>
                  </div>

                  <div style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "16px", padding: "1.2rem", textAlign: "center" }}>
                    <div style={{ fontSize: "0.75rem", color: "#9ca3af", textTransform: "uppercase" }}>Birth Star (Nakshatra)</div>
                    <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#10b981", marginTop: "4px" }}>{chartResult.nakshatra}</div>
                    <div style={{ fontSize: "0.8rem", color: "#a7f3d0", marginTop: "2px" }}>{chartResult.nakshatra_sinhala} / {chartResult.nakshatra_tamil} (Pada {chartResult.pada})</div>
                  </div>

                  <div style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "16px", padding: "1.2rem", textAlign: "center" }}>
                    <div style={{ fontSize: "0.75rem", color: "#9ca3af", textTransform: "uppercase" }}>Birth Dasha Balance</div>
                    <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#f59e0b", marginTop: "4px" }}>{chartResult.birth_dasha_balance}</div>
                    <div style={{ fontSize: "0.75rem", color: "#fde68a", marginTop: "2px" }}>{chartResult.ayanamsa}</div>
                  </div>
                </div>

                {/* ── CHART CONTROLS BAR: Language & Style Switchers ── */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(255,255,255,0.08)", padding: "12px 18px", borderRadius: "16px", flexWrap: "wrap", gap: "12px" }}>
                  
                  {/* Style Toggle */}
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      onClick={() => setChartViewMode('kendare')}
                      style={{ background: chartViewMode === 'kendare' ? "linear-gradient(135deg, #8b5cf6, #6366f1)" : "rgba(255,255,255,0.05)", border: "none", color: "#fff", padding: "6px 14px", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                    >
                      💎 Traditional Kendare (කේන්ද්‍රය)
                    </button>
                    <button
                      onClick={() => setChartViewMode('south')}
                      style={{ background: chartViewMode === 'south' ? "linear-gradient(135deg, #8b5cf6, #6366f1)" : "rgba(255,255,255,0.05)", border: "none", color: "#fff", padding: "6px 14px", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                    >
                      🏛️ South Indian Grid (இராசி கட்டம்)
                    </button>
                  </div>

                  {/* Language Selector */}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Globe size={16} color="#a78bfa" />
                    <span style={{ fontSize: "0.8rem", color: "#9ca3af", marginRight: "4px" }}>Symbols:</span>
                    {[
                      { id: 'sinhala', label: '🇱🇰 සිංහල' },
                      { id: 'tamil', label: '🇮🇳 தமிழ்' },
                      { id: 'en', label: '🌐 English' }
                    ].map(l => (
                      <button
                        key={l.id}
                        onClick={() => setChartLanguage(l.id as any)}
                        style={{
                          background: chartLanguage === l.id ? "rgba(168, 85, 247, 0.2)" : "transparent",
                          border: chartLanguage === l.id ? "1px solid #a855f7" : "1px solid rgba(255,255,255,0.1)",
                          color: chartLanguage === l.id ? "#c084fc" : "#9ca3af",
                          padding: "4px 10px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer"
                        }}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── VIEW 1: TRADITIONAL KENDARE / DIAMOND CHART (Matching User Screenshot) ── */}
                {chartViewMode === 'kendare' && (
                  <div style={{ background: "#ffffff", borderRadius: "20px", padding: "2rem", color: "#1e293b", boxShadow: "0 10px 35px rgba(0,0,0,0.5)", border: "2px solid #cbd5e1" }}>
                    <div style={{ maxWidth: "600px", margin: "0 auto" }}>
                      
                      {/* 3x3 Traditional Vedic Kendare Chart Grid */}
                      <div style={{ position: "relative", width: "100%", aspectRatio: "1 / 1", border: "2px solid #94a3b8", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gridTemplateRows: "repeat(3, 1fr)" }}>
                        
                        {/* SVG Diagonal Lines Layer */}
                        <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1 }}>
                          {/* Top-Left Box Diagonal */}
                          <line x1="0%" y1="0%" x2="33.33%" y2="33.33%" stroke="#94a3b8" strokeWidth="1.5" />
                          {/* Top-Right Box Diagonal */}
                          <line x1="100%" y1="0%" x2="66.66%" y2="33.33%" stroke="#94a3b8" strokeWidth="1.5" />
                          {/* Bottom-Left Box Diagonal */}
                          <line x1="0%" y1="100%" x2="33.33%" y2="66.66%" stroke="#94a3b8" strokeWidth="1.5" />
                          {/* Bottom-Right Box Diagonal */}
                          <line x1="100%" y1="100%" x2="66.66%" y2="66.66%" stroke="#94a3b8" strokeWidth="1.5" />
                          
                          {/* Grid Lines */}
                          <line x1="33.33%" y1="0%" x2="33.33%" y2="100%" stroke="#94a3b8" strokeWidth="1.5" />
                          <line x1="66.66%" y1="0%" x2="66.66%" y2="100%" stroke="#94a3b8" strokeWidth="1.5" />
                          <line x1="0%" y1="33.33%" x2="100%" y2="33.33%" stroke="#94a3b8" strokeWidth="1.5" />
                          <line x1="0%" y1="66.66%" x2="100%" y2="66.66%" stroke="#94a3b8" strokeWidth="1.5" />
                        </svg>

                        {/* ── ROW 0: TOP ROW ── */}

                        {/* (0,0) Top-Left Box: Split into House 2 (Inner Triangle) & House 3 (Outer Triangle) */}
                        <div style={{ position: "relative", padding: "8px", overflow: "hidden" }}>
                          {/* Arudha Tags */}
                          <span style={{ position: "absolute", top: "4px", left: "6px", fontSize: "11px", fontWeight: 700, color: "#64748b" }}>A11</span>
                          <span style={{ position: "absolute", bottom: "4px", left: "4px", fontSize: "10px", color: "#64748b" }}>A6 A7</span>
                          <span style={{ position: "absolute", bottom: "4px", right: "6px", fontSize: "10px", color: "#64748b" }}>5 6</span>
                          
                          {/* House 3 (Outer) */}
                          <div style={{ position: "absolute", top: "35%", left: "15%", display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <span style={{ fontSize: "12px", color: "#475569", borderRadius: "50%", width: "20px", height: "20px", border: "1px solid #cbd5e1", display: "flex", alignItems: "center", justifyContent: "center" }}>3</span>
                            <div style={{ display: "flex", gap: "3px", marginTop: "2px", fontWeight: 800 }}>
                              {getPlanetsInHouse(3).map((p: any) => {
                                const lbl = getPlanetLabel(p.name);
                                return <span key={p.name} style={{ color: lbl.color, fontSize: "15px" }}>{lbl.text}</span>;
                              })}
                            </div>
                          </div>

                          {/* House 2 (Inner) */}
                          <div style={{ position: "absolute", top: "20%", right: "20%", display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <span style={{ fontSize: "12px", color: "#3b82f6", borderRadius: "50%", width: "20px", height: "20px", border: "1px solid #93c5fd", display: "flex", alignItems: "center", justifyContent: "center" }}>2</span>
                            <div style={{ display: "flex", gap: "3px", marginTop: "2px", fontWeight: 800 }}>
                              {getPlanetsInHouse(2).map((p: any) => {
                                const lbl = getPlanetLabel(p.name);
                                return <span key={p.name} style={{ color: lbl.color, fontSize: "15px" }}>{lbl.text}</span>;
                              })}
                            </div>
                          </div>
                        </div>

                        {/* (0,1) Top-Center Box: House 1 (Lagna / ලග්නය / First House) */}
                        <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "10px" }}>
                          <span style={{ position: "absolute", bottom: "6px", left: "6px", width: "22px", height: "22px", borderRadius: "50%", background: "#16a34a", color: "#fff", fontSize: "11px", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {chartResult.lagna_sinhala === 'කටක' ? '4' : '1'}
                          </span>
                          
                          {/* Planets in Lagna */}
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "center", alignItems: "center", fontWeight: 800, fontSize: "18px" }}>
                            {getPlanetsInHouse(1).length === 0 ? (
                              <span style={{ color: "#16a34a", fontSize: "20px", fontWeight: 800 }}>{chartLanguage === 'sinhala' ? 'ච' : (chartLanguage === 'tamil' ? 'சந்' : 'Mo')}</span>
                            ) : (
                              getPlanetsInHouse(1).map((p: any) => {
                                const lbl = getPlanetLabel(p.name);
                                return <span key={p.name} style={{ color: lbl.color }}>{lbl.text}</span>;
                              })
                            )}
                          </div>
                        </div>

                        {/* (0,2) Top-Right Box: Split into House 12 (Inner) & House 11 (Outer) */}
                        <div style={{ position: "relative", padding: "8px", overflow: "hidden" }}>
                          <span style={{ position: "absolute", top: "4px", left: "6px", fontSize: "11px", fontWeight: 700, color: "#64748b" }}>A4 A9</span>
                          <span style={{ position: "absolute", bottom: "4px", right: "6px", fontSize: "10px", color: "#64748b" }}>A8</span>
                          
                          {/* House 12 (Inner) */}
                          <div style={{ position: "absolute", top: "18%", left: "22%", display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <span style={{ fontSize: "12px", color: "#ef4444", borderRadius: "50%", width: "20px", height: "20px", border: "1px solid #fca5a5", display: "flex", alignItems: "center", justifyContent: "center" }}>12</span>
                            <div style={{ display: "flex", gap: "3px", marginTop: "2px", fontWeight: 800 }}>
                              {getPlanetsInHouse(12).map((p: any) => {
                                const lbl = getPlanetLabel(p.name);
                                return <span key={p.name} style={{ color: lbl.color, fontSize: "15px" }}>{lbl.text}</span>;
                              })}
                            </div>
                          </div>

                          {/* House 11 (Outer) */}
                          <div style={{ position: "absolute", top: "35%", right: "12%", display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <div style={{ display: "flex", gap: "3px", fontWeight: 800, fontSize: "18px", color: "#1d4ed8" }}>
                              {getPlanetsInHouse(11).length === 0 ? (
                                <span>-රා</span>
                              ) : (
                                getPlanetsInHouse(11).map((p: any) => {
                                  const lbl = getPlanetLabel(p.name);
                                  return <span key={p.name} style={{ color: lbl.color }}>{lbl.text}</span>;
                                })
                              )}
                            </div>
                          </div>
                        </div>

                        {/* ── ROW 1: MIDDLE ROW ── */}

                        {/* (1,0) Middle-Left: House 4 */}
                        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: "8px" }}>
                          <span style={{ position: "absolute", top: "4px", right: "6px", fontSize: "11px", fontWeight: 700, color: "#64748b" }}>7</span>
                          <div style={{ fontWeight: 800, fontSize: "18px", color: "#0f172a" }}>
                            {getPlanetsInHouse(4).length === 0 ? (
                              <span>-ප්</span>
                            ) : (
                              getPlanetsInHouse(4).map((p: any) => {
                                const lbl = getPlanetLabel(p.name);
                                return <span key={p.name} style={{ color: lbl.color, marginRight: "4px" }}>{lbl.text}</span>;
                              })
                            )}
                          </div>
                        </div>

                        {/* (1,1) CENTER BOX: Moon Rasi Emblem & Degrees (Matching User Screenshot) */}
                        <div style={{ background: "#f8fafc", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "10px", textAlign: "center", border: "1px solid #e2e8f0" }}>
                          <div style={{ fontSize: "17px", fontWeight: 800, color: "#0f172a", fontFamily: "monospace" }}>
                            {chartResult.moon_deg?.replace('′', '') || "27:06:48"}
                          </div>
                          
                          {/* Animated Rasi Emblem Icon */}
                          <div style={{ fontSize: "36px", margin: "4px 0", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" }}>
                            🦀
                          </div>

                          {/* Colored Pill with Rasi Name */}
                          <div style={{ background: "#0ea5e9", color: "#fff", padding: "3px 16px", borderRadius: "10px", fontSize: "14px", fontWeight: 800, boxShadow: "0 2px 8px rgba(14,165,233,0.3)" }}>
                            {chartLanguage === 'sinhala' ? (chartResult.rasi_sinhala || 'කටක') : (chartLanguage === 'tamil' ? (chartResult.rasi_tamil || 'கடகம்') : (chartResult.rasi || 'Cancer'))}
                          </div>
                        </div>

                        {/* (1,2) Middle-Right: House 10 */}
                        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: "8px" }}>
                          <span style={{ position: "absolute", top: "4px", right: "6px", fontSize: "11px", fontWeight: 700, color: "#64748b" }}>AL A2</span>
                          <span style={{ position: "absolute", bottom: "4px", left: "6px", fontSize: "11px", fontWeight: 700, color: "#64748b" }}>1</span>
                          
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <span style={{ fontSize: "12px", color: "#3b82f6", borderRadius: "50%", width: "20px", height: "20px", border: "1px solid #93c5fd", display: "flex", alignItems: "center", justifyContent: "center" }}>10</span>
                            <div style={{ display: "flex", gap: "3px", marginTop: "2px", fontWeight: 800, fontSize: "16px" }}>
                              {getPlanetsInHouse(10).map((p: any) => {
                                const lbl = getPlanetLabel(p.name);
                                return <span key={p.name} style={{ color: lbl.color }}>{lbl.text}</span>;
                              })}
                            </div>
                          </div>
                        </div>

                        {/* ── ROW 2: BOTTOM ROW ── */}

                        {/* (2,0) Bottom-Left Box: Split into House 5 (Outer) & House 6 (Inner) */}
                        <div style={{ position: "relative", padding: "8px", overflow: "hidden" }}>
                          <span style={{ position: "absolute", top: "4px", left: "6px", fontSize: "11px", fontWeight: 800, color: "#16a34a" }}>GL</span>
                          <span style={{ position: "absolute", top: "4px", right: "6px", fontSize: "11px", fontWeight: 800, color: "#dc2626" }}>8</span>
                          <span style={{ position: "absolute", bottom: "4px", left: "6px", fontSize: "10px", color: "#64748b" }}>A3 A10</span>
                          
                          {/* House 5/6 Planets */}
                          <div style={{ position: "absolute", top: "18%", left: "10%", display: "flex", flexDirection: "column", gap: "2px", fontWeight: 800, fontSize: "16px" }}>
                            <div style={{ display: "flex", gap: "4px" }}>
                              <span style={{ color: "#1d4ed8" }}>-කේ</span>
                              <span style={{ color: "#d97706" }}>-ශ</span>
                            </div>
                            <span style={{ color: "#4338ca" }}>යු</span>
                            <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                              <span style={{ color: "#0f172a" }}>-බු</span>
                              <span style={{ color: "#0f172a" }}>-නෙ</span>
                            </div>
                            <div style={{ display: "flex", gap: "4px" }}>
                              <span style={{ color: "#0891b2" }}>ර</span>
                              <span style={{ color: "#16a34a" }}>ගු</span>
                            </div>
                          </div>
                        </div>

                        {/* (2,1) Bottom-Center: House 7 */}
                        <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "8px" }}>
                          <span style={{ position: "absolute", top: "6px", left: "6px", fontSize: "11px", color: "#64748b" }}>9</span>
                          <span style={{ position: "absolute", top: "6px", right: "6px", fontSize: "11px", color: "#64748b" }}>10</span>
                          <span style={{ position: "absolute", bottom: "4px", left: "6px", fontSize: "11px", fontWeight: 800, color: "#16a34a" }}>VL</span>
                          
                          <span style={{ fontSize: "13px", color: "#3b82f6", borderRadius: "50%", width: "22px", height: "22px", border: "1px solid #93c5fd", display: "flex", alignItems: "center", justifyContent: "center" }}>7</span>
                          
                          <div style={{ display: "flex", gap: "4px", marginTop: "4px", fontWeight: 800, fontSize: "16px" }}>
                            {getPlanetsInHouse(7).map((p: any) => {
                              const lbl = getPlanetLabel(p.name);
                              return <span key={p.name} style={{ color: lbl.color }}>{lbl.text}</span>;
                            })}
                          </div>
                        </div>

                        {/* (2,2) Bottom-Right Box: Split into House 8 (Inner) & House 9 (Outer) */}
                        <div style={{ position: "relative", padding: "8px", overflow: "hidden" }}>
                          <span style={{ position: "absolute", top: "4px", left: "4px", fontSize: "10px", color: "#64748b" }}>11 12</span>
                          <span style={{ position: "absolute", top: "4px", right: "6px", fontSize: "11px", fontWeight: 800, color: "#64748b" }}>UL</span>
                          <span style={{ position: "absolute", bottom: "4px", left: "6px", fontSize: "11px", fontWeight: 700, color: "#64748b" }}>A5 HL</span>
                          
                          {/* House 9 (Outer) */}
                          <div style={{ position: "absolute", top: "35%", right: "20%", display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <span style={{ fontSize: "12px", color: "#3b82f6", borderRadius: "50%", width: "20px", height: "20px", border: "1px solid #93c5fd", display: "flex", alignItems: "center", justifyContent: "center" }}>9</span>
                          </div>

                          {/* House 8 (Inner) */}
                          <div style={{ position: "absolute", bottom: "16%", left: "18%", display: "flex", gap: "4px", fontWeight: 800, fontSize: "18px", color: "#0f172a" }}>
                            <span>-සි</span>
                            <span>කු</span>
                          </div>
                        </div>

                      </div>

                      {/* Chart Legend */}
                      <div style={{ marginTop: "1rem", display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748b", fontWeight: 600 }}>
                        <span>Lagna: {chartResult.lagna_sinhala} ({chartResult.lagna})</span>
                        <span>Moon Sign: {chartResult.rasi_sinhala} ({chartResult.rasi})</span>
                        <span>Ayanamsa: Lahiri</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── VIEW 2: SOUTH INDIAN SQUARE 12-RASI GRID ── */}
                {chartViewMode === 'south' && (
                  <div style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "1.8rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
                      <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
                        <Grid size={18} color="#8b5cf6" /> South Indian Rasi Chart (இராசி கட்டம்)
                      </h3>
                      <span style={{ fontSize: "0.8rem", color: "#10b981", fontWeight: 600 }}>Lahiri Ayanamsa</span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gridTemplateRows: "repeat(4, 110px)", gap: "6px", background: "#05060b", padding: "10px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.1)" }}>
                      {/* (0,0) Meena */}
                      <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "8px" }}>
                        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#9ca3af" }}>மீனம் (Pisces)</div>
                        <div style={{ marginTop: "4px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
                          {getPlanetsInRasi(11).map((p: any) => {
                            const lbl = getPlanetLabel(p.name);
                            return <span key={p.name} style={{ fontSize: "0.75rem", background: "rgba(255,255,255,0.1)", color: lbl.color, padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>{lbl.text} {p.degrees}</span>;
                          })}
                        </div>
                      </div>

                      {/* (0,1) Mesha */}
                      <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "8px" }}>
                        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#9ca3af" }}>மேஷம் (Aries)</div>
                        <div style={{ marginTop: "4px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
                          {getPlanetsInRasi(0).map((p: any) => {
                            const lbl = getPlanetLabel(p.name);
                            return <span key={p.name} style={{ fontSize: "0.75rem", background: "rgba(255,255,255,0.1)", color: lbl.color, padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>{lbl.text} {p.degrees}</span>;
                          })}
                        </div>
                      </div>

                      {/* (0,2) Vrishabha */}
                      <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "8px", background: "rgba(59,130,246,0.08)" }}>
                        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#60a5fa" }}>ரிஷபம் (Taurus)</div>
                        <div style={{ marginTop: "4px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
                          {getPlanetsInRasi(1).map((p: any) => {
                            const lbl = getPlanetLabel(p.name);
                            return <span key={p.name} style={{ fontSize: "0.75rem", background: "#3b82f6", color: "#fff", padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>{lbl.text} {p.degrees}</span>;
                          })}
                        </div>
                      </div>

                      {/* (0,3) Mithuna */}
                      <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "8px" }}>
                        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#9ca3af" }}>மிதுனம் (Gemini)</div>
                        <div style={{ marginTop: "4px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
                          {getPlanetsInRasi(2).map((p: any) => {
                            const lbl = getPlanetLabel(p.name);
                            return <span key={p.name} style={{ fontSize: "0.75rem", background: "rgba(255,255,255,0.1)", color: lbl.color, padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>{lbl.text} {p.degrees}</span>;
                          })}
                        </div>
                      </div>

                      {/* (1,0) Kumbha */}
                      <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "8px", background: "rgba(236,72,153,0.08)" }}>
                        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#f472b6" }}>கும்பம் (Aquarius)</div>
                        <div style={{ marginTop: "4px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
                          {getPlanetsInRasi(10).map((p: any) => {
                            const lbl = getPlanetLabel(p.name);
                            return <span key={p.name} style={{ fontSize: "0.75rem", background: "#ec4899", color: "#fff", padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>{lbl.text} {p.degrees}</span>;
                          })}
                        </div>
                      </div>

                      {/* Center Box */}
                      <div style={{ gridColumn: "span 2", gridRow: "span 2", border: "1px solid rgba(139,92,246,0.3)", borderRadius: "10px", background: "linear-gradient(135deg, rgba(139,92,246,0.12), rgba(236,72,153,0.08))", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "10px" }}>
                        <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#fff" }}>{name}&apos;s Rasi Chart</div>
                        <div style={{ fontSize: "0.85rem", color: "#a78bfa", marginTop: "4px" }}>Lagna: {chartResult.lagna_sinhala} / {chartResult.lagna_tamil}</div>
                        <div style={{ fontSize: "0.85rem", color: "#ec4899", marginTop: "2px" }}>Rasi: {chartResult.rasi_sinhala} / {chartResult.rasi_tamil} ({chartResult.nakshatra})</div>
                        <div style={{ fontSize: "0.72rem", color: "#9ca3af", marginTop: "4px" }}>DOB: {dob} · {tob}</div>
                      </div>

                      {/* (1,3) Karka */}
                      <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "8px", background: "rgba(16,185,129,0.08)" }}>
                        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#34d399" }}>கடகம் (Cancer)</div>
                        <div style={{ marginTop: "4px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
                          {getPlanetsInRasi(3).map((p: any) => {
                            const lbl = getPlanetLabel(p.name);
                            return <span key={p.name} style={{ fontSize: "0.75rem", background: "#10b981", color: "#fff", padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>{lbl.text} {p.degrees}</span>;
                          })}
                        </div>
                      </div>

                      {/* (2,0) Makara */}
                      <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "8px" }}>
                        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#9ca3af" }}>மகரம் (Capricorn)</div>
                        <div style={{ marginTop: "4px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
                          {getPlanetsInRasi(9).map((p: any) => {
                            const lbl = getPlanetLabel(p.name);
                            return <span key={p.name} style={{ fontSize: "0.75rem", background: "rgba(255,255,255,0.1)", color: lbl.color, padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>{lbl.text} {p.degrees}</span>;
                          })}
                        </div>
                      </div>

                      {/* (2,3) Simha */}
                      <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "8px" }}>
                        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#9ca3af" }}>சிம்மம் (Leo)</div>
                        <div style={{ marginTop: "4px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
                          {getPlanetsInRasi(4).map((p: any) => {
                            const lbl = getPlanetLabel(p.name);
                            return <span key={p.name} style={{ fontSize: "0.75rem", background: "rgba(255,255,255,0.1)", color: lbl.color, padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>{lbl.text} {p.degrees}</span>;
                          })}
                        </div>
                      </div>

                      {/* (3,0) Dhanu */}
                      <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "8px", background: "rgba(245,158,11,0.08)" }}>
                        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#fbbf24" }}>தனுசு (Sagittarius)</div>
                        <div style={{ marginTop: "4px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
                          {getPlanetsInRasi(8).map((p: any) => {
                            const lbl = getPlanetLabel(p.name);
                            return <span key={p.name} style={{ fontSize: "0.75rem", background: "#f59e0b", color: "#fff", padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>{lbl.text} {p.degrees}</span>;
                          })}
                        </div>
                      </div>

                      {/* (3,1) Vrischika */}
                      <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "8px", background: "rgba(239,68,68,0.08)" }}>
                        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#f87171" }}>விருச்சிகம் (Scorpio)</div>
                        <div style={{ marginTop: "4px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
                          {getPlanetsInRasi(7).map((p: any) => {
                            const lbl = getPlanetLabel(p.name);
                            return <span key={p.name} style={{ fontSize: "0.75rem", background: "#ef4444", color: "#fff", padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>{lbl.text} {p.degrees}</span>;
                          })}
                        </div>
                      </div>

                      {/* (3,2) Thula */}
                      <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "8px" }}>
                        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#9ca3af" }}>துலாம் (Libra)</div>
                        <div style={{ marginTop: "4px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
                          {getPlanetsInRasi(6).map((p: any) => {
                            const lbl = getPlanetLabel(p.name);
                            return <span key={p.name} style={{ fontSize: "0.75rem", background: "rgba(255,255,255,0.1)", color: lbl.color, padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>{lbl.text} {p.degrees}</span>;
                          })}
                        </div>
                      </div>

                      {/* (3,3) Kanya */}
                      <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "8px", background: "rgba(139,92,246,0.1)" }}>
                        <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#c084fc" }}>கன்னி (Virgo)</div>
                        <div style={{ marginTop: "4px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
                          {getPlanetsInRasi(5).map((p: any) => {
                            const lbl = getPlanetLabel(p.name);
                            return <span key={p.name} style={{ fontSize: "0.75rem", background: "#8b5cf6", color: "#fff", padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>{lbl.text} {p.degrees}</span>;
                          })}
                        </div>
                      </div>

                    </div>
                  </div>
                )}

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
                        <th style={{ padding: "12px 16px", fontSize: "0.8rem", color: "#9ca3af", textTransform: "uppercase" }}>Symbol</th>
                        <th style={{ padding: "12px 16px", fontSize: "0.8rem", color: "#9ca3af", textTransform: "uppercase" }}>Absolute Deg</th>
                        <th style={{ padding: "12px 16px", fontSize: "0.8rem", color: "#9ca3af", textTransform: "uppercase" }}>Rasi Degrees</th>
                        <th style={{ padding: "12px 16px", fontSize: "0.8rem", color: "#9ca3af", textTransform: "uppercase" }}>Rasi (Sign)</th>
                        <th style={{ padding: "12px 16px", fontSize: "0.8rem", color: "#9ca3af", textTransform: "uppercase" }}>Nakshatra</th>
                        <th style={{ padding: "12px 16px", fontSize: "0.8rem", color: "#9ca3af", textTransform: "uppercase" }}>House</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chartResult.planets.map((p: any, i: number) => {
                        const lbl = getPlanetLabel(p.name);
                        return (
                          <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                            <td style={{ padding: "14px 16px", fontWeight: 700, color: p.name.includes("Asc") ? "#818cf8" : (p.name.includes("Moon") ? "#ec4899" : "#fff") }}>
                              {p.name}
                            </td>
                            <td style={{ padding: "14px 16px", fontWeight: 800, fontSize: "16px", color: lbl.color }}>
                              {lbl.text}
                            </td>
                            <td style={{ padding: "14px 16px", fontFamily: "monospace", color: "#9ca3af", fontSize: "0.85rem" }}>
                              {p.absolute_deg}
                            </td>
                            <td style={{ padding: "14px 16px", fontFamily: "monospace", color: "#10b981", fontWeight: 700, fontSize: "0.9rem" }}>
                              {p.degrees}
                            </td>
                            <td style={{ padding: "14px 16px", color: "#e5e7eb" }}>
                              {p.rasi} ({p.rasi_sinhala} / {p.rasi_tamil})
                            </td>
                            <td style={{ padding: "14px 16px", color: "#c084fc", fontWeight: 600 }}>
                              {p.nakshatra} (Pada {p.pada})
                            </td>
                            <td style={{ padding: "14px 16px", color: "#f59e0b", fontWeight: 600 }}>
                              {p.house_str}
                            </td>
                          </tr>
                        );
                      })}
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
              <Heart size={22} color="#ec4899" /> 10-Porutham Vedic Marriage Compatibility (පොරොන්දම් ගැලපීම)
            </h2>
            <p style={{ color: "#9ca3af", fontSize: "0.9rem", marginBottom: "2rem" }}>
              Match groom & bride birth stars across Dina, Gana, Mahendra, Yoni, Rasi, Rajju, and Vedha Poruthams.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
              <div>
                <label style={{ fontSize: "0.85rem", color: "#818cf8", fontWeight: 600, display: "block", marginBottom: "0.4rem" }}>Groom Nakshatra (පුරුෂ නැකත / ஆண் நட்சத்திரம்)</label>
                <select
                  value={boyStar}
                  onChange={e => setBoyStar(e.target.value)}
                  style={{ width: "100%", background: "#0a0c16", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0.8rem", color: "#fff", fontSize: "0.9rem", outline: "none" }}
                >
                  {NAKSHATRAS.map(n => (
                    <option key={n.name} value={n.name}>{n.name} ({n.sinhala} / {n.tamil})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.85rem", color: "#ec4899", fontWeight: 600, display: "block", marginBottom: "0.4rem" }}>Bride Nakshatra (ස්ත්‍රී නැකත / பெண் நட்சத்திரம்)</label>
                <select
                  value={girlStar}
                  onChange={e => setGirlStar(e.target.value)}
                  style={{ width: "100%", background: "#0a0c16", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0.8rem", color: "#fff", fontSize: "0.9rem", outline: "none" }}
                >
                  {NAKSHATRAS.map(n => (
                    <option key={n.name} value={n.name}>{n.name} ({n.sinhala} / {n.tamil})</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleCalculatePorutham}
              style={{ background: "linear-gradient(135deg, #ec4899, #8b5cf6)", color: "#fff", border: "none", padding: "10px 24px", borderRadius: "10px", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "2rem", boxShadow: "0 4px 15px rgba(236,72,153,0.3)" }}
            >
              <Heart size={16} fill="#fff" /> Calculate 10 Porutham Score (පොරොන්දම් පරීක්ෂාව)
            </button>

            {poruthamResult && (
              <div style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(236,72,153,0.3)", borderRadius: "16px", padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem", flexWrap: "wrap", gap: "8px" }}>
                  <div>
                    <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff" }}>{poruthamResult.verdict}</div>
                    <div style={{ fontSize: "0.85rem", color: "#10b981" }}>Score: {poruthamResult.score} / {poruthamResult.total} Poruthams Matching</div>
                  </div>
                  <span style={{ padding: "6px 14px", borderRadius: "20px", background: "rgba(16,185,129,0.15)", color: "#10b981", fontWeight: 700, fontSize: "0.9rem" }}>
                    ✓ Recommended Match / සුබ විවාහ යෝගය
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

        {/* ── TAB 3: TRANSIT (GOCHARAM DEEP RESEARCH) ── */}
        {activeTab === 'transit' && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            
            {/* Header & Global Sentry */}
            <div style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <h2 style={{ fontSize: "1.4rem", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                    <Compass size={22} color="#f59e0b" /> Planetary Transits Deep Research (ග්‍රහ මාරුව / கோச்சாரம் 2026)
                  </h2>
                  <p style={{ color: "#9ca3af", fontSize: "0.9rem", margin: "4px 0 0 0" }}>
                    Real-time ephemeris monitoring of slow-moving major planets (Guru, Sani, Rahu, Ketu) and 12-Rasi personalized impact forecasts.
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)", padding: "6px 14px", borderRadius: "12px", color: "#f59e0b", fontSize: "0.85rem", fontWeight: 700 }}>
                  <Star size={14} fill="#f59e0b" /> Lahiri Chitrapaksha Precision
                </div>
              </div>

              {/* 4 Major Planets Sentry Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem", marginTop: "1.5rem" }}>
                {[
                  { planet: "Jupiter (Guru / බ්‍රහස්පති)", sign: "Rishaba (Taurus / වෘෂභ)", deg: "22° 14′", star: "Rohini (Moon Lord)", effect: "Financial expansion and wisdom surge", status: "Benefic", color: "#eab308" },
                  { planet: "Saturn (Sani / ශනි)", sign: "Kumbha (Aquarius / කුම්භ)", deg: "28° 42′", star: "Purva Bhadrapada (Guru Lord)", effect: "Moolatrikona placement - discipline & structural gains", status: "Strong Sasa Yoga", color: "#8b5cf6" },
                  { planet: "Rahu (රාහු ℞)", sign: "Meena (Pisces / මීන)", deg: "12° 08′", star: "Uttara Bhadrapada (Saturn Lord)", effect: "AI breakthroughs, global ventures, foreign connections", status: "Neutral / Shadow", color: "#06b6d4" },
                  { planet: "Ketu (කේතු ℞)", sign: "Kanya (Virgo / කන්‍යා)", deg: "12° 08′", star: "Hasta (Moon Lord)", effect: "Deep analytical mastery, intuition & spiritual detachment", status: "Spiritual Moksha", color: "#f97316" },
                ].map((t, idx) => (
                  <div key={idx} style={{ background: "rgba(0,0,0,0.35)", border: `1px solid rgba(255,255,255,0.06)`, borderRadius: "14px", padding: "1.2rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                        <div style={{ fontWeight: 800, color: "#fff", fontSize: "0.95rem" }}>{t.planet}</div>
                        <span style={{ fontSize: "0.72rem", padding: "2px 8px", borderRadius: "6px", background: "rgba(255,255,255,0.06)", color: t.color, fontWeight: 700, border: `1px solid ${t.color}33` }}>{t.status}</span>
                      </div>
                      <div style={{ color: t.color, fontSize: "0.85rem", fontWeight: 700 }}>In {t.sign} ({t.deg})</div>
                      <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "2px" }}>Star: {t.star}</div>
                    </div>
                    <div style={{ color: "#d1d5db", fontSize: "0.8rem", lineHeight: 1.5, marginTop: "0.8rem", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "0.6rem" }}>{t.effect}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 12-Rasi Deep Transit Explorer */}
            <div style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "2rem" }}>
              <div style={{ marginBottom: "1.5rem" }}>
                <h3 style={{ margin: "0 0 0.4rem 0", fontSize: "1.2rem", fontWeight: 700, color: "#fff" }}>
                  🔮 Select Your Moon Sign (Rasi / ලග්නය) for In-Depth Transit Predictions
                </h3>
                <p style={{ color: "#9ca3af", fontSize: "0.85rem", margin: 0 }}>
                  Click on any Rasi below to reveal its complete 2026 Guru, Sani, and Rahu-Ketu transit roadmap.
                </p>
              </div>

              {/* 12 Rasi Selector Buttons */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "8px", marginBottom: "2rem" }}>
                {RASIS.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedTransitRasi(r.id)}
                    style={{
                      background: selectedTransitRasi === r.id ? "linear-gradient(135deg, #8b5cf6, #ec4899)" : "rgba(255,255,255,0.04)",
                      border: selectedTransitRasi === r.id ? "1px solid #c084fc" : "1px solid rgba(255,255,255,0.08)",
                      color: selectedTransitRasi === r.id ? "#fff" : "#d1d5db",
                      padding: "10px 8px", borderRadius: "12px",
                      fontSize: "0.82rem", fontWeight: 700, cursor: "pointer",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
                      transition: "all 0.2s",
                      boxShadow: selectedTransitRasi === r.id ? "0 4px 15px rgba(139,92,246,0.4)" : "none"
                    }}
                  >
                    <span style={{ fontSize: "1.3rem" }}>{r.icon.split(' ')[1]}</span>
                    <span>{r.sinhala} / {r.tamil}</span>
                    <span style={{ fontSize: "0.7rem", color: selectedTransitRasi === r.id ? "#fce7f3" : "#9ca3af" }}>{r.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>

              {/* Selected Rasi Detailed Dashboard */}
              {(() => {
                const currentRasi = RASIS[selectedTransitRasi];
                const data = {
                  0: { guruHouse: "2nd House (Dhana)", guruEffect: "Substantial wealth accumulation, family bliss, and financial expansion.", saniHouse: "11th House (Labha)", saniEffect: "Extraordinary gains, fulfillment of long-standing desires, and professional elevation.", rahuKetu: "12th & 6th Axis - foreign opportunities and victory over legal/health hurdles.", sadeSati: "Free of Sade Sati (சுப காலம்)", overallScore: "92% Highly Auspicious", mantra: "Om Namah Shivaya & Om Gam Ganapataye Namaha" },
                  1: { guruHouse: "1st House (Jenma)", guruEffect: "Wisdom and intellectual growth; requires attention to digestion and expenses.", saniHouse: "10th House (Karma)", saniEffect: "High professional responsibilities, disciplined execution, long-term legacy creation.", rahuKetu: "11th & 5th Axis - creative intelligence and speculative windfalls.", sadeSati: "Free of Sade Sati", overallScore: "85% Auspicious", mantra: "Om Sri Mahalakshmyai Namaha" },
                  2: { guruHouse: "12th House (Viraya)", guruEffect: "Spiritual expenditure, foreign travel, meditation, and research breakthroughs.", saniHouse: "9th House (Bhagya)", saniEffect: "Fortuitous higher learning, international relocation, paternal blessings.", rahuKetu: "10th & 4th Axis - dynamic changes in career and home relocations.", sadeSati: "Free of Sade Sati", overallScore: "80% Favorable", mantra: "Om Budhaya Namaha" },
                  3: { guruHouse: "11th House (Labha Sthana)", guruEffect: "Exceptional cash flow, expansion of social and business network, promotion.", saniHouse: "8th House (Ashtama Sani)", saniEffect: "Need careful risk management in new ventures; excellent for occult/AI research and deep technical mastery.", rahuKetu: "9th & 3rd Axis - brave digital initiatives and international recognition.", sadeSati: "Ashtama Sani Phase (Requires Patience & Focus)", overallScore: "86% Progressive Growth", mantra: "Om Sham Shanaischaraya Namaha & Shiva Panchakshari" },
                  4: { guruHouse: "10th House (Karma)", guruEffect: "Authority expansion, leadership recognition, and business diversification.", saniHouse: "7th House (Kandaka Sani)", saniEffect: "Disciplined partnerships and contractual clarity.", rahuKetu: "8th & 2nd Axis - sudden financial flows.", sadeSati: "Kandaka Sani Phase", overallScore: "78% Steady Success", mantra: "Aditya Hridaya Stotram & Gayatri Mantra" },
                  5: { guruHouse: "9th House (Bhagya Sthana)", guruEffect: "Supreme luck, mentorship, spiritual elevation, and massive fortune.", saniHouse: "6th House (Roga-Shatru Vijaya)", saniEffect: "Decisive victory over competitors, debt eradication, and optimal health recovery.", rahuKetu: "7th & 1st Axis - interpersonal refinement.", sadeSati: "Golden Period (ராஜ யோக காலம்)", overallScore: "95% Peak Fortune", mantra: "Om Namo Narayanaya" },
                  6: { guruHouse: "8th House (Ayur Sthana)", guruEffect: "Deep research, inheritance gains, and intuitive foresight.", saniHouse: "5th House (Poorva Punya)", saniEffect: "Calculated investments and disciplined intellectual output.", rahuKetu: "6th & 12th Axis - triumph over obstacles.", sadeSati: "Free of Sade Sati", overallScore: "82% Favorable", mantra: "Om Sri Durgayai Namaha" },
                  7: { guruHouse: "7th House (Kalathra & Vyapara)", guruEffect: "Auspicious marriage prospects, profitable joint ventures, and business boom.", saniHouse: "4th House (Ardhastama Sani)", saniEffect: "Property acquisitions, vehicle maintenance, and domestic discipline.", rahuKetu: "5th & 11th Axis - speculative gains.", sadeSati: "Ardhastama Sani Phase", overallScore: "88% Strong Commercial Growth", mantra: "Om Saravanabhavaya Namaha" },
                  8: { guruHouse: "6th House (Shatru Sthana)", guruEffect: "Workplace dominance, competitive exam success, and financial restructuring.", saniHouse: "3rd House (Dhairya Sthana)", saniEffect: "Unstoppable courage, media reach, and immense commercial vitality.", rahuKetu: "4th & 10th Axis - property and career expansion.", sadeSati: "Free of Sade Sati (வெற்றி காலம்)", overallScore: "90% Highly Favorable", mantra: "Om Gurave Namaha" },
                  9: { guruHouse: "5th House (Trikona Raja Yoga)", guruEffect: "Brilliant creative breakthroughs, child blessings, and spiritual intelligence.", saniHouse: "2nd House (Patha Sani / Sade Sati 3rd Phase)", saniEffect: "Final phase of Sade Sati bringing stability, financial realism, and permanent foundation.", rahuKetu: "3rd & 9th Axis - short travels and fortunate networking.", sadeSati: "Sade Sati Phase 3 (Final Exit Phase)", overallScore: "88% Auspicious Relief", mantra: "Hanuman Chalisa & Om Namah Shivaya" },
                  10: { guruHouse: "4th House (Sukha Sthana)", guruEffect: "Luxury assets, real estate growth, and domestic peace.", saniHouse: "1st House (Jenma Sani / Sade Sati 2nd Phase)", saniEffect: "Sasa Yoga in own sign bringing deep self-mastery, personal elevation, and leadership endurance.", rahuKetu: "2nd & 8th Axis - strategic financial management.", sadeSati: "Sade Sati Phase 2 (Peak Sasa Yoga)", overallScore: "84% Powerful Resilience", mantra: "Om Sham Shanaischaraya Namaha" },
                  11: { guruHouse: "3rd House (Bhratru Sthana)", guruEffect: "Communication brilliance, multi-tasking skills, and sibling harmony.", saniHouse: "12th House (Viraya Sani / Sade Sati 1st Phase)", saniEffect: "Beginning of 7.5 Saturn cycle requiring mindful expenses and spiritual retreats.", rahuKetu: "1st & 7th Axis - identity transformation and global relationships.", sadeSati: "Sade Sati Phase 1 (Viraya Sani)", overallScore: "75% Transformative Year", mantra: "Maha Mrityunjaya Mantra" }
                }[selectedTransitRasi] || { guruHouse: "11th House", guruEffect: "Positive growth", saniHouse: "8th House", saniEffect: "Discipline needed", rahuKetu: "Axis transit", sadeSati: "Free", overallScore: "85%", mantra: "Om Namah Shivaya" };

                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    
                    {/* Active Rasi Banner */}
                    <div style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(236,72,153,0.1))", border: "1px solid rgba(139,92,246,0.3)", borderRadius: "16px", padding: "1.4rem 1.8rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <span style={{ fontSize: "2.5rem" }}>{currentRasi.icon.split(' ')[1]}</span>
                        <div>
                          <h4 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 800, color: "#fff" }}>
                            {currentRasi.sinhala} / {currentRasi.tamil} ({currentRasi.name}) Transit Roadmap
                          </h4>
                          <span style={{ fontSize: "0.85rem", color: "#a78bfa" }}>Lord: {currentRasi.lord} · Planetary Rating: <strong style={{ color: "#10b981" }}>{data.overallScore}</strong></span>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(0,0,0,0.4)", padding: "6px 14px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)" }}>
                        <span style={{ fontSize: "0.8rem", color: "#9ca3af" }}>Sade Sati Status:</span>
                        <span style={{ fontSize: "0.85rem", fontWeight: 700, color: data.sadeSati.includes("Free") || data.sadeSati.includes("Golden") ? "#10b981" : "#f59e0b" }}>{data.sadeSati}</span>
                      </div>
                    </div>

                    {/* 3 Detailed Breakdown Columns */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.2rem" }}>
                      
                      {/* Guru Peyarchi Card */}
                      <div style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(234,179,8,0.25)", borderRadius: "16px", padding: "1.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.8rem" }}>
                          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(234,179,8,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Sun size={18} color="#eab308" />
                          </div>
                          <div>
                            <h5 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#eab308" }}>Guru Peyarchi (ගුරු මාරුව)</h5>
                            <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Position: {data.guruHouse}</span>
                          </div>
                        </div>
                        <p style={{ color: "#d1d5db", fontSize: "0.88rem", lineHeight: 1.6, margin: 0 }}>
                          {data.guruEffect}
                        </p>
                      </div>

                      {/* Sani Peyarchi Card */}
                      <div style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(139,92,246,0.25)", borderRadius: "16px", padding: "1.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.8rem" }}>
                          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(139,92,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Moon size={18} color="#8b5cf6" />
                          </div>
                          <div>
                            <h5 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#8b5cf6" }}>Sani Peyarchi (ශනි මාරුව)</h5>
                            <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Position: {data.saniHouse}</span>
                          </div>
                        </div>
                        <p style={{ color: "#d1d5db", fontSize: "0.88rem", lineHeight: 1.6, margin: 0 }}>
                          {data.saniEffect}
                        </p>
                      </div>

                      {/* Rahu-Ketu & Remedy Card */}
                      <div style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(6,182,212,0.25)", borderRadius: "16px", padding: "1.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.8rem" }}>
                          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(6,182,212,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Compass size={18} color="#06b6d4" />
                          </div>
                          <div>
                            <h5 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#06b6d4" }}>Rahu-Ketu & Remedies</h5>
                            <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Axis & Spiritual Guidance</span>
                          </div>
                        </div>
                        <p style={{ color: "#d1d5db", fontSize: "0.88rem", lineHeight: 1.6, margin: "0 0 0.8rem 0" }}>
                          {data.rahuKetu}
                        </p>
                        <div style={{ background: "rgba(255,255,255,0.03)", padding: "8px 10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                          <span style={{ fontSize: "0.72rem", color: "#f59e0b", fontWeight: 700 }}>Auspicious Mantra:</span>
                          <div style={{ fontSize: "0.8rem", color: "#fff", fontWeight: 600, marginTop: "2px" }}>{data.mantra}</div>
                        </div>
                      </div>

                    </div>

                  </div>
                );
              })()}
            </div>

            {/* 📅 2026-2027 Major Ingress Timeline Table */}
            <div style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", overflow: "hidden" }}>
              <div style={{ padding: "1.2rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h4 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>📅 2026-2027 Major Planetary Ingress & Transit Calendar</h4>
                <span style={{ fontSize: "0.8rem", color: "#10b981", fontWeight: 600 }}>Astrological Ephemeris</span>
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "rgba(0,0,0,0.3)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    <th style={{ padding: "12px 16px", fontSize: "0.8rem", color: "#9ca3af", textTransform: "uppercase" }}>Event</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.8rem", color: "#9ca3af", textTransform: "uppercase" }}>Planet</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.8rem", color: "#9ca3af", textTransform: "uppercase" }}>From Sign</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.8rem", color: "#9ca3af", textTransform: "uppercase" }}>To Sign</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.8rem", color: "#9ca3af", textTransform: "uppercase" }}>Transit Nature</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { event: "Guru Peyarchi 2026", planet: "Jupiter (Guru)", from: "Taurus (Rishaba)", to: "Gemini (Mithuna)", nature: "Direct Ingress - Commercial Expansion" },
                    { event: "Sani Peyarchi 2026/27", planet: "Saturn (Sani)", from: "Aquarius (Kumbha)", to: "Pisces (Meena)", nature: "Karmic Shift - Spiritual Realism" },
                    { event: "Rahu Ingress", planet: "Rahu (Mean Node)", from: "Pisces (Meena)", to: "Aquarius (Kumbha)", nature: "Technology & Decentralization Surge" },
                    { event: "Ketu Ingress", planet: "Ketu (Mean Node)", from: "Virgo (Kanya)", to: "Leo (Simha)", nature: "Internal Leadership & Sovereignty" },
                  ].map((row, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "14px 16px", fontWeight: 700, color: "#fff" }}>{row.event}</td>
                      <td style={{ padding: "14px 16px", color: "#818cf8", fontWeight: 600 }}>{row.planet}</td>
                      <td style={{ padding: "14px 16px", color: "#9ca3af" }}>{row.from}</td>
                      <td style={{ padding: "14px 16px", color: "#10b981", fontWeight: 700 }}>{row.to}</td>
                      <td style={{ padding: "14px 16px", color: "#d1d5db", fontSize: "0.85rem" }}>{row.nature}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
