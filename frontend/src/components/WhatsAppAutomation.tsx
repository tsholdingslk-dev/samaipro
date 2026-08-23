"use client";

import React, { useState, useEffect } from "react";
import { QrCode, Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function WhatsAppAutomation({ phone, message, onSent }: { phone: string, message: string, onSent?: () => void }) {
  const [status, setStatus] = useState<"loading" | "qr_ready" | "connected" | "error">("loading");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message?: string } | null>(null);

  const WA_SERVER = process.env.NEXT_PUBLIC_WA_SERVER || "http://localhost:4000";

  const checkStatus = async () => {
    try {
      const res = await fetch(`${WA_SERVER}/api/wa/status`);
      const data = await res.json();
      
      if (data.ready) {
        setStatus("connected");
      } else if (data.qrCode) {
        setQrCode(data.qrCode);
        setStatus("qr_ready");
      } else {
        setStatus("loading");
      }
    } catch (err) {
      console.error("WA Server offline", err);
      setStatus("error");
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  const handleSend = async () => {
    if (!phone || !message) return;
    setSending(true);
    try {
      const res = await fetch(`${WA_SERVER}/api/wa/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, message })
      });
      const data = await res.json();
      if (data.success) {
        setSendResult({ success: true, message: "Successfully sent via WhatsApp Automation!" });
        if (onSent) onSent();
      } else {
        setSendResult({ success: false, message: data.error || "Failed to send." });
      }
    } catch (err: any) {
      setSendResult({ success: false, message: "Server error. Is the WA Server running?" });
    }
    setSending(false);
  };

  return (
    <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.5rem", marginTop: "1.5rem" }}>
      <h4 style={{ margin: "0 0 1rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WA" width="20" height="20" />
        TS-Brain WhatsApp Automation
      </h4>

      {status === "error" && (
        <div style={{ color: "#ef4444", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem" }}>
          <AlertCircle size={16} /> WA Automation Server offline. Start 'whatsapp-server'.
        </div>
      )}

      {status === "loading" && (
        <div style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem" }}>
          <Loader2 size={16} className="animate-spin" /> Initializing WhatsApp Engine...
        </div>
      )}

      {status === "qr_ready" && qrCode && (
        <div style={{ textAlign: "center", background: "#fff", padding: "1rem", borderRadius: "8px", display: "inline-block" }}>
          <img src={qrCode} alt="WhatsApp QR Code" style={{ width: "200px", height: "200px" }} />
          <p style={{ color: "#000", margin: "0.5rem 0 0 0", fontSize: "0.85rem", fontWeight: 600 }}>Scan QR with WhatsApp</p>
        </div>
      )}

      {status === "connected" && (
        <div>
          <div style={{ color: "#10b981", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.95rem", marginBottom: "1rem" }}>
            <CheckCircle size={18} /> Phone Connected. Ready to automate!
          </div>

          <button 
            onClick={handleSend} 
            disabled={sending}
            style={{ 
              width: "100%", 
              padding: "0.8rem", 
              borderRadius: "8px", 
              background: sending ? "rgba(16, 185, 129, 0.5)" : "#10b981", 
              color: "#fff", 
              border: "none", 
              fontWeight: 600, 
              cursor: sending ? "wait" : "pointer",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "0.5rem"
            }}
          >
            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            {sending ? "Sending..." : "Auto-Send WhatsApp Message"}
          </button>
          
          {sendResult && (
            <div style={{ marginTop: "1rem", fontSize: "0.85rem", color: sendResult.success ? "#10b981" : "#ef4444" }}>
              {sendResult.message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
