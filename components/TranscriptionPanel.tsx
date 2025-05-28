import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AudioFile } from '../types';
import { PencilIcon, ArrowDownTrayIcon as SolidArrowDownTrayIcon } from '@heroicons/react/24/solid';
import TranscriptionViewer from './TranscriptionViewer';
import { downloadTextFile } from '../lib/utils'; // Import the utility

// Define ParsedLine and utility functions here or import from a shared utils file
// Keeping parseLine here as exportTranscription was using it, though direct transcription string might be simpler for TXT.
interface ParsedLine {
  time: number | null;
  speaker?: string;
  text: string;
  originalLine: string; // Keep original for reference if needed, or for reconstruction
  timestampStr?: string; // Store the original [MM:SS] string
}

const parseLine = (line: string): ParsedLine => {
  const speakerMatch = line.match(/^(\[\d{2}:\d{2}\])\s*([^:]+):\s*(.*)/);
  if (speakerMatch) {
    const timestampStr = speakerMatch[1];
    const timeParts = timestampStr.replace(/[\[\]]/g, '').split(':');
    const minutes = parseInt(timeParts[0], 10);
    const seconds = parseInt(timeParts[1], 10);
    return {
      time: minutes * 60 + seconds,
      speaker: speakerMatch[2].trim(),
      text: speakerMatch[3].trim(),
      originalLine: line,
      timestampStr: timestampStr,
    };
  }

  const simpleTimestampMatch = line.match(/^(\[\d{2}:\d{2}\])\s*(.*)/);
  if (simpleTimestampMatch) {
    const timestampStr = simpleTimestampMatch[1];
    const timeParts = timestampStr.replace(/[\[\]]/g, '').split(':');
    const minutes = parseInt(timeParts[0], 10);
    const seconds = parseInt(timeParts[1], 10);
    return {
      time: minutes * 60 + seconds,
      text: simpleTimestampMatch[2].trim(),
      originalLine: line,
      timestampStr: timestampStr,
    };
  }
  return { time: null, text: line, originalLine: line };
};


interface TranscriptionPanelProps {
  transcription: string;
  audioFile: AudioFile | null;
  onTranscriptionUpdate: (updatedTranscription: string) => void;
}

const TranscriptionPanel: React.FC<TranscriptionPanelProps> = ({
  transcription,
  audioFile,
  onTranscriptionUpdate
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGlobalEditMode, setIsGlobalEditMode] = useState(false); // New state for global edit mode
  
  // Existing editing state - can be phased out or kept for other features
  const [editingIndex, setEditingIndex] = useState<number | null>(null); // Retained for now, though not used by global edit
  const [editText, setEditText] = useState(''); // Retained for now
  const [editSpeaker, setEditSpeaker] = useState(''); // Retained for now

  const [showExportOptions, setShowExportOptions] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const updateTime = () => setCurrentTime(audio.currentTime);
    const updatePlayingState = () => setIsPlaying(!audio.paused);
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('play', updatePlayingState);
    audio.addEventListener('pause', updatePlayingState);
    audio.addEventListener('ended', updatePlayingState);
    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('play', updatePlayingState);
      audio.removeEventListener('pause', updatePlayingState);
      audio.removeEventListener('ended', updatePlayingState);
    };
  }, []);

  const handleSeek = (timestampSeconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = timestampSeconds;
      if (audioRef.current.paused) {
        audioRef.current.play().catch(err => console.error('Error playing audio on seek:', err));
      }
    }
  };

  const handleLineTextChange = useCallback((lineIndex: number, newText: string) => {
    const currentParsedLines = transcription.split('\n').map(parseLine);
    if (lineIndex < 0 || lineIndex >= currentParsedLines.length) {
      console.error("Invalid line index for update:", lineIndex);
      return;
    }
    const updatedParsedLines = currentParsedLines.map((line, index) => 
      index === lineIndex ? { ...line, text: newText } : line
    );
    const newTranscriptionString = updatedParsedLines.map(line => {
      let prefix = "";
      if (line.timestampStr) { prefix += line.timestampStr + " "; }
      if (line.speaker) { prefix += line.speaker + ": "; }
      return prefix + line.text;
    }).join('\n');
    onTranscriptionUpdate(newTranscriptionString);
  }, [transcription, onTranscriptionUpdate]);

  const handleExportTranscription = (format: 'txt' | 'pdf' | 'docx') => {
    if (!transcription) return;

    const filenameBase = `transcript_${audioFile?.name.split('.')[0] || 'export'}`;
    
    if (format === 'txt') {
      // Use the raw transcription string directly for TXT export,
      // as it reflects the current state including edits.
      downloadTextFile(`${filenameBase}.txt`, transcription);
    } else if (format === 'pdf') {
      alert('PDF export for transcripts is not currently implemented. Please export as TXT.');
      // Optionally, could call downloadTextFile as a fallback:
      // downloadTextFile(`${filenameBase}_fallback.txt`, transcription);
    } else if (format === 'docx') {
      alert('DOCX export for transcripts is not currently implemented. Please export as TXT.');
      // Optionally, could call downloadTextFile as a fallback:
      // downloadTextFile(`${filenameBase}_fallback.txt`, transcription);
    }
    setShowExportOptions(false);
  };

  const filteredTranscription = searchTerm
    ? transcription // Placeholder: Actual filtering logic would need to parse and filter lines
    : transcription;

  const canExportTranscription = transcription && transcription.trim() !== '';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Transcription</h2>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsGlobalEditMode(!isGlobalEditMode)}
              title={isGlobalEditMode ? "Disable Edit Mode" : "Enable Edit Mode"}
              className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                isGlobalEditMode ? 'bg-blue-100 dark:bg-blue-800' : ''
              }`}
            >
              <PencilIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowExportOptions(!showExportOptions)}
                disabled={!canExportTranscription} // Disabled if no transcription
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center disabled:opacity-50"
              >
                <SolidArrowDownTrayIcon className="w-5 h-5 mr-2" />
                Exporter
              </button>
              {showExportOptions && ( // Show options even in edit mode
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg z-10">
                  <div className="py-1">
                    <button
                      onClick={() => handleExportTranscription('txt')}
                      disabled={!canExportTranscription}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50"
                    >
                      Exporter en TXT
                    </button>
                    <button
                      onClick={() => handleExportTranscription('pdf')}
                      disabled={!canExportTranscription}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50"
                    >
                      Exporter en PDF
                    </button>
                    <button
                      onClick={() => handleExportTranscription('docx')}
                      disabled={!canExportTranscription}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50"
                    >
                      Exporter en DOCX
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {audioFile && (
          <div className="w-full">
            <audio 
              ref={audioRef} 
              controls 
              className="w-full mb-4"
              src={audioFile.url}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            >
              Votre navigateur ne supporte pas l'élément audio.
            </audio>
          </div>
        )}
        
        <div className="relative">
          <input
            type="text"
            placeholder="Rechercher dans la transcription..."
            disabled={isGlobalEditMode} // Disable search in edit mode
            className="w-full p-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg /* Search Icon */ className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
        </div>
        
        <TranscriptionViewer
          transcription={filteredTranscription}
          currentTime={currentTime}
          onSeek={handleSeek}
          isEditing={isGlobalEditMode}
          onLineTextChange={handleLineTextChange}
        />
        
        {/* Old editing UI placeholder - can be removed if isGlobalEditMode replaces its function */}
        {/* 
        {editingIndex !== null && (
            // This UI for single line edit might be redundant or could be adapted
        )}
        */}
      </div>
    </div>
  );
};

export default TranscriptionPanel;
