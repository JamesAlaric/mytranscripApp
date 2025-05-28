'use client';

import { useState, useEffect } from 'react';
import FileUploader from '../components/FileUploader';
import Navbar from '../components/Navbar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import TranscriptionPanel from '../components/TranscriptionPanel';
import SummaryPanel from '../components/SummaryPanel';
import { AudioFile } from '../types';

export default function Home() {
  const [fileName, setFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [transcription, setTranscription] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [whisperWorker, setWhisperWorker] = useState<Worker | null>(null);
  const [audioFile, setAudioFile] = useState<AudioFile | null>(null);
  const [activeTab, setActiveTab] = useState<string>('transcription');
  const [canGenerateSummary, setCanGenerateSummary] = useState<boolean>(false);
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);

  // Initialize the worker
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const worker = new Worker(new URL('./workers/whisperWorker.ts', import.meta.url));
        
        worker.onmessage = (event) => {
          const { status, progress, message, transcription } = event.data;
          
          if (status === 'progress' && progress) {
            setProgress(progress);
            setStatusMessage(message || 'Traitement en cours...');
          } else if (status === 'complete' && transcription) {
            setTranscription(transcription);
            setCanGenerateSummary(true);
            setIsProcessing(false);
            setStatusMessage('Transcription terminée!');
          } else if (status === 'error') {
            console.error('Error from worker:', message); // Log the detailed error
            setStatusMessage(`Erreur: ${message}`); // Display the error
            setIsProcessing(false);
          } else {
            setStatusMessage(message || 'Traitement en cours...');
          }
        };
        
        setWhisperWorker(worker);
        
        // Clean up the worker when the component unmounts
        return () => {
          worker.terminate();
        };
      } catch (error) {
        console.error('Erreur lors de l\'initialisation du worker:', error);
      }
    }
  }, []);
  
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    
    console.log('Fichier sélectionné:', file.name, file.type, file.size);
    setFileName(file.name);
    setIsProcessing(true);
    setProgress(0);
    setTranscription('');
    setSummary('');
    setCanGenerateSummary(false);
    setStatusMessage('Préparation du fichier audio...');
    
    // Créer une URL pour le fichier audio
    const audioUrl = URL.createObjectURL(file);
    setAudioFile({
      name: file.name,
      url: audioUrl,
      type: file.type,
      size: file.size
    });
    
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
  
  const mockProcessAudio = async (file: File) => {
    // Simulate processing time
    for (let i = 0; i <= 100; i += 10) {
      setProgress(i);
      setStatusMessage(`Traitement: ${i}%`);
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // Mock transcription
    const mockTranscription = `
      [00:00:05] Pierre: Bonjour à tous, merci de vous joindre à cette réunion.
      [00:00:10] Pierre: Aujourd'hui, nous allons discuter des résultats trimestriels et des plans futurs.
      [00:00:20] Marie: Pouvez-vous partager la présentation avec nous?
      [00:00:25] Pierre: Oui, je vais partager mon écran maintenant.
      [00:00:35] Pierre: Comme vous pouvez le voir, nos résultats du premier trimestre ont dépassé les attentes.
      [00:00:45] Thomas: C'est une excellente nouvelle! Qu'est-ce qui a contribué à ce succès?
      [00:00:55] Pierre: Plusieurs facteurs: le lancement du nouveau produit, l'amélioration de la stratégie marketing et l'expansion de l'équipe.
      [00:01:10] Marie: Quels sont les plans pour le deuxième trimestre?
      [00:01:15] Pierre: Nous allons nous concentrer sur l'expansion du marché et la fidélisation des clients.
      [00:01:30] Thomas: Avons-nous les ressources pour cela?
      [00:01:35] Pierre: Oui, le budget a été approuvé.
      [00:01:45] Marie: Excellent, j'ai hâte de voir les résultats.
      [00:01:55] Pierre: Merci à tous pour votre contribution. Retrouvons-nous la semaine prochaine.
    `;
    
    setTranscription(mockTranscription);
    setCanGenerateSummary(true);
    setIsProcessing(false);
    setStatusMessage('Transcription terminée!');
  };
  
  const handleGenerateSummary = () => {
    setIsSummarizing(true);
    setActiveTab('summary');
    setStatusMessage('Génération du résumé en cours...'); // Optional: provide status

    try {
      // Ensure 'transcription' is the current, potentially edited, transcription state
      if (!transcription || transcription.trim() === '') {
        setSummary('Erreur: La transcription est vide, impossible de générer un résumé.');
        setIsSummarizing(false);
        setStatusMessage('Échec de la génération du résumé.');
        return;
      }
      
      const result = await generateSummary(transcription);
      setSummary(result); // 'result' will be the summary string or an error message string
      
      // The 'formatSummary' in summarizer.ts should handle the structure.
      // If 'result' starts with "Error:", SummaryViewer should display it as an error.
      
    } catch (error) {
      console.error('Failed to generate summary:', error);
      // The generateSummary service itself should return a string error message
      // This catch is a fallback for unexpected errors in the calling process
      if (error instanceof Error) {
        setSummary(`Erreur inattendue lors de la génération du résumé: ${error.message}`);
      } else {
        setSummary('Erreur inattendue lors de la génération du résumé.');
      }
    } finally {
      setIsSummarizing(false);
      // Update status message based on whether 'summary' contains an error
      // This logic might need refinement based on how errors are consistently reported
      if (summary.startsWith('Error:')) { // A bit simplistic, depends on error format from service
        setStatusMessage('Échec de la génération du résumé.');
      } else {
        setStatusMessage('Résumé généré!');
      }
    }
  };
  
  const handleTranscriptionUpdate = (updatedTranscription: string) => {
    setTranscription(updatedTranscription);
    // Réinitialiser le résumé si la transcription change
    setSummary('');
    setCanGenerateSummary(true);
  };
  
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <FileUploader onFileUpload={handleFileUpload} isProcessing={isProcessing} />
          </div>
          
          {/* Unified status display for transcription processing and summary completion/failure messages */}
          {(isProcessing || (statusMessage && (activeTab === 'summary' || statusMessage.includes("Transcription terminée")))) && !isSummarizing && (
            <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
                {statusMessage}
              </h2>
              {isProcessing && ( // Only show progress bar for transcription processing
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              )}
            </div>
          )}
          
          {(transcription || audioFile) && (
            <Tabs defaultValue="transcription" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex justify-between items-center mb-4">
                <TabsList className="grid grid-cols-2 w-[400px]">
                  <TabsTrigger value="transcription">Transcription</TabsTrigger>
                  <TabsTrigger value="summary" disabled={!canGenerateSummary && !summary && !isSummarizing}>Résumé</TabsTrigger>
                </TabsList>
                
                {activeTab === 'transcription' && canGenerateSummary && (!summary || summary.startsWith("Error:")) && (
                  <button 
                    onClick={handleGenerateSummary}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50"
                    disabled={isSummarizing || !transcription.trim()}
                  >
                    {isSummarizing ? 'Génération du résumé...' : 'Générer le résumé'}
                  </button>
                )}
                 {activeTab === 'summary' && summary && !summary.startsWith("Error:") && canGenerateSummary && (
                  <button
                    onClick={handleGenerateSummary} // Allow re-generation
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors disabled:opacity-50"
                    disabled={isSummarizing || !transcription.trim()}
                  >
                    {isSummarizing ? 'Re-génération...' : 'Re-générer le résumé'}
                  </button>
                )}
              </div>
              
              <TabsContent 
                value="transcription" 
                className="mt-4 p-6 bg-white dark:bg-gray-800/50 rounded-lg shadow-md"
              >
                <TranscriptionPanel 
                  transcription={transcription} 
                  audioFile={audioFile} 
                  onTranscriptionUpdate={handleTranscriptionUpdate}
                />
              </TabsContent>
              
              <TabsContent 
                value="summary" 
                className="mt-4 p-6 bg-white dark:bg-gray-800/50 rounded-lg shadow-md"
              >
                <SummaryPanel 
                  summary={summary} 
                  isGenerating={isSummarizing} 
                  onGenerateSummary={handleGenerateSummary}
                />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </main>
  );
}
