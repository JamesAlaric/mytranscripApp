import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  return [
    hours > 0 ? String(hours).padStart(2, '0') : null,
    String(minutes).padStart(2, '0'),
    String(secs).padStart(2, '0')
  ]
    .filter(Boolean)
    .join(':');
}

export function parseTimestamp(timestamp: string): number | null {
  // Match formats like [00:00:00] or [00:00]
  const match = timestamp.match(/\[(\d{1,2}):(\d{2})(?::(\d{2}))?\]/);
  
  if (!match) return null;
  
  const hours = match[3] ? parseInt(match[1], 10) : 0;
  const minutes = match[3] ? parseInt(match[2], 10) : parseInt(match[1], 10);
  const seconds = match[3] ? parseInt(match[3], 10) : parseInt(match[2], 10);
  
  return hours * 3600 + minutes * 60 + seconds;
}

export function extractSpeakerAndText(line: string): { speaker: string; text: string; timestamp: string } | null {
  // Match format like "[00:00:00] Speaker: Text" or "[00:00] Speaker: Text"
  const match = line.match(/(\[\d{1,2}:\d{2}(?::\d{2})?\])\s*([^:]+):\s*(.*)/);
  
  if (!match) return null;
  
  return {
    timestamp: match[1],
    speaker: match[2].trim(),
    text: match[3].trim()
  };
}

export function downloadTextFile(filename: string, text: string) {
  const element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}
