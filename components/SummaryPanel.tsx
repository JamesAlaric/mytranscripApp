import React, { useState, useEffect } from 'react';
import { ArrowDownTrayIcon, CheckCircleIcon, ClipboardDocumentListIcon, UserGroupIcon } from '@heroicons/react/24/outline';

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
  const [parsedSummary, setParsedSummary] = useState<{
    mainPoints: string[];
    actionItems: string[];
    speakers: string[];
  } | null>(null);
  const [showExportOptions, setShowExportOptions] = useState(false);
  
  useEffect(() => {
    if (summary) {
      try {
        const parsed = JSON.parse(summary);
        setParsedSummary(parsed);
      } catch (error) {
        console.error('Error parsing summary:', error);
        setParsedSummary(null);
      }
    } else {
      setParsedSummary(null);
    }
  }, [summary]);
  
  const exportSummary = (format: 'txt' | 'pdf' | 'docx') => {
    if (!parsedSummary) return;
    
    const content = `
RÉSUMÉ DE LA RÉUNION

POINTS PRINCIPAUX:
${parsedSummary.mainPoints.map((point, i) => `${i + 1}. ${point}`).join('\n')}

ACTIONS À ENTREPRENDRE:
${parsedSummary.actionItems.map((item, i) => `${i + 1}. ${item}`).join('\n')}

PARTICIPANTS:
${parsedSummary.speakers.map((speaker, i) => `${i + 1}. ${speaker}`).join('\n')}
    `;
    
    if (format === 'txt') {
      const element = document.createElement('a');
      const file = new Blob([content], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = `resume_reunion_${new Date().toISOString().split('T')[0]}.txt`;
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
          <title>Résumé de la réunion</title>
          <style>
            body { font-family: 'Poppins', Arial, sans-serif; line-height: 1.6; padding: 20px; }
            h1, h2 { color: #333; }
            ul { padding-left: 20px; }
            .section { margin-bottom: 20px; }
            .icon { color: #0066cc; margin-right: 10px; }
          </style>
        </head>
        <body>
          <h1>Résumé de la réunion</h1>
          
          <div class="section">
            <h2><span class="icon">📌</span> Points principaux</h2>
            <ul>
              ${parsedSummary.mainPoints.map(point => `<li>${point}</li>`).join('')}
            </ul>
          </div>
          
          <div class="section">
            <h2><span class="icon">✅</span> Actions à entreprendre</h2>
            <ul>
              ${parsedSummary.actionItems.map(item => `<li>${item}</li>`).join('')}
            </ul>
          </div>
          
          <div class="section">
            <h2><span class="icon">👥</span> Participants</h2>
            <ul>
              ${parsedSummary.speakers.map(speaker => `<li>${speaker}</li>`).join('')}
            </ul>
          </div>
          
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
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Résumé</h2>
        
        {parsedSummary && (
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
                    onClick={() => exportSummary('txt')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    Exporter en TXT
                  </button>
                  <button
                    onClick={() => exportSummary('pdf')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    Exporter en PDF
                  </button>
                  <button
                    onClick={() => exportSummary('docx')}
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
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Cela peut prendre quelques instants</p>
        </div>
      ) : parsedSummary ? (
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="flex items-center mb-3">
              <ClipboardDocumentListIcon className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-2" />
              <h3 className="text-xl font-medium text-gray-800 dark:text-white">Points principaux</h3>
            </div>
            <ul className="list-disc pl-6 space-y-2">
              {parsedSummary.mainPoints.map((point, index) => (
                <li key={index} className="text-gray-700 dark:text-gray-300">{point}</li>
              ))}
            </ul>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <div className="flex items-center mb-3">
              <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400 mr-2" />
              <h3 className="text-xl font-medium text-gray-800 dark:text-white">Actions à entreprendre</h3>
            </div>
            <ul className="list-disc pl-6 space-y-2">
              {parsedSummary.actionItems.map((item, index) => (
                <li key={index} className="text-gray-700 dark:text-gray-300">{item}</li>
              ))}
            </ul>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <div className="flex items-center mb-3">
              <UserGroupIcon className="w-6 h-6 text-purple-600 dark:text-purple-400 mr-2" />
              <h3 className="text-xl font-medium text-gray-800 dark:text-white">Participants</h3>
            </div>
            <ul className="list-disc pl-6 space-y-2">
              {parsedSummary.speakers.map((speaker, index) => (
                <li key={index} className="text-gray-700 dark:text-gray-300">{speaker}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
            Aucun résumé n'a encore été généré.
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
