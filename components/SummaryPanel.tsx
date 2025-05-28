import React, { useState } from 'react'; // Removed useEffect as it's no longer used
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'; // Removed unused icons
import SummaryViewer from './SummaryViewer'; // Ensure SummaryViewer is imported
import { downloadTextFile } from '../lib/utils'; // Import the utility

interface SummaryPanelProps {
  summary: string;
  isGenerating: boolean;
  onGenerateSummary: () => void;
}

const SummaryPanel: React.FC<SummaryPanelProps> = ({
  summary,
  isGenerating,
  onGenerateSummary
}) => {
  // parsedSummary state and useEffect for JSON.parse are removed.
  const [showExportOptions, setShowExportOptions] = useState(false);
  
  const handleExportSummary = (format: 'txt' | 'pdf' | 'docx') => {
    if (!summary || summary.startsWith("Error:") || summary.startsWith("Erreur:")) {
      alert("Impossible d'exporter un résumé vide ou une erreur.");
      return;
    }
    
    const filenameBase = `summary_${new Date().toISOString().split('T')[0]}`;
    
    if (format === 'txt') {
      downloadTextFile(`${filenameBase}.txt`, summary);
    } else if (format === 'pdf') {
      alert('L\'exportation PDF du résumé n\'est pas entièrement implémentée. Exportation en TXT à la place.');
      downloadTextFile(`${filenameBase}_fallback.txt`, summary); // Fallback to TXT
    } else if (format === 'docx') {
      alert('Export DOCX non implémenté. Utilisez TXT pour le moment.');
      // Optionally, could call downloadTextFile as a fallback:
      // downloadTextFile(`${filenameBase}_fallback.txt`, summary);
    }
    setShowExportOptions(false);
  };
  
  const isErrorSummary = summary.startsWith("Error:") || summary.startsWith("Erreur:");

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Résumé</h2>
        
        {summary && !isErrorSummary && (
          <div className="relative">
            <button
              onClick={() => setShowExportOptions(!showExportOptions)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center disabled:opacity-50"
              disabled={isGenerating} // Disable export if summary is currently being generated
            >
              <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
              Exporter
            </button>
            
            {showExportOptions && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg z-10">
                <div className="py-1">
                  <button
                    onClick={() => handleExportSummary('txt')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    Exporter en TXT
                  </button>
                  <button
                    onClick={() => handleExportSummary('pdf')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    Exporter en PDF
                  </button>
                  <button
                    onClick={() => handleExportSummary('docx')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    Exporter en DOCX
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {isGenerating ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-300">Génération du résumé en cours...</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Cela peut prendre quelques instants.</p>
        </div>
      ) : summary ? ( // If there is a summary string (could be actual summary or error message)
        <SummaryViewer summary={summary} />
      ) : ( // No summary and not generating
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
            Aucun résumé n'a encore été généré ou la transcription est vide.
          </p>
          <button
            onClick={onGenerateSummary}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            Générer le résumé
          </button>
        </div>
      )}
    </div>
  );
};

export default SummaryPanel;
