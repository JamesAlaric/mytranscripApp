'use client';

import React from 'react';
import { DocumentDuplicateIcon, CheckCircleIcon, ClipboardDocumentListIcon, UserGroupIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface SummaryViewerProps {
  summary: string;
}

export default function SummaryViewer({ summary }: SummaryViewerProps) {
  // Fonction pour parser et formater le résumé structuré
  const formatSummary = () => {
    // Diviser le résumé en sections
    const sections = summary.split('\n\n');
    const formattedSections = [];
    
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      
      if (section.startsWith('📋 RÉSUMÉ EXÉCUTIF')) {
        formattedSections.push(
          <div key={`section-${i}`} className="mb-6">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-gray-800 dark:text-white">
              <span>📋</span> Résumé exécutif
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              {section.replace('📋 RÉSUMÉ EXÉCUTIF\n', '')}
            </p>
          </div>
        );
      } else if (section.startsWith('🎯 POINTS CLÉS DISCUTÉS')) {
        const points = section.replace('🎯 POINTS CLÉS DISCUTÉS\n', '').split('\n');
        formattedSections.push(
          <div key={`section-${i}`} className="mb-6">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-gray-800 dark:text-white">
              <span>🎯</span> Points clés discutés
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300">
              {points.map((point, idx) => (
                <li key={idx}>{point.replace('• ', '')}</li>
              ))}
            </ul>
          </div>
        );
      } else if (section.startsWith('✅ DÉCISIONS PRISES')) {
        const decisions = section.replace('✅ DÉCISIONS PRISES\n', '').split('\n');
        formattedSections.push(
          <div key={`section-${i}`} className="mb-6">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-gray-800 dark:text-white">
              <CheckCircleIcon className="h-5 w-5 text-green-500" /> Décisions prises
            </h3>
            <ol className="list-decimal pl-5 space-y-1 text-gray-700 dark:text-gray-300">
              {decisions.map((decision, idx) => {
                // Enlever le numéro au début (ex: "1. ")
                const cleanedDecision = decision.replace(/^\d+\.\s*/, '');
                return <li key={idx}>{cleanedDecision}</li>;
              })}
            </ol>
          </div>
        );
      } else if (section.startsWith('📝 ACTIONS À SUIVRE')) {
        const actions = section.replace('📝 ACTIONS À SUIVRE\n', '').split('\n');
        formattedSections.push(
          <div key={`section-${i}`} className="mb-6">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-gray-800 dark:text-white">
              <ClipboardDocumentListIcon className="h-5 w-5 text-blue-500" /> Actions à suivre
            </h3>
            <div className="space-y-2">
              {actions.map((action, idx) => {
                // Extraire la personne responsable et l'échéance si disponible
                const match = action.match(/- \[(.*?)\]: (.*?)(?:\s*-\s*\[(.*?)\])?$/);
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
                return <div key={idx} className="p-2">{action.replace('- ', '')}</div>;
              })}
            </div>
          </div>
        );
      } else if (section.startsWith('👥 PARTICIPANTS IDENTIFIÉS')) {
        const participants = section.replace('👥 PARTICIPANTS IDENTIFIÉS\n', '');
        formattedSections.push(
          <div key={`section-${i}`} className="mb-6">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-gray-800 dark:text-white">
              <UserGroupIcon className="h-5 w-5 text-purple-500" /> Participants
            </h3>
            <div className="flex flex-wrap gap-2">
              {participants.split(', ').map((participant, idx) => (
                <span key={idx} className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-gray-800 dark:text-gray-200">
                  {participant}
                </span>
              ))}
            </div>
          </div>
        );
      } else if (section.startsWith('⏭️ PROCHAINES ÉTAPES')) {
        formattedSections.push(
          <div key={`section-${i}`} className="mb-6">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-gray-800 dark:text-white">
              <ArrowPathIcon className="h-5 w-5 text-orange-500" /> Prochaines étapes
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              {section.replace('⏭️ PROCHAINES ÉTAPES\n', '')}
            </p>
          </div>
        );
      } else {
        // Pour toute autre section non reconnue
        formattedSections.push(
          <div key={`section-${i}`} className="mb-6">
            <p className="text-gray-700 dark:text-gray-300">{section}</p>
          </div>
        );
      }
    }
    
    return formattedSections;
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
