import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

const PYTHON_SCRIPTS_DIR = path.join(process.cwd(), 'python-scripts');

export async function fetchTranscript(source: string): Promise<{
  transcript: string;
  title: string;
  date: string | null;
}> {
  try {
    const scriptPath = path.join(PYTHON_SCRIPTS_DIR, 'transcript_fetcher.py');
    const { stdout, stderr } = await execAsync(
      `python "${scriptPath}" "${source}"`,
      { env: { ...process.env } }
    );

    if (stderr) {
      console.error('Python stderr:', stderr);
    }

    const result = JSON.parse(stdout);

    if (result.error) {
      throw new Error(result.error);
    }

    return result;
  } catch (error) {
    console.error('Error fetching transcript:', error);
    throw error;
  }
}

export async function generateGuide(transcript: string): Promise<string> {
  try {
    const scriptPath = path.join(PYTHON_SCRIPTS_DIR, 'guide_generator.py');
    const { stdout, stderr } = await execAsync(
      `python "${scriptPath}" "${transcript.replace(/"/g, '\\"')}"`,
      {
        env: { ...process.env, GEMINI_API_KEY: process.env.GEMINI_API_KEY },
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer for large outputs
      }
    );

    if (stderr) {
      console.error('Python stderr:', stderr);
    }

    const result = JSON.parse(stdout);

    if (result.error) {
      throw new Error(result.error);
    }

    return result.markdown;
  } catch (error) {
    console.error('Error generating guide:', error);
    throw error;
  }
}
