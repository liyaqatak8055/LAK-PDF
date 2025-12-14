import React, { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { Button } from '../components/Button';
import { PdfFile, ProcessingStatus } from '../types';
import { rotatePdf, downloadPdf, formatBytes } from '../services/pdfService';
import { RotateCw, RotateCcw, X, CheckCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export const RotatePdf: React.FC = () => {
  const [file, setFile] = useState<PdfFile | null>(null);
  const [rotation, setRotation] = useState<number>(0);
  const [status, setStatus] = useState<ProcessingStatus>({ isProcessing: false, message: '' });

  const handleFileSelected = (selectedFiles: File[]) => {
    if (selectedFiles.length > 0) {
      setFile({
        id: uuidv4(),
        file: selectedFiles[0],
        name: selectedFiles[0].name,
        size: selectedFiles[0].size,
      });
      setRotation(0);
    }
  };

  const handleRotate = (deg: number) => {
    setRotation(prev => prev + deg);
  };

  const handleProcess = async () => {
    if (!file) return;
    setStatus({ isProcessing: true, message: 'Rotating PDF...' });

    try {
      const rotatedBytes = await rotatePdf(file.file, rotation);
      downloadPdf(rotatedBytes, `rotated-${file.name}`);
      setStatus({ isProcessing: false, message: 'Done!', success: true });
    } catch (error) {
      console.error(error);
      setStatus({ isProcessing: false, message: 'Error rotating file.', error: 'Failed' });
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Rotate PDF</h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          Rotate your PDF files permanently. Rotate all pages at once.
        </p>
      </div>

      {!file ? (
        <FileUploader
          onFilesSelected={handleFileSelected}
          multiple={false}
          icon={<RotateCw className="w-12 h-12 text-purple-400" />}
          title="Select PDF file"
          description="Drop your PDF here to rotate it"
        />
      ) : (
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
           <div className="flex items-start justify-between mb-8 pb-6 border-b border-slate-100">
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center text-red-500 font-bold shrink-0">
                 PDF
               </div>
               <div>
                 <h3 className="font-semibold text-slate-900 truncate max-w-[200px] md:max-w-xs">{file.name}</h3>
                 <p className="text-sm text-slate-500">{formatBytes(file.size)}</p>
               </div>
             </div>
             <button onClick={() => setFile(null)} className="text-slate-400 hover:text-red-500 transition-colors">
               <X />
             </button>
           </div>

           <div className="flex flex-col items-center justify-center py-6 mb-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
             <div 
                className="w-32 h-44 bg-white shadow-md border border-slate-200 flex items-center justify-center transition-transform duration-300"
                style={{ transform: `rotate(${rotation}deg)` }}
             >
                <div className="text-slate-300 font-bold text-4xl select-none">A</div>
             </div>
             <div className="mt-4 font-mono text-sm text-slate-500">
               Current Rotation: {rotation % 360}°
             </div>
           </div>

           <div className="grid grid-cols-2 gap-4 mb-8">
             <button 
                onClick={() => handleRotate(-90)}
                className="flex items-center justify-center gap-2 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-purple-300 transition-all font-medium text-slate-700"
             >
               <RotateCcw className="w-5 h-5" /> Left 90°
             </button>
             <button 
                onClick={() => handleRotate(90)}
                className="flex items-center justify-center gap-2 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-purple-300 transition-all font-medium text-slate-700"
             >
               <RotateCw className="w-5 h-5" /> Right 90°
             </button>
           </div>

           <Button 
             variant="primary" 
             size="lg" 
             className="w-full bg-purple-500 hover:bg-purple-600 focus:ring-purple-400 shadow-purple-500/30"
             onClick={handleProcess}
             isLoading={status.isProcessing}
           >
             {status.isProcessing ? 'Rotating...' : 'Download Rotated PDF'}
           </Button>
        </div>
      )}
    </div>
  );
};