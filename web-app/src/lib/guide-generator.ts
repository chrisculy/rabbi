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
export async function generateGuide(biblePassages: string, transcript: string): Promise<string> {
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

    // Summarize the sermon transcript first to allow guide creation to focus more on the Bible passages themselves.
    const sermonSummaryPrompt = `Summarize the following sermon transcript in 1-2 paragraphs, focusing on interpretation and application of the primary Bible passage.

    Please note that the sermon transcript may include some announcements at the beginning and an invitation to respond at the end; focus on the main sermon content.

    The summary should be in plain text with no formatting.

BEGIN SERMON TRANSCRIPT.
${transcript}
END SERMON TRANSCRIPT.`;

    console.log('[GuideGenerator] Generating sermon summary for guide generation prompt:');

    const sermonSummaryResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: sermonSummaryPrompt,
      config: {
        temperature: 0.8,
      },
    });

    const sermonSummary = sermonSummaryResponse.text;
    if (!sermonSummary) {
      throw new Error('Gemini API returned empty sermon summary');
    }

    // Create the prompt
    const prompt = createDiscussionGuidePrompt(biblePassages, sermonSummary);

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
 * @param biblePassages - The Bible passages
 * @param summary - The sermon summary
 * @returns The formatted prompt string
 */
function createDiscussionGuidePrompt(biblePassages: string, summary: string): string {
  return `Based on the following Bible passages (and using the sermon summary as an interpretive and application reference) create a small group leader discussion guide suitable for a 20-40 minute discussion. Most of the guide should be written at a 5th-7th grade reading level, except for the questions section which has specific guidance below.

The guide should follow the SOAP structure (Scripture, Observation, Application, Prayer) and include the following elements:

A title in the format "Small Group Discussion Guide: [Primary Bible Passage]"

1. Scripture:
    a. a brief summary of the primary Bible passage(s) (do not use the sermon content for this summary) (2-3 sentences)
    b. Key themes and, if applicable, secondary scripture references
3. Observation:
    a. 3-5 thoughtful discussion questions aimed at younger Christians, framed at the 5th-7th grade reading level followed by a horizontal line and then 3-5 thoughtful discussion question aimed at more mature believers, framed at a high school reading level. The questions should be approximately 40% comprehension and 60% practical application. The questions should be designed so that they:
        - Help participants reflect on the Bible passage(s)
        - Connect the Bible passage(s) to personal application
        - Encourage deeper theological exploration
        - Foster group conversation
        - Aid in answering the following questions each week (but don't use these questions verbatim; adapt appropriately for the particular Bible passage(s)):
          1. What do we learn about God?
          2. What do we learn about humanity?
          3. What is God inviting us to believe or obey in this passage?
4. Application:
    a. A practical application challenge for the week
5. Prayer:
    a. Suggested closing prayer points

Lay out the guide in a clear, easy-to-read structure that a small group leader can follow. Please do not reference the structure of the guide in the guide itself (e.g. "This guide is intended for a 20-40 minute discussion", "Use this guide to facilitate conversation", etc.)

The output must be in Markdown format. Do not use quotation marks around text unless you are quoting scripture directly.

BEGIN BIBLE PASSAGES.

${biblePassages}

END BIBLE PASSAGES.

BEGIN SERMON SUMMARY.

${summary}

END SERMON SUMMARY.`;
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
