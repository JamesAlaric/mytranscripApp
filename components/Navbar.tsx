'use client';

import { useState } from 'react';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import { PlusIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

interface NavbarProps {
  onNewTranscription?: () => void;
  showNewButton?: boolean;
}

export default function Navbar({ onNewTranscription, showNewButton = false }: NavbarProps) {
  const [showHelp, setShowHelp] = useState(false);
  
  return (
    <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Logo />
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowHelp(!showHelp)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Aide"
          >
            <QuestionMarkCircleIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm hidden md:inline">Aide</span>
          </button>
          
          {showNewButton && (
            <button 
              onClick={onNewTranscription}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              <span className="hidden md:inline">Nouvelle transcription</span>
            </button>
          )}
          
          <ThemeToggle />
        </div>
      </div>
      
      {showHelp && (
        <div className="container mx-auto px-4 py-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Comment utiliser myTranscript</h3>
            <ol className="list-decimal pl-5 space-y-2 text-gray-700 dark:text-gray-300">
              <li>Téléchargez un fichier audio de réunion (formats MP3, WAV, M4A)</li>
              <li>Attendez que la transcription soit générée</li>
              <li>Modifiez la transcription si nécessaire en cliquant sur l'icône de crayon</li>
              <li>Générez un résumé de la réunion</li>
              <li>Exportez la transcription ou le résumé dans le format de votre choix</li>
            </ol>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              Note: Le traitement est effectué localement sur votre appareil. Aucune donnée n'est envoyée à des serveurs externes.  
            </p>
          </div>
        </div>
      )}
    </header>
  );
}
