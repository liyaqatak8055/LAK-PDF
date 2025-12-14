import React, { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { Button } from '../components/Button';
import { PdfFile, ProcessingStatus } from '../types';
import { convertPdfToImages, downloadPdf, formatBytes } from '../services/pdfService';
import { FileText, Image as ImageIcon, X, ArrowRight, Download } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export const ConvertPdf: React.FC = () => {
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

  const handleConvertToImages = async () => {
    if (!file) return;
    setStatus({ isProcessing: true, message: 'Converting PDF to Images...' });

    try {
      const zipBlob = await convertPdfToImages(file.file);
      downloadPdf(zipBlob, `converted-images-${file.name.replace('.pdf', '')}.zip`);
      setStatus({ isProcessing: false, message: 'Done!', success: true });
    } catch (error) {
      console.error(error);
      setStatus({ isProcessing: false, message: 'Error converting file.', error: 'Failed' });
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Convert PDF</h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          Convert your PDF files to other formats.
        </p>
      </div>

      {!file ? (
        <FileUploader
          onFilesSelected={handleFileSelected}
          multiple={false}
          icon={<FileText className="w-12 h-12 text-pink-400" />}
          title="Select PDF file"
          description="Drop your PDF here to convert it"
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

           <div className="space-y-4">
              <h3 className="font-bold text-slate-900">Select Output Format</h3>
              
              <button 
                className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-pink-300 hover:bg-pink-50 transition-all group"
                onClick={handleConvertToImages}
                disabled={status.isProcessing}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white border border-slate-100 rounded-lg flex items-center justify-center text-pink-500">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="block font-semibold text-slate-900">PDF to JPG</span>
                    <span className="text-xs text-slate-500">Convert pages to images</span>
                  </div>
                </div>
                <ArrowRight className="text-slate-300 group-hover:text-pink-500 transition-colors" />
              </button>

              <button 
                className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 opacity-60 cursor-not-allowed"
                disabled
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="block font-semibold text-slate-900">PDF to Word</span>
                    <span className="text-xs text-slate-500">Coming soon</span>
                  </div>
                </div>
              </button>

              {status.isProcessing && (
                <div className="text-center py-4 text-pink-500 font-medium animate-pulse">
                  Converting... Please wait
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};