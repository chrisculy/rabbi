/**
 * Transcript Fetcher Module
 * Handles fetching transcripts from YouTube videos and parsing local transcript files
 */

import { YoutubeTranscript } from 'youtube-transcript';

export interface TranscriptResult {
  title: string;
  transcript: string;
  date?: string;
}

/**
 * Extract video ID from various YouTube URL formats
 * @param youtubeUrl - YouTube video URL
 * @returns Video ID string
 */
function extractVideoId(youtubeUrl: string): string {
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?]+)/,
  ];

  for (const pattern of patterns) {
    const match = youtubeUrl.match(pattern);
    if (match) {
      return match[1];
    }
  }

  // If no pattern matches, assume it's already a video ID
  return youtubeUrl;
}

/**
 * Fetch video metadata from YouTube (title and publish date)
 * @param videoId - YouTube video ID
 * @returns Promise<{title: string, date?: string}>
 */
async function fetchYoutubeMetadata(videoId: string): Promise<{ title: string; date?: string }> {
  try {
    // Use oEmbed API to get basic metadata
    const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);

    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      title: data.title || 'Unknown Title',
      date: undefined, // oEmbed doesn't provide publish date
    };
  } catch (error) {
    console.error('[TranscriptFetcher] Error fetching metadata:', error);
    // Return a default if metadata fetch fails
    return {
      title: `Video ${videoId}`,
      date: undefined,
    };
  }
}

/**
 * Fetch transcript from a YouTube video
 * @param videoUrl - YouTube video URL
 * @returns Promise<TranscriptResult> - Object containing title, transcript, and optional date
 */
export async function fetchYoutubeTranscript(videoUrl: string): Promise<TranscriptResult> {
  console.log('[TranscriptFetcher] Fetching YouTube transcript...');

  const videoId = extractVideoId(videoUrl);
  console.log(`[TranscriptFetcher] Video ID: ${videoId}`);

  try {
    // Fetch transcript using youtube-transcript package
    const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);

    if (!transcriptItems || transcriptItems.length === 0) {
      throw new Error('No transcript found for this video');
    }

    // Extract text from transcript items
    const transcriptText = transcriptItems
      .map((item) => item.text)
      .join(' ')
      .trim();

    console.log(`[TranscriptFetcher] ✓ Transcript retrieved (${transcriptText.length} characters)`);

    // Fetch metadata
    const metadata = await fetchYoutubeMetadata(videoId);

    return {
      title: metadata.title,
      transcript: transcriptText,
      date: metadata.date,
    };
  } catch (error) {
    console.error('[TranscriptFetcher] Error fetching transcript:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to fetch YouTube transcript: ${error.message}`);
    }
    throw new Error('Failed to fetch YouTube transcript: Unknown error');
  }
}

/**
 * Parse date from filename (format: MM.DD.YY)
 * @param filename - Filename that might contain a date
 * @returns Date string in ISO format or undefined
 */
function parseDateFromFilename(filename: string): string | undefined {
  const dateMatch = filename.match(/(\d{2})\.(\d{2})\.(\d{2})/);
  if (dateMatch) {
    const month = dateMatch[1];
    const day = dateMatch[2];
    const year = `20${dateMatch[3]}`; // Convert YY to YYYY

    try {
      const date = new Date(`${year}-${month}-${day}`);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    } catch {
      // Invalid date, continue
    }
  }
  return undefined;
}

/**
 * Read and parse transcript from a local text file
 *
 * Expected format: 4-tuples where each tuple consists of:
 * - Line 1: Timestamp range
 * - Line 2: Speaker
 * - Line 3: Transcript text
 * - Line 4: Blank line
 *
 * @param fileContent - Content of the transcript file
 * @param filename - Name of the file (used for extracting title and date)
 * @returns Promise<TranscriptResult> - Object containing title, transcript, and optional date
 */
export async function readLocalTranscript(
  fileContent: string,
  filename: string
): Promise<TranscriptResult> {
  console.log('[TranscriptFetcher] Reading local transcript file...');

  try {
    const lines = fileContent.split(/\r?\n/);

    // Parse 4-tuples and extract transcript text (every 3rd line in groups of 4)
    const transcriptLines: string[] = [];
    for (let i = 0; i < lines.length; i += 4) {
      if (i + 2 < lines.length) {
        // 3rd line (index 2) is the transcript text
        const transcriptText = lines[i + 2].trim();
        if (transcriptText) {
          // Only add non-empty lines
          transcriptLines.push(transcriptText);
        }
      }
    }

    const transcript = transcriptLines.join('\n');

    if (!transcript || transcript.length === 0) {
      throw new Error('No transcript content found in file');
    }

    console.log(`[TranscriptFetcher] ✓ Transcript loaded from file (${transcript.length} characters)`);

    // Use filename (without extension) as title
    const title = filename.replace(/\.[^/.]+$/, '');

    // Try to extract date from filename (format: MM.DD.YY)
    const date = parseDateFromFilename(filename);

    return {
      title,
      transcript,
      date,
    };
  } catch (error) {
    console.error('[TranscriptFetcher] Error reading transcript:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to read local transcript: ${error.message}`);
    }
    throw new Error('Failed to read local transcript: Unknown error');
  }
}
