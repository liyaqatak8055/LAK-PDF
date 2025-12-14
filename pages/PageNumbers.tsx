import React, { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { Button } from '../components/Button';
import { PdfFile, ProcessingStatus } from '../types';
import { addPageNumbers, downloadPdf, formatBytes } from '../services/pdfService';
import { Hash, X, ArrowDown } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export const PageNumbers: React.FC = () => {
  const [file, setFile] = useState<PdfFile | null>(null);
  const [position, setPosition] = useState<'bottom-center' | 'bottom-right'>('bottom-center');
  const [status, setStatus] = useState<ProcessingStatus>({ isProcessing: false, message: '' });

  const handleFileSelected = (selectedFiles: File[]) => {
    if (selectedFiles.length > 0) {
      setFile({
        id: uuidv4(),
        file: selectedFiles[0],
        name: selectedFiles[0].name,
        size: selectedFiles[0].size,
      });
    }
  };

  const handleProcess = async () => {
    if (!file) return;
    setStatus({ isProcessing: true, message: 'Adding page numbers...' });

    try {
      const newPdfBytes = await addPageNumbers(file.file, position);
      downloadPdf(newPdfBytes, `numbered-${file.name}`);
      setStatus({ isProcessing: false, message: 'Done!', success: true });
    } catch (error) {
      console.error(error);
      setStatus({ isProcessing: false, message: 'Error processing file.', error: 'Failed' });
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Page Numbers</h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          Add page numbers into your PDF document easily.
        </p>
      </div>

      {!file ? (
        <FileUploader
          onFilesSelected={handleFileSelected}
          multiple={false}
          icon={<Hash className="w-12 h-12 text-teal-400" />}
          title="Select PDF file"
          description="Drop your PDF here"
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

           <div className="mb-8">
             <h4 className="font-semibold text-slate-800 mb-4">Position</h4>
             <div className="grid grid-cols-2 gap-4">
               <button
                 onClick={() => setPosition('bottom-center')}
                 className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${position === 'bottom-center' ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200 hover:border-teal-300'}`}
               >
                 <div className="w-20 h-28 bg-white border border-slate-200 shadow-sm relative mx-auto">
                    <div className="absolute bottom-2 left-0 right-0 text-center text-[8px] text-slate-400 font-mono">1/5</div>
                 </div>
                 <span className="font-medium text-sm">Bottom Center</span>
               </button>
               
               <button
                 onClick={() => setPosition('bottom-right')}
                 className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${position === 'bottom-right' ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200 hover:border-teal-300'}`}
               >
                 <div className="w-20 h-28 bg-white border border-slate-200 shadow-sm relative mx-auto">
                    <div className="absolute bottom-2 right-2 text-[8px] text-slate-400 font-mono">1/5</div>
                 </div>
                 <span className="font-medium text-sm">Bottom Right</span>
               </button>
             </div>
           </div>

           <Button 
             variant="primary" 
             size="lg" 
             className="w-full bg-teal-500 hover:bg-teal-600 focus:ring-teal-400 shadow-teal-500/30"
             onClick={handleProcess}
             isLoading={status.isProcessing}
           >
             {status.isProcessing ? 'Processing...' : 'Add Page Numbers'}
           </Button>
        </div>
      )}
    </div>
  );
};