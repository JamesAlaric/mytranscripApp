'use client';

import React from 'react';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import { PlusIcon } from '@heroicons/react/24/outline';

interface NavbarProps {
  onNewTranscription?: () => void;
  showNewButton?: boolean;
}

export default function Navbar({ onNewTranscription, showNewButton = false }: NavbarProps) {
  return (
    <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Logo />
        
        <div className="flex items-center gap-3">
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
    </header>
  );
}
