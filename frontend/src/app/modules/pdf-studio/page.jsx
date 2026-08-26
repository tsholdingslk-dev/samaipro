"use client";
import { useState, useRef } from 'react'
import { Upload, Download, Type, Image as ImageIcon, MousePointer2, FileText, Eraser, Square, Circle, Crop } from 'lucide-react'
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
  const fileInputRef = useRef(null)

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
        <section className="workspace">
          {file && (
            <div className="toolbar glass-panel animate-fade-in">
              <button 
                className={`btn-icon ${activeTool === 'select' ? 'active' : ''}`}
                onClick={() => setActiveTool('select')}
                title="Select"
              >
                <MousePointer2 size={20} />
              </button>
              <button 
                className={`btn-icon ${activeTool === 'text' ? 'active' : ''}`}
                onClick={() => setActiveTool('text')}
                title="Add Text"
              >
                <Type size={20} />
              </button>
              <button 
                className={`btn-icon ${activeTool === 'image' ? 'active' : ''}`}
                onClick={() => setActiveTool('image')}
                title="Add Image"
              >
                <ImageIcon size={20} />
              </button>
              <div style={{ width: '1px', background: 'var(--border-color)', margin: '0 4px' }}></div>
              <button 
                className={`btn-icon ${activeTool === 'eraser' ? 'active' : ''}`}
                onClick={() => setActiveTool('eraser')}
                title="Eraser / White-out"
              >
                <Eraser size={20} />
              </button>
              <button 
                className={`btn-icon ${activeTool === 'rect' ? 'active' : ''}`}
                onClick={() => setActiveTool('rect')}
                title="Add Box"
              >
                <Square size={20} />
              </button>
              <button 
                className={`btn-icon ${activeTool === 'circle' ? 'active' : ''}`}
                onClick={() => setActiveTool('circle')}
                title="Add Circle"
              >
                <Circle size={20} />
              </button>
              <button 
                className={`btn-icon ${activeTool === 'crop' ? 'active' : ''}`}
                onClick={() => setActiveTool('crop')}
                title="Crop & Move"
              >
                <Crop size={20} />
              </button>
              <div style={{ width: '1px', background: 'var(--border-color)', margin: '0 4px' }}></div>
              <input 
                type="color" 
                value={selectedColor} 
                onChange={(e) => setSelectedColor(e.target.value)} 
                style={{ width: '30px', height: '30px', padding: '0', border: 'none', borderRadius: '4px', cursor: 'pointer', background: 'transparent' }}
                title="Select Color"
              />
            </div>
          )}

          <div className="pdf-viewer-container">
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
                <button className="btn btn-primary" onClick={triggerFileInput}>
                  Select File
                </button>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App

