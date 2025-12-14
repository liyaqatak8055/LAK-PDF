import React, { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { Button } from '../components/Button';
import { PdfFile, ProcessingStatus } from '../types';
import { protectPdf, downloadPdf, formatBytes } from '../services/pdfService';
import { Shield, Lock, X, Eye, EyeOff } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export const ProtectPdf: React.FC = () => {
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
    }
  };

  const handleProtect = async () => {
    if (!file || !password) return;
    setStatus({ isProcessing: true, message: 'Encrypting PDF...' });

    try {
      const protectedBytes = await protectPdf(file.file, password);
      downloadPdf(protectedBytes, `protected-${file.name}`);
      setStatus({ isProcessing: false, message: 'Done!', success: true });
    } catch (error) {
      console.error(error);
      setStatus({ isProcessing: false, message: 'Error protecting file.', error: 'Failed' });
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Protect PDF</h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          Encrypt your PDF file with a password to prevent unauthorized access.
        </p>
      </div>

      {!file ? (
        <FileUploader
          onFilesSelected={handleFileSelected}
          multiple={false}
          icon={<Shield className="w-12 h-12 text-indigo-500" />}
          title="Select PDF file"
          description="Drop your PDF here to protect it"
        />
      ) : (
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
           <div className="flex items-start justify-between mb-8 pb-6 border-b border-slate-100">
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-500 font-bold shrink-0">
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

           <div className="mb-8">
             <label className="block text-sm font-medium text-slate-700 mb-2">Set a Password</label>
             <div className="relative">
               <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
               <input
                 type={showPassword ? "text" : "password"}
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 className="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium"
                 placeholder="Enter a strong password"
               />
               <button 
                 type="button"
                 onClick={() => setShowPassword(!showPassword)}
                 className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
               >
                 {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
               </button>
             </div>
             <p className="text-xs text-slate-500 mt-2">
               Note: Use a password you can remember. If you forget it, the file cannot be recovered.
             </p>
           </div>

           <Button 
             variant="primary" 
             size="lg" 
             className="w-full bg-indigo-500 hover:bg-indigo-600 focus:ring-indigo-400 shadow-indigo-500/30"
             onClick={handleProtect}
             disabled={!password}
             isLoading={status.isProcessing}
           >
             {status.isProcessing ? 'Encrypting...' : 'Protect PDF'}
           </Button>
        </div>
      )}
    </div>
  );
};