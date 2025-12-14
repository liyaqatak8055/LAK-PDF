import React, { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { Button } from '../components/Button';
import { PdfFile, ProcessingStatus } from '../types';
import { compressPdf, downloadPdf, formatBytes } from '../services/pdfService';
import { Minimize2, CheckCircle, X, Gauge, ShieldCheck, Zap } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export const CompressPdf: React.FC = () => {
  const [file, setFile] = useState<PdfFile | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>({ isProcessing: false, message: '' });
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
  const [compressionLevel, setCompressionLevel] = useState<number>(0.7); // 0.7 = Recommended

  const handleFileSelected = (selectedFiles: File[]) => {
    if (selectedFiles.length > 0) {
      setFile({
        id: uuidv4(),
        file: selectedFiles[0],
        name: selectedFiles[0].name,
        size: selectedFiles[0].size,
      });
      setCompressedSize(null);
    }
  };

  const handleCompress = async () => {
    if (!file) return;
    setStatus({ isProcessing: true, message: 'Compressing PDF...' });

    // Tiny delay to let UI update
    setTimeout(async () => {
        try {
            const compressedBytes = await compressPdf(file.file, compressionLevel);
            const newSize = compressedBytes.byteLength;
            setCompressedSize(newSize);
            
            downloadPdf(compressedBytes, `compressed-${file.name}`);
            setStatus({ isProcessing: false, message: 'Done!', success: true });
          } catch (error) {
            console.error(error);
            setStatus({ isProcessing: false, message: 'Error compressing file.', error: 'Failed' });
          }
    }, 100);
  };

  const options = [
    {
      level: 0.4,
      title: "Extreme Compression",
      desc: "Less quality, high compression.",
      icon: <Zap className="w-5 h-5 text-orange-500" />,
      color: "border-orange-200 bg-orange-50 hover:border-orange-300"
    },
    {
      level: 0.7,
      title: "Recommended Compression",
      desc: "Good quality, good compression.",
      icon: <Gauge className="w-5 h-5 text-green-500" />,
      color: "border-green-200 bg-green-50 hover:border-green-300"
    },
    {
      level: 1.0,
      title: "Less Compression",
      desc: "High quality, less compression.",
      icon: <ShieldCheck className="w-5 h-5 text-blue-500" />,
      color: "border-blue-200 bg-blue-50 hover:border-blue-300"
    }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Compress PDF</h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          Reduce file size while optimizing for maximal PDF quality.
        </p>
      </div>

      {!file ? (
        <FileUploader
          onFilesSelected={handleFileSelected}
          multiple={false}
          icon={<Minimize2 className="w-12 h-12 text-green-400" />}
          title="Select PDF file"
          description="Drop your PDF here to compress it"
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

           {compressedSize !== null ? (
             <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Compression Complete!</h3>
                <p className="text-slate-500 mb-6">
                  Your PDF is now <span className="font-bold text-slate-800">{formatBytes(compressedSize)}</span> 
                  {compressedSize < file.size ? 
                    <span className="text-green-500 ml-1">({Math.round((1 - compressedSize/file.size) * 100)}% smaller)</span> 
                    : <span className="text-slate-400 ml-1">(No reduction possible)</span>
                  }
                </p>
                <Button onClick={() => { setFile(null); setCompressedSize(null); }} variant="secondary">
                  Compress Another File
                </Button>
             </div>
           ) : (
             <div className="space-y-6">
               <h4 className="font-bold text-slate-900">Compression Level</h4>
                <div className="grid grid-cols-1 gap-3">
                  {options.map((opt) => (
                    <button
                      key={opt.level}
                      onClick={() => setCompressionLevel(opt.level)}
                      className={`relative text-left p-4 rounded-xl border-2 transition-all flex items-start gap-4 ${compressionLevel === opt.level ? opt.color.replace('border-', 'border-opacity-100 border-') + ' ring-1 ring-offset-0 ring-current' : 'border-slate-100 bg-white hover:bg-slate-50'}`}
                      style={{ borderColor: compressionLevel === opt.level ? 'currentColor' : '' }}
                    >
                      <div className={`p-2 rounded-lg bg-white shadow-sm ${compressionLevel === opt.level ? 'opacity-100' : 'opacity-70'}`}>
                        {opt.icon}
                      </div>
                      <div className="flex-grow">
                        <h5 className={`font-bold ${compressionLevel === opt.level ? 'text-slate-900' : 'text-slate-700'}`}>{opt.title}</h5>
                        <p className="text-sm text-slate-500 mt-0.5">{opt.desc}</p>
                      </div>
                      {compressionLevel === opt.level && (
                        <div className="absolute top-4 right-4 text-green-500">
                          <CheckCircle className="w-5 h-5 fill-current text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

               <Button 
                 variant="primary" 
                 size="lg" 
                 className="w-full bg-green-500 hover:bg-green-600 focus:ring-green-400 shadow-green-500/30"
                 onClick={handleCompress}
                 isLoading={status.isProcessing}
               >
                 {status.isProcessing ? 'Compressing...' : 'Compress PDF'}
               </Button>
             </div>
           )}
        </div>
      )}
    </div>
  );
};