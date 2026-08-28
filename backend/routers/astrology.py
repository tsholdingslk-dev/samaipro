import math
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import json

router = APIRouter(
    prefix="/astrology",
    tags=["Astrology Studio"]
)

class ChartRequest(BaseModel):
    name: str
    gender: Optional[str] = "Male"
    dob: str # YYYY-MM-DD
    tob: str # HH:MM (24h)
    pob: Optional[str] = "Jaffna, Sri Lanka"
    latitude: Optional[float] = 9.6615
    longitude: Optional[float] = 80.0255
    timezone_offset: Optional[float] = 5.5 # Sri Lanka / India IST

RASIS = [
    {"id": 0, "name": "Mesha (Aries)", "tamil": "மேஷம்", "lord": "Mars", "element": "Fire"},
    {"id": 1, "name": "Vrishabha (Taurus)", "tamil": "ரிஷபம்", "lord": "Venus", "element": "Earth"},
    {"id": 2, "name": "Mithuna (Gemini)", "tamil": "மிதுனம்", "lord": "Mercury", "element": "Air"},
    {"id": 3, "name": "Karka (Cancer)", "tamil": "கடகம்", "lord": "Moon", "element": "Water"},
    {"id": 4, "name": "Simha (Leo)", "tamil": "சிம்மம்", "lord": "Sun", "element": "Fire"},
    {"id": 5, "name": "Kanya (Virgo)", "tamil": "கன்னி", "lord": "Mercury", "element": "Earth"},
    {"id": 6, "name": "Thula (Libra)", "tamil": "துலாம்", "lord": "Venus", "element": "Air"},
    {"id": 7, "name": "Vrischika (Scorpio)", "tamil": "விருச்சிகம்", "lord": "Mars", "element": "Water"},
    {"id": 8, "name": "Dhanu (Sagittarius)", "tamil": "தனுசு", "lord": "Jupiter", "element": "Fire"},
    {"id": 9, "name": "Makara (Capricorn)", "tamil": "மகரம்", "lord": "Saturn", "element": "Earth"},
    {"id": 10, "name": "Kumbha (Aquarius)", "tamil": "கும்பம்", "lord": "Saturn", "element": "Air"},
    {"id": 11, "name": "Meena (Pisces)", "tamil": "மீனம்", "lord": "Jupiter", "element": "Water"},
]

NAKSHATRAS = [
    {"name": "Ashwini", "tamil": "அஸ்வினி", "lord": "Ketu", "dasha_years": 7},
    {"name": "Bharani", "tamil": "பரணி", "lord": "Venus", "dasha_years": 20},
    {"name": "Krittika", "tamil": "கார்த்திகை", "lord": "Sun", "dasha_years": 6},
    {"name": "Rohini", "tamil": "ரோகிணி", "lord": "Moon", "dasha_years": 10},
    {"name": "Mrigashira", "tamil": "மிருகசீரிடம்", "lord": "Mars", "dasha_years": 7},
    {"name": "Ardra", "tamil": "திருவாதிரை", "lord": "Rahu", "dasha_years": 18},
    {"name": "Punarvasu", "tamil": "புனர்பூசம்", "lord": "Jupiter", "dasha_years": 16},
    {"name": "Pushya", "tamil": "பூசம்", "lord": "Saturn", "dasha_years": 19},
    {"name": "Ashlesha", "tamil": "ஆயில்யம்", "lord": "Mercury", "dasha_years": 17},
    {"name": "Magha", "tamil": "மகம்", "lord": "Ketu", "dasha_years": 7},
    {"name": "Purva Phalguni", "tamil": "பூரம்", "lord": "Venus", "dasha_years": 20},
    {"name": "Uttara Phalguni", "tamil": "உத்திரம்", "lord": "Sun", "dasha_years": 6},
    {"name": "Hasta", "tamil": "அஸ்தம்", "lord": "Moon", "dasha_years": 10},
    {"name": "Chitra", "tamil": "சித்திரை", "lord": "Mars", "dasha_years": 7},
    {"name": "Svati", "tamil": "சுவாதி", "lord": "Rahu", "dasha_years": 18},
    {"name": "Vishakha", "tamil": "விசாகம்", "lord": "Jupiter", "dasha_years": 16},
    {"name": "Anuradha", "tamil": "அனுஷம்", "lord": "Saturn", "dasha_years": 19},
    {"name": "Jyeshtha", "tamil": "கேட்டை", "lord": "Mercury", "dasha_years": 17},
    {"name": "Mula", "tamil": "மூலம்", "lord": "Ketu", "dasha_years": 7},
    {"name": "Purva Ashadha", "tamil": "பூராடம்", "lord": "Venus", "dasha_years": 20},
    {"name": "Uttara Ashadha", "tamil": "உத்திராடம்", "lord": "Sun", "dasha_years": 6},
    {"name": "Shravana", "tamil": "திருவோணம்", "lord": "Moon", "dasha_years": 10},
    {"name": "Dhanishta", "tamil": "அவிட்டம்", "lord": "Mars", "dasha_years": 7},
    {"name": "Shatabhisha", "tamil": "சதயம்", "lord": "Rahu", "dasha_years": 18},
    {"name": "Purva Bhadrapada", "tamil": "பூரட்டாதி", "lord": "Jupiter", "dasha_years": 16},
    {"name": "Uttara Bhadrapada", "tamil": "உத்திரட்டாதி", "lord": "Saturn", "dasha_years": 19},
    {"name": "Revati", "tamil": "ரேவதி", "lord": "Mercury", "dasha_years": 17},
]

DASHA_SEQUENCE = [
    {"lord": "Ketu", "years": 7},
    {"lord": "Venus", "years": 20},
    {"lord": "Sun", "years": 6},
    {"lord": "Moon", "years": 10},
    {"lord": "Mars", "years": 7},
    {"lord": "Rahu", "years": 18},
    {"lord": "Jupiter", "years": 16},
    {"lord": "Saturn", "years": 19},
    {"lord": "Mercury", "years": 17}
]

def deg_to_dms_str(deg_float: float) -> str:
    deg_float = deg_float % 360
    d = int(deg_float)
    m = int(round((deg_float - d) * 60))
    if m == 60:
        d += 1
        m = 0
    return f"{d}° {m:02d}′"

def normalize_deg(d: float) -> float:
    return d % 360.0

def calculate_universal_ephemeris(dt_utc: datetime, lat: float, lon: float) -> Dict[str, Any]:
    """
    Universal High-Precision Astronomical Ephemeris Engine (Keplerian Orbital Mechanics + Lahiri Ayanamsa)
    Valid for any date from 1900 to 2100.
    """
    # 1. Julian Day (JD) & Julian Century (T) from J2000.0 (2000 Jan 1.5)
    Y = dt_utc.year
    M = dt_utc.month
    D = dt_utc.day + (dt_utc.hour + dt_utc.minute / 60.0 + dt_utc.second / 3600.0) / 24.0
    if M <= 2:
        Y -= 1
        M += 12
    A = int(Y / 100)
    B = 2 - A + int(A / 4)
    JD = int(365.25 * (Y + 4716)) + int(30.6001 * (M + 1)) + D + B - 1524.5
    T = (JD - 2451545.0) / 36525.0 # Julian centuries from J2000

    # 2. Lahiri Ayanamsa (Chitrapaksha)
    ayanamsa = 23.8565 + (JD - 2451545.0) * (50.29 / 3600.0) / 365.25

    # 3. Earth-Sun Orbit (Heliocentric Earth / Geocentric Sun)
    L_sun = normalize_deg(280.46646 + 36000.76983 * T + 0.0003032 * T * T)
    M_sun = normalize_deg(357.52911 + 35999.05029 * T - 0.0001537 * T * T)
    C_sun = (1.914602 - 0.004817 * T - 0.000014 * T * T) * math.sin(math.radians(M_sun)) + \
            (0.019993 - 0.000101 * T) * math.sin(math.radians(2 * M_sun)) + \
            0.000289 * math.sin(math.radians(3 * M_sun))
    sun_true_trop = normalize_deg(L_sun + C_sun)
    sun_sid = normalize_deg(sun_true_trop - ayanamsa)

    # Earth Heliocentric distance R_E & longitude L_E
    e_E = 0.016708634 - 0.000042037 * T
    R_E = 1.000001018 * (1 - e_E * e_E) / (1 + e_E * math.cos(math.radians(M_sun + C_sun)))
    L_E = normalize_deg(sun_true_trop + 180)

    # 4. Moon (Chandra) Geocentric Longitude with Perturbations
    L_moon = normalize_deg(218.3164477 + 481267.88128 * T)
    M_moon = normalize_deg(134.9633964 + 477198.867505 * T)
    D_moon = normalize_deg(297.8501921 + 445267.1114034 * T) # elongation
    F_moon = normalize_deg(93.2720950 + 483202.0175233 * T)  # argument of latitude

    moon_perturb = 6.288774 * math.sin(math.radians(M_moon)) + \
                   1.274027 * math.sin(math.radians(2 * D_moon - M_moon)) + \
                   0.658314 * math.sin(math.radians(2 * D_moon)) + \
                   0.213618 * math.sin(math.radians(2 * M_moon)) - \
                   0.185116 * math.sin(math.radians(M_sun)) - \
                   0.114332 * math.sin(math.radians(2 * F_moon)) + \
                   0.058793 * math.sin(math.radians(2 * D_moon - 2 * M_moon)) + \
                   0.057066 * math.sin(math.radians(2 * D_moon - M_sun - M_moon))
    moon_true_trop = normalize_deg(L_moon + moon_perturb)
    moon_sid = normalize_deg(moon_true_trop - ayanamsa)

    # 5. Rahu & Ketu (Mean Ascending Lunar Node)
    rahu_trop = normalize_deg(125.04452 - 1934.136261 * T + 0.0020708 * T * T)
    rahu_sid = normalize_deg(rahu_trop - ayanamsa)
    ketu_sid = normalize_deg(rahu_sid + 180)

    # 6. Keplerian Planetary Elements for Geocentric Longitudes
    planets_elements = {
        "Mercury": {"N": 48.3313 + 3.24587e-5 * JD, "i": 7.0047, "w": 29.1241 + 1.01444e-5 * JD, "a": 0.387098, "e": 0.205635, "M": normalize_deg(168.6562 + 4.0923344368 * (JD - 2451545.0))},
        "Venus":   {"N": 76.6799 + 2.46590e-5 * JD, "i": 3.3946, "w": 54.8910 + 1.38374e-5 * JD, "a": 0.723330, "e": 0.006773, "M": normalize_deg(48.0052 + 1.6021302244 * (JD - 2451545.0))},
        "Mars":    {"N": 49.5574 + 2.11081e-5 * JD, "i": 1.8497, "w": 286.5016 + 2.92961e-5 * JD, "a": 1.523688, "e": 0.093405, "M": normalize_deg(18.6021 + 0.5240207766 * (JD - 2451545.0))},
        "Jupiter": {"N": 100.4542 + 2.76854e-5 * JD, "i": 1.3030, "w": 273.8777 + 1.64505e-5 * JD, "a": 5.202561, "e": 0.048498, "M": normalize_deg(19.8950 + 0.0830853001 * (JD - 2451545.0))},
        "Saturn":  {"N": 113.6634 + 2.38980e-5 * JD, "i": 2.4886, "w": 339.3939 + 2.97661e-5 * JD, "a": 9.554747, "e": 0.055546, "M": normalize_deg(316.9670 + 0.0334442282 * (JD - 2451545.0))}
    }

    geo_planets = {}
    for p_name, el in planets_elements.items():
        M_rad = math.radians(el["M"])
        # Solve Kepler's equation: E = M + e*sin(E)
        E = el["M"] + math.degrees(el["e"] * math.sin(M_rad) * (1.0 + el["e"] * math.cos(M_rad)))
        for _ in range(3):
            E_rad = math.radians(E)
            E = E - math.degrees((E_rad - el["e"] * math.sin(E_rad) - M_rad) / (1.0 - el["e"] * math.cos(E_rad)))
        
        E_rad = math.radians(E)
        xv = el["a"] * (math.cos(E_rad) - el["e"])
        yv = el["a"] * (math.sqrt(1.0 - el["e"] * el["e"]) * math.sin(E_rad))
        
        v = math.degrees(math.atan2(yv, xv))
        r = math.sqrt(xv * xv + yv * yv)
        
        l_helio = normalize_deg(v + el["w"])
        l_helio_rad = math.radians(l_helio)
        
        # Geocentric conversion
        xh = r * math.cos(l_helio_rad)
        yh = r * math.sin(l_helio_rad)
        
        L_E_rad = math.radians(L_E)
        xg = xh + R_E * math.cos(L_E_rad)
        yg = yh + R_E * math.sin(L_E_rad)
        
        l_geo_trop = normalize_deg(math.degrees(math.atan2(yg, xg)))
        l_geo_sid = normalize_deg(l_geo_trop - ayanamsa)
        geo_planets[p_name] = l_geo_sid

    # 7. Ascendant (Lagna) Computation
    # Greenwich Mean Sidereal Time (GMST) in degrees
    d_since_j2000 = JD - 2451545.0
    GMST0 = normalize_deg(280.46061837 + 360.98564736629 * d_since_j2000 + 0.000387933 * T * T)
    RAMC = normalize_deg(GMST0 + lon) # Local Sidereal Time in degrees
    eps = 23.4392911 - 0.0130042 * T  # Obliquity of ecliptic

    RAMC_rad = math.radians(RAMC)
    eps_rad = math.radians(eps)
    lat_rad = math.radians(lat)

    y_asc = math.cos(RAMC_rad)
    x_asc = -math.sin(RAMC_rad) * math.cos(eps_rad) - math.tan(lat_rad) * math.sin(eps_rad)
    asc_trop = normalize_deg(math.degrees(math.atan2(y_asc, x_asc)) + 90.0)
    asc_sid = normalize_deg(asc_trop - ayanamsa)

    # Collect calculated sidereal positions
    planets_raw = [
        {"name": "Ascendant (Lagna)", "symbol": "Asc", "long": asc_sid, "is_retro": False},
        {"name": "Sun (Surya)", "symbol": "Su", "long": sun_sid, "is_retro": False},
        {"name": "Moon (Chandra)", "symbol": "Mo", "long": moon_sid, "is_retro": False},
        {"name": "Mars (Chevvai)", "symbol": "Ma", "long": geo_planets["Mars"], "is_retro": False},
        {"name": "Mercury (Budha)", "symbol": "Me", "long": geo_planets["Mercury"], "is_retro": False},
        {"name": "Jupiter (Guru)", "symbol": "Ju", "long": geo_planets["Jupiter"], "is_retro": False},
        {"name": "Venus (Sukra)", "symbol": "Ve", "long": geo_planets["Venus"], "is_retro": False},
        {"name": "Saturn (Sani)", "symbol": "Sa", "long": geo_planets["Saturn"], "is_retro": False},
        {"name": "Rahu ℞", "symbol": "Ra", "long": rahu_sid, "is_retro": True},
        {"name": "Ketu ℞", "symbol": "Ke", "long": ketu_sid, "is_retro": True},
    ]

    calculated_planets = []
    for p in planets_raw:
        long_val = p["long"] % 360
        rasi_idx = int(long_val / 30) % 12
        rasi_obj = RASIS[rasi_idx]
        deg_in_rasi = long_val % 30
        nak_idx = int(long_val / (360.0 / 27.0)) % 27
        nak_obj = NAKSHATRAS[nak_idx]
        pada = int((long_val % (360.0 / 27.0)) / (360.0 / 108.0)) + 1

        calculated_planets.append({
            "name": p["name"],
            "symbol": p["symbol"],
            "absolute_deg": deg_to_dms_str(long_val),
            "degrees": deg_to_dms_str(deg_in_rasi),
            "degrees_num": round(deg_in_rasi, 2),
            "rasi_id": rasi_idx,
            "rasi": rasi_obj["name"].split(' ')[0],
            "rasi_full": rasi_obj["name"],
            "rasi_tamil": rasi_obj["tamil"],
            "rasi_lord": rasi_obj["lord"],
            "nakshatra": nak_obj["name"],
            "nakshatra_tamil": nak_obj["tamil"],
            "nakshatra_lord": nak_obj["lord"],
            "pada": pada,
            "is_retrograde": p["is_retro"]
        })

    lagna_info = calculated_planets[0]
    moon_info = calculated_planets[2]

    # Assign Houses 1 to 12
    lagna_rasi_id = lagna_info["rasi_id"]
    for cp in calculated_planets:
        house_num = ((cp["rasi_id"] - lagna_rasi_id) % 12) + 1
        cp["house"] = house_num
        cp["house_str"] = f"{house_num}th House" if house_num not in [1, 2, 3] else ("1st House (Lagna)" if house_num == 1 else ("2nd House" if house_num == 2 else "3rd House"))

    # Active Dasha calculation
    moon_long = moon_info["rasi_id"] * 30.0 + moon_info["degrees_num"]
    nak_fraction = (moon_long % (360.0 / 27.0)) / (360.0 / 27.0)
    moon_nak_obj = next((n for n in NAKSHATRAS if n["name"] == moon_info["nakshatra"]), NAKSHATRAS[0])
    balance_years = moon_nak_obj["dasha_years"] * (1.0 - nak_fraction)

    # Current running dasha based on age
    age_years = (datetime.now(timezone.utc) - dt_utc.replace(tzinfo=timezone.utc)).days / 365.25
    dasha_cursor = balance_years
    current_lord = moon_nak_obj["lord"]
    dasha_idx = next((i for i, d in enumerate(DASHA_SEQUENCE) if d["lord"] == current_lord), 0)

    while age_years > dasha_cursor:
        dasha_idx = (dasha_idx + 1) % len(DASHA_SEQUENCE)
        dasha_cursor += DASHA_SEQUENCE[dasha_idx]["years"]
    
    active_dasha_name = DASHA_SEQUENCE[dasha_idx]["lord"]
    current_dasha_str = f"{active_dasha_name} Mahadasha"

    return {
        "ayanamsa": f"Lahiri Chitrapaksha ({deg_to_dms_str(ayanamsa)})",
        "lagna": lagna_info["rasi_full"],
        "lagna_tamil": lagna_info["rasi_tamil"],
        "lagna_deg": lagna_info["degrees"],
        "lagna_star": f"{lagna_info['nakshatra']} (Pada {lagna_info['pada']})",
        "rasi": moon_info["rasi_full"],
        "rasi_tamil": moon_info["rasi_tamil"],
        "moon_deg": moon_info["degrees"],
        "nakshatra": moon_info["nakshatra"],
        "nakshatra_tamil": moon_info["nakshatra_tamil"],
        "pada": moon_info["pada"],
        "birth_dasha_balance": f"{moon_nak_obj['lord']} Dasha: {balance_years:.1f} Yrs at birth",
        "current_dasha": current_dasha_str,
        "planets": calculated_planets
    }

@router.post("/calculate-chart")
async def calculate_chart(req: ChartRequest):
    try:
        dt_str = f"{req.dob} {req.tob}"
        dt = datetime.strptime(dt_str, "%Y-%m-%d %H:%M")
        dt_utc = dt - timedelta(hours=req.timezone_offset)
        
        result = calculate_universal_ephemeris(dt_utc, req.latitude, req.longitude)
        result["user_details"] = {
            "name": req.name,
            "gender": req.gender,
            "dob": req.dob,
            "tob": req.tob,
            "pob": req.pob
        }
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Astrological calculation error: {str(e)}")
