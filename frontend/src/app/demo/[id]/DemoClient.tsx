"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function DemoClient() {
  const params = useParams();
  const leadId = params?.id as string;

  const [demoData, setDemoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [bookingModal, setBookingModal] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [bookingSubmitted, setBookingSubmitted] = useState(false);

  useEffect(() => {
    if (!leadId) return;

    fetch(`/api/lead-gen/demo/${leadId}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Demo website not found");
        }
        return res.json();
      })
      .then((data) => {
        setDemoData(data.demo_data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [leadId]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: "#030712", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ width: "50px", height: "50px", borderRadius: "50%", border: "4px solid #ec4899", borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
        <p style={{ marginTop: "1.5rem", fontSize: "1.1rem", color: "#94a3b8", fontWeight: 600 }}>Building & Loading Custom Corporate Web Showcase...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !demoData) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: "#030712", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
        <h2 style={{ fontSize: "2rem", fontWeight: 800 }}>Demo Website Not Found</h2>
        <p style={{ color: "#94a3b8", marginTop: "0.5rem" }}>The requested business demo link is invalid or expired.</p>
      </div>
    );
  }

  const colors = demoData.theme_colors || {
    primary: "#ec4899",
    accent: "#8b5cf6",
    bg: "#0f172a",
    card_bg: "rgba(30, 27, 75, 0.7)",
    gradient: "linear-gradient(135deg, #ec4899, #8b5cf6)"
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone) return;
    setBookingSubmitted(true);
    setTimeout(() => {
      setBookingModal(false);
      setBookingSubmitted(false);
      setCustomerName("");
      setCustomerPhone("");
    }, 2500);
  };

  const cleanPhone = demoData.phone ? demoData.phone.replace(/[^0-9]/g, "") : "";

  if (demoData.html_code) {
    return (
      <div style={{ width: "100vw", height: "100vh", overflow: "hidden", margin: 0, padding: 0, background: "#000" }}>
        <iframe
          srcDoc={demoData.html_code}
          title={demoData.business_name}
          style={{ width: "100%", height: "100%", border: "none" }}
        />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: colors.bg || "#0f172a", color: "#f8fafc", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Header */}
      <header style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "1.1rem 2.5rem",
        background: "rgba(3, 7, 18, 0.85)",
        backdropFilter: "blur(14px)",
        position: "sticky",
        top: 0,
        zIndex: 50,
        borderBottom: "1px solid rgba(255,255,255,0.08)"
      }}>
        <div style={{ fontSize: "1.5rem", fontWeight: 900, background: colors.gradient || "linear-gradient(135deg, #ec4899, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          {demoData.business_name}
        </div>
        
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          {demoData.phone && (
            <a
              href={`tel:${cleanPhone}`}
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                color: "#fff",
                padding: "0.6rem 1.2rem",
                borderRadius: "8px",
                textDecoration: "none",
                fontWeight: 700,
                fontSize: "0.9rem",
                border: "1px solid rgba(255,255,255,0.15)"
              }}
            >
              📞 {demoData.phone}
            </a>
          )}
          <button
            onClick={() => setBookingModal(true)}
            style={{
              background: colors.gradient || "linear-gradient(135deg, #ec4899, #8b5cf6)",
              color: "#fff",
              border: "none",
              padding: "0.65rem 1.4rem",
              borderRadius: "8px",
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(236, 72, 153, 0.3)"
            }}
          >
            📅 Book Appointment / Contact
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        padding: "5rem 2rem",
        textAlign: "center",
        background: demoData.hero_image
          ? `linear-gradient(rgba(3, 7, 18, 0.75), rgba(3, 7, 18, 0.9)), url(${demoData.hero_image}) center/cover no-repeat`
          : "linear-gradient(180deg, rgba(3, 7, 18, 0.5), rgba(15, 23, 42, 1))",
        borderBottom: "1px solid rgba(255,255,255,0.08)"
      }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <span style={{
            background: "rgba(236, 72, 153, 0.15)",
            color: "#f472b6",
            padding: "0.4rem 1.2rem",
            borderRadius: "20px",
            fontSize: "0.85rem",
            fontWeight: 700,
            letterSpacing: "1px",
            textTransform: "uppercase",
            border: "1px solid rgba(236, 72, 153, 0.3)",
            display: "inline-block",
            marginBottom: "1.5rem"
          }}>
            ⭐ Official Verified Business Hub in {demoData.city || "City"}
          </span>

          <h1 style={{ fontSize: "3.2rem", fontWeight: 900, lineHeight: 1.2, marginBottom: "1rem" }}>
            {demoData.business_name}
          </h1>

          <p style={{ fontSize: "1.25rem", color: "#cbd5e1", maxWidth: "700px", margin: "0 auto 2rem", lineHeight: 1.6 }}>
            {demoData.tagline || `Authentic ${demoData.category} Services with 100% Satisfaction Guarantee.`}
          </p>

          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => setBookingModal(true)}
              style={{
                background: colors.gradient || "linear-gradient(135deg, #ec4899, #8b5cf6)",
                color: "#fff",
                border: "none",
                padding: "0.9rem 2rem",
                borderRadius: "10px",
                fontSize: "1.05rem",
                fontWeight: 800,
                cursor: "pointer"
              }}
            >
              🚀 Get Free Consultation / Quote
            </button>
            {cleanPhone && (
              <a
                href={`https://wa.me/${cleanPhone}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: "#22c55e",
                  color: "#fff",
                  padding: "0.9rem 2rem",
                  borderRadius: "10px",
                  fontSize: "1.05rem",
                  fontWeight: 800,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem"
                }}
              >
                💬 WhatsApp Instant Chat
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Counters Bar */}
      {demoData.counters && (
        <section style={{ padding: "2.5rem 2rem", background: "rgba(0,0,0,0.4)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "2rem", textAlign: "center" }}>
            {demoData.counters.map((c: any, idx: number) => (
              <div key={idx}>
                <div style={{ fontSize: "2.2rem", fontWeight: 900, color: colors.primary || "#ec4899" }}>{c.value}</div>
                <div style={{ color: "#94a3b8", fontSize: "0.9rem", marginTop: "0.2rem" }}>{c.label}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Featured Offerings / Services */}
      {demoData.services && (
        <section style={{ padding: "4rem 2rem", maxWidth: "1200px", margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", fontSize: "2rem", fontWeight: 800, marginBottom: "0.5rem" }}>
            Our Premium Offerings & Services
          </h2>
          <p style={{ textAlign: "center", color: "#94a3b8", marginBottom: "3rem" }}>
            Designed for excellence and tailored to your specific needs
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem" }}>
            {demoData.services.map((s: any, idx: number) => (
              <div key={idx} style={{
                background: "rgba(30, 41, 59, 0.7)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "16px",
                padding: "2rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <span style={{ background: "rgba(236, 72, 153, 0.15)", color: "#f472b6", padding: "0.25rem 0.75rem", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 700 }}>
                      {s.badge || "Featured"}
                    </span>
                    <span style={{ fontWeight: 800, color: "#10b981", fontSize: "1.1rem" }}>{s.price}</span>
                  </div>
                  <h3 style={{ fontSize: "1.3rem", fontWeight: 800, marginBottom: "0.75rem" }}>{s.title}</h3>
                  <p style={{ color: "#94a3b8", fontSize: "0.95rem", lineHeight: 1.6 }}>{s.desc}</p>
                </div>
                <button
                  onClick={() => setBookingModal(true)}
                  style={{
                    marginTop: "1.5rem",
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    background: "rgba(255, 255, 255, 0.05)",
                    color: "#fff",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  Book This Service →
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Customer Reviews Section */}
      {demoData.reviews && (
        <section style={{ padding: "4rem 2rem", background: "rgba(0, 0, 0, 0.3)", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <h2 style={{ textAlign: "center", fontSize: "2rem", fontWeight: 800, marginBottom: "2.5rem" }}>
              What Our Clients Say
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
              {demoData.reviews.map((r: any, idx: number) => (
                <div key={idx} style={{
                  background: "rgba(15, 23, 42, 0.8)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  padding: "1.5rem",
                  borderRadius: "12px"
                }}>
                  <div style={{ color: "#f59e0b", marginBottom: "0.5rem" }}>{"⭐".repeat(r.stars || 5)}</div>
                  <p style={{ fontStyle: "italic", color: "#cbd5e1", fontSize: "0.95rem", marginBottom: "1rem", lineHeight: 1.6 }}>"{r.comment}"</p>
                  <p style={{ fontWeight: 700, fontSize: "0.9rem", color: colors.primary || "#ec4899" }}>- {r.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer style={{ textAlign: "center", padding: "3rem 2rem", borderTop: "1px solid rgba(255,255,255,0.08)", color: "#64748b", fontSize: "0.9rem" }}>
        <p>© 2026 {demoData.business_name}. Powered by SAM AI Corporate Studio Engine.</p>
      </footer>

      {/* Booking Modal */}
      {bookingModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100, padding: "1rem" }}>
          <div style={{ background: "#1e293b", padding: "2rem", borderRadius: "16px", maxWidth: "450px", width: "100%", border: "1px solid rgba(255, 255, 255, 0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 800 }}>📅 Book Appointment / Quote</h3>
              <button onClick={() => setBookingModal(false)} style={{ background: "transparent", border: "none", color: "#fff", fontSize: "1.5rem", cursor: "pointer" }}>×</button>
            </div>

            {bookingSubmitted ? (
              <div style={{ padding: "2rem 1rem", textAlign: "center", color: "#4ade80" }}>
                <h4>✅ Booking Requested Successfully!</h4>
                <p style={{ color: "#cbd5e1", fontSize: "0.9rem", marginTop: "0.5rem" }}>
                  {demoData.business_name} team will contact you shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit}>
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#cbd5e1", marginBottom: "0.3rem" }}>Your Name</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter your full name"
                    style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff" }}
                  />
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#cbd5e1", marginBottom: "0.3rem" }}>Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Enter your phone number"
                    style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff" }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    width: "100%",
                    padding: "0.85rem",
                    borderRadius: "8px",
                    border: "none",
                    background: colors.gradient || "linear-gradient(135deg, #ec4899, #8b5cf6)",
                    color: "#fff",
                    fontWeight: 800,
                    cursor: "pointer",
                    fontSize: "1rem"
                  }}
                >
                  Confirm Booking Request
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
