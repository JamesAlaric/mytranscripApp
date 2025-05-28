'use client';

import React from 'react';
import { DocumentTextIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface TranscriptionViewerProps {
  transcription: string;
}

export default function TranscriptionViewer({ transcription }: TranscriptionViewerProps) {
  // Fonction pour formater la transcription avec coloration des locuteurs
  const formatTranscription = (text: string) => {
    // Diviser le texte par lignes
    const lines = text.split('\n');
    
    return lines.map((line, index) => {
      // Détecter les locuteurs (format "Speaker X: ")
      if (line.match(/^Speaker \d+:/)) {
        const [speaker, ...content] = line.split(':');
        return (
          <div key={index} className="mb-4">
            <span className="font-semibold text-blue-600 dark:text-blue-400">{speaker}:</span>
            <span>{content.join(':')}</span>
          </div>
        );
      }
      return <div key={index} className="mb-2">{line}</div>;
    });
  };

  return (
    <div className="border rounded-xl overflow-hidden shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
        <div className="flex items-center gap-2">
          <DocumentTextIcon className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold">Transcription</h2>
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-500" />
          </div>
          <input 
            type="text" 
            className="pl-10 pr-4 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500 outline-none" 
            placeholder="Rechercher..." 
          />
        </div>
      </div>
      <div className="p-6 h-[600px] overflow-y-auto">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {formatTranscription(transcription)}
        </div>
      </div>
    </div>
  );
}
