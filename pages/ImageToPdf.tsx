import React, { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { Button } from '../components/Button';
import { PdfFile, ProcessingStatus } from '../types';
import { imagesToPdf, downloadPdf, formatBytes } from '../services/pdfService';
import { Image as ImageIcon, X, ArrowUp, ArrowDown } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export const ImageToPdf: React.FC = () => {
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>({
    isProcessing: false,
    message: '',
  });

  const handleFilesSelected = (selectedFiles: File[]) => {
    // Create preview URLs
    const newFiles = selectedFiles.map(file => ({
      id: uuidv4(),
      file,
      name: file.name,
      size: file.size,
      previewUrl: URL.createObjectURL(file)
    }));
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove?.previewUrl) {
        URL.revokeObjectURL(fileToRemove.previewUrl);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const handleConvert = async () => {
    if (files.length === 0) return;

    setStatus({ isProcessing: true, message: 'Converting images...' });

    try {
      const pdfBytes = await imagesToPdf(files);
      downloadPdf(pdfBytes, 'images.pdf');
      setStatus({ isProcessing: false, message: 'Done!', success: true });
    } catch (error) {
      console.error(error);
      setStatus({ isProcessing: false, message: 'Error converting files.', error: 'Failed' });
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">JPG to PDF</h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          Convert your images to PDF. Adjust the order and download your file in seconds.
        </p>
      </div>

      {files.length === 0 ? (
        <FileUploader
          onFilesSelected={handleFilesSelected}
          accept="image/png, image/jpeg, image/jpg"
          icon={<ImageIcon className="w-12 h-12 text-blue-400" />}
          title="Select JPG images"
          description="Drag & drop images here"
        />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
            {files.map((file) => (
              <div key={file.id} className="relative group bg-white p-2 rounded-xl shadow-sm border border-slate-200">
                <div className="aspect-[3/4] overflow-hidden rounded-lg bg-slate-100 relative">
                  <img 
                    src={file.previewUrl} 
                    alt={file.name} 
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={() => removeFile(file.id)}
                      className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transform hover:scale-110 transition-all"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
                <div className="mt-2 px-1">
                  <p className="text-xs font-medium text-slate-700 truncate">{file.name}</p>
                  <p className="text-[10px] text-slate-400">{formatBytes(file.size)}</p>
                </div>
              </div>
            ))}
            
            <div className="flex flex-col items-center justify-center aspect-[3/4] border-2 border-dashed border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer relative">
               <input
                type="file"
                multiple
                accept="image/png, image/jpeg"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={(e) => {
                  if(e.target.files) handleFilesSelected(Array.from(e.target.files))
                }}
               />
               <div className="bg-white p-3 rounded-full shadow-sm mb-2">
                 <ImageIcon className="text-slate-400 w-6 h-6" />
               </div>
               <span className="text-sm font-semibold text-slate-500">Add more</span>
            </div>
          </div>

          <div className="flex justify-center">
            <Button 
              size="lg" 
              className="w-full md:w-auto md:min-w-[200px]"
              onClick={handleConvert}
              isLoading={status.isProcessing}
            >
              Convert {files.length} images to PDF
            </Button>
          </div>
        </>
      )}
    </div>
  );
};