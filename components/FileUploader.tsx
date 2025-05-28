'use client';

import React, { useState, useRef } from 'react';
import { MicrophoneIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';

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
      alert('Veuillez télécharger un fichier audio valide (MP3, WAV, M4A)');
      return;
    }
    
    // Check file size (2GB max)
    const maxSize = 2 * 1024 * 1024 * 1024; // 2GB in bytes
    if (file.size > maxSize) {
      alert('La taille du fichier dépasse la limite de 2 Go');
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
    <div className="w-full max-w-2xl mx-auto">
      <div 
        className={`
          flex flex-col items-center justify-center w-full h-80 
          border-2 border-dashed rounded-2xl 
          ${dragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-700'} 
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
        
        <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
          <div className="w-20 h-20 mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <MicrophoneIcon className="w-10 h-10 text-blue-500" />
          </div>
          <h3 className="mb-2 text-xl font-semibold text-gray-800 dark:text-white">
            Glissez votre fichier audio ici
          </h3>
          <p className="mb-4 text-base text-gray-600 dark:text-gray-300">
            ou cliquez pour sélectionner (MP3, WAV, M4A - max 2GB)
          </p>
          <button 
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onButtonClick();
            }}
            disabled={isProcessing}
          >
            <ArrowUpTrayIcon className="w-5 h-5" />
            <span>Télécharger un fichier</span>
          </button>
        </div>
      </div>
      
      {isProcessing && (
        <div className="mt-6 text-center">
          <p className="text-base text-gray-700 dark:text-gray-300">
            Traitement de votre fichier audio en cours...
          </p>
        </div>
      )}
    </div>
  );
}
