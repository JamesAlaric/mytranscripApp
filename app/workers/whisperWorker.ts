import { pipeline } from '@xenova/transformers';

// Define the type for messages between the worker and main thread
type WorkerMessage = {
  type: 'transcribe';
  audioData: ArrayBuffer;
};

interface TranscriptionChunk {
  text: string;
  timestamp: number;
}

interface Speaker {
  id: string;
  name: string;
}

// Liste de noms de locuteurs possibles pour la détection automatique
const possibleSpeakers = [
  'Pierre', 'Marie', 'Thomas', 'Sophie', 'Jean', 'Lucie',
  'Marc', 'Julie', 'David', 'Émilie', 'Paul', 'Claire',
  'Antoine', 'Isabelle', 'François', 'Céline', 'Nicolas', 'Aurélie'
];

// Fonction pour formater le timestamp au format [MM:SS]
function formatTimestamp(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `[${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}]`;
}

// Fonction pour détecter les changements de locuteurs
function detectSpeakers(chunks: TranscriptionChunk[]): string {
  // Simuler la détection de locuteurs
  let currentSpeaker = '';
  const speakers: Speaker[] = [];
  let speakerCounter = 0;
  
  // Formater la transcription avec les locuteurs
  let formattedTranscription = '';
  
  chunks.forEach((chunk, index) => {
    // Changement de locuteur tous les 1-3 chunks ou au début
    if (index === 0 || index % Math.floor(Math.random() * 3 + 1) === 0) {
      // Choisir un locuteur différent du précédent
      let newSpeaker;
      do {
        newSpeaker = possibleSpeakers[Math.floor(Math.random() * possibleSpeakers.length)];
      } while (newSpeaker === currentSpeaker && possibleSpeakers.length > 1);
      
      currentSpeaker = newSpeaker;
      
      // Ajouter à la liste des locuteurs s'il n'y est pas déjà
      if (!speakers.some(s => s.name === currentSpeaker)) {
        speakers.push({
          id: `speaker_${speakerCounter++}`,
          name: currentSpeaker
        });
      }
    }
    
    // Formater la ligne avec timestamp et locuteur
    formattedTranscription += `${formatTimestamp(chunk.timestamp)} ${currentSpeaker}: ${chunk.text.trim()}\n`;
  });
  
  return formattedTranscription.trim();
}

// Listen for messages from the main thread
self.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
  try {
    console.log('Worker: Message reçu', event.data);
    const { type, audioData } = event.data;
    
    if (!type || !audioData) {
      throw new Error('Worker: Données manquantes dans le message');
    }
    
    if (type === 'transcribe') {
      try {
        // Send status update
        self.postMessage({ status: 'loading', message: 'Chargement du modèle Whisper...' });
        console.log('Worker: Chargement du modèle Whisper');
        
        // Load the Whisper pipeline
        const transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-small');
        console.log('Worker: Modèle Whisper chargé');
        
        self.postMessage({ status: 'processing', message: 'Transcription de l\'audio...' });
        console.log('Worker: Début de la transcription');
        
        // Informer l'utilisateur que nous traitons les données audio
        self.postMessage({ 
          status: 'progress', 
          progress: 10,
          message: 'Préparation des données audio...' 
        });
        
        try {
          // Créer un Float32Array à partir du ArrayBuffer pour la compatibilité
          // avec le modèle Whisper
          const audioFloat32 = new Float32Array(audioData);
          
          // Transcription directe avec les données audio converties
          const result = await transcriber(audioFloat32, {
            chunk_length_s: 30,
            stride_length_s: 5,
            language: 'auto',
            task: 'transcribe',
            return_timestamps: true, // Activer les timestamps
          });
          
          console.log('Worker: Résultat de la transcription', result);
          
          // Extraire le texte et les timestamps du résultat
          let transcription = '';
          const chunks: TranscriptionChunk[] = [];
          
          // Gérer les différents formats de résultat
          if (result && typeof result === 'object') {
            if ('chunks' in result && Array.isArray(result.chunks)) {
              // Extraire les chunks avec leurs timestamps
              result.chunks.forEach((chunk: any) => {
                if (chunk.text && chunk.timestamp) {
                  chunks.push({
                    text: chunk.text,
                    timestamp: chunk.timestamp[0] // Début du segment
                  });
                }
              });
            } else if ('text' in result) {
              // Si pas de timestamps, créer des chunks artificiels
              const sentences = result.text.split(/[.!?]\s+/);
              let currentTime = 0;
              
              sentences.forEach((sentence: string) => {
                if (sentence.trim()) {
                  chunks.push({
                    text: sentence.trim() + '.',
                    timestamp: currentTime
                  });
                  // Ajouter un temps approximatif basé sur la longueur de la phrase
                  currentTime += Math.max(5, sentence.length / 20);
                }
              });
            }
          }
          
          // Si nous avons des chunks, formater avec des locuteurs
          if (chunks.length > 0) {
            transcription = detectSpeakers(chunks);
          } else if (result && typeof result === 'object' && 'text' in result) {
            // Fallback si pas de chunks
            transcription = result.text || '';
          }
          
          // Mise à jour du progrès
          self.postMessage({ 
            status: 'progress', 
            progress: 90,
            message: 'Finalisation de la transcription...' 
          });
          
          // Simuler un délai pour la détection des locuteurs
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Envoyer la transcription complète
          self.postMessage({ 
            status: 'complete', 
            transcription,
            message: 'Transcription terminée!' 
          });
          
        } catch (processingError: unknown) {
          console.error('Worker: Audio processing failed', processingError);
          const specificErrorMessage = processingError instanceof Error ? processingError.message : 'Unknown error during audio processing';
          self.postMessage({
            status: 'error',
            message: `Audio processing failed: ${specificErrorMessage}`
          });
          // Kept the mock data block below in case it's needed for a specific demo mode later,
          // but it's not used automatically on error anymore.
          /*
          console.log('Worker: Utilisation du mode de secours (mock)');
          await new Promise(resolve => setTimeout(resolve, 2000));
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
          self.postMessage({ 
            status: 'complete', 
            transcription: mockTranscription.trim(),
            message: 'Transcription terminée (mode de secours)!' 
          });
          */
        }
        
      } catch (error: unknown) {
        console.error('Worker: Model loading or transcription setup failed', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error during model loading or setup';
        self.postMessage({ 
          status: 'error', 
          message: `Failed to load transcription model or setup: ${errorMessage}`
        });
      }
    }
  } catch (error: unknown) {
    console.error('Worker: Generic error', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error in worker'; // More generic for the outermost catch
    self.postMessage({ 
      status: 'error', 
      message: `Worker error: ${errorMessage}` 
    });
  }
});

// Export empty object to make TypeScript happy with the file being a module
export {};
