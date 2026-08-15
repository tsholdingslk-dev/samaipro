"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Using native fetch for Vercel compatibility

interface Lead {
  id: string;
  business_name: string;
  category: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  rating: string;
  review_count: string;
  website: string | null;
  website_status: string; // missing, outdated, active
  demo_url: string | null;
  demo_data: string | null;
  outreach_status: string; // new, demo_created, proposal_sent, converted
  created_at: string;
}

export default function LeadGenPage() {
  const router = useRouter();

  // Search State
  const [query, setQuery] = useState("Nearby Restaurants");
  const [city, setCity] = useState("Madurai");
  const [filterNoWebsite, setFilterNoWebsite] = useState(true);
  const [filterOutdatedWebsite, setFilterOutdatedWebsite] = useState(true);
  const [loadingSearch, setLoadingSearch] = useState(false);

  // Leads Data
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Active View Tab
  const [activeTab, setActiveTab] = useState<"search" | "leads" | "demo" | "proposal">("search");

  // Demo Generator State
  const [templateTheme, setTemplateTheme] = useState("modern_dark");
  const [customTagline, setCustomTagline] = useState("");
  const [generatingDemo, setGeneratingDemo] = useState(false);
  const [demoPreviewData, setDemoPreviewData] = useState<any>(null);

  // Proposal State
  const [proposalLang, setProposalLang] = useState<"tamil" | "english" | "bilingual">("tamil");
  const [senderName, setSenderName] = useState("SAM AI Studio");
  const [senderPhone, setSenderPhone] = useState("+91 9876543210");
  const [generatingProposal, setGeneratingProposal] = useState(false);
  const [proposalResult, setProposalResult] = useState<{ proposal_text: string; whatsapp_url: string; demo_url: string } | null>(null);

  // Notification Banner
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch initial leads
  const fetchLeads = async () => {
    setLoadingLeads(true);
    try {
      const res = await fetch("/api/lead-gen/leads");
      const data = await res.json();
      const leadArr = Array.isArray(data) ? data : (data.leads || []);
      setLeads(leadArr);
      if (leadArr.length > 0 && !selectedLead) {
        setSelectedLead(leadArr[0]);
      }
    } catch (err) {
      console.error("Failed to fetch leads", err);
      setLeads([]);
    } finally {
      setLoadingLeads(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // Handle Search & Scraper
  const handleSearchLeads = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !city.trim()) return;

    setLoadingSearch(true);
    try {
      const res = await fetch("/api/lead-gen/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          city,
          filter_no_website: filterNoWebsite,
          filter_outdated_website: filterOutdatedWebsite
        })
      });
      const data = await res.json();
      const newLeads = Array.isArray(data) ? data : (data.leads || []);
      showNotification(`Extracted ${newLeads.length} leads in ${city}!`, "success");
      setLeads(newLeads);
      if (newLeads.length > 0) setSelectedLead(newLeads[0]);
      setActiveTab("leads");
    } catch (err: any) {
      showNotification(err.message || "Error connecting to backend.", "error");
    } finally {
      setLoadingSearch(false);
    }
  };

  // Generate Demo Website
  const handleGenerateDemo = async (lead: Lead) => {
    setSelectedLead(lead);
    setGeneratingDemo(true);
    try {
      const res = await fetch("/api/lead-gen/generate-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: lead.id,
          template_theme: templateTheme,
          custom_tagline: customTagline || undefined
        })
      });
      const data = await res.json();
      setDemoPreviewData(data.demo_data || data);
      showNotification(`Demo Website created for ${lead.business_name}!`, "success");
      setActiveTab("demo");
    } catch (err) {
      showNotification("Failed to generate demo site.", "error");
    } finally {
      setGeneratingDemo(false);
    }
  };

  // Generate AI Proposal
  const handleGenerateProposal = async (lead: Lead) => {
    setSelectedLead(lead);
    setGeneratingProposal(true);
    try {
      const res = await fetch("/api/lead-gen/generate-proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: lead.id,
          language: proposalLang,
          sender_name: senderName,
          sender_phone: senderPhone
        })
      });
      const data = await res.json();
      setProposalResult(data);
      showNotification("Personalized Proposal Generated!", "success");
      setActiveTab("proposal");
    } catch (err) {
      showNotification("Failed to generate proposal.", "error");
    } finally {
      setGeneratingProposal(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    window.open(`/api/lead-gen/export`, "_blank");
  };

  const handleClearAllLeads = async () => {
    if (!confirm("Are you sure you want to clear all old saved leads?")) return;
    try {
      await fetch("/api/lead-gen/leads-clear/all", { method: "DELETE" });
      showNotification("All old saved leads cleared!", "success");
      setLeads([]);
      setSelectedLead(null);
    } catch (err) {
      showNotification("Failed to clear leads", "error");
    }
  };




  return (
    <div className="page-container" style={{ padding: "2rem", maxWidth: "1300px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <Link href="/modules" style={{ color: "#ec4899", textDecoration: "none", fontSize: "0.9rem", fontWeight: 600 }}>
            ← Back to Modules
          </Link>
          <h1 style={{ fontSize: "2.2rem", marginTop: "0.4rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>🎯</span> Lead Generation & Demo Web Studio
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Extract local businesses, filter missing websites, auto-create live demo sites & send WhatsApp proposals.
          </p>
        </div>
        <div style={{ display: "flex", gap: "1rem" }}>
          <button
            onClick={handleClearAllLeads}
            style={{
              background: "rgba(239, 68, 68, 0.15)",
              color: "#f87171",
              border: "1px solid #ef4444",
              borderRadius: "10px",
              padding: "0.75rem 1.25rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}
          >
            🗑️ Clear Old Leads
          </button>
          <button
            onClick={handleExportCSV}
            style={{
              background: "linear-gradient(135deg, #10b981, #059669)",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              padding: "0.75rem 1.25rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              boxShadow: "0 4px 14px rgba(16, 185, 129, 0.3)"
            }}
          >
            📥 Export Leads CSV
          </button>
        </div>
      </div>


      {/* Toast Notification */}
      {notification && (
        <div style={{
          padding: "1rem 1.5rem",
          borderRadius: "8px",
          marginBottom: "1.5rem",
          background: notification.type === "success" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
          border: `1px solid ${notification.type === "success" ? "#10b981" : "#ef4444"}`,
          color: notification.type === "success" ? "#34d399" : "#f87171",
          fontWeight: 500
        }}>
          {notification.message}
        </div>
      )}

      {/* Top Navigation Tabs */}
      <div style={{
        display: "flex",
        gap: "0.75rem",
        marginBottom: "2rem",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        paddingBottom: "0.75rem"
      }}>
        {[
          { id: "search", label: "🔍 1. Search & Scraper" },
          { id: "leads", label: `📊 2. Lead Pipeline (${leads.length})` },
          { id: "demo", label: "🎨 3. Instant Demo Web Studio" },
          { id: "proposal", label: "💬 4. WhatsApp Proposal Generator" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: "0.6rem 1.2rem",
              borderRadius: "8px",
              border: "none",
              background: activeTab === tab.id ? "#ec4899" : "rgba(255, 255, 255, 0.05)",
              color: "#fff",
              fontWeight: activeTab === tab.id ? 700 : 500,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: Search & Scraper */}
      {activeTab === "search" && (
        <div className="glass-panel animate-fade-in" style={{ padding: "2rem" }}>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Find Local Businesses & Missing Websites</h2>
          <form onSubmit={handleSearchLeads}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Business Category / Keyword</label>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. Nearby Restaurants, Salons, Plumbers, Clinics"
                  style={{
                    width: "100%",
                    padding: "0.8rem 1rem",
                    borderRadius: "8px",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    background: "rgba(0, 0, 0, 0.2)",
                    color: "#fff"
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>City / Area Location</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Chennai, Madurai, Coimbatore"
                  style={{
                    width: "100%",
                    padding: "0.8rem 1rem",
                    borderRadius: "8px",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    background: "rgba(0, 0, 0, 0.2)",
                    color: "#fff"
                  }}
                  required
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "2rem", marginBottom: "1.5rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={filterNoWebsite}
                  onChange={(e) => setFilterNoWebsite(e.target.checked)}
                  style={{ accentColor: "#ec4899", width: "18px", height: "18px" }}
                />
                <span style={{ fontSize: "0.95rem" }}>Filter Missing Websites (`Website: null / empty`)</span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={filterOutdatedWebsite}
                  onChange={(e) => setFilterOutdatedWebsite(e.target.checked)}
                  style={{ accentColor: "#ec4899", width: "18px", height: "18px" }}
                />
                <span style={{ fontSize: "0.95rem" }}>Include Outdated / Non-Mobile Sites</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loadingSearch}
              style={{
                width: "100%",
                padding: "0.9rem",
                borderRadius: "10px",
                border: "none",
                background: "linear-gradient(135deg, #ec4899, #be185d)",
                color: "#fff",
                fontSize: "1.1rem",
                fontWeight: 700,
                cursor: loadingSearch ? "not-allowed" : "pointer"
              }}
            >
              {loadingSearch ? "🔍 Extracting Businesses & Scraping Data..." : "🚀 Extract Business Leads Now"}
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: Lead Pipeline Table */}
      {activeTab === "leads" && (
        <div className="glass-panel animate-fade-in" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.4rem" }}>Discovered Business Leads</h2>
            <button onClick={fetchLeads} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", padding: "0.4rem 0.8rem", borderRadius: "6px", cursor: "pointer" }}>
              🔄 Refresh List
            </button>
          </div>

          {loadingLeads ? (
            <p style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>Loading business leads...</p>
          ) : leads.length === 0 ? (
            <p style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>No leads found yet. Use the Search & Scraper tab to extract businesses!</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.03)" }}>
                    <th style={{ padding: "0.75rem" }}>Business</th>
                    <th style={{ padding: "0.75rem" }}>Category</th>
                    <th style={{ padding: "0.75rem" }}>Phone</th>
                    <th style={{ padding: "0.75rem" }}>City</th>
                    <th style={{ padding: "0.75rem" }}>Rating</th>
                    <th style={{ padding: "0.75rem" }}>Website Status</th>
                    <th style={{ padding: "0.75rem" }}>Outreach Status</th>
                    <th style={{ padding: "0.75rem" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((l) => (
                    <tr key={l.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                      <td style={{ padding: "0.75rem", fontWeight: 600 }}>{l.business_name}</td>
                      <td style={{ padding: "0.75rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>{l.category}</td>
                      <td style={{ padding: "0.75rem" }}>{l.phone || "N/A"}</td>
                      <td style={{ padding: "0.75rem" }}>{l.city}</td>
                      <td style={{ padding: "0.75rem" }}>⭐ {l.rating} ({l.review_count})</td>
                      <td style={{ padding: "0.75rem" }}>
                        {l.website_status === "missing" ? (
                          <span style={{ background: "rgba(239, 68, 68, 0.2)", color: "#f87171", padding: "0.25rem 0.5rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 700 }}>
                            🚫 NO WEBSITE
                          </span>
                        ) : (
                          <span style={{ background: "rgba(245, 158, 11, 0.2)", color: "#fbbf24", padding: "0.25rem 0.5rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 700 }}>
                            ⚠️ OUTDATED SITE
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        <span style={{
                          background: l.outreach_status === "proposal_sent" ? "rgba(16, 185, 129, 0.2)" : l.outreach_status === "demo_created" ? "rgba(59, 130, 246, 0.2)" : "rgba(107, 114, 128, 0.2)",
                          color: l.outreach_status === "proposal_sent" ? "#34d399" : l.outreach_status === "demo_created" ? "#60a5fa" : "#9ca3af",
                          padding: "0.25rem 0.5rem", borderRadius: "4px", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700
                        }}>
                          {l.outreach_status}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button
                            onClick={() => handleGenerateDemo(l)}
                            title="Generate/Update Demo Website"
                            style={{ background: "#8b5cf6", border: "none", color: "#fff", padding: "0.3rem 0.6rem", borderRadius: "4px", cursor: "pointer", fontSize: "0.8rem" }}
                          >
                            🪄 Demo
                          </button>

                          {l.demo_url && (
                            <a
                              href={l.demo_url}
                              target="_blank"
                              rel="noreferrer"
                              style={{ background: "#3b82f6", color: "#fff", padding: "0.3rem 0.6rem", borderRadius: "4px", textDecoration: "none", fontSize: "0.8rem" }}
                            >
                              👁️ View
                            </a>
                          )}

                          <button
                            onClick={() => handleGenerateProposal(l)}
                            title="Generate Proposal"
                            style={{ background: "#ec4899", border: "none", color: "#fff", padding: "0.3rem 0.6rem", borderRadius: "4px", cursor: "pointer", fontSize: "0.8rem" }}
                          >
                            📩 Proposal
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Instant Demo Web Studio */}
      {activeTab === "demo" && (
        <div className="glass-panel animate-fade-in" style={{ padding: "2rem" }}>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Instant Demo Web Studio</h2>
          {selectedLead ? (
            <div>
              <div style={{ background: "rgba(255,255,255,0.05)", padding: "1rem", borderRadius: "8px", marginBottom: "1.5rem" }}>
                <p style={{ fontWeight: 700, fontSize: "1.1rem" }}>Target Business: {selectedLead.business_name}</p>
                <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>Category: {selectedLead.category} | City: {selectedLead.city} | Phone: {selectedLead.phone}</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "2rem" }}>
                {/* Controls */}
                <div>
                  <h3 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>Template Customization</h3>
                  
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.9rem" }}>Select Theme Style</label>
                    <select
                      value={templateTheme}
                      onChange={(e) => setTemplateTheme(e.target.value)}
                      style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", background: "rgba(0,0,0,0.3)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }}
                    >
                      <option value="modern_dark">Modern Dark Minimalist</option>
                      <option value="warm_restaurant">Warm Gourmet / Restaurant</option>
                      <option value="elegant_salon">Elegant Luxury Salon / Beauty</option>
                      <option value="professional_service">Professional Business & Service</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: "1.5rem" }}>
                    <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.9rem" }}>Custom Tagline (Optional)</label>
                    <input
                      type="text"
                      value={customTagline}
                      onChange={(e) => setCustomTagline(e.target.value)}
                      placeholder="e.g. Best Taste & Fast Delivery in City"
                      style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", background: "rgba(0,0,0,0.3)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }}
                    />
                  </div>

                  <button
                    onClick={() => handleGenerateDemo(selectedLead)}
                    disabled={generatingDemo}
                    style={{
                      width: "100%",
                      padding: "0.8rem",
                      borderRadius: "8px",
                      border: "none",
                      background: "#8b5cf6",
                      color: "#fff",
                      fontWeight: 700,
                      cursor: "pointer",
                      marginBottom: "1rem"
                    }}
                  >
                    {generatingDemo ? "Generating..." : "⚡ Build Dynamic Demo Page"}
                  </button>

                  {selectedLead.demo_url && (
                    <a
                      href={selectedLead.demo_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "block",
                        textAlign: "center",
                        padding: "0.8rem",
                        borderRadius: "8px",
                        background: "#3b82f6",
                        color: "#fff",
                        textDecoration: "none",
                        fontWeight: 700
                      }}
                    >
                      🔗 Open Live Demo Link
                    </a>
                  )}
                </div>

                {/* Live Sandbox Preview */}
                <div style={{ background: "#0f172a", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden" }}>
                  <div style={{ background: "#1e293b", padding: "0.5rem 1rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ef4444" }}></div>
                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#f59e0b" }}></div>
                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#10b981" }}></div>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginLeft: "0.5rem" }}>
                      Preview: samaipro-zrlr.vercel.app{selectedLead.demo_url || `/demo/${selectedLead.id}`}
                    </span>
                  </div>

                  <div style={{ padding: "1.5rem", maxHeight: "500px", overflowY: "auto" }}>
                    {demoPreviewData ? (
                      <div>
                        <div style={{ textAlign: "center", padding: "2rem 1rem", background: "linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url(" + demoPreviewData.hero_image + ") center/cover", borderRadius: "8px", marginBottom: "1.5rem" }}>
                          <h1 style={{ fontSize: "1.8rem", color: "#fff", marginBottom: "0.5rem" }}>{demoPreviewData.business_name}</h1>
                          <p style={{ color: "#cbd5e1", fontSize: "1rem" }}>{demoPreviewData.tagline}</p>
                          <div style={{ marginTop: "1rem", display: "flex", justifyContent: "center", gap: "1rem" }}>
                            <span style={{ background: "#ec4899", color: "#fff", padding: "0.4rem 1rem", borderRadius: "20px", fontWeight: 700 }}>
                              📞 Call: {demoPreviewData.phone}
                            </span>
                            <span style={{ background: "#10b981", color: "#fff", padding: "0.4rem 1rem", borderRadius: "20px", fontWeight: 700 }}>
                              ⭐ {demoPreviewData.rating} Rating
                            </span>
                          </div>
                        </div>

                        <h4 style={{ marginBottom: "0.5rem" }}>Featured Offerings:</h4>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                          {demoPreviewData.services?.map((s: any, idx: number) => (
                            <div key={idx} style={{ background: "rgba(255,255,255,0.05)", padding: "1rem", borderRadius: "8px" }}>
                              <p style={{ fontWeight: 700, color: "#f472b6" }}>{s.title}</p>
                              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{s.desc}</p>
                              <p style={{ fontSize: "0.8rem", fontWeight: 700, marginTop: "0.4rem" }}>{s.price}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--text-muted)" }}>
                        Click "Build Dynamic Demo Page" to generate interactive preview!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p style={{ color: "var(--text-muted)" }}>Please select a lead from the Lead Pipeline table first!</p>
          )}
        </div>
      )}

      {/* TAB 4: WhatsApp Proposal Generator */}
      {activeTab === "proposal" && (
        <div className="glass-panel animate-fade-in" style={{ padding: "2rem" }}>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>WhatsApp / Email Outreach Proposal Generator</h2>
          {selectedLead ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "2rem" }}>
              {/* Proposal Settings */}
              <div>
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: 600 }}>Proposal Language</label>
                  <select
                    value={proposalLang}
                    onChange={(e) => setProposalLang(e.target.value as any)}
                    style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", background: "rgba(0,0,0,0.3)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }}
                  >
                    <option value="tamil">Tamil (தமிழ்)</option>
                    <option value="english">English</option>
                    <option value="bilingual">Bilingual (Tamil + English)</option>
                  </select>
                </div>

                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: 600 }}>Your Agency / Sender Name</label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", background: "rgba(0,0,0,0.3)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }}
                  />
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: 600 }}>Your Contact Phone Number</label>
                  <input
                    type="text"
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", background: "rgba(0,0,0,0.3)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }}
                  />
                </div>

                <button
                  onClick={() => handleGenerateProposal(selectedLead)}
                  disabled={generatingProposal}
                  style={{
                    width: "100%",
                    padding: "0.8rem",
                    borderRadius: "8px",
                    border: "none",
                    background: "linear-gradient(135deg, #ec4899, #be185d)",
                    color: "#fff",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  {generatingProposal ? "Generating..." : "🤖 Generate Custom AI Proposal"}
                </button>
              </div>

              {/* Output Preview & WhatsApp Launch */}
              <div>
                <h3 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>Generated Outreach Message</h3>
                {proposalResult ? (
                  <div>
                    <textarea
                      readOnly
                      rows={14}
                      value={proposalResult.proposal_text}
                      style={{
                        width: "100%",
                        padding: "1rem",
                        borderRadius: "8px",
                        background: "rgba(0,0,0,0.4)",
                        color: "#fff",
                        border: "1px solid rgba(255,255,255,0.15)",
                        fontSize: "0.95rem",
                        fontFamily: "sans-serif",
                        whiteSpace: "pre-wrap",
                        marginBottom: "1rem"
                      }}
                    />

                    <div style={{ display: "flex", gap: "1rem" }}>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(proposalResult.proposal_text);
                          showNotification("Proposal copied to clipboard!", "success");
                        }}
                        style={{
                          flex: 1,
                          padding: "0.8rem",
                          borderRadius: "8px",
                          border: "1px solid rgba(255,255,255,0.2)",
                          background: "rgba(255,255,255,0.1)",
                          color: "#fff",
                          fontWeight: 600,
                          cursor: "pointer"
                        }}
                      >
                        📋 Copy Text
                      </button>

                      <a
                        href={proposalResult.whatsapp_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          flex: 1.5,
                          padding: "0.8rem",
                          borderRadius: "8px",
                          background: "#25D366",
                          color: "#fff",
                          textDecoration: "none",
                          fontWeight: 700,
                          textAlign: "center",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          gap: "0.5rem"
                        }}
                      >
                        🟢 Send via WhatsApp Web
                      </a>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "4rem 2rem", background: "rgba(0,0,0,0.2)", borderRadius: "8px", color: "var(--text-muted)" }}>
                    Click "Generate Custom AI Proposal" to synthesize your personalized message!
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p style={{ color: "var(--text-muted)" }}>Please select a lead from the Lead Pipeline table first!</p>
          )}
        </div>
      )}
    </div>
  );
}
