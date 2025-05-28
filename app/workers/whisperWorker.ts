import { pipeline } from '@xenova/transformers';

// Define the type for messages between the worker and main thread
type WorkerMessage = {
  type: 'transcribe';
  audioData: ArrayBuffer;
};

// Listen for messages from the main thread
self.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
  const { type, audioData } = event.data;
  
  if (type === 'transcribe') {
    try {
      // Send status update
      self.postMessage({ status: 'loading', message: 'Loading Whisper model...' });
      
      // Load the Whisper pipeline
      const transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-small');
      
      // Send status update
      self.postMessage({ status: 'processing', message: 'Transcribing audio...' });
      
      // Convert ArrayBuffer to Float32Array for processing
      // Vérifier que nous sommes dans un environnement navigateur
      if (typeof window === 'undefined' || typeof AudioContext === 'undefined') {
        throw new Error('AudioContext is not available in this environment');
      }
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(audioData);
      const audioData32 = audioBuffer.getChannelData(0);
      
      // Process the audio in chunks to show progress
      const chunkSize = 100000;
      let transcription = '';
      
      for (let i = 0; i < audioData32.length; i += chunkSize) {
        const chunk = audioData32.slice(i, i + chunkSize);
        
        // Transcribe the chunk
        const result = await transcriber(chunk, {
          chunk_length_s: 30,
          stride_length_s: 5,
          language: 'auto',
          task: 'transcribe',
        });
        
        // Handle different result formats
        if (Array.isArray(result)) {
          // If result is an array, concatenate all text fields
          transcription += result.map(item => item.text || '').join(' ');
        } else {
          // If result is a single object
          transcription += result.text || '';
        }
        
        // Report progress
        const progress = Math.min(100, Math.round((i + chunkSize) / audioData32.length * 100));
        self.postMessage({ 
          status: 'progress', 
          progress,
          message: `Transcribing: ${progress}%` 
        });
      }
      
      // Send the completed transcription
      self.postMessage({ 
        status: 'complete', 
        transcription,
        message: 'Transcription complete!' 
      });
      
    } catch (error) {
      console.error('Transcription error:', error);
      self.postMessage({ 
        status: 'error', 
        message: `Error during transcription: ${error.message}` 
      });
    }
  }
});

// Export empty object to make TypeScript happy with the file being a module
export {};
