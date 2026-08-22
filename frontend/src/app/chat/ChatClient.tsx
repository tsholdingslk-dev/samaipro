"use client";

import { useEffect, useState, useRef } from "react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export default function ChatClient({ projectId }: { projectId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Safe fetch on mount
  useEffect(() => {
    const init = async () => {
      try {
        const url = `/api/chat/${projectId || "default"}`;
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const res = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setMessages(data.map((m: any, i: number) => ({
            id: String(i),
            role: m.role === "user" ? "user" : "assistant",
            content: String(m.content || ""),
          })));
        } else {
          setMessages([{
            id: "welcome",
            role: "assistant",
            content: "Hello! I am SAM AI Turbo Engine. How can I assist you today?",
          }]);
        }
      } catch {
        setMessages([{
          id: "welcome",
          role: "assistant",
          content: "Hello! I am SAM AI Turbo Engine. How can I assist you today?",
        }]);
      }
    };
    init();
  }, [projectId]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("content", text);

      const url = `/api/chat/${projectId || "default"}`;
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(url, {
        method: "POST",
        headers: token ? {
          Authorization: `Bearer ${token}`
        } : {},
        body: formData,
      });
      const data = await res.json();
      const reply = data.content || data.message || "SAM AI is processing your request...";
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: String(reply),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message-bubble ${msg.role === "user" ? "user" : "ai"}`}>
            <div>{msg.content}</div>
          </div>
        ))}
        {loading && (
          <div className="message-bubble ai">
            <div style={{ opacity: 0.6 }}>SAM AI is thinking...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <form onSubmit={sendMessage} className="chat-input-wrapper">
          <input
            type="text"
            className="chat-input"
            placeholder="Message SAM AI..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            autoFocus
          />
          <button type="submit" className="chat-send-btn" disabled={loading || !input.trim()}>
            {loading ? "..." : "Send"}
          </button>
        </form>
      </div>
    </>
  );
}
