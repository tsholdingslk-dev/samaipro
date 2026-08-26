"use client";
import { useState, useRef } from 'react'
import { 
  FileText, Upload, Download, Type, Square, Circle, Eraser, MousePointer2, Image as ImageIcon, Crop,
  Sparkles, Bot, Wand2, FileSignature, Languages, MessagesSquare
} from 'lucide-react'
import { PDFDocument, rgb } from 'pdf-lib'
import dynamic from 'next/dynamic'
const PdfViewer = dynamic(() => import('./components/PdfViewer'), { ssr: false })
import './App.css'

function App() {
  const [file, setFile] = useState(null)
  const [activeTool, setActiveTool] = useState('select')
  const [numPages, setNumPages] = useState(0)
  const [annotations, setAnnotations] = useState([])
  const [selectedColor, setSelectedColor] = useState('#ff0000')
  const [aiTab, setAiTab] = useState('chat')
  
  // AI States
  const [chatInput, setChatInput] = useState('')
  const [chatResponse, setChatResponse] = useState('')
  const [summaryResponse, setSummaryResponse] = useState('')
  const [isAiLoading, setIsAiLoading] = useState(false)
  const fileInputRef = useRef(null)

  const handleAskAI = async () => {
    if (!file || !chatInput.trim()) return;
    setIsAiLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('prompt', chatInput);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${API_URL}/api/pdf-studio/chat`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setChatResponse(data.response || "No response received.");
    } catch (e) {
      console.error(e);
      setChatResponse("Error connecting to AI Assistant.");
    } finally {
      setIsAiLoading(false);
    }
  }

  const handleSummary = async () => {
    if (!file) return;
    setIsAiLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${API_URL}/api/pdf-studio/summary`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setSummaryResponse(data.response || "No summary generated.");
    } catch (e) {
      console.error(e);
      setSummaryResponse("Error generating summary.");
    } finally {
      setIsAiLoading(false);
    }
  }

  const hexToRgbLib = (hex) => {
    if (!hex) return rgb(0,0,0);
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return rgb(r, g, b);
  };

  const handleExport = async () => {
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);

      for (const ann of annotations) {
        const page = pdfDoc.getPage(ann.pageNum - 1);
        const { height } = page.getSize();
        
        if (ann.type === 'text' && ann.value && ann.value.trim() !== '') {
          // pdf-lib origin is bottom-left, our canvas is top-left
          page.drawText(ann.value, {
            x: ann.x,
            y: height - ann.y - ann.fontSize,
            size: ann.fontSize,
            color: hexToRgbLib(ann.color),
          });
        } else if (ann.type === 'eraser') {
          page.drawRectangle({
            x: ann.x,
            y: height - ann.y - ann.height,
            width: ann.width,
            height: ann.height,
            color: rgb(1, 1, 1),
          });
        } else if (ann.type === 'rect') {
          page.drawRectangle({
            x: ann.x,
            y: height - ann.y - ann.height,
            width: ann.width,
            height: ann.height,
            borderColor: hexToRgbLib(ann.color),
            borderWidth: 2,
            color: rgb(0, 0, 0),
            opacity: 0,
            borderOpacity: 1,
          });
        } else if (ann.type === 'circle') {
          page.drawEllipse({
            x: ann.x + ann.width / 2,
            y: height - ann.y - ann.height / 2,
            xScale: ann.width / 2,
            yScale: ann.height / 2,
            borderColor: hexToRgbLib(ann.color),
            borderWidth: 2,
            color: rgb(0, 0, 0),
            opacity: 0,
            borderOpacity: 1,
          });
        } else if (ann.type === 'image' && ann.dataUrl) {
          // Extract base64 data
          const base64Data = ann.dataUrl.split(',')[1];
          const isPng = ann.dataUrl.includes('image/png');
          const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
          
          let pdfImage;
          if (isPng) {
            pdfImage = await pdfDoc.embedPng(imageBytes);
          } else {
            pdfImage = await pdfDoc.embedJpg(imageBytes);
          }
          
          page.drawImage(pdfImage, {
            x: ann.x,
            y: height - ann.y - ann.height,
            width: ann.width,
            height: ann.height,
          });
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `edited_${file.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('Error exporting PDF');
    }
  }

  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile)
    } else {
      alert('Please select a valid PDF file.')
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header animate-fade-in">
        <div className="header-title">
          <FileText size={24} color="var(--accent-primary)" />
          PDF Master Pro
        </div>
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn" onClick={triggerFileInput} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', cursor: 'pointer', color: '#fff' }}>
            <Upload size={18} />
            Open PDF
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="application/pdf"
            style={{ display: 'none' }}
          />
          <button className="btn btn-primary" disabled={!file} onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#8b5cf6', border: 'none', borderRadius: '8px', cursor: file ? 'pointer' : 'not-allowed', color: '#fff', opacity: file ? 1 : 0.5 }}>
            <Download size={18} />
            Export
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-header">
            Pages
          </div>
          <div className="thumbnail-list">
            {file && numPages > 0 ? (
              Array.from(new Array(numPages), (el, index) => (
                <div key={index + 1} className={`thumbnail-container ${index === 0 ? 'active' : ''}`}>
                  <div className="thumbnail-placeholder">
                    Page {index + 1}
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{index + 1}</span>
                </div>
              ))
            ) : (
              <div style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center' }}>
                Open a PDF to see pages
              </div>
            )}
          </div>
        </aside>

        {/* Workspace */}
        <section className="workspace" style={{ display: 'flex', flexDirection: 'column', flex: 1, position: 'relative' }}>
          <div className="pdf-viewer-container" style={{ flex: 1, padding: '24px', overflow: 'auto' }}>
            {file ? (
              <PdfViewer 
                file={file} 
                onPageRendered={(pages) => setNumPages(pages)} 
                activeTool={activeTool}
                annotations={annotations}
                setAnnotations={setAnnotations}
                selectedColor={selectedColor}
              />
            ) : (
              <div className="empty-state animate-fade-in">
                <FileText size={48} opacity={0.5} />
                <h2>No Document Opened</h2>
                <p>Click "Open PDF" to start editing.</p>
                <button className="btn btn-primary" onClick={triggerFileInput} style={{ background: '#8b5cf6', color: '#fff', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
                  Select File
                </button>
              </div>
            )}
          </div>

          {/* Bottom Toolbar */}
          {file && (
            <div className="bottom-toolbar animate-fade-in">
              <div className="bottom-toolbar-group">
                <button className={`btn-tool ${activeTool === 'select' ? 'active' : ''}`} onClick={() => setActiveTool('select')} title="Select">
                  <MousePointer2 size={18} /><span>Select</span>
                </button>
              </div>
              <div className="bottom-toolbar-group">
                <button className={`btn-tool ${activeTool === 'text' ? 'active' : ''}`} onClick={() => setActiveTool('text')} title="Add Text">
                  <Type size={18} /><span>Text</span>
                </button>
                <button className={`btn-tool ${activeTool === 'image' ? 'active' : ''}`} onClick={() => setActiveTool('image')} title="Add Image">
                  <ImageIcon size={18} /><span>Image</span>
                </button>
                <button className={`btn-tool ${activeTool === 'draw' ? 'active' : ''}`} onClick={() => setActiveTool('draw')} title="Draw">
                  <Wand2 size={18} /><span>Draw</span>
                </button>
                <button className={`btn-tool ${activeTool === 'sign' ? 'active' : ''}`} onClick={() => setActiveTool('sign')} title="Sign">
                  <FileSignature size={18} /><span>Sign</span>
                </button>
              </div>
              <div className="bottom-toolbar-group">
                <button className={`btn-tool ${activeTool === 'rect' ? 'active' : ''}`} onClick={() => setActiveTool('rect')} title="Add Box">
                  <Square size={18} /><span>Box</span>
                </button>
                <button className={`btn-tool ${activeTool === 'circle' ? 'active' : ''}`} onClick={() => setActiveTool('circle')} title="Add Circle">
                  <Circle size={18} /><span>Circle</span>
                </button>
                <button className={`btn-tool ${activeTool === 'highlight' ? 'active' : ''}`} onClick={() => setActiveTool('highlight')} title="Highlight">
                  <Sparkles size={18} /><span>Highlight</span>
                </button>
                <button className={`btn-tool ${activeTool === 'eraser' ? 'active' : ''}`} onClick={() => setActiveTool('eraser')} title="Redact / Eraser">
                  <Eraser size={18} /><span>Redact</span>
                </button>
              </div>
              <div className="bottom-toolbar-group">
                <input 
                  type="color" 
                  value={selectedColor} 
                  onChange={(e) => setSelectedColor(e.target.value)} 
                  style={{ width: '24px', height: '24px', padding: '0', border: 'none', borderRadius: '4px', cursor: 'pointer', background: 'transparent' }}
                  title="Select Color"
                />
              </div>
            </div>
          )}
        </section>

        {/* AI Assistant Right Sidebar */}
        <aside className="ai-sidebar">
          <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8b5cf6' }}>
            <Bot size={18} />
            AI Assistant
          </div>
          <div className="ai-tabs">
            <div className={`ai-tab ${aiTab === 'chat' ? 'active' : ''}`} onClick={() => setAiTab('chat')}><MessagesSquare size={14} style={{marginBottom:'4px'}}/><br/>Ask AI</div>
            <div className={`ai-tab ${aiTab === 'summary' ? 'active' : ''}`} onClick={() => setAiTab('summary')}><FileText size={14} style={{marginBottom:'4px'}}/><br/>Summary</div>
            <div className={`ai-tab ${aiTab === 'rewrite' ? 'active' : ''}`} onClick={() => setAiTab('rewrite')}><Wand2 size={14} style={{marginBottom:'4px'}}/><br/>Rewrite</div>
            <div className={`ai-tab ${aiTab === 'translate' ? 'active' : ''}`} onClick={() => setAiTab('translate')}><Languages size={14} style={{marginBottom:'4px'}}/><br/>Translate</div>
          </div>
          <div className="ai-content">
            {aiTab === 'chat' && (
              <div className="ai-message">
                <p style={{ margin: 0, fontWeight: 'bold', color: 'var(--text-primary)' }}>AI Document Chat</p>
                <p style={{ fontSize: '0.8rem', marginTop: '8px', opacity: 0.8 }}>Ask me anything about this PDF. I can extract points, find data, or answer questions.</p>
                
                <input 
                  type="text" 
                  placeholder="e.g. What is the total amount?" 
                  style={{ width: '100%', marginTop: '16px', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} 
                  disabled={!file || isAiLoading}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
                />
                
                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', marginTop: '8px', background: '#8b5cf6', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', cursor: (file && !isAiLoading) ? 'pointer' : 'not-allowed', opacity: (file && !isAiLoading) ? 1 : 0.5 }} 
                  disabled={!file || isAiLoading}
                  onClick={handleAskAI}
                >
                  {isAiLoading ? 'Thinking...' : 'Ask AI'}
                </button>

                {chatResponse && (
                  <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--text-primary)', borderLeft: '3px solid #8b5cf6' }}>
                    {chatResponse}
                  </div>
                )}
              </div>
            )}
            
            {aiTab === 'summary' && (
              <div className="ai-message">
                <p style={{ margin: 0, fontWeight: 'bold', color: 'var(--text-primary)' }}>AI Summarizer</p>
                <p style={{ fontSize: '0.8rem', marginTop: '8px', opacity: 0.8 }}>Generate an executive summary, key points, and action items from this document.</p>
                
                <button 
                  className="btn-primary" 
                  style={{ width: '100%', marginTop: '16px', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', border: '1px solid rgba(139, 92, 246, 0.3)', padding: '8px', borderRadius: '6px', cursor: (file && !isAiLoading) ? 'pointer' : 'not-allowed', opacity: (file && !isAiLoading) ? 1 : 0.5 }} 
                  disabled={!file || isAiLoading}
                  onClick={handleSummary}
                >
                  {isAiLoading ? 'Analyzing Document...' : 'Generate Summary'}
                </button>

                {summaryResponse && (
                  <div style={{ marginTop: '16px', padding: '12px', background: 'var(--bg-primary)', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--text-primary)', border: '1px solid var(--border-color)', whiteSpace: 'pre-wrap' }}>
                    {summaryResponse}
                  </div>
                )}
              </div>
            )}
            
            {aiTab === 'rewrite' && (
              <div className="ai-message">
                <p style={{ margin: 0, fontWeight: 'bold', color: 'var(--text-primary)' }}>AI Rewrite</p>
                <p style={{ fontSize: '0.8rem', marginTop: '8px', opacity: 0.8 }}>Select text in the PDF to make it professional, shorten it, or fix grammar.</p>
                <div style={{ padding: '12px', marginTop: '16px', background: 'var(--bg-primary)', border: '1px dashed var(--border-color)', borderRadius: '6px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Coming soon in Phase 4!
                </div>
              </div>
            )}
            
            {aiTab === 'translate' && (
              <div className="ai-message">
                <p style={{ margin: 0, fontWeight: 'bold', color: 'var(--text-primary)' }}>AI Translation</p>
                <p style={{ fontSize: '0.8rem', marginTop: '8px', opacity: 0.8 }}>Translate this document while preserving its layout.</p>
                <select style={{ width: '100%', marginTop: '16px', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} disabled={!file}>
                  <option>Tamil</option>
                  <option>Sinhala</option>
                  <option>English</option>
                  <option>Hindi</option>
                  <option>Arabic</option>
                </select>
                <button className="btn-primary" style={{ width: '100%', marginTop: '8px', background: '#8b5cf6', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', cursor: file ? 'pointer' : 'not-allowed' }} disabled={!file}>Translate PDF</button>
              </div>
            )}
          </div>
        </aside>
      </main>
    </div>
  )
}

export default App

