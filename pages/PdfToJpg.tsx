import React, { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { Button } from '../components/Button';
import { PdfFile, ProcessingStatus } from '../types';
import { convertPdfToImages, downloadPdf, formatBytes } from '../services/pdfService';
import { FileImage, X, Image as ImageIcon, ArrowRight } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export const PdfToJpg: React.FC = () => {
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

  const handleConvert = async () => {
    if (!file) return;
    setStatus({ isProcessing: true, message: 'Converting PDF pages to Images...' });

    try {
      const zipBlob = await convertPdfToImages(file.file);
      downloadPdf(zipBlob, `images-${file.name.replace('.pdf', '')}.zip`);
      setStatus({ isProcessing: false, message: 'Done!', success: true });
    } catch (error) {
      console.error(error);
      setStatus({ isProcessing: false, message: 'Error converting file.', error: 'Failed' });
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">PDF to JPG</h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          Convert each page of your PDF into a high-quality JPG image.
        </p>
      </div>

      {!file ? (
        <FileUploader
          onFilesSelected={handleFileSelected}
          multiple={false}
          icon={<FileImage className="w-12 h-12 text-yellow-500" />}
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

           <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-6 mb-8 flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-yellow-500 shrink-0 shadow-sm">
                <ImageIcon />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">High Quality Extraction</h4>
                <p className="text-sm text-slate-600">Every page will be converted to a separate JPG image and downloaded as a ZIP file.</p>
              </div>
           </div>

           <Button 
             variant="primary" 
             size="lg" 
             className="w-full bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-400 shadow-yellow-500/30"
             onClick={handleConvert}
             isLoading={status.isProcessing}
           >
             {status.isProcessing ? 'Converting...' : 'Convert to JPG'}
           </Button>
        </div>
      )}
    </div>
  );
};