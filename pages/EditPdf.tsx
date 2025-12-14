import React, { useState, useRef, useEffect } from 'react';
import { FileUploader } from '../components/FileUploader';
import { Button } from '../components/Button';
import { pdfjs, saveEditedPdf, EditorAction, downloadPdf } from '../services/pdfService';
import { PenTool, Type, Eraser, Download, ChevronLeft, ChevronRight, X, Palette, Save, CheckCircle, Minus, Plus, MousePointer2, Trash2, Square, Image as ImageIcon, Smile, Copy, Circle as CircleIcon } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export const EditPdf: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [tool, setTool] = useState<'none' | 'text' | 'draw' | 'shape'>('none');
  const [shapeType, setShapeType] = useState<'rectangle' | 'circle'>('rectangle');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // Tool Properties
  const [color, setColor] = useState('#000000');
  const [fontSize, setFontSize] = useState(16);
  const [brushSize, setBrushSize] = useState(3);
  
  const [actions, setActions] = useState<EditorAction[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [textInput, setTextInput] = useState<{x: number, y: number, value: string} | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageCache = useRef<Record<string, HTMLImageElement>>({});
  
  // Interaction Refs
  const isDragging = useRef(false);
  const dragStart = useRef<{x: number, y: number} | null>(null);
  const actionStart = useRef<Partial<EditorAction> | null>(null);
  const currentPath = useRef<{x: number, y: number}[]>([]);
  const interactionMode = useRef<'create' | 'move' | 'resize'>('create');

  const commonEmojis = ['😀', '😂', '😍', '😎', '🤔', '👍', '👎', '✅', '❌', '⭐', '🔥', '❤️', '📅', '📍', '✉️', '📞'];

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setActions([]);
      setTool('none');
      setSelectedId(null);
    }
  };

  // Load PDF Document
  useEffect(() => {
    if (file) {
      const loadPdf = async () => {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        setNumPages(pdf.numPages);
        setCurrentPage(1);
        renderPage(1, pdf);
      };
      loadPdf();
    }
  }, [file]);

  // Render Page
  const renderPage = async (pageNum: number, pdfDoc?: any) => {
    if (!file && !pdfDoc) return;
    
    // Get document reference (either passed or new load)
    let doc = pdfDoc;
    if (!doc) {
      const arrayBuffer = await file!.arrayBuffer();
      doc = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    }

    const page = await doc.getPage(pageNum);
    
    // Calculate scale to fit container width
    const containerWidth = containerRef.current?.clientWidth || 800;
    const viewportUnscaled = page.getViewport({ scale: 1 });
    const newScale = Math.min((containerWidth - 48) / viewportUnscaled.width, 1.5); // Max 1.5 zoom, padding
    setScale(newScale);

    const viewport = page.getViewport({ scale: newScale });
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    
    if (canvas && overlay) {
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      overlay.height = viewport.height;
      overlay.width = viewport.width;

      const context = canvas.getContext('2d');
      if (context) {
        await page.render({ canvasContext: context, viewport }).promise;
      }
      
      requestAnimationFrame(redrawOverlay);
    }
  };

  // Re-render when page changes
  useEffect(() => {
    if (file) renderPage(currentPage);
  }, [currentPage]);

  // Watch for actions changes to redraw
  useEffect(() => {
    redrawOverlay();
  }, [actions, selectedId]);

  // Ensure images are loaded before drawing
  const ensureImageLoaded = (id: string, src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve) => {
      if (imageCache.current[id]) {
        resolve(imageCache.current[id]);
        return;
      }
      const img = new Image();
      img.src = src;
      img.onload = () => {
        imageCache.current[id] = img;
        resolve(img);
        // Force redraw once loaded
        requestAnimationFrame(redrawOverlay);
      };
    });
  };

  // Redraw all actions for the current page
  const redrawOverlay = () => {
    if (!overlayRef.current) return;
    const ctx = overlayRef.current.getContext('2d');
    if (!ctx) return;
    const width = overlayRef.current.width;
    const height = overlayRef.current.height;

    ctx.clearRect(0, 0, width, height);
    const pageActions = actions.filter(a => a.pageIndex === currentPage - 1);

    pageActions.forEach(action => {
      ctx.save();
      // Draw Action
      if (action.type === 'text' && action.text && action.x !== undefined && action.y !== undefined) {
        const renderedSize = (action.size || 16) * scale;
        ctx.font = `${renderedSize}px Inter, sans-serif`;
        ctx.fillStyle = action.color || '#000000';
        ctx.textBaseline = 'top';
        ctx.fillText(action.text, action.x * width, action.y * height);
      }
      
      if (action.type === 'draw' && action.paths) {
        ctx.beginPath();
        ctx.strokeStyle = action.color || '#000000';
        ctx.lineWidth = (action.strokeWidth || 3) * scale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        if (action.paths.length > 0) {
          ctx.moveTo(action.paths[0].x * width, action.paths[0].y * height);
          for (let i = 1; i < action.paths.length; i++) {
            ctx.lineTo(action.paths[i].x * width, action.paths[i].y * height);
          }
        }
        ctx.stroke();
      }

      if (action.type === 'rectangle' && action.x !== undefined && action.y !== undefined && action.width !== undefined && action.height !== undefined) {
         ctx.fillStyle = action.color || '#FFFFFF';
         ctx.fillRect(action.x * width, action.y * height, action.width * width, action.height * height);
      }

      if (action.type === 'circle' && action.x !== undefined && action.y !== undefined && action.width !== undefined && action.height !== undefined) {
         ctx.fillStyle = action.color || '#000000';
         ctx.beginPath();
         const w = action.width * width;
         const h = action.height * height;
         ctx.ellipse(
           (action.x * width) + w / 2, 
           (action.y * height) + h / 2, 
           w / 2, 
           h / 2, 
           0, 0, 2 * Math.PI
         );
         ctx.fill();
      }

      if (action.type === 'image' && action.imageData && action.x !== undefined && action.y !== undefined) {
         // Check cache
         const img = imageCache.current[action.id];
         if (img) {
            let finalW = 0, finalH = 0;
            if (action.width !== undefined && action.height !== undefined) {
                finalW = action.width * width;
                finalH = action.height * height;
            } else {
                // Fallback / Initial
                finalW = (action.imageWidth || 0.2) * width;
                const aspect = img.width / img.height;
                finalH = action.imageHeight ? action.imageHeight * height : finalW / aspect;
            }
            ctx.drawImage(img, action.x * width, action.y * height, finalW, finalH);
         } else {
            // Trigger load
            ensureImageLoaded(action.id, action.imageData);
         }
      }

      // Draw Selection Outline
      if (selectedId === action.id) {
         ctx.strokeStyle = '#3b82f6'; // Blue-500
         ctx.lineWidth = 1;
         ctx.setLineDash([5, 3]);
         
         let bounds = { x: 0, y: 0, w: 0, h: 0 };

         if (action.type === 'text' && action.text && action.x !== undefined && action.y !== undefined) {
             const renderedSize = (action.size || 16) * scale;
             ctx.font = `${renderedSize}px Inter, sans-serif`;
             const metrics = ctx.measureText(action.text);
             bounds = {
                 x: action.x * width - 4,
                 y: action.y * height - 4,
                 w: metrics.width + 8,
                 h: renderedSize + 8 // Approx height
             };
         } else if ((action.type === 'rectangle' || action.type === 'circle') && action.x !== undefined) {
             bounds = {
                 x: action.x! * width,
                 y: action.y! * height,
                 w: action.width! * width,
                 h: action.height! * height
             };
         } else if (action.type === 'image' && action.x !== undefined) {
             const img = imageCache.current[action.id];
             if(img) {
                let w = action.width ? action.width * width : (action.imageWidth || 0.2) * width;
                let h = 0;
                if (action.height) h = action.height * height;
                else {
                    const aspect = img.width / img.height;
                    h = w / aspect;
                }
                bounds = {
                    x: action.x! * width,
                    y: action.y! * height,
                    w: w,
                    h: h
                };
             }
         }

         if (bounds.w > 0) {
             ctx.strokeRect(bounds.x, bounds.y, bounds.w, bounds.h);
             
             // Draw Resize Handle (Bottom Right)
             ctx.setLineDash([]);
             ctx.fillStyle = '#3b82f6';
             ctx.fillRect(bounds.x + bounds.w - 6, bounds.y + bounds.h - 6, 12, 12);
         }
      }
      ctx.restore();
    });
  };

  // Helper: Get Mouse Pos normalized using event target to prevent null ref errors
  const getMousePos = (e: React.MouseEvent) => {
    // Fallback if target is not element (should not happen on canvas event)
    if (!(e.currentTarget instanceof Element)) {
       return { x: 0, y: 0, width: 0, height: 0, rawX: 0, rawY: 0 };
    }
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
      rawX: e.clientX - rect.left,
      rawY: e.clientY - rect.top,
      width: rect.width,
      height: rect.height
    };
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const imgFile = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (evt) => {
        const base64 = evt.target?.result as string;
        const newId = uuidv4();
        // Add centered
        const newAction: EditorAction = {
          id: newId,
          type: 'image',
          pageIndex: currentPage - 1,
          x: 0.3, // approximate center
          y: 0.3,
          imageData: base64,
          imageWidth: 0.4, // Default width 40%
          width: 0.4,
          // height will be calculated by aspect ratio
        };
        setActions(prev => [...prev, newAction]);
        setTool('none');
        setSelectedId(newId);
        // Preload
        ensureImageLoaded(newId, base64);
      };
      reader.readAsDataURL(imgFile);
    }
    // Reset
    if(fileInputRef.current) fileInputRef.current.value = '';
  };

  const emojiToImage = (emoji: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.font = '100px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emoji, 64, 70);
      return canvas.toDataURL('image/png');
    }
    return '';
  };

  const addEmoji = (emoji: string) => {
    const base64 = emojiToImage(emoji);
    if (!base64) return;

    const newId = uuidv4();
    const newAction: EditorAction = {
      id: newId,
      type: 'image', // Add as image to ensure it renders in PDF correctly
      pageIndex: currentPage - 1,
      x: 0.4,
      y: 0.4,
      imageData: base64,
      imageWidth: 0.1, // Small default size for emoji
      width: 0.1,
    };
    
    setActions(prev => [...prev, newAction]);
    setTool('none');
    setSelectedId(newId);
    setShowEmojiPicker(false);
    ensureImageLoaded(newId, base64);
  };

  const duplicateSelected = () => {
    if(!selectedId) return;
    const selected = actions.find(a => a.id === selectedId);
    if(selected) {
        const newId = uuidv4();
        const newAction = {
            ...selected,
            id: newId,
            x: (selected.x || 0) + 0.05,
            y: (selected.y || 0) + 0.05
        };
        
        // Immediate cache population for images to allow instant movement
        if(selected.type === 'image' && selected.imageData) {
            if(imageCache.current[selected.id]) {
                imageCache.current[newId] = imageCache.current[selected.id];
            } else {
                ensureImageLoaded(newId, selected.imageData);
            }
        }

        setActions(prev => [...prev, newAction]);
        setSelectedId(newId);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getMousePos(e);
    
    // 1. If Select Mode
    if (tool === 'none') {
        // Check for resize handle hit on selected item
        if (selectedId) {
            const selectedAction = actions.find(a => a.id === selectedId);
            if (selectedAction) {
                // Calculate handle bounds (Replicated logic from redrawOverlay for hit testing)
                let bounds = { x: 0, y: 0, w: 0, h: 0 };
                const width = pos.width;
                const height = pos.height;
                
                if (selectedAction.type === 'text' && selectedAction.text) {
                     const ctx = overlayRef.current!.getContext('2d')!;
                     const renderedSize = (selectedAction.size || 16) * scale;
                     ctx.font = `${renderedSize}px Inter, sans-serif`;
                     const metrics = ctx.measureText(selectedAction.text);
                     bounds = {
                         x: selectedAction.x! * width - 4,
                         y: selectedAction.y! * height - 4,
                         w: metrics.width + 8,
                         h: renderedSize + 8
                     };
                } else if ((selectedAction.type === 'rectangle' || selectedAction.type === 'circle') && selectedAction.x !== undefined) {
                     bounds = {
                         x: selectedAction.x! * width,
                         y: selectedAction.y! * height,
                         w: selectedAction.width! * width,
                         h: selectedAction.height! * height
                     };
                } else if (selectedAction.type === 'image') {
                     const img = imageCache.current[selectedAction.id];
                     if(img) {
                        let w = selectedAction.width ? selectedAction.width * width : (selectedAction.imageWidth || 0.2) * width;
                        let h = selectedAction.height ? selectedAction.height * height : 0;
                        if (!h) {
                            const aspect = img.width / img.height;
                            h = w / aspect;
                        }
                        bounds = {
                            x: selectedAction.x! * width,
                            y: selectedAction.y! * height,
                            w: w,
                            h: h
                        };
                     }
                }

                // Check Handle Hit (Bottom Right)
                const handleSize = 15; // slightly larger hit area
                const handleX = bounds.x + bounds.w - 6;
                const handleY = bounds.y + bounds.h - 6;
                
                if (pos.rawX >= handleX - 5 && pos.rawX <= handleX + handleSize && 
                    pos.rawY >= handleY - 5 && pos.rawY <= handleY + handleSize) {
                    interactionMode.current = 'resize';
                    isDragging.current = true;
                    dragStart.current = { x: pos.x, y: pos.y };
                    actionStart.current = { ...selectedAction };
                    // For image, we need to know starting width/height explicitly
                    if (selectedAction.type === 'image' && !selectedAction.width && actionStart.current) {
                       actionStart.current.width = bounds.w / width;
                       actionStart.current.height = bounds.h / height;
                    }
                    return;
                }
                
                // Check Move Hit (Inside Box)
                if (pos.rawX >= bounds.x && pos.rawX <= bounds.x + bounds.w &&
                    pos.rawY >= bounds.y && pos.rawY <= bounds.y + bounds.h) {
                    interactionMode.current = 'move';
                    isDragging.current = true;
                    dragStart.current = { x: pos.x, y: pos.y };
                    actionStart.current = { ...selectedAction };
                    return;
                }
            }
        }

        // Hit Test for New Selection (reverse iterate)
        const reversed = [...actions].reverse();
        const hit = reversed.find(a => {
            if (a.pageIndex !== currentPage - 1) return false;
            // Simplified hit test for image/shapes
            const width = pos.width;
            const height = pos.height;
            let rect = { x: 0, y: 0, w: 0, h: 0 };

            if (a.type === 'text' && a.text) {
                const ctx = overlayRef.current!.getContext('2d')!;
                const renderedSize = (a.size || 16) * scale;
                ctx.font = `${renderedSize}px Inter, sans-serif`;
                const metrics = ctx.measureText(a.text);
                rect = {
                    x: a.x! * width,
                    y: a.y! * height,
                    w: metrics.width,
                    h: renderedSize
                };
            } else if (a.type === 'rectangle' || a.type === 'circle') {
                rect = {
                    x: a.x! * width,
                    y: a.y! * height,
                    w: a.width! * width,
                    h: a.height! * height
                };
            } else if (a.type === 'image') {
                 const img = imageCache.current[a.id];
                 if(img) {
                    let w = a.width ? a.width * width : (a.imageWidth || 0.2) * width;
                    let h = a.height ? a.height * height : 0;
                    if(!h) {
                        const aspect = img.width / img.height;
                        h = w / aspect;
                    }
                    rect = { x: a.x! * width, y: a.y! * height, w, h };
                 }
            }
            return pos.rawX >= rect.x && pos.rawX <= rect.x + rect.w && pos.rawY >= rect.y && pos.rawY <= rect.y + rect.h;
        });

        if (hit) {
            setSelectedId(hit.id);
            interactionMode.current = 'move'; 
            isDragging.current = true;
            dragStart.current = { x: pos.x, y: pos.y };
            actionStart.current = { ...hit };
        } else {
            setSelectedId(null);
            setTextInput(null);
            setShowEmojiPicker(false);
        }
        return;
    }

    // 2. Create Modes
    interactionMode.current = 'create';
    isDragging.current = true;
    dragStart.current = { x: pos.x, y: pos.y };

    if (tool === 'draw') {
        currentPath.current = [{ x: pos.x, y: pos.y }];
    } else if (tool === 'text') {
        setTextInput({ x: pos.x, y: pos.y, value: '' });
        isDragging.current = false; 
    } else if (tool === 'shape') {
        const newId = uuidv4();
        const type = shapeType;
        const newAction: EditorAction = {
            id: newId,
            type: type,
            pageIndex: currentPage - 1,
            x: pos.x,
            y: pos.y,
            width: 0,
            height: 0,
            color: color
        };
        setActions(prev => [...prev, newAction]);
        setSelectedId(newId);
        actionStart.current = newAction;
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const pos = getMousePos(e);
    
    // DRAWING PREVIEW
    if (tool === 'draw' && isDragging.current && overlayRef.current) {
        currentPath.current.push({ x: pos.x, y: pos.y });
        const ctx = overlayRef.current.getContext('2d');
        if (ctx) {
            ctx.lineTo(pos.rawX, pos.rawY);
            ctx.stroke();
        }
        return;
    }

    // MANIPULATION
    if (isDragging.current && selectedId) {
        const deltaX = pos.x - (dragStart.current?.x || 0);
        const deltaY = pos.y - (dragStart.current?.y || 0);

        if (interactionMode.current === 'move' && actionStart.current) {
            setActions(prev => prev.map(a => 
                a.id === selectedId 
                ? { ...a, x: (actionStart.current?.x || 0) + deltaX, y: (actionStart.current?.y || 0) + deltaY } 
                : a
            ));
        } else if (interactionMode.current === 'resize' && actionStart.current) {
             setActions(prev => prev.map(a => {
                if (a.id !== selectedId) return a;
                
                if (a.type === 'text') {
                    const scaleFactor = 1 + deltaY * 5; 
                    const newSize = Math.max(8, (actionStart.current?.size || 16) * scaleFactor);
                    return { ...a, size: newSize };
                }
                
                if (a.type === 'rectangle' || a.type === 'circle' || a.type === 'image') {
                    return {
                        ...a,
                        width: Math.max(0.01, (actionStart.current?.width || 0) + deltaX),
                        height: Math.max(0.01, (actionStart.current?.height || 0) + deltaY)
                    };
                }
                return a;
            }));
        } else if (interactionMode.current === 'create' && tool === 'shape' && actionStart.current) {
            // Dragging to create box
             setActions(prev => prev.map(a => 
                a.id === selectedId 
                ? { ...a, width: deltaX, height: deltaY } 
                : a
            ));
        }
    }
  };

  const handleMouseUp = () => {
    if (tool === 'draw' && isDragging.current) {
      const newAction: EditorAction = {
        id: uuidv4(),
        type: 'draw',
        pageIndex: currentPage - 1,
        paths: [...currentPath.current],
        color,
        strokeWidth: brushSize
      };
      setActions(prev => [...prev, newAction]);
    }

    // Ensure positive width/height for shapes
    if (tool === 'shape' && isDragging.current && selectedId) {
        setActions(prev => prev.map(a => {
            if (a.id !== selectedId) return a;
            let { x, y, width, height } = a;
            if (width! < 0) { x = (x || 0) + width!; width = Math.abs(width!); }
            if (height! < 0) { y = (y || 0) + height!; height = Math.abs(height!); }
            return { ...a, x, y, width, height };
        }));
        setTool('none'); 
    }

    isDragging.current = false;
    dragStart.current = null;
    actionStart.current = null;
    currentPath.current = [];
    interactionMode.current = 'create';
  };

  const confirmText = () => {
    if (textInput && textInput.value) {
      const newAction: EditorAction = {
        id: uuidv4(),
        type: 'text',
        pageIndex: currentPage - 1,
        x: textInput.x,
        y: textInput.y,
        text: textInput.value,
        color,
        size: fontSize
      };
      setActions(prev => [...prev, newAction]);
      setTool('none');
      setSelectedId(newAction.id);
    }
    setTextInput(null);
  };

  const deleteSelected = () => {
    if (selectedId) {
        setActions(prev => prev.filter(a => a.id !== selectedId));
        setSelectedId(null);
    }
  };

  const undo = () => {
    setActions(prev => {
        const newArr = [...prev];
        const lastIndex = newArr.length - 1;
        if (lastIndex >= 0) newArr.splice(lastIndex, 1);
        return newArr;
    });
  };

  const handleSave = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const bytes = await saveEditedPdf(file, actions);
      downloadPdf(bytes, `edited-${file.name}`);
    } catch (e) {
      console.error(e);
      alert('Failed to save PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  const colors = [
    '#000000', '#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1', '#FFFFFF'
  ];

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-100 flex flex-col">
      <input 
        type="file" 
        ref={fileInputRef} 
        accept="image/*" 
        className="hidden" 
        onChange={handleImageUpload} 
      />

      {!file ? (
        <div className="max-w-4xl mx-auto w-full pt-12 px-4">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">Edit PDF</h1>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Add text, images, shapes, and annotations to your PDF.
            </p>
          </div>
          <FileUploader
            onFilesSelected={handleFileSelected}
            multiple={false}
            icon={<PenTool className="w-12 h-12 text-pink-500" />}
            title="Select PDF to Edit"
            description="Drag & drop your PDF here"
          />
        </div>
      ) : (
        <>
          {/* Professional Toolbar */}
          <div className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-30 shadow-sm select-none">
            <div className="max-w-7xl mx-auto flex flex-col xl:flex-row items-center justify-between gap-4">
              
              {/* Tools Group */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full xl:w-auto">
                <Button variant="ghost" size="sm" onClick={() => setFile(null)} className="shrink-0 mr-2">
                  <X className="w-4 h-4" />
                </Button>
                
                <div className="flex bg-slate-100 p-1 rounded-lg shrink-0">
                  <button 
                     onClick={() => { setTool('none'); setTextInput(null); }}
                     className={`p-2 rounded-md transition-all flex items-center gap-2 text-sm font-medium ${tool === 'none' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}
                     title="Select"
                   >
                     <MousePointer2 className="w-4 h-4" /> <span className="hidden sm:inline">Select</span>
                   </button>
                   <button 
                     onClick={() => setTool('text')}
                     className={`p-2 rounded-md transition-all flex items-center gap-2 text-sm font-medium ${tool === 'text' ? 'bg-white shadow text-pink-600' : 'text-slate-500 hover:text-slate-800'}`}
                   >
                     <Type className="w-4 h-4" /> <span className="hidden sm:inline">Text</span>
                   </button>
                   <button 
                     onClick={() => fileInputRef.current?.click()}
                     className={`p-2 rounded-md transition-all flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800`}
                   >
                     <ImageIcon className="w-4 h-4" /> <span className="hidden sm:inline">Photo</span>
                   </button>
                   <button 
                     onClick={() => { setTool('shape'); setShapeType('rectangle'); }}
                     className={`p-2 rounded-md transition-all flex items-center gap-2 text-sm font-medium ${tool === 'shape' && shapeType === 'rectangle' ? 'bg-white shadow text-pink-600' : 'text-slate-500 hover:text-slate-800'}`}
                   >
                     <Square className="w-4 h-4" /> <span className="hidden sm:inline">Rect</span>
                   </button>
                   <button 
                     onClick={() => { setTool('shape'); setShapeType('circle'); }}
                     className={`p-2 rounded-md transition-all flex items-center gap-2 text-sm font-medium ${tool === 'shape' && shapeType === 'circle' ? 'bg-white shadow text-pink-600' : 'text-slate-500 hover:text-slate-800'}`}
                   >
                     <CircleIcon className="w-4 h-4" /> <span className="hidden sm:inline">Circle</span>
                   </button>
                   <button 
                     onClick={() => setTool('draw')}
                     className={`p-2 rounded-md transition-all flex items-center gap-2 text-sm font-medium ${tool === 'draw' ? 'bg-white shadow text-pink-600' : 'text-slate-500 hover:text-slate-800'}`}
                   >
                     <PenTool className="w-4 h-4" /> <span className="hidden sm:inline">Draw</span>
                   </button>
                   <button 
                     onClick={() => { setShowEmojiPicker(!showEmojiPicker); setTool('none'); }}
                     className={`p-2 rounded-md transition-all flex items-center gap-2 text-sm font-medium relative ${showEmojiPicker ? 'bg-white shadow text-pink-600' : 'text-slate-500 hover:text-slate-800'}`}
                   >
                     <Smile className="w-4 h-4" /> <span className="hidden sm:inline">Emoji</span>
                     
                     {showEmojiPicker && (
                       <div className="absolute top-full left-0 mt-2 bg-white border border-slate-200 shadow-xl rounded-xl p-3 grid grid-cols-4 gap-2 z-50 w-48 max-h-48 overflow-y-auto custom-scrollbar">
                         {commonEmojis.map(e => (
                           <button 
                             key={e} 
                             onClick={(evt) => { evt.stopPropagation(); addEmoji(e); }}
                             className="text-2xl hover:bg-slate-100 rounded p-1"
                           >
                             {e}
                           </button>
                         ))}
                       </div>
                     )}
                   </button>
                </div>

                <div className="h-8 w-px bg-slate-200 shrink-0 mx-2"></div>

                <div className="flex gap-1 shrink-0">
                    <button 
                       onClick={duplicateSelected}
                       disabled={!selectedId}
                       className="p-2 rounded-lg text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors disabled:opacity-30"
                       title="Duplicate"
                     >
                       <Copy className="w-5 h-5" />
                    </button>
                    <button 
                       onClick={deleteSelected}
                       disabled={!selectedId}
                       className="p-2 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-30"
                       title="Delete"
                     >
                       <Trash2 className="w-5 h-5" />
                    </button>
                    <button 
                       onClick={undo}
                       className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                       title="Undo"
                     >
                       <Eraser className="w-5 h-5" />
                    </button>
                </div>
              </div>

              {/* Right: Properties & Save */}
              <div className="flex items-center gap-6 w-full xl:w-auto justify-between xl:justify-end">
                 
                 <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="relative group">
                        <div 
                          className="w-8 h-8 rounded-full border-2 border-slate-200 cursor-pointer shadow-sm"
                          style={{ backgroundColor: color }}
                        ></div>
                        <input 
                          type="color" 
                          value={color}
                          onChange={(e) => setColor(e.target.value)}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                      </div>
                      <div className="hidden lg:flex gap-1">
                        {colors.slice(0, 5).map(c => (
                          <button
                            key={c}
                            onClick={() => setColor(c)}
                            className={`w-6 h-6 rounded-full border border-slate-200 transition-transform hover:scale-110 ${color === c ? 'ring-2 ring-offset-1 ring-slate-400' : ''}`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                 </div>

                 <Button 
                    variant="primary" 
                    onClick={handleSave}
                    isLoading={isProcessing}
                    className="bg-pink-600 hover:bg-pink-700 shadow-pink-500/20"
                  >
                    <Save className="w-4 h-4 mr-2" /> Download
                  </Button>
              </div>
            </div>
          </div>

          {/* Editor Workspace */}
          <div className="flex-grow overflow-auto p-4 md:p-8 relative flex justify-center bg-slate-100/50" ref={containerRef}>
            <div className="relative shadow-2xl transition-transform duration-200 ease-out select-none">
              <canvas ref={canvasRef} className="bg-white block" />
              <canvas 
                ref={overlayRef} 
                className={`absolute inset-0 touch-none outline-none ${tool !== 'none' ? 'cursor-crosshair' : 'cursor-default'}`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
              
              {/* WYSIWYG Text Input Overlay */}
              {textInput && (
                <div 
                  className="absolute z-20"
                  style={{ 
                    left: textInput.x * (overlayRef.current?.width || 0), 
                    top: textInput.y * (overlayRef.current?.height || 0) 
                  }}
                >
                  <input 
                    autoFocus
                    type="text" 
                    placeholder="Type..."
                    className="outline-none bg-transparent border-none p-0 m-0 leading-none placeholder:text-slate-300 min-w-[50px] whitespace-nowrap overflow-hidden"
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: `${fontSize * scale}px`,
                      color: color,
                      lineHeight: '1',
                      height: `${fontSize * scale}px`
                    }}
                    value={textInput.value}
                    onChange={(e) => setTextInput({...textInput, value: e.target.value})}
                    onKeyDown={(e) => { 
                      if(e.key === 'Enter') confirmText();
                      if(e.key === 'Escape') setTextInput(null);
                    }}
                    onBlur={confirmText}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Footer Pagination */}
          {numPages > 1 && (
            <div className="h-14 bg-white border-t border-slate-200 flex items-center justify-center gap-4 sticky bottom-0 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-full hover:bg-slate-100 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="font-medium text-slate-600 text-sm">
                Page {currentPage} of {numPages}
              </span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
                disabled={currentPage === numPages}
                className="p-2 rounded-full hover:bg-slate-100 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};