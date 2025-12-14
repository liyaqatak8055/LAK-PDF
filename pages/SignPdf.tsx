import React, { useState, useRef, useEffect } from 'react';
import { FileUploader } from '../components/FileUploader';
import { Button } from '../components/Button';
import { pdfjs, saveEditedPdf, EditorAction, downloadPdf } from '../services/pdfService';
import { Signature, PenTool, X, Check, Save, Eraser } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export const SignPdf: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [signature, setSignature] = useState<string | null>(null); // Base64 signature
  const [isSigning, setIsSigning] = useState(false);
  const [placedSignature, setPlacedSignature] = useState<{x: number, y: number} | null>(null);
  
  const [status, setStatus] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<HTMLCanvasElement>(null);

  const [pdfScale, setPdfScale] = useState(1);

  // Load PDF First Page Preview
  useEffect(() => {
    if (file && pdfCanvasRef.current && pdfContainerRef.current) {
      const render = async () => {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);
        
        const containerWidth = pdfContainerRef.current!.clientWidth;
        const viewportUnscaled = page.getViewport({ scale: 1 });
        const scale = Math.min((containerWidth - 32) / viewportUnscaled.width, 1.5);
        setPdfScale(scale);

        const viewport = page.getViewport({ scale });
        const canvas = pdfCanvasRef.current!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          await page.render({ canvasContext: ctx, viewport }).promise;
        }
      };
      render();
    }
  }, [file]);

  // Signature Pad Logic
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsSigning(true);
    const canvas = signaturePadRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000000';
    
    const { offsetX, offsetY } = getCoordinates(e, canvas);
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isSigning) return;
    const canvas = signaturePadRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { offsetX, offsetY } = getCoordinates(e, canvas);
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
  };

  const endDrawing = () => {
    setIsSigning(false);
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    
    return {
      offsetX: clientX - rect.left,
      offsetY: clientY - rect.top
    };
  };

  const clearSignature = () => {
    const canvas = signaturePadRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
    setSignature(null);
  };

  const saveSignature = () => {
    const canvas = signaturePadRef.current;
    if (canvas) {
      setSignature(canvas.toDataURL('image/png'));
    }
  };

  const handlePdfClick = (e: React.MouseEvent) => {
    if (signature && pdfCanvasRef.current) {
      const rect = pdfCanvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      setPlacedSignature({ x, y });
    }
  };

  const handleDownload = async () => {
    if (!file || !signature || !placedSignature) return;
    setStatus(true);
    
    const actions: EditorAction[] = [{
      id: uuidv4(),
      type: 'image',
      pageIndex: 0, // Simplified: Only page 1 for now
      imageData: signature,
      x: placedSignature.x,
      y: placedSignature.y,
      imageWidth: 0.2, // Default size
      imageHeight: 0.1
    }];

    try {
      const newPdf = await saveEditedPdf(file, actions);
      downloadPdf(newPdf, `signed-${file.name}`);
    } catch (e) {
      console.error(e);
      alert("Failed to save PDF");
    } finally {
      setStatus(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Sign PDF</h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          Draw your signature and place it on your document.
        </p>
      </div>

      {!file ? (
        <FileUploader
          onFilesSelected={(f) => setFile(f[0])}
          multiple={false}
          icon={<Signature className="w-12 h-12 text-indigo-500" />}
          title="Select PDF"
          description="Drop the document you want to sign"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* PDF Preview Area */}
          <div className="lg:col-span-2 bg-slate-100 p-4 rounded-2xl overflow-hidden flex justify-center" ref={pdfContainerRef}>
            <div className="relative shadow-lg">
              <canvas ref={pdfCanvasRef} onClick={handlePdfClick} className="bg-white cursor-crosshair" />
              {placedSignature && signature && (
                <img 
                  src={signature} 
                  className="absolute border-2 border-indigo-500 border-dashed bg-indigo-50/20"
                  style={{
                    left: `${placedSignature.x * 100}%`,
                    top: `${placedSignature.y * 100}%`,
                    width: '20%', // visual approx
                    transform: 'translateY(-100%)' // anchor bottom-left to click point
                  }}
                />
              )}
            </div>
          </div>

          {/* Sidebar Controls */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 h-fit">
            <h3 className="font-bold text-slate-900 mb-4">Your Signature</h3>
            
            {!signature ? (
              <div className="mb-6">
                <div className="border border-slate-200 rounded-lg bg-slate-50 mb-2 touch-none">
                  <canvas 
                    ref={signaturePadRef} 
                    width={300} 
                    height={150} 
                    className="w-full cursor-pencil"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={endDrawing}
                    onMouseLeave={endDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={endDrawing}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={clearSignature} className="flex-1">
                    <Eraser className="w-4 h-4 mr-2" /> Clear
                  </Button>
                  <Button variant="primary" size="sm" onClick={saveSignature} className="flex-1">
                    <Check className="w-4 h-4 mr-2" /> Use This
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mb-6 text-center">
                 <div className="bg-white border border-slate-200 p-4 rounded-lg mb-4">
                   <img src={signature} alt="Signature" className="h-16 mx-auto" />
                 </div>
                 <p className="text-sm text-slate-500 mb-4">
                   Click anywhere on the document to place your signature.
                 </p>
                 <Button variant="secondary" size="sm" onClick={() => setSignature(null)} className="w-full">
                   Redraw Signature
                 </Button>
              </div>
            )}

            <div className="border-t border-slate-100 pt-6">
              <Button 
                variant="primary" 
                size="lg" 
                className="w-full bg-indigo-600"
                disabled={!placedSignature}
                onClick={handleDownload}
                isLoading={status}
              >
                <Save className="w-5 h-5 mr-2" /> Save & Download
              </Button>
              {!placedSignature && signature && (
                 <p className="text-xs text-orange-500 mt-2 text-center">Please click on the PDF to place signature first.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};