import React, { useRef, useState } from 'react';
import { Upload, FileType, AlertCircle } from 'lucide-react';
import { Button } from './Button';

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFilesSelected,
  accept = ".pdf",
  multiple = true,
  title = "Choose PDF files",
  description = "or drop PDFs here",
  icon
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateFile = (file: File): boolean => {
    if (!accept || accept === '*') return true;
    const acceptedTypes = accept.split(',').map(t => t.trim().toLowerCase());
    const fileName = file.name.toLowerCase();
    const fileType = file.type.toLowerCase();
    
    return acceptedTypes.some(type => {
      if (type.startsWith('.')) {
        return fileName.endsWith(type);
      }
      if (type.endsWith('/*')) {
        const baseType = type.replace('/*', '');
        return fileType.startsWith(baseType);
      }
      return fileType === type;
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      
      // Filter files
      const validFiles = droppedFiles.filter(validateFile);

      if (validFiles.length === 0) {
        setError(`Invalid file type. Please upload ${accept} files.`);
        return;
      }

      if (validFiles.length < droppedFiles.length) {
        // Some were invalid, but we proceed with valid ones
        // Optional: Notify user
      }

      if (!multiple && validFiles.length > 1) {
        onFilesSelected([validFiles[0]]);
      } else {
        onFilesSelected(validFiles);
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
      // Reset input so same file can be selected again if needed
      e.target.value = '';
    }
  };

  return (
    <div
      className={`
        relative overflow-hidden rounded-3xl border-2 border-dashed transition-all duration-300 ease-in-out cursor-pointer
        flex flex-col items-center justify-center p-12 text-center h-80 group
        ${isDragging 
          ? 'border-primary-400 bg-primary-50 scale-[1.01]' 
          : error 
            ? 'border-red-300 bg-red-50'
            : 'border-slate-200 bg-white hover:border-primary-300 hover:bg-slate-50'
        }
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept={accept}
        multiple={multiple}
        onChange={handleInputChange}
      />
      
      <div className={`p-5 rounded-full mb-6 transition-transform duration-300 group-hover:scale-110 ${isDragging ? 'bg-white' : 'bg-primary-50'}`}>
        {icon || <Upload className="w-10 h-10 text-primary-400" />}
      </div>

      <h3 className="text-2xl font-bold text-slate-800 mb-2">{title}</h3>
      <p className="text-slate-500 max-w-sm mx-auto mb-8">{description}</p>
      
      <Button variant="primary" size="lg" className="pointer-events-none">
        Select Files
      </Button>
      
      {error && (
        <div className="mt-4 flex items-center gap-2 text-sm text-red-500 animate-in slide-in-from-bottom-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
      
      {!error && (
        <div className="mt-6 flex items-center gap-2 text-xs text-slate-400 font-medium uppercase tracking-wide">
          <FileType className="w-3 h-3" />
          <span>Secure Client-Side Processing</span>
        </div>
      )}
    </div>
  );
};