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
            setStatusMessage(`Erreur: ${message}`);
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
    
    // Simulate summary generation
    setTimeout(() => {
      const summaryObj = {
        mainPoints: [
          "Les résultats du premier trimestre ont dépassé les attentes",
          "Facteurs de succès: lancement d'un nouveau produit, amélioration du marketing, expansion de l'équipe",
          "Plans pour le T2: expansion du marché et fidélisation des clients",
          "Le budget pour les plans du T2 a été approuvé"
        ],
        actionItems: [
          "Partager la présentation avec l'équipe",
          "Se réunir à nouveau la semaine prochaine",
          "Préparer l'expansion du marché",
          "Développer une stratégie de fidélisation des clients"
        ],
        speakers: [
          "Pierre (Présentateur principal)",
          "Marie",
          "Thomas"
        ]
      };
      
      setSummary(JSON.stringify(summaryObj, null, 2));
      setIsSummarizing(false);
    }, 2000);
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
          
          {isProcessing && (
            <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
                {statusMessage}
              </h2>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}
          
          {(transcription || audioFile) && (
            <Tabs defaultValue="transcription" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex justify-between items-center mb-4">
                <TabsList className="grid grid-cols-2 w-[400px]">
                  <TabsTrigger value="transcription">Transcription</TabsTrigger>
                  <TabsTrigger value="summary" disabled={!canGenerateSummary && !summary}>Résumé</TabsTrigger>
                </TabsList>
                
                {activeTab === 'transcription' && canGenerateSummary && !summary && (
                  <button 
                    onClick={handleGenerateSummary}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                    disabled={isSummarizing}
                  >
                    {isSummarizing ? 'Génération en cours...' : 'Générer le résumé'}
                  </button>
                )}
              </div>
              
              <TabsContent value="transcription" className="mt-0">
                <TranscriptionPanel 
                  transcription={transcription} 
                  audioFile={audioFile} 
                  onTranscriptionUpdate={handleTranscriptionUpdate}
                />
              </TabsContent>
              
              <TabsContent value="summary" className="mt-0">
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
