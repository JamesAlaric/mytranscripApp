'use client';

import React, { useMemo, useEffect, useRef } from 'react';
import { DocumentTextIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface ParsedLine {
  time: number | null;
  speaker?: string;
  text: string;
  originalLine: string;
}

interface TranscriptionViewerProps {
  transcription: string;
  currentTime: number;
  onSeek: (time: number) => void;
  isEditing: boolean;
  onLineTextChange: (lineIndex: number, newText: string) => void;
  // TODO: Consider onLineSpeakerChange if speaker editing is also required
}

// Helper function to parse a single line of transcription
const parseLine = (line: string): ParsedLine => {
  // Try to match "[MM:SS] Speaker: Text"
  const speakerMatch = line.match(/^\[(\d{2}):(\d{2})\]\s*([^:]+):\s*(.*)/);
  if (speakerMatch) {
    const minutes = parseInt(speakerMatch[1], 10);
    const seconds = parseInt(speakerMatch[2], 10);
    return {
      time: minutes * 60 + seconds,
      speaker: speakerMatch[3].trim(),
      text: speakerMatch[4].trim(),
      originalLine: line,
    };
  }

  // Try to match "[MM:SS] Text"
  const simpleTimestampMatch = line.match(/^\[(\d{2}):(\d{2})\]\s*(.*)/);
  if (simpleTimestampMatch) {
    const minutes = parseInt(simpleTimestampMatch[1], 10);
    const seconds = parseInt(simpleTimestampMatch[2], 10);
    return {
      time: minutes * 60 + seconds,
      text: simpleTimestampMatch[3].trim(),
      originalLine: line,
    };
  }

  // Line without a recognizable timestamp
  return { time: null, text: line, originalLine: line };
};

export default function TranscriptionViewer({ 
  transcription, 
  currentTime, 
  onSeek,
  isEditing,
  onLineTextChange 
}: TranscriptionViewerProps) {
  
  const [editingStates, setEditingStates] = React.useState<Record<number, string>>({});

  const parsedLines = useMemo(() => {
    return transcription.split('\n').map(parseLine);
  }, [transcription]);

  const handleTextChange = (index: number, newText: string) => {
    setEditingStates(prev => ({ ...prev, [index]: newText }));
  };

  const handleTextBlur = (index: number) => {
    if (editingStates[index] !== undefined && editingStates[index] !== parsedLines[index].text) {
      onLineTextChange(index, editingStates[index]);
    }
    // Clear the specific editing state to revert to prop truth or keep it if you want sticky edits until next prop change
    // For simplicity, we let `parsedLines` (from prop) be the source of truth after blur.
    // If onLineTextChange updates the parent, transcription prop will change, re-rendering.
  };
  
  const activeLineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentTime]); // Re-evaluate when currentTime changes and an active line is set

  const findActiveLineIndex = () => {
    let activeIdx = -1;
    for (let i = 0; i < parsedLines.length; i++) {
      const line = parsedLines[i];
      if (line.time !== null && line.time <= currentTime) {
        const nextLine = parsedLines[i + 1];
        if (nextLine && nextLine.time !== null) {
          if (nextLine.time > currentTime) {
            activeIdx = i;
            break;
          }
        } else {
          // This is the last timed line, or subsequent lines are not timed
          activeIdx = i;
          // If it's the very last line or subsequent lines have no time, it remains active.
          // If there's a next line but it has no time, the current one is still the last "timed" active
        }
      } else if (line.time !== null && line.time > currentTime) {
        // The first line whose time is greater than currentTime, so no line is active yet, or previous was active
        break;
      }
    }
     // If no line is active based on time (e.g. currentTime is before the first timestamp),
     // and we have lines, mark the first line with a timestamp as "next up" or default.
     // For now, we only highlight if time condition is met.
    return activeIdx;
  };

  const activeLineIndex = findActiveLineIndex();

  return (
    <div className="border rounded-xl overflow-hidden shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
        <div className="flex items-center gap-2">
          <DocumentTextIcon className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold">Transcription</h2>
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-500" />
          </div>
          <input 
            type="text" 
            className="pl-10 pr-4 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500 outline-none" 
            placeholder="Rechercher..." 
            // TODO: Implement search functionality if needed
          />
        </div>
      </div>
      <div className="p-6 h-[600px] overflow-y-auto">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {parsedLines.map((line, index) => {
            const isActive = index === activeLineIndex;
            const lineRef = isActive ? activeLineRef : null;

            return (
              <div 
                key={index} 
                ref={lineRef}
                className={`mb-2 p-1 rounded ${
                  isActive ? 'bg-blue-100 dark:bg-blue-900' : ''
                } ${!isEditing && line.time !== null ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700' : ''}`}
                onClick={() => {
                  if (!isEditing && line.time !== null) {
                    onSeek(line.time);
                  }
                }}
              >
                {line.speaker && (
                  <span className="font-semibold text-blue-600 dark:text-blue-400 mr-1">
                    {line.speaker}:
                  </span>
                )}
                {isEditing ? (
                  <input
                    type="text"
                    value={editingStates[index] !== undefined ? editingStates[index] : line.text}
                    onChange={(e) => handleTextChange(index, e.target.value)}
                    onBlur={() => handleTextBlur(index)}
                    className="w-full bg-transparent border-b border-blue-500 dark:border-blue-400 focus:outline-none"
                    // Prevent click propagation to the div's onSeek when input is focused/clicked
                    onClick={(e) => e.stopPropagation()} 
                  />
                ) : (
                  <span>{line.text}</span>
                )}
                {/* Timestamp could be displayed if needed, but kept out for cleaner editing UI */}
                {/* {line.time !== null && <span className="text-xs text-gray-400 ml-2">({formatTimestamp(line.time)})</span>} */}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
