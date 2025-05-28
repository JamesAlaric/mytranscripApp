'use client';

import { useState, useRef } from 'react';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';

interface FileUploaderProps {
  onFileUpload: (file: File) => void;
  isProcessing: boolean;
}

export default function FileUploader({ onFileUpload, isProcessing }: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0] && !isProcessing) {
      const file = e.dataTransfer.files[0];
      validateAndUpload(file);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    
    if (e.target.files && e.target.files[0] && !isProcessing) {
      const file = e.target.files[0];
      validateAndUpload(file);
    }
  };
  
  const validateAndUpload = (file: File) => {
    // Check file type
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid audio file (MP3, WAV, M4A)');
      return;
    }
    
    // Check file size (2GB max)
    const maxSize = 2 * 1024 * 1024 * 1024; // 2GB in bytes
    if (file.size > maxSize) {
      alert('File size exceeds 2GB limit');
      return;
    }
    
    onFileUpload(file);
  };
  
  const onButtonClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };
  
  return (
    <div className="w-full max-w-xl">
      <div 
        className={`
          flex flex-col items-center justify-center w-full h-64 
          border-2 border-dashed rounded-lg 
          ${dragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'} 
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50'}
          transition-all duration-200
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={isProcessing ? undefined : onButtonClick}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={handleChange}
          accept=".mp3,.wav,.m4a"
          disabled={isProcessing}
        />
        
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <ArrowUpTrayIcon className="w-10 h-10 mb-3 text-gray-400" />
          <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="font-semibold">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            MP3, WAV, or M4A (Max 2GB)
          </p>
        </div>
      </div>
      
      {isProcessing && (
        <p className="text-center mt-4 text-sm text-gray-500 dark:text-gray-400">
          Processing your audio file. Please wait...
        </p>
      )}
    </div>
  );
}
