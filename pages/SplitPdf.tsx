import React, { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { Button } from '../components/Button';
import { PdfFile, ProcessingStatus } from '../types';
import { splitPdf, downloadPdf, formatBytes } from '../services/pdfService';
import { Scissors, FileText, Download, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export const SplitPdf: React.FC = () => {
  const [file, setFile] = useState<PdfFile | null>(null);
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

  const handleSplit = async () => {
    if (!file) return;
    setStatus({ isProcessing: true, message: 'Splitting PDF pages...' });

    try {
      const zipBlob = await splitPdf(file.file);
      downloadPdf(zipBlob, `split-${file.name.replace('.pdf', '')}.zip`);
      setStatus({ isProcessing: false, message: 'Done!', success: true });
    } catch (error) {
      console.error(error);
      setStatus({ isProcessing: false, message: 'Error splitting file.', error: 'Failed' });
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Split PDF</h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          Separate one page or a whole set for easy conversion into independent PDF files.
        </p>
      </div>

      {!file ? (
        <FileUploader
          onFilesSelected={handleFileSelected}
          multiple={false}
          icon={<Scissors className="w-12 h-12 text-orange-400" />}
          title="Select PDF file"
          description="Drop your PDF here to split it"
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

           <div className="space-y-6">
             <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
               <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                 <FileText className="w-4 h-4" /> Extract All Pages
               </h4>
               <p className="text-sm text-slate-500 mb-4">
                 Every page of this PDF will be converted into a separate PDF file. 
                 The files will be downloaded as a ZIP archive.
               </p>
             </div>

             <Button 
               variant="primary" 
               size="lg" 
               className="w-full"
               onClick={handleSplit}
               isLoading={status.isProcessing}
             >
               {status.isProcessing ? 'Splitting...' : 'Split PDF'} <Download className="w-4 h-4 ml-2" />
             </Button>
           </div>
        </div>
      )}
    </div>
  );
};