import React, { useState, useRef, useEffect } from 'react';
import { AudioFile } from '../types';
import { parseTimestamp, extractSpeakerAndText } from '../lib/utils';
import { MicrophoneIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { ArrowDownTrayIcon } from '@heroicons/react/24/solid';

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
  const [parsedLines, setParsedLines] = useState<Array<{
    timestamp: string;
    timestampSeconds: number;
    speaker: string;
    text: string;
    original: string;
  }>>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [editSpeaker, setEditSpeaker] = useState('');
  const [showExportOptions, setShowExportOptions] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const lineRefs = useRef<Array<HTMLDivElement | null>>([]);
  
  // Parse the transcription into lines
  useEffect(() => {
    if (!transcription) {
      setParsedLines([]);
      return;
    }
    
    const lines = transcription.trim().split('\n').filter(line => line.trim());
    const parsed = lines.map(line => {
      const extracted = extractSpeakerAndText(line);
      if (extracted) {
        const { timestamp, speaker, text } = extracted;
        const timestampSeconds = parseTimestamp(timestamp) || 0;
        return {
          timestamp,
          timestampSeconds,
          speaker,
          text,
          original: line
        };
      }
      return null;
    }).filter(Boolean) as Array<{
      timestamp: string;
      timestampSeconds: number;
      speaker: string;
      text: string;
      original: string;
    }>;
    
    setParsedLines(parsed);
    lineRefs.current = parsed.map(() => null);
  }, [transcription]);
  
  // Update audio time
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const updateTime = () => {
      setCurrentTime(audio.currentTime);
      setIsPlaying(!audio.paused);
    };
    
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('play', () => setIsPlaying(true));
    audio.addEventListener('pause', () => setIsPlaying(false));
    audio.addEventListener('ended', () => setIsPlaying(false));
    
    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('play', () => setIsPlaying(true));
      audio.removeEventListener('pause', () => setIsPlaying(false));
      audio.removeEventListener('ended', () => setIsPlaying(false));
    };
  }, [audioRef.current]);
  
  // Scroll to current timestamp
  useEffect(() => {
    if (!isPlaying) return;
    
    // Find the current line based on timestamp
    const currentLineIndex = parsedLines.findIndex((line, index, array) => {
      const nextLine = array[index + 1];
      return currentTime >= line.timestampSeconds && 
             (!nextLine || currentTime < nextLine.timestampSeconds);
    });
    
    if (currentLineIndex !== -1 && lineRefs.current[currentLineIndex]) {
      lineRefs.current[currentLineIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [currentTime, isPlaying, parsedLines]);
  
  const handleSeek = (timestampSeconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = timestampSeconds;
      if (!isPlaying) {
        audioRef.current.play().catch(err => console.error('Error playing audio:', err));
      }
    }
  };
  
  const handleEdit = (index: number) => {
    const line = parsedLines[index];
    setEditingIndex(index);
    setEditText(line.text);
    setEditSpeaker(line.speaker);
  };
  
  const handleSaveEdit = () => {
    if (editingIndex === null) return;
    
    const updatedLines = [...parsedLines];
    updatedLines[editingIndex] = {
      ...updatedLines[editingIndex],
      speaker: editSpeaker,
      text: editText
    };
    
    // Reconstruct the full transcription
    const updatedTranscription = updatedLines
      .map(line => `${line.timestamp} ${line.speaker}: ${line.text}`)
      .join('\n');
    
    onTranscriptionUpdate(updatedTranscription);
    setEditingIndex(null);
  };
  
  const handleCancelEdit = () => {
    setEditingIndex(null);
  };
  
  const exportTranscription = (format: 'txt' | 'pdf' | 'docx') => {
    const content = parsedLines
      .map(line => `${line.timestamp} ${line.speaker}: ${line.text}`)
      .join('\n\n');
    
    if (format === 'txt') {
      const element = document.createElement('a');
      const file = new Blob([content], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = `transcription_${audioFile?.name.split('.')[0] || 'export'}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } else if (format === 'pdf') {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Veuillez autoriser les fenêtres pop-up pour exporter en PDF');
        return;
      }
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Transcription - ${audioFile?.name || 'Export'}</title>
          <style>
            body { font-family: 'Poppins', Arial, sans-serif; line-height: 1.6; padding: 20px; }
            h1 { color: #333; }
            .line { margin-bottom: 10px; }
            .timestamp { color: #666; font-weight: bold; }
            .speaker { color: #0066cc; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Transcription - ${audioFile?.name || 'Export'}</h1>
          ${parsedLines.map(line => `
            <div class="line">
              <span class="timestamp">${line.timestamp}</span>
              <span class="speaker">${line.speaker}:</span>
              ${line.text}
            </div>
          `).join('')}
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
        </html>
      `);
      
      printWindow.document.close();
    } else if (format === 'docx') {
      alert('Export DOCX non implémenté. Utilisez TXT ou PDF pour le moment.');
    }
    
    setShowExportOptions(false);
  };
  
  const filteredLines = searchTerm
    ? parsedLines.filter(line => 
        line.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        line.speaker.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : parsedLines;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Transcription</h2>
          
          <div className="flex items-center space-x-2">
            <div className="relative">
              <button
                onClick={() => setShowExportOptions(!showExportOptions)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center"
              >
                <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                Exporter
              </button>
              
              {showExportOptions && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg z-10">
                  <div className="py-1">
                    <button
                      onClick={() => exportTranscription('txt')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      Exporter en TXT
                    </button>
                    <button
                      onClick={() => exportTranscription('pdf')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      Exporter en PDF
                    </button>
                    <button
                      onClick={() => exportTranscription('docx')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
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
            >
              Votre navigateur ne supporte pas l'élément audio.
            </audio>
          </div>
        )}
        
        <div className="relative">
          <input
            type="text"
            placeholder="Rechercher dans la transcription..."
            className="w-full p-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg
            className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-gray-500"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        
        <div className="mt-4 max-h-[500px] overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md">
          {filteredLines.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredLines.map((line, index) => (
                <div
                  key={index}
                  ref={el => lineRefs.current[index] = el}
                  className={`p-3 ${currentTime >= line.timestampSeconds && (!filteredLines[index + 1] || currentTime < filteredLines[index + 1].timestampSeconds) 
                    ? 'bg-blue-50 dark:bg-blue-900/20' 
                    : ''}`}
                >
                  {editingIndex === index ? (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500 dark:text-gray-400 cursor-pointer" onClick={() => handleSeek(line.timestampSeconds)}>
                          {line.timestamp}
                        </span>
                        <input
                          type="text"
                          value={editSpeaker}
                          onChange={(e) => setEditSpeaker(e.target.value)}
                          className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        rows={3}
                      />
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={handleCancelEdit}
                          className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                          <XMarkIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                          <CheckIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span 
                            className="text-gray-500 dark:text-gray-400 cursor-pointer hover:text-blue-500 dark:hover:text-blue-400" 
                            onClick={() => handleSeek(line.timestampSeconds)}
                          >
                            {line.timestamp}
                          </span>
                          <span className="font-medium text-blue-600 dark:text-blue-400">{line.speaker}:</span>
                        </div>
                        <button
                          onClick={() => handleEdit(index)}
                          className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                          <PencilIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                      </div>
                      <p className="mt-1 text-gray-800 dark:text-gray-200">{line.text}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              {searchTerm ? 'Aucun résultat trouvé pour cette recherche.' : 'Aucune transcription disponible.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TranscriptionPanel;
