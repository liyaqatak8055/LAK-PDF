import React, { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { Button } from '../components/Button';
import { PdfFile, ProcessingStatus } from '../types';
import { unlockPdf, downloadPdf, formatBytes } from '../services/pdfService';
import { Lock, Unlock, X, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export const UnlockPdf: React.FC = () => {
  const [file, setFile] = useState<PdfFile | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<ProcessingStatus>({ isProcessing: false, message: '' });

  const handleFileSelected = (selectedFiles: File[]) => {
    if (selectedFiles.length > 0) {
      setFile({
        id: uuidv4(),
        file: selectedFiles[0],
        name: selectedFiles[0].name,
        size: selectedFiles[0].size,
      });
      setStatus({ isProcessing: false, message: '' });
    }
  };

  const handleUnlock = async () => {
    if (!file || !password) return;
    setStatus({ isProcessing: true, message: 'Unlocking PDF...' });

    try {
      const unlockedBytes = await unlockPdf(file.file, password);
      downloadPdf(unlockedBytes, `unlocked-${file.name}`);
      setStatus({ isProcessing: false, message: 'Done!', success: true });
    } catch (error) {
      console.error(error);
      setStatus({ isProcessing: false, message: 'Incorrect password or file is corrupt.', error: 'Failed' });
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Unlock PDF</h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          Remove password security from PDF files, giving you the freedom to use your data.
        </p>
      </div>

      {!file ? (
        <FileUploader
          onFilesSelected={handleFileSelected}
          multiple={false}
          icon={<Unlock className="w-12 h-12 text-slate-500" />}
          title="Select PDF file"
          description="Drop your protected PDF here"
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

           {status.error && (
             <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex gap-3 text-red-700">
               <AlertTriangle className="w-5 h-5 shrink-0" />
               <p className="text-sm">Failed to unlock. Please ensure the password is correct.</p>
             </div>
           )}

           <div className="mb-8">
             <label className="block text-sm font-medium text-slate-700 mb-2">Enter Password</label>
             <div className="relative">
               <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
               <input
                 type={showPassword ? "text" : "password"}
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 className="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition-all"
                 placeholder="Enter the PDF password"
               />
               <button 
                 type="button"
                 onClick={() => setShowPassword(!showPassword)}
                 className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
               >
                 {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
               </button>
             </div>
           </div>

           <Button 
             variant="primary" 
             size="lg" 
             className="w-full bg-slate-800 hover:bg-slate-900 focus:ring-slate-400"
             onClick={handleUnlock}
             disabled={!password}
             isLoading={status.isProcessing}
           >
             {status.isProcessing ? 'Unlocking...' : 'Unlock PDF'}
           </Button>
        </div>
      )}
    </div>
  );
};