'use client';

import React from 'react';
import { DocumentDuplicateIcon, CheckCircleIcon, ClipboardDocumentListIcon, UserGroupIcon, ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface SummaryViewerProps {
  summary: string;
}

export default function SummaryViewer({ summary }: SummaryViewerProps) {
  // Check for error state first
  if (summary.startsWith('Error:') || summary.startsWith('Erreur:')) {
    return (
      <div className="border rounded-xl overflow-hidden shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
            <h2 className="text-lg font-semibold text-red-500">Summary Error</h2>
          </div>
        </div>
        <div className="p-6 h-[600px] overflow-y-auto">
          <p className="text-red-600 dark:text-red-400">{summary}</p>
        </div>
      </div>
    );
  }

  // Fonction pour parser et formater le résumé structuré
  const formatSummary = () => {
    if (!summary || summary.trim() === "") {
      return <p className="text-gray-500 dark:text-gray-400">No summary available.</p>;
    }

    // Diviser le résumé en sections
    const sections = summary.split('\n\n');
    const formattedSections = [];
    let hasRecognizedSection = false;
    
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i].trim();
      if (!section) continue;

      if (section.startsWith('📋 RÉSUMÉ EXÉCUTIF')) {
        hasRecognizedSection = true;
        formattedSections.push(
          <div key={`section-${i}`} className="mb-6">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-gray-800 dark:text-white">
              <span>📋</span> Résumé exécutif
            </h3>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
              {section.replace('📋 RÉSUMÉ EXÉCUTIF\n', '')}
            </p>
          </div>
        );
      } else if (section.startsWith('🎯 POINTS CLÉS DISCUTÉS')) {
        hasRecognizedSection = true;
        const points = section.replace('🎯 POINTS CLÉS DISCUTÉS\n', '').split('\n').map(p => p.trim()).filter(p => p);
        formattedSections.push(
          <div key={`section-${i}`} className="mb-6">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-gray-800 dark:text-white">
              <span>🎯</span> Points clés discutés
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300">
              {points.map((point, idx) => (
                <li key={idx}>{point.replace(/^•\s*/, '')}</li>
              ))}
            </ul>
          </div>
        );
      } else if (section.startsWith('✅ DÉCISIONS PRISES')) {
        hasRecognizedSection = true;
        const decisions = section.replace('✅ DÉCISIONS PRISES\n', '').split('\n').map(d => d.trim()).filter(d => d);
        formattedSections.push(
          <div key={`section-${i}`} className="mb-6">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-gray-800 dark:text-white">
              <CheckCircleIcon className="h-5 w-5 text-green-500" /> Décisions prises
            </h3>
            <ol className="list-decimal pl-5 space-y-1 text-gray-700 dark:text-gray-300">
              {decisions.map((decision, idx) => {
                const cleanedDecision = decision.replace(/^\d+\.\s*/, '');
                return <li key={idx}>{cleanedDecision}</li>;
              })}
            </ol>
          </div>
        );
      } else if (section.startsWith('📝 ACTIONS À SUIVRE')) {
        hasRecognizedSection = true;
        const actions = section.replace('📝 ACTIONS À SUIVRE\n', '').split('\n').map(a => a.trim()).filter(a => a);
        formattedSections.push(
          <div key={`section-${i}`} className="mb-6">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-gray-800 dark:text-white">
              <ClipboardDocumentListIcon className="h-5 w-5 text-blue-500" /> Actions à suivre
            </h3>
            <div className="space-y-2">
              {actions.map((action, idx) => {
                const match = action.match(/^- \[(.*?)\]: (.*?)(?:\s*-\s*\[(.*?)\])?$/);
                if (match) {
                  const [, person, task, deadline] = match;
                  return (
                    <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                      <div className="flex-1">
                        <div className="font-medium">{task}</div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded">{person}</span>
                          {deadline && <span className="text-gray-500">• Échéance: {deadline}</span>}
                        </div>
                      </div>
                    </div>
                  );
                }
                return <div key={idx} className="p-2">{action.replace(/^- \s*/, '')}</div>;
              })}
            </div>
          </div>
        );
      } else if (section.startsWith('👥 PARTICIPANTS IDENTIFIÉS')) {
        hasRecognizedSection = true;
        const participants = section.replace('👥 PARTICIPANTS IDENTIFIÉS\n', '');
        formattedSections.push(
          <div key={`section-${i}`} className="mb-6">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-gray-800 dark:text-white">
              <UserGroupIcon className="h-5 w-5 text-purple-500" /> Participants
            </h3>
            <div className="flex flex-wrap gap-2">
              {participants.split(', ').map((participant, idx) => (
                <span key={idx} className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-gray-800 dark:text-gray-200">
                  {participant.trim()}
                </span>
              ))}
            </div>
          </div>
        );
      } else if (section.startsWith('⏭️ PROCHAINES ÉTAPES')) {
        hasRecognizedSection = true;
        formattedSections.push(
          <div key={`section-${i}`} className="mb-6">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-gray-800 dark:text-white">
              <ArrowPathIcon className="h-5 w-5 text-orange-500" /> Prochaines étapes
            </h3>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
              {section.replace('⏭️ PROCHAINES ÉTAPES\n', '')}
            </p>
          </div>
        );
      } else {
        // For any other non-empty section not recognized
        formattedSections.push(
          <div key={`section-${i}`} className="mb-6">
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{section}</p>
          </div>
        );
      }
    }
    
    // If no sections were recognized (e.g. plain text summary), display the whole summary as pre-line text
    if (!hasRecognizedSection && summary.trim()) {
      return <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{summary}</p>;
    }

    return formattedSections.length > 0 ? formattedSections : <p className="text-gray-500 dark:text-gray-400">Summary content is empty or not in a recognized format.</p>;
  };

  return (
    <div className="border rounded-xl overflow-hidden shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
        <div className="flex items-center gap-2">
          <DocumentDuplicateIcon className="h-5 w-5 text-green-600" />
          <h2 className="text-lg font-semibold">Résumé</h2>
        </div>
      </div>
      <div className="p-6 h-[600px] overflow-y-auto">
        {formatSummary()}
      </div>
    </div>
  );
}
