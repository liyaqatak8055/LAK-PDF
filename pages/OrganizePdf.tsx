import React, { useState, useEffect } from 'react';
import { FileUploader } from '../components/FileUploader';
import { Button } from '../components/Button';
import { PdfFile, ProcessingStatus } from '../types';
import { organizePdf, downloadPdf, formatBytes, pdfjs } from '../services/pdfService';
import { Files, X, ArrowLeft, ArrowRight, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export const OrganizePdf: React.FC = () => {
  const [file, setFile] = useState<PdfFile | null>(null);
  const [pages, setPages] = useState<{index: number, img: string}[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>({ isProcessing: false, message: '' });

  const handleFileSelected = async (selectedFiles: File[]) => {
    if (selectedFiles.length > 0) {
      const f = selectedFiles[0];
      setFile({
        id: uuidv4(),
        file: f,
        name: f.name,
        size: f.size,
      });

      // Generate thumbnails
      setStatus({ isProcessing: true, message: 'Loading pages...' });
      try {
        const arrayBuffer = await f.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        const newPages = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 0.5 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          if (context) {
            await page.render({ canvasContext: context, viewport }).promise;
            newPages.push({
              index: i - 1, // 0-based index for pdf-lib
              img: canvas.toDataURL()
            });
          }
        }
        setPages(newPages);
        setStatus({ isProcessing: false, message: '' });
      } catch (e) {
        console.error(e);
        setStatus({ isProcessing: false, message: 'Error loading PDF' });
      }
    }
  };

  const movePage = (currentIndex: number, direction: 'left' | 'right') => {
    const newPages = [...pages];
    const targetIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
    
    if (targetIndex >= 0 && targetIndex < newPages.length) {
      [newPages[currentIndex], newPages[targetIndex]] = [newPages[targetIndex], newPages[currentIndex]];
      setPages(newPages);
    }
  };

  const removePage = (index: number) => {
    const newPages = [...pages];
    newPages.splice(index, 1);
    setPages(newPages);
  };

  const handleSave = async () => {
    if (!file || pages.length === 0) return;
    setStatus({ isProcessing: true, message: 'Saving PDF...' });

    try {
      const indices = pages.map(p => p.index);
      const pdfBytes = await organizePdf(file.file, indices);
      downloadPdf(pdfBytes, `organized-${file.name}`);
      setStatus({ isProcessing: false, message: 'Done!', success: true });
    } catch (error) {
      console.error(error);
      setStatus({ isProcessing: false, message: 'Error saving file.', error: 'Failed' });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Organize PDF</h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          Sort, reorder or delete pages from your PDF document.
        </p>
      </div>

      {!file ? (
        <FileUploader
          onFilesSelected={handleFileSelected}
          multiple={false}
          icon={<Files className="w-12 h-12 text-orange-500" />}
          title="Select PDF file"
          description="Drop your PDF here"
        />
      ) : (
        <div>
          <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm sticky top-20 z-10">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-red-500 font-bold shrink-0">
                 PDF
               </div>
               <div>
                 <h3 className="font-semibold text-slate-900 truncate max-w-[200px]">{file.name}</h3>
                 <p className="text-xs text-slate-500">{pages.length} Pages</p>
               </div>
             </div>
             <div className="flex gap-2">
               <Button variant="ghost" onClick={() => setFile(null)}>Cancel</Button>
               <Button variant="primary" onClick={handleSave} isLoading={status.isProcessing}>Save PDF</Button>
             </div>
          </div>

          {status.isProcessing && pages.length === 0 ? (
            <div className="text-center py-20 text-slate-400">Loading pages...</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {pages.map((page, i) => (
                <div key={i} className="group relative bg-white p-2 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all">
                  <div className="relative aspect-[3/4] bg-slate-100 mb-2 overflow-hidden border border-slate-100">
                    <img src={page.img} alt={`Page ${i+1}`} className="w-full h-full object-contain" />
                    <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1.5 rounded">
                      {i + 1}
                    </div>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                       <button 
                         onClick={() => removePage(i)}
                         className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-transform hover:scale-110"
                         title="Delete Page"
                       >
                         <Trash2 size={16} />
                       </button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between mt-1">
                    <button 
                      onClick={() => movePage(i, 'left')} 
                      disabled={i === 0}
                      className="p-1 rounded hover:bg-slate-100 text-slate-400 disabled:opacity-30"
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <button 
                      onClick={() => movePage(i, 'right')} 
                      disabled={i === pages.length - 1}
                      className="p-1 rounded hover:bg-slate-100 text-slate-400 disabled:opacity-30"
                    >
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};