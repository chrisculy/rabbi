import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { generateGuide } from '@/lib/guide-generator';
import { updateGuideMarkdown } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { guideId, transcript, biblePassages } = await request.json();

    if (!guideId || !transcript) {
      return NextResponse.json(
        { error: 'Guide ID and transcript are required' },
        { status: 400 }
      );
    }

    console.log('[API] Starting guide generation for guide:', guideId);
    console.log('[API] Transcript length:', transcript.length);

    // Generate discussion guide using Gemini AI
    const markdown = await generateGuide(biblePassages || '', transcript);

    console.log('[API] Guide generated successfully, length:', markdown.length);

    // Update guide in database
    await updateGuideMarkdown(guideId, markdown);

    console.log('[API] Guide saved to database');

    return NextResponse.json({
      success: true,
      markdown,
    });
  } catch (error) {
    console.error('[API] Error generating guide:', error);
    console.error('[API] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: 'Failed to generate guide',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Increase timeout for this route (Vercel default is 10s)
export const maxDuration = 60; // 60 seconds
