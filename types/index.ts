export interface AudioFile {
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface TranscriptionLine {
  timestamp: string;
  timestampSeconds: number;
  speaker: string;
  text: string;
  original?: string;
}

export interface Summary {
  mainPoints: string[];
  actionItems: string[];
  speakers: string[];
}

export interface ExportOptions {
  format: 'txt' | 'pdf' | 'docx';
  content: 'transcription' | 'summary';
}
