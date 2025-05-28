/**
 * Summarizer service that uses the free Hugging Face Inference API
 * to generate meeting summaries from transcriptions.
 */

const HUGGING_FACE_INFERENCE_API = 'https://api-inference.huggingface.co/models/google/flan-t5-xl';

/**
 * Generate a structured meeting summary from a transcription
 * @param transcription The meeting transcription text
 * @returns A structured summary of the meeting
 */
export async function generateSummary(transcription: string): Promise<string> {
  try {
    // For development/demo purposes, the mock summary logic below is commented out.
    // The actual API call is now active.
    
    // Simulate API delay - COMMENTED OUT
    // await new Promise(resolve => setTimeout(resolve, 2000)); 
    
    // Create a structured summary based on the transcription content - COMMENTED OUT
    // const summary = createStructuredSummary(transcription);
    // return summary;
    
    // --- HUGGING FACE API CALL ---
    console.warn("IMPORTANT: Replace 'Bearer YOUR_HUGGING_FACE_TOKEN' in app/services/summarizer.ts with your actual Hugging Face API token for summarization to work.");
    const prompt = `
      Summarize the following meeting transcript into a structured format:
      
      ${transcription.substring(0, 4000)}
      
      Format the summary with these sections:
      - Executive Summary (2-3 sentences)
      - Key Points Discussed (bullet points)
      - Decisions Made (numbered list)
      - Action Items (who does what by when)
      - Participants (if identifiable)
      - Next Steps
    `;
    
    const response = await fetch(HUGGING_FACE_INFERENCE_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // IMPORTANT: Replace with your actual Hugging Face API token
        'Authorization': 'Bearer YOUR_HUGGING_FACE_TOKEN' 
      },
      body: JSON.stringify({ inputs: prompt }),
    });
    
    if (!response.ok) {
      const errorBody = await response.text(); // Try to get more error info
      console.error('API Error Response Body:', errorBody);
      throw new Error(`API error: ${response.status} ${response.statusText}. Details: ${errorBody}`);
    }
    
    const result = await response.json();
    if (result && result[0] && result[0].generated_text) {
      return formatSummary(result[0].generated_text);
    } else {
      console.error('Unexpected API response structure:', result);
      throw new Error('Failed to parse summary from API response.');
    }
    // --- END HUGGING FACE API CALL ---

  } catch (error) {
    console.error('Error in generateSummary:', error);
    if (error instanceof Error) {
      return `Error generating summary: ${error.message}`;
    }
    return 'An unknown error occurred while generating the summary.';
  }
}

/**
 * Creates a structured summary from the transcription
 * This is a placeholder function that extracts key information
 * In a real implementation, this would be handled by the AI model
 */
function createStructuredSummary(transcription: string): string {
  // Extract speakers
  const speakerMatches = transcription.match(/Speaker \d+/g) || [];
  // Convert Set to Array to avoid TypeScript iteration issues
  const speakers = Array.from(new Set(speakerMatches));
  
  // Extract potential action items (sentences with future tense)
  const sentences = transcription.split(/[.!?]+/);
  const actionItems = sentences
    .filter(sentence => 
      sentence.toLowerCase().includes('will') || 
      sentence.toLowerCase().includes('should') ||
      sentence.toLowerCase().includes('need to') ||
      sentence.toLowerCase().includes('going to')
    )
    .map(sentence => sentence.trim())
    .filter(sentence => sentence.length > 10)
    .slice(0, 3);
  
  // Create a structured summary
  return `📋 RÉSUMÉ EXÉCUTIF
${transcription.length > 200 
  ? transcription.substring(0, 200).trim() + '...' 
  : transcription}

🎯 POINTS CLÉS DISCUTÉS
• Discussion des sujets principaux de la réunion
• Examen des progrès et des défis actuels
${transcription.includes('project') ? '• Mise à jour sur l\'état du projet' : ''}

✅ DÉCISIONS PRISES
1. Continuer avec les plans actuels
${actionItems.length > 0 ? `2. ${actionItems[0]}` : ''}

📝 ACTIONS À SUIVRE
${actionItems.map((item, index) => `- [Membre de l'équipe]: ${item}`).join('\n')}
${actionItems.length === 0 ? '- [Tous]: Réviser les notes de la réunion et partager les commentaires' : ''}

👥 PARTICIPANTS IDENTIFIÉS
${speakers.length > 0 ? speakers.join(', ') : 'Participants non identifiés dans la transcription'}

⏭️ PROCHAINES ÉTAPES
Planifier une réunion de suivi pour évaluer les progrès
`;
}

/**
 * Formats the raw summary into a structured format
 */
function formatSummary(rawSummary: string): string {
  // Add emojis and formatting to the summary sections
  let formattedSummary = rawSummary
    .replace(/Executive Summary/i, '📋 RÉSUMÉ EXÉCUTIF')
    .replace(/Key Points/i, '🎯 POINTS CLÉS DISCUTÉS')
    .replace(/Decisions/i, '✅ DÉCISIONS PRISES')
    .replace(/Action Items/i, '📝 ACTIONS À SUIVRE')
    .replace(/Participants/i, '👥 PARTICIPANTS IDENTIFIÉS')
    .replace(/Next Steps/i, '⏭️ PROCHAINES ÉTAPES');
  
  return formattedSummary;
}
