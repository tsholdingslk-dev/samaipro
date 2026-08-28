"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Globe, Server, ExternalLink, Settings, ArrowLeft, 
  CheckCircle2, Plus, Edit2, Trash2, Shield
} from 'lucide-react';

type Site = {
  id: string;
  name: string;
  type: string;
  status: string;
  manageUrl: string;
  siteUrl: string;
};

const DEFAULT_SITES: Site[] = [
  { 
    id: "3z",
    name: "3zeronetwork.com", 
    type: "PHP / Custom", 
    status: "Live",
    manageUrl: "https://3zeronetwork.com/admin",
    siteUrl: "https://3zeronetwork.com"
  },
  { 
    id: "auslanka",
    name: "AusLanka Holidays", 
    type: "HTML / PHP", 
    status: "Live",
    manageUrl: "https://auslanka.com/admin",
    siteUrl: "https://auslanka.com"
  },
  { 
    id: "kannagi",
    name: "Kannagi Kalalayam", 
    type: "WordPress CMS", 
    status: "Live",
    manageUrl: "https://kannagi.org/wp-admin",
    siteUrl: "https://kannagi.org"
  }
];

export default function SiteManager() {
  const [sites, setSites] = useState<Site[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("samai_managed_sites");
      if (saved) {
        try { return JSON.parse(saved); } catch {}
      }
    }
    return DEFAULT_SITES;
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSiteUrl, setEditSiteUrl] = useState("");
  const [editManageUrl, setEditManageUrl] = useState("");

  const saveSites = (updated: Site[]) => {
    setSites(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("samai_managed_sites", JSON.stringify(updated));
    }
  };

  const handleStartEdit = (site: Site) => {
    setEditingId(site.id);
    setEditSiteUrl(site.siteUrl);
    setEditManageUrl(site.manageUrl);
  };

  const handleSaveEdit = (id: string) => {
    const updated = sites.map(s => {
      if (s.id === id) {
        return { ...s, siteUrl: editSiteUrl, manageUrl: editManageUrl };
      }
      return s;
    });
    saveSites(updated);
    setEditingId(null);
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(to bottom right, var(--bg-dark), #0f0f16)", color: "var(--text-main)", padding: "3rem 2rem", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ marginBottom: "2.5rem" }}>
          <Link href="/modules" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", textDecoration: "none", fontSize: "0.85rem", marginBottom: "0.8rem", padding: "4px 10px", borderRadius: "6px", background: "rgba(255,255,255,0.05)" }}>
            <ArrowLeft size={14} /> Back to Modules
          </Link>
          <h1 style={{ fontSize: "2.4rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.8rem", background: "linear-gradient(135deg, #f59e0b, #ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            <Globe size={36} color="#f59e0b" />
            Websites & CMS Manager
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "1.05rem", marginTop: "0.4rem" }}>
            Central command dashboard to monitor, manage and launch your PHP, HTML & WordPress web applications.
          </p>
        </div>

        {/* Sites List */}
        <div style={{ display: "grid", gap: "1.2rem" }}>
          {sites.map((site) => (
            <div key={site.id} style={{ 
              background: "rgba(25, 25, 35, 0.5)", border: "1px solid rgba(255,255,255,0.08)", 
              borderRadius: "16px", padding: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(245, 158, 11, 0.15)", border: "1px solid rgba(245, 158, 11, 0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Server size={24} color="#f59e0b" />
                </div>
                <div>
                  <h3 style={{ margin: "0 0 4px 0", fontSize: "1.2rem", fontWeight: 700 }}>{site.name}</h3>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    <span>{site.type}</span>
                    <span>·</span>
                    <span style={{ color: "#10b981", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                      <CheckCircle2 size={13} /> {site.status}
                    </span>
                  </div>
                </div>
              </div>

              {editingId === site.id ? (
                <div style={{ width: "100%", marginTop: "0.8rem", background: "rgba(0,0,0,0.3)", padding: "1rem", borderRadius: "10px" }}>
                  <div style={{ marginBottom: "0.6rem" }}>
                    <label style={{ fontSize: "0.78rem", color: "#9ca3af", display: "block", marginBottom: "0.2rem" }}>Site URL:</label>
                    <input
                      type="text"
                      value={editSiteUrl}
                      onChange={e => setEditSiteUrl(e.target.value)}
                      style={{ width: "100%", background: "#0c0e17", border: "1px solid var(--border)", borderRadius: "6px", padding: "0.4rem 0.8rem", color: "#fff", fontSize: "0.85rem", boxSizing: "border-box" }}
                    />
                  </div>
                  <div style={{ marginBottom: "0.8rem" }}>
                    <label style={{ fontSize: "0.78rem", color: "#9ca3af", display: "block", marginBottom: "0.2rem" }}>Admin / Manage URL:</label>
                    <input
                      type="text"
                      value={editManageUrl}
                      onChange={e => setEditManageUrl(e.target.value)}
                      style={{ width: "100%", background: "#0c0e17", border: "1px solid var(--border)", borderRadius: "6px", padding: "0.4rem 0.8rem", color: "#fff", fontSize: "0.85rem", boxSizing: "border-box" }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => handleSaveEdit(site.id)}
                      style={{ background: "#10b981", color: "#fff", border: "none", padding: "6px 14px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}
                    >
                      Save URLs
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "0.8rem", cursor: "pointer" }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                  <button 
                    onClick={() => handleStartEdit(site)}
                    style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#d1d5db", padding: "8px 12px", borderRadius: "8px", fontSize: "0.85rem", cursor: "pointer" }}
                    title="Edit Site URLs"
                  >
                    <Edit2 size={14} /> Configure
                  </button>

                  <a 
                    href={site.manageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b", padding: "8px 14px", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 600, textDecoration: "none" }}
                  >
                    <Settings size={14} /> Admin CMS
                  </a>

                  <a 
                    href={site.siteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: "6px", background: "linear-gradient(135deg, #f59e0b, #ea580c)", color: "#fff", padding: "8px 16px", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 700, textDecoration: "none" }}
                  >
                    <ExternalLink size={14} /> Open Site
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
