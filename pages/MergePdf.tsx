import React, { useState, useCallback } from 'react';
import { Layout } from '../components/Layout';
import { FileUploader } from '../components/FileUploader';
import { Button } from '../components/Button';
import { PdfFile, ProcessingStatus } from '../types';
import { mergePdfs, downloadPdf, formatBytes } from '../services/pdfService';
import { FileText, X, ArrowUp, ArrowDown, Download, RefreshCw, Files } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export const MergePdf: React.FC = () => {
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>({
    isProcessing: false,
    message: '',
  });

  const handleFilesSelected = (selectedFiles: File[]) => {
    const newPdfFiles: PdfFile[] = selectedFiles.map(file => ({
      id: uuidv4(),
      file,
      name: file.name,
      size: file.size,
    }));
    setFiles(prev => [...prev, ...newPdfFiles]);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const moveFile = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === files.length - 1)
    ) {
      return;
    }

    const newFiles = [...files];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newFiles[index], newFiles[targetIndex]] = [newFiles[targetIndex], newFiles[index]];
    setFiles(newFiles);
  };

  const handleMerge = async () => {
    if (files.length < 2) return;

    setStatus({ isProcessing: true, message: 'Merging your PDFs...' });

    try {
      const mergedBytes = await mergePdfs(files);
      downloadPdf(mergedBytes, 'merged-document.pdf');
      setStatus({ isProcessing: false, message: 'Done! Download started.', success: true });
      setTimeout(() => setStatus({ isProcessing: false, message: '' }), 3000);
    } catch (error) {
      console.error(error);
      setStatus({ isProcessing: false, message: 'Error merging files.', error: 'Failed' });
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Merge PDF Files</h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          Combine PDFs in the order you want with the easiest PDF merger available.
        </p>
      </div>

      {files.length === 0 ? (
        <FileUploader
          onFilesSelected={handleFilesSelected}
          icon={<Files className="w-12 h-12 text-primary-400" />}
          title="Select PDF files"
          description="Drop your PDFs here or select them to begin merging"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <span className="font-semibold text-slate-700">{files.length} Files Selected</span>
                <button 
                  onClick={() => setFiles([])}
                  className="text-red-500 text-sm font-medium hover:text-red-600 transition-colors"
                >
                  Clear All
                </button>
              </div>
              
              <ul className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto no-scrollbar">
                {files.map((file, index) => (
                  <li key={file.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors group">
                    <div className="w-10 h-12 bg-red-100 rounded flex items-center justify-center shrink-0 border border-red-200">
                      <span className="font-bold text-red-500 text-xs">PDF</span>
                    </div>
                    
                    <div className="flex-grow min-w-0">
                      <p className="font-medium text-slate-800 truncate">{file.name}</p>
                      <p className="text-xs text-slate-400">{formatBytes(file.size)}</p>
                    </div>

                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => moveFile(index, 'up')}
                        disabled={index === 0}
                        className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button 
                        onClick={() => moveFile(index, 'down')}
                        disabled={index === files.length - 1}
                        className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        <ArrowDown size={16} />
                      </button>
                      <button 
                        onClick={() => removeFile(file.id)}
                        className="p-1.5 rounded-full hover:bg-red-100 text-slate-400 hover:text-red-500 ml-2"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              
              <div className="p-4 border-t border-slate-100 bg-slate-50">
                 <div className="relative">
                   <input
                    type="file"
                    multiple
                    accept=".pdf"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => {
                      if(e.target.files) handleFilesSelected(Array.from(e.target.files))
                    }}
                   />
                   <Button variant="secondary" size="sm" className="w-full">
                     + Add more files
                   </Button>
                 </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-24">
              <h3 className="font-bold text-slate-900 mb-4 text-lg">Summary</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">File count:</span>
                  <span className="font-medium text-slate-800">{files.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Total size:</span>
                  <span className="font-medium text-slate-800">
                    {formatBytes(files.reduce((acc, curr) => acc + curr.size, 0))}
                  </span>
                </div>
              </div>

              <Button 
                variant="primary" 
                size="lg" 
                className="w-full" 
                onClick={handleMerge}
                disabled={files.length < 2}
                isLoading={status.isProcessing}
              >
                {status.isProcessing ? 'Merging...' : 'Merge PDF'}
              </Button>

              {files.length < 2 && (
                <p className="text-xs text-orange-500 mt-3 text-center bg-orange-50 p-2 rounded">
                  Please select at least 2 PDF files to merge.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};