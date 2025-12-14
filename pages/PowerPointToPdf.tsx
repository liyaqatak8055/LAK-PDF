import React, { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { Button } from '../components/Button';
import { convertPowerPointToPdf } from '../services/officeService';
import { downloadPdf, formatBytes } from '../services/pdfService';
import { Presentation, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export const PowerPointToPdf: React.FC = () => {
  const [file, setFile] = useState<{file: File, id: string, name: string, size: number} | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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
    setIsProcessing(true);
    try {
      const blob = await convertPowerPointToPdf(file.file);
      downloadPdf(blob, `${file.name.split('.')[0]}.pdf`);
    } catch (e) {
      console.error(e);
      alert('Error converting file');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">PowerPoint to PDF</h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          Convert PowerPoint presentations (PPT, PPTX) to PDF.
        </p>
      </div>

      {!file ? (
        <FileUploader
          onFilesSelected={handleFileSelected}
          multiple={false}
          accept=".pptx,.ppt"
          icon={<Presentation className="w-12 h-12 text-orange-500" />}
          title="Select PowerPoint file"
          description="Drop your Presentation here"
        />
      ) : (
        <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
           <div className="flex items-center justify-between mb-8">
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-orange-500 font-bold shrink-0">
                 PPT
               </div>
               <div>
                 <h3 className="font-semibold text-slate-900 truncate max-w-[200px]">{file.name}</h3>
                 <p className="text-sm text-slate-500">{formatBytes(file.size)}</p>
               </div>
             </div>
             <button onClick={() => setFile(null)} className="text-slate-400 hover:text-red-500"><X /></button>
           </div>
           
           <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 mb-6 text-xs text-orange-800">
             Note: Complex slide animations and transitions cannot be preserved. Static content will be converted.
           </div>

           <Button 
             variant="primary" 
             size="lg" 
             className="w-full bg-orange-500 hover:bg-orange-600"
             onClick={handleConvert}
             isLoading={isProcessing}
           >
             {isProcessing ? 'Converting...' : 'Convert to PDF'}
           </Button>
        </div>
      )}
    </div>
  );
};