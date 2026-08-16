"use client";

import { useState } from "react";
import Link from "next/link";
import { apiFetch } from "../../../utils/api";

export default function SocialNewsPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [postResult, setPostResult] = useState("");
  const [error, setError] = useState("");
  
  // Image Analysis State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [imageAnalysis, setImageAnalysis] = useState("");

  const handleGeneratePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    setLoading(true);
    setError("");
    setPostResult("");
    setImageAnalysis("");
    setImageFile(null);
    setImagePreview("");

    try {
      const formData = new FormData();
      formData.append("url", url);
      
      const data = await apiFetch("/social-news/generate-post", {
        method: "POST",
        body: formData,
      });

      setPostResult(data.post);
    } catch (err: any) {
      setError(err.message || "Failed to generate post. Please check the URL.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setImageAnalysis("");
    }
  };

  const handleAnalyzeImage = async () => {
    if (!imageFile) return;
    
    setAnalyzingImage(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      
      const data = await apiFetch("/social-news/analyze-image", {
        method: "POST",
        body: formData,
      });

      setImageAnalysis(data.analysis);
    } catch (err: any) {
      setError(err.message || "Failed to analyze image.");
    } finally {
      setAnalyzingImage(false);
    }
  };

  return (
    <div className="module-container" style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 className="text-2xl font-bold" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.5rem" }}>📰</span> NewsFlash Elite Editor
          </h1>
          <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>
            Create viral, fact-checked Facebook posts tailored for the US audience.
          </p>
        </div>
        <Link href="/modules" className="btn-secondary" style={{ padding: "0.5rem 1rem", borderRadius: "0.5rem", textDecoration: "none", color: "var(--text-color)", border: "1px solid var(--border-color)" }}>
          &larr; Back to Modules
        </Link>
      </div>

      {error && (
        <div style={{ padding: "1rem", backgroundColor: "rgba(239, 68, 68, 0.1)", borderLeft: "4px solid #ef4444", color: "#ef4444", marginBottom: "2rem", borderRadius: "0.25rem" }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2rem" }}>
        {/* STEP 1: Generate Post */}
        <div className="glass-panel" style={{ padding: "1.5rem", borderRadius: "1rem", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>Step 1: Content Analysis</h2>
          <form onSubmit={handleGeneratePost}>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", color: "var(--text-muted)" }}>
                News Article Source Link
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/news-article"
                required
                style={{ width: "100%", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-primary)", color: "var(--text-color)" }}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !url}
              style={{
                width: "100%", padding: "0.75rem", borderRadius: "0.5rem", fontWeight: "600", border: "none", cursor: loading || !url ? "not-allowed" : "pointer",
                backgroundColor: loading ? "var(--border-color)" : "#3b82f6", color: "#fff", transition: "all 0.2s"
              }}
            >
              {loading ? "Analyzing Article & Generating Post..." : "Generate Facebook Post"}
            </button>
          </form>

          {postResult && (
            <div style={{ marginTop: "1.5rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "0.5rem" }}>Generated Facebook Post:</h3>
              <div style={{ 
                padding: "1rem", backgroundColor: "var(--bg-primary)", borderRadius: "0.5rem", border: "1px solid var(--border-color)", 
                whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: "0.95rem", lineHeight: "1.6"
              }}>
                {postResult}
              </div>
              <button 
                onClick={() => navigator.clipboard.writeText(postResult)}
                style={{ marginTop: "0.75rem", padding: "0.5rem 1rem", fontSize: "0.85rem", borderRadius: "0.3rem", border: "1px solid var(--border-color)", backgroundColor: "transparent", color: "var(--text-color)", cursor: "pointer" }}
              >
                📋 Copy Post
              </button>
            </div>
          )}
        </div>

        {/* STEP 2: Image Analysis (Only visible after post is generated) */}
        {postResult && (
          <div className="glass-panel" style={{ padding: "1.5rem", borderRadius: "1rem", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>Step 2: Reference Image Analysis</h2>
            <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
              Please upload a reference image you'd like me to use for the post design. I will analyze its composition and provide strategic advice for this story.
            </p>
            
            <div style={{ marginBottom: "1rem" }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                id="image-upload"
                style={{ display: "none" }}
              />
              <label 
                htmlFor="image-upload"
                style={{
                  display: "block", padding: "1.5rem", textAlign: "center", border: "2px dashed var(--border-color)", borderRadius: "0.5rem",
                  cursor: "pointer", color: "var(--text-muted)", backgroundColor: "var(--bg-primary)"
                }}
              >
                {imageFile ? imageFile.name : "📸 Click to upload a reference image"}
              </label>
            </div>

            {imagePreview && (
              <div style={{ marginBottom: "1rem", textAlign: "center" }}>
                <img src={imagePreview} alt="Preview" style={{ maxWidth: "100%", maxHeight: "300px", borderRadius: "0.5rem", objectFit: "contain" }} />
              </div>
            )}

            {imageFile && (
              <button
                onClick={handleAnalyzeImage}
                disabled={analyzingImage}
                style={{
                  width: "100%", padding: "0.75rem", borderRadius: "0.5rem", fontWeight: "600", border: "none", cursor: analyzingImage ? "not-allowed" : "pointer",
                  backgroundColor: analyzingImage ? "var(--border-color)" : "#8b5cf6", color: "#fff", transition: "all 0.2s"
                }}
              >
                {analyzingImage ? "Analyzing Image..." : "Analyze Image Design"}
              </button>
            )}

            {imageAnalysis && (
              <div style={{ marginTop: "1.5rem" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "0.5rem", color: "#8b5cf6" }}>Analysis & Design Advice:</h3>
                <div style={{ 
                  padding: "1rem", backgroundColor: "var(--bg-primary)", borderRadius: "0.5rem", border: "1px solid var(--border-color)", 
                  whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: "0.95rem", lineHeight: "1.6"
                }}>
                  {imageAnalysis}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
