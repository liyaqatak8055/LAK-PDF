import React, { useState } from 'react';
import { Button } from '../components/Button';
import { PdfFile, ProcessingStatus } from '../types';
import { imagesToPdf, downloadPdf } from '../services/pdfService';
import { Scan, Camera, Trash2, ArrowRight, Download, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export const ScanPdf: React.FC = () => {
  const [scans, setScans] = useState<PdfFile[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>({ isProcessing: false, message: '' });

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map((file: File, index) => ({
        id: uuidv4(),
        file,
        name: `Scan ${scans.length + index + 1}`,
        size: file.size,
        previewUrl: URL.createObjectURL(file)
      }));
      setScans(prev => [...prev, ...newFiles]);
      // Reset input
      e.target.value = '';
    }
  };

  const removeScan = (id: string) => {
    setScans(prev => prev.filter(s => s.id !== id));
  };

  const handleSavePdf = async () => {
    if (scans.length === 0) return;
    setStatus({ isProcessing: true, message: 'Generating PDF...' });
    try {
      const pdfBytes = await imagesToPdf(scans);
      downloadPdf(pdfBytes, 'scanned-document.pdf');
      setStatus({ isProcessing: false, message: '', success: true });
    } catch (e) {
      setStatus({ isProcessing: false, message: 'Failed to create PDF', error: 'Error' });
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Scan to PDF</h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          Use your device camera to scan documents and convert them to PDF instantly.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
        {/* Camera Trigger */}
        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 mb-8">
          <div className="w-16 h-16 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mb-4">
            <Camera className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-slate-900 mb-2">Take a Photo</h3>
          <p className="text-sm text-slate-500 mb-6 text-center">Tap the button below to open your camera</p>
          
          <div className="relative">
            <Button variant="primary" size="lg" className="pl-10 pr-10">
              <Camera className="w-5 h-5 mr-2" /> Start Camera
            </Button>
            <input 
              type="file" 
              accept="image/*" 
              capture="environment"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleCapture}
            />
          </div>
        </div>

        {/* Scan List */}
        {scans.length > 0 && (
          <div className="space-y-6">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Scan className="w-4 h-4" /> Scanned Pages ({scans.length})
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {scans.map((scan, idx) => (
                <div key={scan.id} className="relative group aspect-[3/4] bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                  <img src={scan.previewUrl} alt="Scan" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center">
                    Page {idx + 1}
                  </div>
                  <button 
                    onClick={() => removeScan(scan.id)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <Button 
              variant="primary" 
              size="lg" 
              className="w-full bg-slate-800"
              onClick={handleSavePdf}
              isLoading={status.isProcessing}
            >
              <Download className="w-5 h-5 mr-2" /> Download PDF
            </Button>
          </div>
        )}

        {scans.length === 0 && (
          <div className="text-center text-slate-400 text-sm italic">
            No scans yet. Use the camera button above to start.
          </div>
        )}
      </div>
    </div>
  );
};