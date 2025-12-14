import React, { useState, useEffect, useRef } from 'react';
import { FileUploader } from '../components/FileUploader';
import { Button } from '../components/Button';
import { Scan, FileText, Download, Copy, RefreshCw, Loader2, AlertCircle, CheckCircle, FileType } from 'lucide-react';
// @ts-ignore
import Tesseract from 'tesseract.js';
import { pdfjs, formatBytes } from '../services/pdfService';
import { v4 as uuidv4 } from 'uuid';
// @ts-ignore
import { jsPDF } from 'jspdf';
// @ts-ignore
import { Document, Packer, Paragraph, TextRun } from 'docx';

export const OcrPdf: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'initializing' | 'processing' | 'done' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const workerRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setStatus('idle');
      setText('');
      setProgress(0);
      setStatusMessage('');
    }
  };

  const processFile = async () => {
    if (!file) return;
    setStatus('initializing');
    setText('');
    setProgress(0);
    setStatusMessage('Initializing OCR engine... (This may take a moment)');

    try {
      const worker = await Tesseract.createWorker('eng', 1, {
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
            setStatusMessage(`Recognizing text... ${Math.round(m.progress * 100)}%`);
          } else if (m.status === 'loading tesseract core') {
            setStatusMessage('Loading OCR Core...');
          } else if (m.status === 'initializing api') {
             setStatusMessage('Initializing API...');
          } else {
            setStatusMessage(m.status);
          }
        }
      });
      
      workerRef.current = worker;
      
      await worker.setParameters({
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
      });

      setStatus('processing');
      let extractedText = '';

      if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        const totalPages = pdf.numPages;
        
        for (let i = 1; i <= totalPages; i++) {
           setStatusMessage(`Scanning Page ${i} of ${totalPages}...`);
           
           const page = await pdf.getPage(i);
           const viewport = page.getViewport({ scale: 2.0 }); 
           
           const canvas = document.createElement('canvas');
           canvas.width = viewport.width;
           canvas.height = viewport.height;
           const ctx = canvas.getContext('2d');
           
           if (ctx) {
             ctx.fillStyle = '#FFFFFF';
             ctx.fillRect(0, 0, canvas.width, canvas.height);
             
             await page.render({ canvasContext: ctx, viewport }).promise;
             
             const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
             if (blob) {
                setProgress(0);
                const { data: { text } } = await worker.recognize(blob);
                extractedText += text + "\n\n";
             }
           }
        }
      } else {
        setStatusMessage('Scanning image...');
        const imageUrl = URL.createObjectURL(file);
        const { data: { text } } = await worker.recognize(imageUrl);
        extractedText = text;
        URL.revokeObjectURL(imageUrl);
      }

      setText(extractedText);
      setStatus('done');
      setStatusMessage('OCR Complete!');
      
      await worker.terminate();
      workerRef.current = null;
      
    } catch (e: any) {
      console.error(e);
      setStatusMessage(`Error: ${e.message || "Failed to process"}`);
      setStatus('error');
      if (workerRef.current) {
        await workerRef.current.terminate();
        workerRef.current = null;
      }
    }
  };

  const copyText = () => {
    navigator.clipboard.writeText(text);
  };

  const downloadAsTxt = () => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file?.name.split('.')[0] || 'document'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAsPdf = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxLineWidth = pageWidth - margin * 2;
    const lineHeight = 7;
    
    // Split text into lines that fit
    const lines = doc.splitTextToSize(text, maxLineWidth);
    
    let cursorY = margin;
    
    lines.forEach((line: string) => {
      if (cursorY + lineHeight > pageHeight - margin) {
        doc.addPage();
        cursorY = margin;
      }
      doc.text(line, margin, cursorY);
      cursorY += lineHeight;
    });
    
    doc.save(`${file?.name.split('.')[0] || 'document'}-clean.pdf`);
  };

  const downloadAsWord = async () => {
    const doc = new Document({
      sections: [{
        properties: {},
        children: text.split('\n').map(line => new Paragraph({
          children: [new TextRun(line)],
        })),
      }],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file?.name.split('.')[0] || 'document'}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setFile(null);
    setText('');
    setStatus('idle');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">OCR PDF Scanner</h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          Convert scanned documents into clean, editable text.
        </p>
      </div>

      {!file ? (
        <FileUploader
          onFilesSelected={handleFileSelected}
          multiple={false}
          accept=".pdf, .png, .jpg, .jpeg, .bmp"
          icon={<Scan className="w-12 h-12 text-cyan-500" />}
          title="Select Document"
          description="Drop PDF or Image to scan"
        />
      ) : (
        <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in slide-in-from-bottom-4">
           {/* Left Column: Controls & Status */}
           <div className="w-full lg:w-1/3 space-y-6">
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
               <div className="flex items-center gap-4 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-12 h-12 bg-white border border-slate-200 text-cyan-600 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                    {file.type.includes('pdf') ? <FileText className="w-6 h-6" /> : <Scan className="w-6 h-6" />}
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="font-bold text-slate-900 truncate" title={file.name}>{file.name}</h3>
                    <p className="text-xs text-slate-500">{formatBytes(file.size)}</p>
                  </div>
                  <button onClick={reset} className="ml-auto text-slate-400 hover:text-red-500">
                    <RefreshCw className="w-5 h-5" />
                  </button>
               </div>

               {status === 'idle' && (
                  <Button onClick={processFile} className="w-full bg-cyan-600 hover:bg-cyan-700 shadow-cyan-500/20" size="lg">
                    <Scan className="w-5 h-5 mr-2" /> Start Processing
                  </Button>
               )}

               {(status === 'initializing' || status === 'processing') && (
                 <div className="space-y-6 py-4">
                   <div className="flex flex-col items-center justify-center text-center">
                      <Loader2 className="w-10 h-10 text-cyan-500 animate-spin mb-4" />
                      <h3 className="font-bold text-slate-800 text-lg mb-1">Scanning...</h3>
                      <p className="text-sm text-slate-500">{statusMessage}</p>
                   </div>
                   
                   <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                     <div 
                       className="bg-cyan-500 h-full rounded-full transition-all duration-300 ease-out relative overflow-hidden" 
                       style={{ width: `${Math.max(5, progress)}%` }}
                     >
                       <div className="absolute inset-0 bg-white/30 w-full h-full animate-[shimmer_2s_infinite]"></div>
                     </div>
                   </div>
                 </div>
               )}

               {status === 'error' && (
                 <div className="bg-red-50 p-6 rounded-xl border border-red-100 text-center">
                   <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                   <h3 className="font-bold text-red-700 mb-2">Scan Failed</h3>
                   <p className="text-sm text-red-600 mb-4">{statusMessage}</p>
                   <Button onClick={reset} variant="secondary" className="w-full">Try Again</Button>
                 </div>
               )}

               {status === 'done' && (
                 <div className="bg-green-50 p-6 rounded-xl border border-green-100 text-center">
                   <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
                   <h3 className="font-bold text-green-700 mb-2">Success!</h3>
                   <p className="text-sm text-green-600 mb-4">Document converted successfully.</p>
                   <div className="flex flex-col gap-2">
                     <Button onClick={downloadAsPdf} variant="primary" className="bg-red-600 hover:bg-red-700 w-full">
                       <Download className="w-4 h-4 mr-2" /> Download as PDF
                     </Button>
                     <Button onClick={downloadAsWord} variant="primary" className="bg-blue-600 hover:bg-blue-700 w-full">
                       <FileType className="w-4 h-4 mr-2" /> Download as Word
                     </Button>
                     <Button onClick={downloadAsTxt} variant="secondary" className="w-full">
                       <FileText className="w-4 h-4 mr-2" /> Download Text
                     </Button>
                   </div>
                 </div>
               )}
             </div>
           </div>

           {/* Right Column: MS Word-style Editor */}
           <div className="w-full lg:w-2/3 bg-slate-100 rounded-2xl border border-slate-200 p-8 flex flex-col items-center min-h-[600px] shadow-inner overflow-auto">
              <div className="w-full max-w-[210mm] bg-white shadow-xl min-h-[297mm] p-[25mm] relative">
                {status !== 'done' && !text ? (
                   <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 pointer-events-none">
                     <Scan className="w-20 h-20 mb-4 opacity-20" />
                     <p className="text-lg font-medium opacity-50">Document Preview</p>
                   </div>
                ) : (
                  <textarea 
                    ref={textareaRef}
                    className="w-full h-full bg-transparent text-slate-900 font-serif text-base leading-relaxed resize-none focus:outline-none"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Extracted text will appear here..."
                    spellCheck={false}
                    style={{ minHeight: '800px' }}
                  />
                )}
              </div>
              
              {status === 'done' && (
                <div className="mt-4 flex gap-2 text-sm text-slate-500">
                  <span>{text.length} characters</span>
                  <span>•</span>
                  <span>Editable Document</span>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};