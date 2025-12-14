import React, { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { Button } from '../components/Button';
import { convertExcelToPdf } from '../services/officeService';
import { downloadPdf, formatBytes } from '../services/pdfService';
import { FileSpreadsheet, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export const ExcelToPdf: React.FC = () => {
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
      const blob = await convertExcelToPdf(file.file);
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
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Excel to PDF</h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          Convert Excel spreadsheets (XLS, XLSX) to PDF documents.
        </p>
      </div>

      {!file ? (
        <FileUploader
          onFilesSelected={handleFileSelected}
          multiple={false}
          accept=".xlsx,.xls,.csv"
          icon={<FileSpreadsheet className="w-12 h-12 text-green-500" />}
          title="Select Excel file"
          description="Drop your Spreadsheet here"
        />
      ) : (
        <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
           <div className="flex items-center justify-between mb-8">
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-500 font-bold shrink-0">
                 XLS
               </div>
               <div>
                 <h3 className="font-semibold text-slate-900 truncate max-w-[200px]">{file.name}</h3>
                 <p className="text-sm text-slate-500">{formatBytes(file.size)}</p>
               </div>
             </div>
             <button onClick={() => setFile(null)} className="text-slate-400 hover:text-red-500"><X /></button>
           </div>

           <Button 
             variant="primary" 
             size="lg" 
             className="w-full bg-green-500 hover:bg-green-600"
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