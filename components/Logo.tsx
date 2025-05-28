'use client';

import React from 'react';
import { MicrophoneIcon } from '@heroicons/react/24/solid';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
}

export default function Logo({ size = 'medium' }: LogoProps) {
  const sizeClasses = {
    small: 'text-xl',
    medium: 'text-2xl md:text-3xl',
    large: 'text-3xl md:text-4xl'
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <MicrophoneIcon className="h-8 w-8 text-blue-500" />
        <span className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full"></span>
      </div>
      <span className={`font-bold ${sizeClasses[size]}`}>
        <span className="text-blue-500">my</span>
        <span className="text-gray-800 dark:text-white">Transcript</span>
      </span>
    </div>
  );
}
