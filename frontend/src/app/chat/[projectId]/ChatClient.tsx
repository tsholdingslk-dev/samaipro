"use client";

import { useEffect, useState, useRef, use, useCallback } from "react";
import { apiFetch } from "../../../utils/api";

type Attachment = {
  type: "image" | "document" | "video" | "audio";
  url: string;
  name: string;
  file?: File;
};

type Message = {
  id?: string;
  role: string;
  content: string;
  timestamp?: string;
  files?: Array<{
    type: "image" | "document" | "video" | "audio";
    url: string;
    name: string;
  }>;
};

export default function ChatClient({ projectId }: { projectId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState<number | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchHistory = useCallback(async () => {
    try {
      const data = await apiFetch(`/chat/${projectId}`);
      setMessages(data);
    } catch (err) {
      console.error("Failed to fetch chat history", err);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      fetchHistory();
    }
  }, [projectId, fetchHistory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && attachments.length === 0) || loading) return;

    const userMessage: Message = { 
      role: "user", 
      content: input,
      files: attachments.map(f => ({ type: f.type, url: f.url, name: f.name }))
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    const currentAttachments = [...attachments];
    setAttachments([]);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("role", "user");
      formData.append("content", userMessage.content);
      
      currentAttachments.forEach((att) => {
        if (att.file) {
          formData.append("files", att.file);
        }
      });

      const token = localStorage.getItem("token");
      const response = await fetch(`/api/chat/${projectId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();
      const aiMessage: Message = { role: "assistant", content: data.content };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message-bubble ${msg.role === 'user' ? 'user' : 'ai'}`}>
            <div>{msg.content}</div>
          </div>
        ))}
        {loading && <div className="message-bubble ai">SAM AI is thinking...</div>}
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
          />
          <button type="submit" className="chat-send-btn" disabled={loading}>Send</button>
        </form>
      </div>
    </>
  );
}
