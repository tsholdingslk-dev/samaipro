"use client";

import React from "react";
import { motion } from "framer-motion";

// Traditional 4x4 Grid for Sinhala/South Indian Chart
// Top row: Pisces, Aries, Taurus, Gemini
// Right col: Cancer, Leo, Virgo
// Bottom row: Libra, Scorpio, Sagittarius
// Left col: Capricorn, Aquarius

const defaultHouses = [
  { id: 12, name: "Meena", label: "මීන" }, { id: 1, name: "Mesha", label: "මේෂ" }, { id: 2, name: "Vrishabha", label: "වෘෂභ" }, { id: 3, name: "Mithuna", label: "මිථුන" },
  { id: 11, name: "Kumbha", label: "කුම්භ" }, { id: 'center', name: "", label: "" }, { id: 'center', name: "", label: "" }, { id: 4, name: "Kataka", label: "කටක" },
  { id: 10, name: "Makara", label: "මකර" }, { id: 'center', name: "", label: "" }, { id: 'center', name: "", label: "" }, { id: 5, name: "Sinha", label: "සිංහ" },
  { id: 9, name: "Dhanu", label: "ධනු" }, { id: 8, name: "Vrishchika", label: "වෘශ්චික" }, { id: 7, name: "Thula", label: "තුලා" }, { id: 6, name: "Kanya", label: "කන්‍යා" }
];

export default function AstrologyChart({ planets = {}, title = "Kendara Chart" }: { planets?: any, title?: string }) {
  return (
    <div style={{ maxWidth: "400px", margin: "0 auto", padding: "1rem", background: "var(--bg-dark)", borderRadius: "12px", border: "1px solid var(--border)" }}>
      <h3 style={{ textAlign: "center", marginBottom: "1rem", color: "var(--primary)" }}>{title}</h3>
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(4, 1fr)", 
        gridTemplateRows: "repeat(4, 1fr)",
        aspectRatio: "1/1",
        gap: "2px",
        background: "var(--border)",
        border: "2px solid var(--border)"
      }}>
        {defaultHouses.map((house, idx) => {
          if (house.id === 'center') {
            // Render the center big box
            if (idx === 5) {
              return (
                <div key={idx} style={{ gridColumn: "2 / span 2", gridRow: "2 / span 2", background: "var(--bg-dark)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                    <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
                      <div style={{ fontSize: "1.5rem" }}>🕉️</div>
                      <div style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>TS-Brain</div>
                      <div style={{ fontSize: "0.8rem" }}>Astrology Engine</div>
                    </div>
                  </motion.div>
                </div>
              );
            }
            return null; // Skip the other center blocks because we spanned them
          }

          // Normal zodiac houses
          return (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: idx * 0.05 }}
              key={idx} 
              style={{ background: "var(--bg-dark)", padding: "0.25rem", position: "relative", display: "flex", flexDirection: "column" }}
            >
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", opacity: 0.7 }}>{house.label}</div>
              
              {/* Planets in this house */}
              <div style={{ flex: 1, display: "flex", flexWrap: "wrap", alignContent: "center", justifyContent: "center", gap: "2px" }}>
                {planets[house.id] && planets[house.id].map((planet: string, pIdx: number) => (
                  <span key={pIdx} style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#fff" }}>
                    {planet}
                  </span>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
