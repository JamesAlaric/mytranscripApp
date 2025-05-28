'use client';

import { DocumentDuplicateIcon } from '@heroicons/react/24/outline';

interface SummaryViewerProps {
  summary: string;
}

export default function SummaryViewer({ summary }: SummaryViewerProps) {
  return (
    <div className="border rounded-lg overflow-hidden shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-center gap-2 p-4 border-b dark:border-gray-700">
        <DocumentDuplicateIcon className="h-5 w-5 text-green-600" />
        <h2 className="text-lg font-semibold">Summary</h2>
      </div>
      <div className="p-4 h-[600px] overflow-y-auto whitespace-pre-wrap">
        {summary}
      </div>
    </div>
  );
}
