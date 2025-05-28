import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import React from 'react';

const poppins = Poppins({ 
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'myTranscript - Transcription de réunions',
  description: 'Transcrivez et résumez vos réunions avec l\'IA',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={poppins.className}>{children}</body>
    </html>
  );
}
