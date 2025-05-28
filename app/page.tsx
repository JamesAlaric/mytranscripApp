'use client';

import React, { useState, useEffect } from 'react';
import { ArrowUpTrayIcon, DocumentTextIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';
import FileUploader from '../components/FileUploader';
import TranscriptionViewer from '../components/TranscriptionViewer';
import SummaryViewer from '../components/SummaryViewer';
import ProgressBar from '../components/ProgressBar';
import { generateSummary } from './services/summarizer';

// Define worker type
let whisperWorker: Worker | null = null;

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [transcription, setTranscription] = useState('');
  const [summary, setSummary] = useState('');
  const [fileName, setFileName] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  // Initialize the worker
  useEffect(() => {
    // S'assurer que nous sommes dans l'environnement du navigateur
    if (typeof window === 'undefined' || typeof Worker === 'undefined') {
      return;
    }

    // Initialiser le worker uniquement côté client
    const initializeWorker = async () => {
      if (!whisperWorker) {
        try {
          // Utiliser dynamic import pour éviter les problèmes de SSR
          whisperWorker = new Worker(new URL('./workers/whisperWorker.ts', import.meta.url));
          
          whisperWorker.onmessage = async (event) => {
            const { status, message, progress, transcription } = event.data;
            
            setStatusMessage(message || '');
            
            if (status === 'progress' && progress) {
              setProgress(progress);
            }
            
            if (status === 'complete' && transcription) {
              setTranscription(transcription);
              setProgress(100);
              setStatusMessage('Génération du résumé...');
              
              // Générer le résumé à partir de la transcription
              const generatedSummary = await generateSummary(transcription);
              setSummary(generatedSummary);
              setIsProcessing(false);
            }
            
            if (status === 'error') {
              console.error('Erreur du worker:', message);
              alert(`Erreur: ${message}`);
              setIsProcessing(false);
            }
          };
          
          whisperWorker.onerror = (error) => {
            console.error('Erreur du worker:', error);
            alert('Une erreur est survenue avec le worker de transcription.');
            setIsProcessing(false);
          };
        } catch (error) {
          console.error('Échec de l\'initialisation du worker:', error);
          // Utiliser l'implémentation de secours si le worker échoue
          alert('Impossible d\'initialiser le worker de transcription. Utilisation du mode de secours.');
        }
      }
    };

    // Initialiser le worker
    initializeWorker();
    
    // Nettoyer le worker lors du démontage du composant
    return () => {
      if (whisperWorker) {
        whisperWorker.terminate();
        whisperWorker = null;
      }
    };
  }, []);

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    
    console.log('Fichier sélectionné:', file.name, file.type, file.size);
    setFileName(file.name);
    setIsProcessing(true);
    setProgress(0);
    setTranscription('');
    setSummary('');
    setStatusMessage('Préparation du fichier audio...');
    
    try {
      // Vérifier si le worker est disponible
      if (whisperWorker) {
        console.log('Utilisation du worker pour la transcription');
        try {
          // Convertir le fichier en ArrayBuffer
          const arrayBuffer = await file.arrayBuffer();
          console.log('Fichier converti en ArrayBuffer, taille:', arrayBuffer.byteLength);
          
          // Envoyer les données au worker
          whisperWorker.postMessage({
            type: 'transcribe',
            audioData: arrayBuffer
          });
          console.log('Message envoyé au worker');
        } catch (workerError) {
          console.error('Erreur lors de l\'envoi au worker:', workerError);
          throw workerError; // Propager l'erreur pour utiliser le fallback
        }
      } else {
        console.log('Worker non disponible, utilisation du mode de secours');
        // Fallback to mock implementation if worker is not available
        await mockProcessAudio(file);
      }
    } catch (error) {
      console.error('Erreur lors du traitement du fichier:', error);
      alert('Une erreur est survenue lors du traitement du fichier. Utilisation du mode de secours.');
      // Utiliser le mode de secours en cas d'erreur
      await mockProcessAudio(file);
    }
  };

  // Mock implementation for development/testing
  const mockProcessAudio = async (file: File) => {
    setStatusMessage('Processing audio (mock mode)...');
    
    const totalSteps = 100;
    let currentStep = 0;
    
    const interval = setInterval(() => {
      currentStep += 1;
      setProgress(currentStep);
      
      if (currentStep >= totalSteps) {
        clearInterval(interval);
        
        // Mock transcription for testing
        const mockTranscription = 
          'This is a sample transcription of a meeting. In a real implementation, this would be generated by Whisper.js.\n\n' +
          'Speaker 1: Hello everyone, thank you for joining today\'s meeting.\n\n' +
          'Speaker 2: Thanks for having us. I\'m excited to discuss the new project.\n\n' +
          'Speaker 1: Let\'s start by reviewing our progress from last week.\n\n' +
          'Speaker 3: I\'ve completed the initial design phase as planned.\n\n' +
          'Speaker 2: Great work! I think we should move forward with implementation next week.';
        
        setTranscription(mockTranscription);
        setStatusMessage('Generating summary...');
        
        // Generate summary with a slight delay to simulate processing
        setTimeout(async () => {
          const generatedSummary = await generateSummary(mockTranscription);
          setSummary(generatedSummary);
          setIsProcessing(false);
        }, 1500);
      }
    }, 50);
  };

  const exportToTxt = (content: string, filePrefix: string) => {
    const element = document.createElement('a');
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${filePrefix}_${fileName.split('.')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };
  
  // Function to export as PDF (using browser's print functionality)
  const exportToPdf = (content: string, filePrefix: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to export as PDF');
      return;
    }
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${filePrefix} - ${fileName}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }
          h1 { color: #333; }
          pre { white-space: pre-wrap; font-family: inherit; }
        </style>
      </head>
      <body>
        <h1>${filePrefix} - ${fileName}</h1>
        <pre>${content}</pre>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  const resetTranscription = () => {
    setTranscription('');
    setSummary('');
    setFileName('');
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <Navbar 
        onNewTranscription={resetTranscription} 
        showNewButton={!!transcription} 
      />

      <main className="flex-1 container mx-auto px-4 py-8">
        {!transcription && (
          <div className="flex-1 flex flex-col items-center justify-center py-10">
            <h1 className="text-3xl md:text-4xl font-bold text-center mb-8 text-gray-800 dark:text-white">
              Transcription de réunions
            </h1>
            <FileUploader onFileUpload={handleFileUpload} isProcessing={isProcessing} />
            
            {isProcessing && (
              <div className="w-full max-w-lg mt-8">
                <ProgressBar progress={progress} />
                <p className="text-center mt-2 text-gray-700 dark:text-gray-300">
                  {statusMessage} {progress}%
                </p>
              </div>
            )}
          </div>
        )}

        {transcription && (
          <div className="flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                {fileName || 'Transcription'}
              </h2>
              
              <div className="flex flex-wrap gap-2">
                <div className="relative group">
                  <button 
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <DocumentTextIcon className="h-5 w-5" />
                    Exporter
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg overflow-hidden z-10 hidden group-hover:block">
                    <button
                      onClick={() => exportToTxt(transcription, 'transcription')}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      Transcription (TXT)
                    </button>
                    <button
                      onClick={() => exportToPdf(transcription, 'Transcription')}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      Transcription (PDF)
                    </button>
                    <button
                      onClick={() => exportToTxt(summary, 'summary')}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      Résumé (TXT)
                    </button>
                    <button
                      onClick={() => exportToPdf(summary, 'Summary')}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      Résumé (PDF)
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
              <TranscriptionViewer transcription={transcription} />
              <SummaryViewer summary={summary} />
            </div>
          </div>
        )}
      </main>
      
      <footer className="py-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500 dark:text-gray-400">
          &copy; {new Date().getFullYear()} myTranscript - Tous droits réservés
        </div>
      </footer>
    </div>
  );
}
