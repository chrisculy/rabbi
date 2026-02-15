/**
 * Discussion Guide Generator using Google Gemini AI
 * Generates small group discussion guides from sermon transcripts
 */

import { GoogleGenAI } from '@google/genai';

/**
 * Generate a discussion guide from a sermon transcript using Google Gemini AI
 * @param transcript - The sermon transcript text
 * @returns Promise<string> - Markdown formatted discussion guide
 */
export async function generateGuide(transcript: string): Promise<string> {
  console.log('[GuideGenerator] Starting guide generation');
  console.log('[GuideGenerator] Transcript length:', transcript.length);

  if (!transcript || transcript.trim().length === 0) {
    throw new Error('Transcript cannot be empty');
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }

  try {
    // Initialize Google GenAI client
    const ai = new GoogleGenAI({ apiKey });

    // Create the prompt
    const prompt = createDiscussionGuidePrompt(transcript);

    console.log('[GuideGenerator] Sending request to Gemini API...');

    // Generate content with Gemini
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.8,
      },
    });

    let markdown = response.text;

    if (!markdown) {
      throw new Error('Gemini API returned empty response');
    }

    console.log('[GuideGenerator] Received response from Gemini API');
    console.log('[GuideGenerator] Raw markdown length:', markdown.length);

    // Format and clean the markdown
    markdown = formatMarkdown(markdown);

    console.log('[GuideGenerator] Formatted markdown length:', markdown.length);
    console.log('[GuideGenerator] Guide generation complete');

    return markdown;
  } catch (error) {
    console.error('[GuideGenerator] Error generating guide:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate guide: ${error.message}`);
    }
    throw new Error('Failed to generate guide: Unknown error');
  }
}

/**
 * Create the prompt for generating a discussion guide
 * @param transcript - The sermon transcript
 * @returns The formatted prompt string
 */
function createDiscussionGuidePrompt(transcript: string): string {
  return `Based on the following sermon transcript, create a small group leader discussion guide suitable for a 20-40 minute discussion.

The guide should follow the SOAP structure (Scripture, Observation, Application, Prayer) and include the following elements:

A title in the format "Small Group Discussion Guide: [Sermon Passage]"

1. Scripture:
    a. a brief summary of the sermon passage (focus more on summarizing the sermon's passage than the sermon itself) (2-3 sentences)
    b. Key themes and scripture references mentioned
3. Observation:
    a. 5-7 thoughtful discussion questions that:
        - Help participants reflect on the sermon's passage
        - Connect the sermon and its passage to personal application
        - Encourage deeper theological exploration
        - Foster group conversation
         - Aid in answering the following questions each week (but can phrase differently as needed for the particular sermon passage):
            1. What do we learn about God?
            2. What do we learn about humanity?
            3. What is God inviting us to believe or obey in this passage?
4. Application:
    a. A practical application challenge for the week
5. Prayer:
    a. Suggested closing prayer points

Lay out the guide in a clear, easy-to-read structure that a small group leader can follow. Please do not reference the structure of the guide in the guide itself (e.g. "This guide is intended for a 20-40 minute discussion", "Use this guide to facilitate conversation", etc.)

Please note that the sermon transcript may include some announcements at the beginning and an invitation to respond at the end; focus on the main sermon content.

The output must be in Markdown format.

BEGIN SERMON TRANSCRIPT.

${transcript}

END SERMON TRANSCRIPT.
Please provide a well-structured discussion guide.`;
}

/**
 * Format and clean markdown output
 * @param markdown - Raw markdown text from Gemini
 * @returns Formatted markdown string
 */
function formatMarkdown(markdown: string): string {
  // Remove any leading/trailing whitespace
  let formatted = markdown.trim();

  // Ensure all ordered and unordered lists have a single space after the marker
  // Only modify lists that have MORE than one space after the marker
  formatted = formatted.replace(/^(\s*[*\-+])\s{2,}/gm, '$1 ');
  formatted = formatted.replace(/^(\s*\d+\.)\s{2,}/gm, '$1 ');

  // Ensure there is a blank line before each heading (only if not already present)
  formatted = formatted.replace(/(?<!\n)\n(#{1,6}\s)/g, '\n\n$1');

  // Ensure there is a blank line after each heading
  formatted = formatted.replace(/(#{1,6}\s[^\n]+)\n(?!\n)/g, '$1\n\n');

  // Remove any excessive blank lines (more than 2 consecutive newlines)
  formatted = formatted.replace(/\n{3,}/g, '\n\n');

  return formatted;
}
