import React, { useState, useRef, useEffect } from 'react';
import { FileUploader } from '../components/FileUploader';
import { Button } from '../components/Button';
import { pdfjs, cropPdf, downloadPdf } from '../services/pdfService';
import { Crop, Scissors, Download, RefreshCw } from 'lucide-react';

export const CropPdf: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Selection State (normalized 0-1)
  const [selection, setSelection] = useState({ x: 0.1, y: 0.1, width: 0.8, height: 0.8 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Render Page 1
  useEffect(() => {
    if (file && canvasRef.current && containerRef.current) {
      const render = async () => {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);
        
        const containerWidth = containerRef.current!.clientWidth;
        const viewportUnscaled = page.getViewport({ scale: 1 });
        const scale = Math.min((containerWidth - 32) / viewportUnscaled.width, 1.2);

        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current!;
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

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setDragStart({ x, y });
    setSelection({ x, y, width: 0, height: 0 });
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const currentX = (e.clientX - rect.left) / rect.width;
    const currentY = (e.clientY - rect.top) / rect.height;

    const x = Math.min(currentX, dragStart.x);
    const y = Math.min(currentY, dragStart.y);
    const width = Math.abs(currentX - dragStart.x);
    const height = Math.abs(currentY - dragStart.y);

    setSelection({ x, y, width, height });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    // Enforce minimum size
    if (selection.width < 0.05 || selection.height < 0.05) {
      setSelection({ x: 0.1, y: 0.1, width: 0.8, height: 0.8 });
    }
  };

  const handleCrop = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const croppedBytes = await cropPdf(file, selection);
      downloadPdf(croppedBytes, `cropped-${file.name}`);
    } catch (e) {
      console.error(e);
      alert("Error cropping PDF");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Crop PDF</h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          Select the area you want to keep. This will crop all pages in the document.
        </p>
      </div>

      {!file ? (
        <FileUploader
          onFilesSelected={(f) => setFile(f[0])}
          multiple={false}
          icon={<Crop className="w-12 h-12 text-emerald-500" />}
          title="Select PDF"
          description="Drop PDF to crop"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 bg-slate-800 p-4 rounded-xl flex justify-center overflow-hidden">
             <div 
               className="relative shadow-lg inline-block select-none"
               ref={containerRef}
               onMouseDown={handleMouseDown}
               onMouseMove={handleMouseMove}
               onMouseUp={handleMouseUp}
               onMouseLeave={handleMouseUp}
             >
               <canvas ref={canvasRef} className="block bg-white pointer-events-none" />
               
               {/* Crop Overlay */}
               <div className="absolute inset-0 bg-black/50 pointer-events-none">
                 <div 
                   className="absolute border-2 border-emerald-400 bg-transparent box-content shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] pointer-events-auto cursor-crosshair"
                   style={{
                     left: `${selection.x * 100}%`,
                     top: `${selection.y * 100}%`,
                     width: `${selection.width * 100}%`,
                     height: `${selection.height * 100}%`
                   }}
                 >
                    {/* Handles */}
                    <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-white -mt-1 -ml-1"></div>
                    <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-white -mt-1 -mr-1"></div>
                    <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-white -mb-1 -ml-1"></div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-white -mb-1 -mr-1"></div>
                 </div>
               </div>
             </div>
           </div>

           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
             <h3 className="font-bold text-slate-900 mb-4">Crop Settings</h3>
             <p className="text-sm text-slate-500 mb-6">
               Draw a box on the preview to select the crop area.
             </p>

             <div className="space-y-4 mb-6">
               <div className="grid grid-cols-2 gap-4 text-sm">
                 <div className="bg-slate-50 p-2 rounded">
                   <span className="text-slate-400">X:</span> {Math.round(selection.x * 100)}%
                 </div>
                 <div className="bg-slate-50 p-2 rounded">
                   <span className="text-slate-400">Y:</span> {Math.round(selection.y * 100)}%
                 </div>
                 <div className="bg-slate-50 p-2 rounded">
                   <span className="text-slate-400">W:</span> {Math.round(selection.width * 100)}%
                 </div>
                 <div className="bg-slate-50 p-2 rounded">
                   <span className="text-slate-400">H:</span> {Math.round(selection.height * 100)}%
                 </div>
               </div>
             </div>

             <Button 
               variant="primary" 
               size="lg" 
               className="w-full bg-emerald-600 hover:bg-emerald-700"
               onClick={handleCrop}
               isLoading={isProcessing}
             >
               <Scissors className="w-5 h-5 mr-2" /> Crop PDF
             </Button>

             <Button variant="ghost" size="sm" onClick={() => setFile(null)} className="w-full mt-2">
               Cancel
             </Button>
           </div>
        </div>
      )}
    </div>
  );
};