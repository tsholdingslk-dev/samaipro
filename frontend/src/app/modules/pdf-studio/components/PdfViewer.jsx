"use client";
import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Setup worker via CDN since Next.js doesn't support ?url Vite syntax natively
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const PdfViewer = ({ file, onPageRendered, activeTool, annotations, setAnnotations, selectedColor }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageNum, setPageNum] = useState(1);
  const [pageRendering, setPageRendering] = useState(false);
  const [pageNumPending, setPageNumPending] = useState(null);
  const [scale, setScale] = useState(1.5);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  
  // Dragging state for movable elements
  const [selectedId, setSelectedId] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Handle global keyboard delete
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        // Only delete if we are not editing text (not focused on an input)
        if (e.target.tagName !== 'INPUT' || document.activeElement.tagName !== 'INPUT') {
          deleteAnnotation(selectedId);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId]);

  const deleteAnnotation = (id) => {
    setAnnotations(prev => prev.filter(ann => ann.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  // Load PDF when file changes
  useEffect(() => {
    if (!file) return;

    const fileReader = new FileReader();
    fileReader.onload = function() {
      const typedarray = new Uint8Array(this.result);
      
      pdfjsLib.getDocument({ data: typedarray }).promise.then((pdf) => {
        setPdfDoc(pdf);
        setPageNum(1);
        if (onPageRendered) {
          onPageRendered(pdf.numPages);
        }
      }).catch((err) => {
        console.error("Error loading PDF", err);
        alert("Failed to load PDF: " + (err.message || err.toString()));
      });
    };
    fileReader.readAsArrayBuffer(file);
  }, [file]);

  // Render page when pageNum or pdfDoc changes
  useEffect(() => {
    if (!pdfDoc) return;
    renderPage(pageNum);
  }, [pdfDoc, pageNum, scale]);

  const renderPage = (num) => {
    setPageRendering(true);
    pdfDoc.getPage(num).then((page) => {
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      setDimensions({ width: viewport.width, height: viewport.height });

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport
      };

      const renderTask = page.render(renderContext);
      
      renderTask.promise.then(() => {
        setPageRendering(false);
        if (pageNumPending !== null) {
          renderPage(pageNumPending);
          setPageNumPending(null);
        }
      });
    });
  };

  const onPrevPage = () => {
    if (pageNum <= 1) return;
    setPageNum(pageNum - 1);
  };

  const onNextPage = () => {
    if (pageNum >= pdfDoc.numPages) return;
    setPageNum(pageNum + 1);
  };

  const getUnscaledPos = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return { x: x / scale, y: y / scale };
  };

  const handleMouseDown = (e) => {
    const { x, y } = getUnscaledPos(e);

    // If selecting, check if we clicked on an annotation
    if (activeTool === 'select') {
      const clickedAnn = currentPageAnnotations.slice().reverse().find(ann => {
        return x >= ann.x && x <= ann.x + (ann.width || 50) &&
               y >= ann.y && y <= ann.y + (ann.height || 20);
      });
      if (clickedAnn) {
        setSelectedId(clickedAnn.id);
        setDraggingId(clickedAnn.id);
        setDragOffset({ x: x - clickedAnn.x, y: y - clickedAnn.y });
      } else {
        setSelectedId(null);
      }
      return;
    }

    if (['text', 'image'].includes(activeTool)) {
      // Simple click to add
      if (activeTool === 'text') {
        const newAnnotation = {
          id: Date.now().toString(),
          type: 'text',
          pageNum, x, y,
          value: '', color: selectedColor, fontSize: 16
        };
        setAnnotations([...annotations, newAnnotation]);
        setSelectedId(newAnnotation.id);
      } else if (activeTool === 'image') {
        const newAnnotation = {
          id: Date.now().toString(),
          type: 'image',
          pageNum, x, y, width: 100, height: 100,
          url: 'https://via.placeholder.com/150'
        };
        setAnnotations([...annotations, newAnnotation]);
        setSelectedId(newAnnotation.id);
      }
      return;
    }

    // Drag to create shapes (rect, circle, eraser, crop)
    if (['eraser', 'rect', 'circle', 'crop'].includes(activeTool)) {
      setIsDrawing(true);
      setStartPos({ x, y });
      setCurrentPos({ x, y });
    }
  };

  const handleMouseMove = (e) => {
    const { x, y } = getUnscaledPos(e);

    if (draggingId) {
      updateAnnotation(draggingId, {
        x: x - dragOffset.x,
        y: y - dragOffset.y
      });
      return;
    }

    if (isDrawing) {
      setCurrentPos({ x, y });
    }
  };

  const handleMouseUp = () => {
    if (draggingId) {
      setDraggingId(null);
    }

    if (isDrawing) {
      setIsDrawing(false);
      
      const width = Math.abs(currentPos.x - startPos.x);
      const height = Math.abs(currentPos.y - startPos.y);
      const x = Math.min(startPos.x, currentPos.x);
      const y = Math.min(startPos.y, currentPos.y);

      if (width < 5 || height < 5) return; // Too small

      if (['eraser', 'rect', 'circle'].includes(activeTool)) {
        const newAnnotation = {
          id: Date.now().toString(),
          type: activeTool,
          pageNum, x, y, width, height,
          color: selectedColor
        };
        setAnnotations([...annotations, newAnnotation]);
        setSelectedId(newAnnotation.id);
      } else if (activeTool === 'crop') {
        // Handle Crop
        const canvas = canvasRef.current;
        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = width * scale;
        cropCanvas.height = height * scale;
        const cropCtx = cropCanvas.getContext('2d');
        
        cropCtx.drawImage(
          canvas,
          x * scale, y * scale, width * scale, height * scale,
          0, 0, width * scale, height * scale
        );
        
        const dataUrl = cropCanvas.toDataURL('image/png');
        
        // 1. Hide original spot
        const eraserAnn = {
          id: Date.now().toString() + '_eraser',
          type: 'eraser',
          pageNum, x, y, width, height
        };
        
        // 2. Add draggable image snippet
        const snippetAnn = {
          id: Date.now().toString() + '_img',
          type: 'image',
          pageNum, x, y, width, height,
          dataUrl: dataUrl,
          url: dataUrl // for rendering
        };
        
        setAnnotations([...annotations, eraserAnn, snippetAnn]);
        setSelectedId(snippetAnn.id);
      }
    }
  };

  const updateAnnotation = (id, newValues) => {
    setAnnotations(prev => prev.map(ann => ann.id === id ? { ...ann, ...newValues } : ann));
  };

  const currentPageAnnotations = annotations.filter(ann => ann.pageNum === pageNum);

  // Calculate current drawing box
  const drawWidth = Math.abs(currentPos.x - startPos.x);
  const drawHeight = Math.abs(currentPos.y - startPos.y);
  const drawX = Math.min(startPos.x, currentPos.x);
  const drawY = Math.min(startPos.y, currentPos.y);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      {pdfDoc && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', background: 'var(--bg-tertiary)', padding: '8px 16px', borderRadius: 'var(--border-radius-lg)', zIndex: 30 }}>
          <button className="btn" onClick={onPrevPage} disabled={pageNum <= 1}>Prev</button>
          <span style={{ display: 'flex', alignItems: 'center' }}>
            Page {pageNum} of {pdfDoc.numPages}
          </span>
          <button className="btn" onClick={onNextPage} disabled={pageNum >= pdfDoc.numPages}>Next</button>
          
          <button className="btn" onClick={() => setScale(s => Math.max(0.5, s - 0.2))}>- Zoom</button>
          <button className="btn" onClick={() => setScale(s => Math.min(3, s + 0.2))}>Zoom +</button>
        </div>
      )}
      
      <div 
        className="pdf-page-container animate-fade-in" 
        style={{ position: 'relative', width: dimensions.width, height: dimensions.height, cursor: activeTool === 'select' ? 'default' : 'crosshair' }}
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <canvas ref={canvasRef} style={{ display: 'block' }}></canvas>
        
        {/* Active Drawing Overlay */}
        {isDrawing && (
          <div style={{
            position: 'absolute',
            left: `${drawX * scale}px`,
            top: `${drawY * scale}px`,
            width: `${drawWidth * scale}px`,
            height: `${drawHeight * scale}px`,
            border: activeTool === 'crop' ? '2px dashed blue' : activeTool === 'eraser' ? 'none' : `2px dashed ${selectedColor}`,
            background: activeTool === 'eraser' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.1)',
            borderRadius: activeTool === 'circle' ? '50%' : '0',
            pointerEvents: 'none',
          }}></div>
        )}

        {/* Annotations Overlay */}
        {currentPageAnnotations.map(ann => {
          const isSelected = selectedId === ann.id;
          const baseStyle = {
            position: 'absolute',
            left: `${ann.x * scale}px`,
            top: `${ann.y * scale}px`,
            width: ann.width ? `${ann.width * scale}px` : 'auto',
            height: ann.height ? `${ann.height * scale}px` : 'auto',
            cursor: activeTool === 'select' ? 'move' : 'default',
            outline: isSelected ? '2px solid blue' : 'none'
          };
          
          const renderDeleteBtn = () => {
            if (isSelected && activeTool === 'select') {
              return (
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteAnnotation(ann.id); }}
                  style={{
                    position: 'absolute', top: '-10px', right: '-10px', width: '20px', height: '20px',
                    borderRadius: '50%', background: 'red', color: 'white', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', zIndex: 50
                  }}
                  title="Delete"
                >
                  ✕
                </button>
              );
            }
            return null;
          };

          if (ann.type === 'text') {
            return (
              <div key={ann.id} style={baseStyle}>
                <input 
                  autoFocus
                  style={{
                    width: '100%',
                    height: '100%',
                    fontSize: `${ann.fontSize * scale}px`,
                    color: ann.color,
                    background: 'transparent',
                    border: activeTool === 'select' ? '1px dashed transparent' : '1px dashed #ccc',
                    outline: 'none',
                    minWidth: '50px',
                    fontFamily: 'Helvetica, Arial, sans-serif'
                  }}
                  value={ann.value}
                  onChange={(e) => updateAnnotation(ann.id, { value: e.target.value })}
                  onMouseDown={(e) => activeTool === 'select' && e.stopPropagation()} 
                  placeholder="Text"
                />
                {renderDeleteBtn()}
              </div>
            );
          } else if (ann.type === 'image') {
            return (
              <div key={ann.id} style={{ ...baseStyle, pointerEvents: activeTool === 'select' ? 'auto' : 'none' }}>
                <img 
                  src={ann.url}
                  alt="annotation"
                  style={{ width: '100%', height: '100%' }}
                  draggable="false"
                />
                {renderDeleteBtn()}
              </div>
            );
          } else if (ann.type === 'eraser') {
            return (
              <div key={ann.id} style={{ ...baseStyle, background: 'white', border: '1px solid #ddd', opacity: 0.9 }}>
                {renderDeleteBtn()}
              </div>
            );
          } else if (ann.type === 'rect') {
            return (
              <div key={ann.id} style={{ ...baseStyle, border: `2px solid ${ann.color}`, background: 'rgba(0,0,0,0.1)' }}>
                {renderDeleteBtn()}
              </div>
            );
          } else if (ann.type === 'circle') {
            return (
              <div key={ann.id} style={{ ...baseStyle, border: `2px solid ${ann.color}`, background: 'rgba(0,0,0,0.1)', borderRadius: '50%' }}>
                {renderDeleteBtn()}
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
};

export default PdfViewer;
