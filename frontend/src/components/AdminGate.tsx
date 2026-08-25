"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, AlertCircle, ShieldCheck } from "lucide-react";
import { apiFetch } from "../utils/api";

interface AdminGateProps {
  children: React.ReactNode;
  onValidSession?: (role: string) => void;
}

export default function AdminGate({ children, onValidSession }: AdminGateProps) {
  const [accessGranted, setAccessGranted] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const session = localStorage.getItem("admin_session");
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed.expiry > Date.now()) {
          setAccessGranted(true);
          if (onValidSession) onValidSession(parsed.role || "admin");
        } else {
          localStorage.removeItem("admin_session");
        }
      } catch (e) {
        localStorage.removeItem("admin_session");
      }
    }
    setChecking(false);
  }, [onValidSession]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminKey.trim()) return;
    
    setLoading(true);
    setError("");

    try {
      const data = await apiFetch("/auth/verify-admin-access", {
        method: "POST",
        body: JSON.stringify({ admin_key: adminKey }),
      });
      
      const role = data.role || "admin";
      localStorage.setItem("admin_session", JSON.stringify({
        key: adminKey,
        role: role,
        expiry: Date.now() + 60 * 60 * 1000 // 1 hour
      }));
      
      setAccessGranted(true);
      if (onValidSession) onValidSession(role);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid Admin Access Key");
    } finally {
      setLoading(false);
    }
  };

  if (checking) return null;

  if (accessGranted) {
    return <>{children}</>;
  }

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(10, 10, 15, 0.8)",
      backdropFilter: "blur(12px)",
      zIndex: 9999
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={error ? { x: [-10, 10, -10, 10, 0] } : { opacity: 1, scale: 1 }}
        transition={error ? { duration: 0.4 } : { duration: 0.3 }}
        style={{
          width: "100%",
          maxWidth: "400px",
          padding: "2.5rem",
          borderRadius: "24px",
          background: "rgba(25, 25, 35, 0.9)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            width: "64px",
            height: "64px",
            background: "rgba(99, 102, 241, 0.1)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.5rem",
            color: "var(--primary)"
          }}>
            <ShieldCheck size={32} />
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "0.5rem", color: "#ffffff" }}>
            Restricted Area
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Please enter your Admin Access Key to continue to modules.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ position: "relative" }}>
              <Lock 
                size={18} 
                style={{ 
                  position: "absolute", 
                  left: "1rem", 
                  top: "50%", 
                  transform: "translateY(-50%)", 
                  color: "var(--text-muted)" 
                }} 
              />
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Admin Key"
                style={{
                  width: "100%",
                  padding: "1rem 1rem 1rem 3rem",
                  background: "rgba(0, 0, 0, 0.2)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  color: "#fff",
                  fontSize: "1rem",
                  outline: "none",
                  transition: "border-color 0.2s"
                }}
                onFocus={(e) => e.target.style.borderColor = "var(--primary)"}
                onBlur={(e) => e.target.style.borderColor = "rgba(255, 255, 255, 0.1)"}
              />
            </div>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "0.5rem", 
                  color: "#ef4444", 
                  fontSize: "0.85rem", 
                  marginTop: "0.75rem" 
                }}
              >
                <AlertCircle size={14} />
                {error}
              </motion.div>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "1rem",
              background: "var(--primary)",
              color: "#fff",
              border: "none",
              borderRadius: "12px",
              fontSize: "1rem",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              transition: "background 0.2s"
            }}
          >
            {loading ? "Verifying..." : "Access Modules"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
