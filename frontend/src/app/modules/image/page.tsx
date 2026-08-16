"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { apiFetch } from "../../../utils/api";

type Tab = "generate" | "prompt" | "edit" | "resize" | "filter" | "text";

export default function ImagePage() {
  const [activeTab, setActiveTab] = useState<Tab>("generate");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  // Direct Generation state
  const [genPrompt, setGenPrompt] = useState("");
  const [genWidth, setGenWidth] = useState("1024");
  const [genHeight, setGenHeight] = useState("1024");
  const [genModel, setGenModel] = useState("flux-realism");
  const [genImageUrl, setGenImageUrl] = useState("");

  // Prompt state
  const [promptDesc, setPromptDesc] = useState("");
  const [promptStyle, setPromptStyle] = useState("photorealistic");
  const [generatedPrompt, setGeneratedPrompt] = useState("");

  const handleDirectGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genPrompt.trim()) return;
    setLoading(true);
    setError("");
    setResult("");
    setGenImageUrl("");

    try {
      const formData = new FormData();
      formData.append("prompt", genPrompt);
      formData.append("width", genWidth);
      formData.append("height", genHeight);
      formData.append("model", genModel);



      const data = await apiFetch("/image/generate", {
        method: "POST",
        body: formData
      });

      setGenImageUrl(data.image_url);
      setResult("AI Image generated successfully!");
    } catch (err: any) {
      setError(err.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  // Edit state
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editInstruction, setEditInstruction] = useState("");
  const [editInstructions, setEditInstructions] = useState("");
  const [editImagePreview, setEditImagePreview] = useState("");

  // Resize state
  const [resizeImage, setResizeImage] = useState<File | null>(null);
  const [resizeWidth, setResizeWidth] = useState("512");
  const [resizeHeight, setResizeHeight] = useState("512");
  const [resizedImage, setResizedImage] = useState("");

  // Filter state
  const [filterImage, setFilterImage] = useState<File | null>(null);
  const [filterType, setFilterType] = useState("grayscale");
  const [filteredImage, setFilteredImage] = useState("");

  // Text state
  const [textImage, setTextImage] = useState<File | null>(null);
  const [textContent, setTextContent] = useState("");
  const [textX, setTextX] = useState("10");
  const [textY, setTextY] = useState("10");
  const [textSize, setTextSize] = useState("36");
  const [textColor, setTextColor] = useState("#ffffff");
  const [textResultImage, setTextResultImage] = useState("");

  const handlePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult("");

    try {
      const formData = new FormData();
      formData.append("description", promptDesc);
      formData.append("style", promptStyle);
      formData.append("project_id", "");

      const data = await apiFetch("/image/generate-prompt", {
        method: "POST",
        body: formData,
      });

      setGeneratedPrompt(data.prompt);
      setResult(`Generated image prompt using ${data.provider}`);
    } catch (err: any) {
      setError(err.message || "Prompt generation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editImage) return;

    setLoading(true);
    setError("");
    setResult("");

    try {
      const formData = new FormData();
      formData.append("image", editImage);
      formData.append("instruction", editInstruction);
      formData.append("project_id", "");

      const data = await apiFetch("/image/edit", {
        method: "POST",
        body: formData,
      });

      setEditImagePreview(`data:image/png;base64,${data.image_base64}`);
      setResult(`Edited image using ${data.provider}`);
    } catch (err: any) {
      setError(err.message || "Edit failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resizeImage) return;

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("image", resizeImage);
      formData.append("width", resizeWidth);
      formData.append("height", resizeHeight);
      formData.append("project_id", "");

      const data = await apiFetch("/image/resize", {
        method: "POST",
        body: formData,
      });

      setResizedImage(`data:image/png;base64,${data.image_base64}`);
      setResult(`Resized to ${data.new_size}`);
    } catch (err: any) {
      setError(err.message || "Resize failed");
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!filterImage) return;

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("image", filterImage);
      formData.append("filter_type", filterType);
      formData.append("project_id", "");

      const data = await apiFetch("/image/filter", {
        method: "POST",
        body: formData,
      });

      setFilteredImage(`data:image/png;base64,${data.image_base64}`);
      setResult(`Applied ${data.filter_applied} filter`);
    } catch (err: any) {
      setError(err.message || "Filter failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAddText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textImage) return;

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("image", textImage);
      formData.append("text", textContent);
      formData.append("x", textX);
      formData.append("y", textY);
      formData.append("font_size", textSize);
      formData.append("color", textColor);
      formData.append("project_id", "");

      const data = await apiFetch("/image/add-text", {
        method: "POST",
        body: formData,
      });

      setTextResultImage(`data:image/png;base64,${data.image_base64}`);
      setResult("Added text overlay to image");
    } catch (err: any) {
      setError(err.message || "Text add failed");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setResult("Copied to clipboard!");
  };

  return (
    <div className="page-container">
      <div className="glass-panel animate-fade-in" style={{ width: "100%", maxWidth: "1000px" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🖼️ Image Module</h1>
          <p style={{ color: "var(--text-muted)" }}>
            Generate prompts, edit, resize, filter, and add text to images
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem", flexWrap: "wrap", justifyContent: "center" }}>
          {[
            { key: "generate", label: "🎨 Generate AI Image" },
            { key: "prompt", label: "Generate Prompt" },
            { key: "edit", label: "Edit" },
            { key: "resize", label: "Resize" },
            { key: "filter", label: "Filter" },
            { key: "text", label: "Add Text" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as Tab)}
              className="btn-primary"
              style={{
                background: activeTab === tab.key ? "var(--primary)" : "transparent",
                border: `2px solid var(--primary)`,
                color: activeTab === tab.key ? "white" : "var(--primary)",
                padding: "0.5rem 1rem",
                fontSize: "0.9rem"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && <div className="error-message">{error}</div>}
        {result && <div style={{ color: "var(--success)", marginBottom: "1rem", textAlign: "center" }}>{result}</div>}

        {activeTab === "generate" && (
          <form onSubmit={handleDirectGenerate}>
            <div className="input-group">
              <label>AI Prompt Description</label>
              <textarea
                className="input-field"
                value={genPrompt}
                onChange={(e) => setGenPrompt(e.target.value)}
                placeholder="Cyberpunk futuristic city neon lights 8k masterpiece..."
                rows={3}
                required
                style={{ resize: "vertical" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
              <div>
                <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block", marginBottom: "0.3rem" }}>Model</label>
                <select className="input-field" value={genModel} onChange={(e) => setGenModel(e.target.value)}>
                  <option value="flux-realism">Flux Realism (Cinematic/Photo)</option>
                  <option value="flux">Flux (High Quality)</option>
                  <option value="flux-3d">Flux 3D (Render/Game)</option>
                  <option value="flux-anime">Flux Anime (Illustration)</option>
                  <option value="turbo">Turbo (Basic Fast)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block", marginBottom: "0.3rem" }}>Width</label>
                <select className="input-field" value={genWidth} onChange={(e) => setGenWidth(e.target.value)}>
                  <option value="512">512 px</option>
                  <option value="768">768 px</option>
                  <option value="1024">1024 px</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block", marginBottom: "0.3rem" }}>Height</label>
                <select className="input-field" value={genHeight} onChange={(e) => setGenHeight(e.target.value)}>
                  <option value="512">512 px</option>
                  <option value="768">768 px</option>
                  <option value="1024">1024 px</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ width: "100%" }} disabled={loading}>
              {loading ? "Generating Image..." : "✨ Generate Image"}
            </button>

            {genImageUrl && (
              <div style={{ marginTop: "2rem", textAlign: "center" }}>
                <h3 style={{ marginBottom: "1rem" }}>Generated Result:</h3>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={genImageUrl}
                  alt="Generated AI Art"
                  style={{ maxWidth: "100%", borderRadius: "12px", border: "1px solid var(--border)", boxShadow: "0 8px 30px rgba(0,0,0,0.5)" }}
                />
                <div style={{ marginTop: "1rem" }}>
                  <a href={genImageUrl} target="_blank" rel="noreferrer" className="btn-primary" style={{ textDecoration: "none", padding: "0.5rem 1.5rem" }}>
                    ⬇ Open / Download High Res
                  </a>
                </div>
              </div>
            )}
          </form>
        )}

        {activeTab === "prompt" && (
          <form onSubmit={handlePrompt}>
            <div className="input-group">
              <label>Image Description</label>
              <textarea
                className="input-field"
                value={promptDesc}
                onChange={(e) => setPromptDesc(e.target.value)}
                placeholder="Describe the image you want to generate..."
                rows={4}
                required
                style={{ resize: "vertical" }}
              />
            </div>

            <div className="input-group">
              <label>Style</label>
              <select
                className="input-field"
                value={promptStyle}
                onChange={(e) => setPromptStyle(e.target.value)}
                style={{ color: "var(--text-main)" }}
              >
                <option value="photorealistic">Photorealistic</option>
                <option value="digital-art">Digital Art</option>
                <option value="anime">Anime</option>
                <option value="3d-render">3D Render</option>
                <option value="painting">Painting</option>
                <option value="cartoon">Cartoon</option>
                <option value="cyberpunk">Cyberpunk</option>
              </select>
            </div>

            <button type="submit" className="btn-primary" style={{ width: "100%" }} disabled={loading}>
              {loading ? "Generating..." : "Generate Prompt"}
            </button>

            {generatedPrompt && (
              <div style={{ marginTop: "2rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <label style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>Generated Prompt:</label>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(generatedPrompt)}
                    className="btn-primary"
                    style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}
                  >
                    Copy
                  </button>
                </div>
                <div style={{
                  padding: "1rem",
                  background: "#1e1e1e",
                  borderRadius: "8px",
                  whiteSpace: "pre-wrap",
                  lineHeight: "1.7",
                  fontSize: "0.95rem"
                }}>
                  {generatedPrompt}
                </div>
              </div>
            )}
          </form>
        )}

        {activeTab === "edit" && (
          <form onSubmit={handleEdit}>
            <div className="input-group">
              <label>Upload Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setEditImage(file);
                    setEditImagePreview(URL.createObjectURL(file));
                  }
                }}
                required
              />
            </div>

            {editImagePreview && (
              <div style={{ marginBottom: "1.5rem", textAlign: "center" }}>
                <img
                  src={editImagePreview}
                  alt="Preview"
                  style={{ maxWidth: "300px", maxHeight: "300px", borderRadius: "8px", border: "1px solid var(--border)" }}
                />
              </div>
            )}

            <div className="input-group">
              <label>What do you want to do with this image?</label>
              <textarea
                className="input-field"
                value={editInstruction}
                onChange={(e) => setEditInstruction(e.target.value)}
                placeholder="e.g., Remove the background, add a sunset, make it more colorful..."
                rows={3}
                required
                style={{ resize: "vertical" }}
              />
            </div>

            <button type="submit" className="btn-primary" style={{ width: "100%" }} disabled={loading}>
              {loading ? "Analyzing..." : "Get Edit Instructions"}
            </button>

            {editInstructions && (
              <div style={{ marginTop: "2rem" }}>
                <label style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "0.5rem", display: "block" }}>
                  Editing Instructions:
                </label>
                <div style={{
                  padding: "1rem",
                  background: "rgba(0,0,0,0.2)",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  whiteSpace: "pre-wrap",
                  lineHeight: "1.7"
                }}>
                  {editInstructions}
                </div>
              </div>
            )}
          </form>
        )}

        {activeTab === "resize" && (
          <form onSubmit={handleResize}>
            <div className="input-group">
              <label>Upload Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setResizeImage(file);
                }}
                required
              />
            </div>

            <div style={{ display: "flex", gap: "1rem" }}>
              <div className="input-group" style={{ flex: 1 }}>
                <label>Width</label>
                <input
                  type="number"
                  className="input-field"
                  value={resizeWidth}
                  onChange={(e) => setResizeWidth(e.target.value)}
                  required
                />
              </div>
              <div className="input-group" style={{ flex: 1 }}>
                <label>Height</label>
                <input
                  type="number"
                  className="input-field"
                  value={resizeHeight}
                  onChange={(e) => setResizeHeight(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ width: "100%" }} disabled={loading}>
              {loading ? "Resizing..." : "Resize Image"}
            </button>

            {resizedImage && (
              <div style={{ marginTop: "2rem", textAlign: "center" }}>
                <label style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "0.5rem", display: "block" }}>
                  Resized Image:
                </label>
                <img
                  src={resizedImage}
                  alt="Resized"
                  style={{ maxWidth: "100%", maxHeight: "400px", borderRadius: "8px", border: "1px solid var(--border)" }}
                />
              </div>
            )}
          </form>
        )}

        {activeTab === "filter" && (
          <form onSubmit={handleFilter}>
            <div className="input-group">
              <label>Upload Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setFilterImage(file);
                }}
                required
              />
            </div>

            <div className="input-group">
              <label>Filter</label>
              <select
                className="input-field"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                style={{ color: "var(--text-main)" }}
              >
                <option value="grayscale">Grayscale</option>
                <option value="sepia">Sepia</option>
                <option value="blur">Blur</option>
                <option value="brightness">Brightness</option>
                <option value="contrast">Contrast</option>
              </select>
            </div>

            <button type="submit" className="btn-primary" style={{ width: "100%" }} disabled={loading}>
              {loading ? "Applying..." : "Apply Filter"}
            </button>

            {filteredImage && (
              <div style={{ marginTop: "2rem", textAlign: "center" }}>
                <label style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "0.5rem", display: "block" }}>
                  Filtered Image:
                </label>
                <img
                  src={filteredImage}
                  alt="Filtered"
                  style={{ maxWidth: "100%", maxHeight: "400px", borderRadius: "8px", border: "1px solid var(--border)" }}
                />
              </div>
            )}
          </form>
        )}

        {activeTab === "text" && (
          <form onSubmit={handleAddText}>
            <div className="input-group">
              <label>Upload Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setTextImage(file);
                }}
                required
              />
            </div>

            <div className="input-group">
              <label>Text to Add</label>
              <input
                type="text"
                className="input-field"
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Enter text..."
                required
              />
            </div>

            <div style={{ display: "flex", gap: "1rem" }}>
              <div className="input-group" style={{ flex: 1 }}>
                <label>X Position</label>
                <input
                  type="number"
                  className="input-field"
                  value={textX}
                  onChange={(e) => setTextX(e.target.value)}
                  required
                />
              </div>
              <div className="input-group" style={{ flex: 1 }}>
                <label>Y Position</label>
                <input
                  type="number"
                  className="input-field"
                  value={textY}
                  onChange={(e) => setTextY(e.target.value)}
                  required
                />
              </div>
              <div className="input-group" style={{ flex: 1 }}>
                <label>Font Size</label>
                <input
                  type="number"
                  className="input-field"
                  value={textSize}
                  onChange={(e) => setTextSize(e.target.value)}
                  required
                />
              </div>
              <div className="input-group" style={{ flex: 1 }}>
                <label>Color</label>
                <input
                  type="color"
                  className="input-field"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  style={{ height: "42px", padding: "2px" }}
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ width: "100%" }} disabled={loading}>
              {loading ? "Adding..." : "Add Text to Image"}
            </button>

            {textResultImage && (
              <div style={{ marginTop: "2rem", textAlign: "center" }}>
                <label style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "0.5rem", display: "block" }}>
                  Result:
                </label>
                <img
                  src={textResultImage}
                  alt="Text added"
                  style={{ maxWidth: "100%", maxHeight: "400px", borderRadius: "8px", border: "1px solid var(--border)" }}
                />
              </div>
            )}
          </form>
        )}

        <div style={{ marginTop: "2rem", textAlign: "center" }}>
          <Link href="/modules" style={{ color: "var(--primary)", textDecoration: "none" }}>
            ← Back to Modules
          </Link>
        </div>
      </div>
    </div>
  );
}
